import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { network } from 'hardhat';
import { getAddress, parseSignature } from 'viem';

const USDC = 1_000_000n;
const INITIAL_MINT = 100n * USDC;
const UINT128_MAX = (1n << 128n) - 1n;

type Fixture = Awaited<ReturnType<typeof deployFixture>>;

describe('PolicyVault constructor', async () => {
  it('reverts when deployed with the zero asset address', async () => {
    const { viem, publicClient, owner, vault } = await deployFixture();

    await viem.assertions.revertWithCustomError(
      viem.deployContract('PolicyVault', [zeroAddress], {
        client: { public: publicClient, wallet: owner },
      }),
      vault,
      'ZeroAddress',
    );
  });
});

describe('PolicyVault M1.2 deposit and withdraw', async () => {
  it('reverts when deposit amount is zero', async () => {
    const { viem, vault } = await deployFixture();

    await viem.assertions.revertWithCustomError(vault.write.deposit([0n]), vault, 'ZeroAmount');
  });

  it('reverts when depositing without allowance', async () => {
    const { viem, owner, token, vault } = await deployFixture();
    const amount = 10n * USDC;

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), 0n);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT);
    assert.equal(await token.read.balanceOf([vault.address]), 0n);

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.deposit([amount]),
      token,
      'ERC20InsufficientAllowance',
      [getAddress(vault.address), 0n, amount],
    );

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), 0n);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT);
    assert.equal(await token.read.balanceOf([vault.address]), 0n);
  });

  it('allows approve plus deposit, updates balances, and emits Deposited', async () => {
    const { viem, publicClient, owner, token, vault } = await deployFixture();
    const amount = 15n * USDC;

    await approve(token, vault.address, amount, publicClient);

    await viem.assertions.emitWithArgs(vault.write.deposit([amount]), vault, 'Deposited', [
      getAddress(owner.account.address),
      amount,
      amount,
    ]);

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), amount);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT - amount);
    assert.equal(await token.read.balanceOf([vault.address]), amount);
  });

  it('accumulates the owner vault balance across a second deposit', async () => {
    const { viem, publicClient, owner, token, vault } = await deployFixture();
    const firstDeposit = 4n * USDC;
    const secondDeposit = 7n * USDC;
    const totalDeposited = firstDeposit + secondDeposit;

    await approve(token, vault.address, totalDeposited, publicClient);
    await waitForTransaction(publicClient, await vault.write.deposit([firstDeposit]));

    await viem.assertions.emitWithArgs(vault.write.deposit([secondDeposit]), vault, 'Deposited', [
      getAddress(owner.account.address),
      secondDeposit,
      totalDeposited,
    ]);

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), totalDeposited);
    assert.equal(await token.read.balanceOf([vault.address]), totalDeposited);
  });

  it('reverts when withdraw amount is zero', async () => {
    const { viem, vault } = await deployFixture();

    await viem.assertions.revertWithCustomError(
      vault.write.withdraw([0n, zeroAddress]),
      vault,
      'ZeroAmount',
    );
  });

  it('reverts when withdraw receiver is the zero address', async () => {
    const { viem, publicClient, token, vault } = await deployFixture();
    const amount = 8n * USDC;

    await approveAndDeposit({ publicClient, token, vault }, amount);

    await viem.assertions.revertWithCustomError(
      vault.write.withdraw([amount, zeroAddress]),
      vault,
      'ZeroAddress',
    );
  });

  it('reverts when withdrawing more than the owner vault balance', async () => {
    const { viem, publicClient, token, vault } = await deployFixture();
    const deposited = 6n * USDC;
    const requested = 7n * USDC;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.withdraw([requested, vault.address]),
      vault,
      'InsufficientVaultBalance',
      [requested, deposited],
    );
  });

  it('does not let a second wallet withdraw from another owner-funded vault balance', async () => {
    const { viem, publicClient, owner, outsider, token, vault } = await deployFixture();
    const deposited = 11n * USDC;
    const requested = 3n * USDC;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.withdraw([requested, outsider.account.address], { account: outsider.account }),
      vault,
      'InsufficientVaultBalance',
      [requested, 0n],
    );

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), deposited);
    assert.equal(await vault.read.vaultBalanceOf([outsider.account.address]), 0n);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT - deposited);
    assert.equal(await token.read.balanceOf([outsider.account.address]), 0n);
    assert.equal(await token.read.balanceOf([vault.address]), deposited);
  });

  it('withdraws to the receiver, updates balances, and emits Withdrawn', async () => {
    const { viem, publicClient, owner, receiver, token, vault } = await deployFixture();
    const deposited = 20n * USDC;
    const withdrawn = 9n * USDC;
    const remainingVaultBalance = deposited - withdrawn;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    await viem.assertions.emitWithArgs(
      vault.write.withdraw([withdrawn, receiver.account.address]),
      vault,
      'Withdrawn',
      [
        getAddress(owner.account.address),
        getAddress(receiver.account.address),
        withdrawn,
        remainingVaultBalance,
      ],
    );

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), remainingVaultBalance);
    assert.equal(await token.read.balanceOf([receiver.account.address]), withdrawn);
    assert.equal(await token.read.balanceOf([vault.address]), remainingVaultBalance);
  });
});

describe('PolicyVault M1.4 policy lifecycle and state-machine proof', async () => {
  it('computePolicyId matches the deterministic policy id used at creation', async () => {
    const { networkHelpers, viem, owner, receiver, vault } = await deployFixture();
    const cap = 25n * USDC;
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;
    const nonce = await vault.read.nextPolicyNonce([owner.account.address]);
    const expectedPolicyId = await vault.read.computePolicyId([
      owner.account.address,
      receiver.account.address,
      cap,
      expiresAt,
      nonce,
    ]);

    await viem.assertions.emitWithArgs(
      vault.write.createPolicy([receiver.account.address, cap, expiresAt]),
      vault,
      'PolicyCreated',
      [
        expectedPolicyId,
        getAddress(owner.account.address),
        getAddress(receiver.account.address),
        cap,
        expiresAt,
      ],
    );

    const policy = await vault.read.getPolicy([expectedPolicyId]);

    assert.equal(policy.owner, getAddress(owner.account.address));
    assert.equal(await vault.read.nextPolicyNonce([owner.account.address]), nonce + 1n);
  });

  it('createPolicy stores the expected owner, beneficiary, cap, spent, expiry, and revoked state', async () => {
    const { networkHelpers, owner, publicClient, receiver, vault } = await deployFixture();
    const { policyId, cap, expiresAt } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    const policy = await vault.read.getPolicy([policyId]);

    assert.equal(policy.owner, getAddress(owner.account.address));
    assert.equal(policy.beneficiary, getAddress(receiver.account.address));
    assert.equal(policy.cap, cap);
    assert.equal(policy.spent, 0n);
    assert.equal(policy.expiresAt, expiresAt);
    assert.equal(policy.revoked, false);
  });

  it('increments nextPolicyNonce only after successful createPolicy', async () => {
    const { networkHelpers, viem, owner, publicClient, receiver, vault } = await deployFixture();
    const now = await latestTimestamp(networkHelpers);
    const cap = 10n * USDC;
    const futureExpiry = now + 3600n;
    const initialNonce = await vault.read.nextPolicyNonce([owner.account.address]);

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([zeroAddress, cap, futureExpiry]),
      vault,
      'ZeroAddress',
    );

    assert.equal(await vault.read.nextPolicyNonce([owner.account.address]), initialNonce);

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([receiver.account.address, cap, now]),
      vault,
      'InvalidExpiry',
    );

    assert.equal(await vault.read.nextPolicyNonce([owner.account.address]), initialNonce);

    await waitForTransaction(
      publicClient,
      await vault.write.createPolicy([receiver.account.address, cap, futureExpiry]),
    );

    assert.equal(await vault.read.nextPolicyNonce([owner.account.address]), initialNonce + 1n);
  });

  it('reverts when createPolicy uses the zero beneficiary', async () => {
    const { networkHelpers, viem, vault } = await deployFixture();
    const cap = 10n * USDC;
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([zeroAddress, cap, expiresAt]),
      vault,
      'ZeroAddress',
    );
  });

  it('reverts when createPolicy uses a zero cap', async () => {
    const { networkHelpers, viem, receiver, vault } = await deployFixture();
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([receiver.account.address, 0n, expiresAt]),
      vault,
      'ZeroAmount',
    );
  });

  it('reverts when createPolicy cap exceeds uint128 max and leaves the owner nonce unchanged', async () => {
    const { networkHelpers, viem, owner, receiver, vault } = await deployFixture();
    const oversizedCap = UINT128_MAX + 1n;
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;
    const nonceBefore = await vault.read.nextPolicyNonce([owner.account.address]);

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.createPolicy([receiver.account.address, oversizedCap, expiresAt]),
      vault,
      'SafeCastOverflowedUintDowncast',
      [128, oversizedCap],
    );

    assert.equal(await vault.read.nextPolicyNonce([owner.account.address]), nonceBefore);
  });

  it('reverts when createPolicy expiry is now or already in the past', async () => {
    const { networkHelpers, viem, receiver, vault } = await deployFixture();
    const cap = 10n * USDC;
    const now = await latestTimestamp(networkHelpers);

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([receiver.account.address, cap, now]),
      vault,
      'InvalidExpiry',
    );

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([receiver.account.address, cap, now - 1n]),
      vault,
      'InvalidExpiry',
    );
  });

  it('revokePolicy happy path emits PolicyRevoked and sets revoked to true', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, vault } = await deployFixture();
    const { policyId, cap } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    await viem.assertions.emitWithArgs(
      vault.write.revokePolicy([policyId]),
      vault,
      'PolicyRevoked',
      [policyId, getAddress(owner.account.address), getAddress(receiver.account.address)],
    );

    const policy = await vault.read.getPolicy([policyId]);

    assert.equal(policy.revoked, true);
    assert.equal(await vault.read.remaining([policyId]), cap);
  });

  it('reverts when revokePolicy is called by a non-owner', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, outsider, vault } =
      await deployFixture();
    const { policyId } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.revokePolicy([policyId], { account: outsider.account }),
      vault,
      'NotPolicyOwner',
      [policyId, getAddress(outsider.account.address)],
    );
  });

  it('reverts when revokePolicy is called for a missing policy', async () => {
    const { viem, vault } = await deployFixture();
    const missingPolicyId = bytes32Value('11');

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.revokePolicy([missingPolicyId]),
      vault,
      'PolicyNotFound',
      [missingPolicyId],
    );
  });

  it('reverts when revokePolicy is called after the policy is already revoked', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, vault } = await deployFixture();
    const { policyId } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    await waitForTransaction(publicClient, await vault.write.revokePolicy([policyId]));

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.revokePolicy([policyId]),
      vault,
      'PolicyIsRevoked',
      [policyId],
    );
  });

  it('happy-path charge transfers tokens, updates state, and emits post-state Charged values', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 18n * USDC;
    const cap = 12n * USDC;
    const charged = 7n * USDC;
    const remainingVaultBalance = deposited - charged;
    const remainingCap = cap - charged;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy(
      {
        networkHelpers,
        owner,
        publicClient,
        receiver,
        vault,
      },
      { cap },
    );

    await viem.assertions.emitWithArgs(
      vault.write.charge([policyId, charged], { account: receiver.account }),
      vault,
      'Charged',
      [
        policyId,
        getAddress(owner.account.address),
        getAddress(receiver.account.address),
        charged,
        charged,
        remainingCap,
      ],
    );

    const policy = await vault.read.getPolicy([policyId]);

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), remainingVaultBalance);
    assert.equal(await vault.read.remaining([policyId]), remainingCap);
    assert.equal(await token.read.balanceOf([receiver.account.address]), charged);
    assert.equal(await token.read.balanceOf([vault.address]), remainingVaultBalance);
    assert.equal(policy.spent, charged);
    assert.equal(policy.revoked, false);
  });

  it('reverts when charge is called by a non-beneficiary', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, outsider, vault } =
      await deployFixture();
    const { policyId } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([policyId, 1n * USDC], { account: outsider.account }),
      vault,
      'NotBeneficiary',
      [policyId, getAddress(outsider.account.address)],
    );
  });

  it('reverts when charge is called for a missing policy', async () => {
    const { viem, receiver, vault } = await deployFixture();
    const missingPolicyId = bytes32Value('22');

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([missingPolicyId, 1n * USDC], { account: receiver.account }),
      vault,
      'PolicyNotFound',
      [missingPolicyId],
    );
  });

  it('reverts when charge amount is zero', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, vault } = await deployFixture();
    const { policyId } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    await viem.assertions.revertWithCustomError(
      vault.write.charge([policyId, 0n], { account: receiver.account }),
      vault,
      'ZeroAmount',
    );
  });

  it('reverts when charge exceeds the remaining cap and does not drift state', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 9n * USDC;
    const cap = 5n * USDC;
    const requested = cap + 1n;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy(
      {
        networkHelpers,
        owner,
        publicClient,
        receiver,
        vault,
      },
      { cap },
    );

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([policyId, requested], { account: receiver.account }),
      vault,
      'CapExceeded',
      [policyId, requested, cap],
    );

    const policy = await vault.read.getPolicy([policyId]);

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), deposited);
    assert.equal(await vault.read.remaining([policyId]), cap);
    assert.equal(await token.read.balanceOf([receiver.account.address]), 0n);
    assert.equal(await token.read.balanceOf([vault.address]), deposited);
    assert.equal(policy.spent, 0n);
  });

  it('reverts when charge exceeds the owner vault balance', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 5n * USDC;
    const requested = deposited + 1n;
    const cap = 9n * USDC;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy(
      {
        networkHelpers,
        owner,
        publicClient,
        receiver,
        vault,
      },
      { cap },
    );

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([policyId, requested], { account: receiver.account }),
      vault,
      'InsufficientVaultBalance',
      [requested, deposited],
    );
  });

  it('reverts when charge is attempted after expiry', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 10n * USDC;
    const charged = 2n * USDC;
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;
    const expiredAt = expiresAt + 1n;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy(
      {
        networkHelpers,
        owner,
        publicClient,
        receiver,
        vault,
      },
      { expiresAt },
    );

    await setNextBlockTimestamp(networkHelpers, expiredAt);

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([policyId, charged], { account: receiver.account }),
      vault,
      'PolicyExpired',
      [policyId, expiresAt, expiredAt],
    );
  });

  it('reverts when charge is attempted after revoke', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 10n * USDC;
    const charged = 2n * USDC;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy({
      networkHelpers,
      owner,
      publicClient,
      receiver,
      vault,
    });

    await waitForTransaction(publicClient, await vault.write.revokePolicy([policyId]));

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([policyId, charged], { account: receiver.account }),
      vault,
      'PolicyIsRevoked',
      [policyId],
    );
  });

  it('allows a charge at the exact expiry timestamp under the documented > expiry rule', async () => {
    const { networkHelpers, publicClient, owner, receiver, token, vault } = await deployFixture();
    const deposited = 10n * USDC;
    const cap = 4n * USDC;
    const charged = 2n * USDC;
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy(
      {
        networkHelpers,
        owner,
        publicClient,
        receiver,
        vault,
      },
      { cap, expiresAt },
    );

    await setNextBlockTimestamp(networkHelpers, expiresAt);
    await waitForTransaction(
      publicClient,
      await vault.write.charge([policyId, charged], { account: receiver.account }),
    );

    assert.equal(await vault.read.remaining([policyId]), cap - charged);
    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), deposited - charged);
  });

  it('lets the owner withdraw only the reduced post-charge vault balance', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 18n * USDC;
    const cap = 12n * USDC;
    const charged = 7n * USDC;
    const remainingVaultBalance = deposited - charged;

    await approveAndDeposit({ publicClient, token, vault }, deposited);

    const { policyId } = await createPolicy(
      {
        networkHelpers,
        owner,
        publicClient,
        receiver,
        vault,
      },
      { cap },
    );

    await waitForTransaction(
      publicClient,
      await vault.write.charge([policyId, charged], { account: receiver.account }),
    );

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.withdraw([remainingVaultBalance + 1n, owner.account.address]),
      vault,
      'InsufficientVaultBalance',
      [remainingVaultBalance + 1n, remainingVaultBalance],
    );

    await viem.assertions.emitWithArgs(
      vault.write.withdraw([remainingVaultBalance, owner.account.address]),
      vault,
      'Withdrawn',
      [
        getAddress(owner.account.address),
        getAddress(owner.account.address),
        remainingVaultBalance,
        0n,
      ],
    );

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), 0n);
    assert.equal(await token.read.balanceOf([vault.address]), 0n);
  });
});

describe('PolicyVault M2.1 depositWithPermit', async () => {
  it('allows permit plus deposit without prior approve, updates balances, and emits Deposited', async () => {
    const { networkHelpers, viem, publicClient, owner, token, vault } = await deployFixture();
    const amount = 13n * USDC;
    const deadline = (await latestTimestamp(networkHelpers)) + 3600n;
    const permit = await signPermit({ owner, publicClient, token, vault }, { amount, deadline });

    assert.equal(await token.read.allowance([owner.account.address, vault.address]), 0n);

    await viem.assertions.emitWithArgs(
      vault.write.depositWithPermit([amount, deadline, permit.v, permit.r, permit.s]),
      vault,
      'Deposited',
      [getAddress(owner.account.address), amount, amount],
    );

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), amount);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT - amount);
    assert.equal(await token.read.balanceOf([vault.address]), amount);
    assert.equal(await token.read.allowance([owner.account.address, vault.address]), 0n);
  });

  it('leaves the same funded state as the classic approve plus deposit path', async () => {
    const permitFixture = await deployFixture();
    const classicFixture = await deployFixture();
    const amount = 9n * USDC;
    const deadline = (await latestTimestamp(permitFixture.networkHelpers)) + 3600n;
    const permit = await signPermit(
      {
        owner: permitFixture.owner,
        publicClient: permitFixture.publicClient,
        token: permitFixture.token,
        vault: permitFixture.vault,
      },
      { amount, deadline },
    );

    await waitForTransaction(
      permitFixture.publicClient,
      await permitFixture.vault.write.depositWithPermit([
        amount,
        deadline,
        permit.v,
        permit.r,
        permit.s,
      ]),
    );

    await approveAndDeposit(classicFixture, amount);

    assert.deepEqual(await readFundingState(permitFixture), await readFundingState(classicFixture));
  });

  it('reverts with ZeroAmount before any permit side effects when amount is zero', async () => {
    const { networkHelpers, viem, owner, token, publicClient, vault } = await deployFixture();
    const deadline = (await latestTimestamp(networkHelpers)) + 3600n;
    const nonceBefore = await token.read.nonces([owner.account.address]);
    const permit = await signPermit(
      { owner, publicClient, token, vault },
      { amount: 0n, deadline },
    );

    await viem.assertions.revertWithCustomError(
      vault.write.depositWithPermit([0n, deadline, permit.v, permit.r, permit.s]),
      vault,
      'ZeroAmount',
    );

    assert.equal(await token.read.nonces([owner.account.address]), nonceBefore);
    assert.equal(await token.read.allowance([owner.account.address, vault.address]), 0n);
    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), 0n);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT);
    assert.equal(await token.read.balanceOf([vault.address]), 0n);
  });

  it('reverts when the permit deadline has already expired', async () => {
    const { networkHelpers, viem, owner, token, publicClient, vault } = await deployFixture();
    const amount = 5n * USDC;
    const deadline = (await latestTimestamp(networkHelpers)) - 1n;
    const permit = await signPermit({ owner, publicClient, token, vault }, { amount, deadline });

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.depositWithPermit([amount, deadline, permit.v, permit.r, permit.s]),
      token,
      'ERC2612ExpiredSignature',
      [deadline],
    );
  });

  it('reverts when permit call data is tampered after signing and leaves no vault or token state drift', async () => {
    const { networkHelpers, viem, owner, token, publicClient, vault } = await deployFixture();
    const signedAmount = 6n * USDC;
    const tamperedAmount = signedAmount + 1n;
    const deadline = (await latestTimestamp(networkHelpers)) + 3600n;
    const nonceBefore = await token.read.nonces([owner.account.address]);
    const permit = await signPermit(
      { owner, publicClient, token, vault },
      { amount: signedAmount, deadline },
    );

    await viem.assertions.revertWithCustomError(
      vault.write.depositWithPermit([tamperedAmount, deadline, permit.v, permit.r, permit.s]),
      token,
      'ERC2612InvalidSigner',
    );

    assert.equal(await token.read.nonces([owner.account.address]), nonceBefore);
    assert.equal(await token.read.allowance([owner.account.address, vault.address]), 0n);
    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), 0n);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT);
    assert.equal(await token.read.balanceOf([vault.address]), 0n);
  });

  it('reverts when reusing the same permit signature after a successful deposit', async () => {
    const { networkHelpers, viem, owner, token, publicClient, vault } = await deployFixture();
    const amount = 6n * USDC;
    const deadline = (await latestTimestamp(networkHelpers)) + 3600n;
    const permit = await signPermit({ owner, publicClient, token, vault }, { amount, deadline });

    await waitForTransaction(
      publicClient,
      await vault.write.depositWithPermit([amount, deadline, permit.v, permit.r, permit.s]),
    );

    await viem.assertions.revertWithCustomError(
      vault.write.depositWithPermit([amount, deadline, permit.v, permit.r, permit.s]),
      token,
      'ERC2612InvalidSigner',
    );

    assert.equal(await token.read.nonces([owner.account.address]), 1n);
    assert.equal(await token.read.allowance([owner.account.address, vault.address]), 0n);
    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), amount);
    assert.equal(await token.read.balanceOf([owner.account.address]), INITIAL_MINT - amount);
    assert.equal(await token.read.balanceOf([vault.address]), amount);
  });
});

async function deployFixture() {
  const { networkHelpers, viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, receiver, outsider] = await viem.getWalletClients();

  const token = await viem.deployContract('MockUSDC', [], {
    client: { public: publicClient, wallet: owner },
  });
  const vault = await viem.deployContract('PolicyVault', [token.address], {
    client: { public: publicClient, wallet: owner },
  });

  await waitForTransaction(
    publicClient,
    await token.write.mint([owner.account.address, INITIAL_MINT], { account: owner.account }),
  );

  return { networkHelpers, viem, publicClient, owner, receiver, outsider, token, vault };
}

async function createPolicy(
  fixture: Pick<Fixture, 'networkHelpers' | 'owner' | 'publicClient' | 'receiver' | 'vault'>,
  overrides: {
    beneficiary?: `0x${string}`;
    cap?: bigint;
    expiresAt?: bigint;
  } = {},
) {
  const beneficiary = overrides.beneficiary ?? fixture.receiver.account.address;
  const cap = overrides.cap ?? 25n * USDC;
  const expiresAt = overrides.expiresAt ?? (await latestTimestamp(fixture.networkHelpers)) + 3600n;
  const nonce = await fixture.vault.read.nextPolicyNonce([fixture.owner.account.address]);
  const policyId = await fixture.vault.read.computePolicyId([
    fixture.owner.account.address,
    beneficiary,
    cap,
    expiresAt,
    nonce,
  ]);

  await waitForTransaction(
    fixture.publicClient,
    await fixture.vault.write.createPolicy([beneficiary, cap, expiresAt]),
  );

  return { beneficiary, cap, expiresAt, nonce, policyId };
}

async function approveAndDeposit(
  fixture: Pick<Fixture, 'publicClient' | 'token' | 'vault'>,
  amount: bigint,
) {
  await approve(fixture.token, fixture.vault.address, amount, fixture.publicClient);
  await waitForTransaction(fixture.publicClient, await fixture.vault.write.deposit([amount]));
}

async function approve(
  token: Fixture['token'],
  spender: `0x${string}`,
  amount: bigint,
  publicClient: Fixture['publicClient'],
) {
  await waitForTransaction(publicClient, await token.write.approve([spender, amount]));
}

async function waitForTransaction(publicClient: Fixture['publicClient'], hash: `0x${string}`) {
  await publicClient.waitForTransactionReceipt({ hash });
}

async function readFundingState(fixture: Pick<Fixture, 'owner' | 'token' | 'vault'>) {
  return {
    vaultBalance: await fixture.vault.read.vaultBalanceOf([fixture.owner.account.address]),
    ownerTokenBalance: await fixture.token.read.balanceOf([fixture.owner.account.address]),
    vaultTokenBalance: await fixture.token.read.balanceOf([fixture.vault.address]),
    allowance: await fixture.token.read.allowance([
      fixture.owner.account.address,
      fixture.vault.address,
    ]),
  };
}

async function signPermit(
  fixture: Pick<Fixture, 'owner' | 'publicClient' | 'token' | 'vault'>,
  {
    amount,
    deadline,
  }: {
    amount: bigint;
    deadline: bigint;
  },
) {
  const [chainId, name, nonce] = await Promise.all([
    fixture.publicClient.getChainId(),
    fixture.token.read.name(),
    fixture.token.read.nonces([fixture.owner.account.address]),
  ]);

  const signature = await fixture.owner.signTypedData({
    account: fixture.owner.account,
    domain: {
      name,
      version: '1',
      chainId,
      verifyingContract: fixture.token.address,
    },
    types: {
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    primaryType: 'Permit',
    message: {
      owner: fixture.owner.account.address,
      spender: fixture.vault.address,
      value: amount,
      nonce,
      deadline,
    },
  });
  const parsedSignature = parseSignature(signature);

  return {
    v: Number(parsedSignature.v),
    r: parsedSignature.r,
    s: parsedSignature.s,
  };
}

async function latestTimestamp(networkHelpers: Fixture['networkHelpers']) {
  return BigInt(await networkHelpers.time.latest());
}

async function setNextBlockTimestamp(networkHelpers: Fixture['networkHelpers'], timestamp: bigint) {
  await networkHelpers.time.setNextBlockTimestamp(Number(timestamp));
}

function bytes32Value(byte: string) {
  return `0x${byte.repeat(32)}` as `0x${string}`;
}

const zeroAddress = '0x0000000000000000000000000000000000000000';
