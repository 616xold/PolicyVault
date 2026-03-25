import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { network } from 'hardhat';
import { getAddress } from 'viem';

const USDC = 1_000_000n;
const INITIAL_MINT = 100n * USDC;

type Fixture = Awaited<ReturnType<typeof deployFixture>>;

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

describe('PolicyVault M1.3 create, revoke, and charge', async () => {
  it('creates a policy with a deterministic id, stored state, nonce increment, and PolicyCreated', async () => {
    const { networkHelpers, viem, owner, receiver, vault } = await deployFixture();
    const cap = 25n * USDC;
    const expiresAt = (await latestTimestamp(networkHelpers)) + 3600n;
    const expectedPolicyId = await vault.read.computePolicyId([
      owner.account.address,
      receiver.account.address,
      cap,
      expiresAt,
      0n,
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

    assert.equal(await vault.read.nextPolicyNonce([owner.account.address]), 1n);
    assert.equal(policy.owner, getAddress(owner.account.address));
    assert.equal(policy.beneficiary, getAddress(receiver.account.address));
    assert.equal(policy.cap, cap);
    assert.equal(policy.spent, 0n);
    assert.equal(policy.expiresAt, expiresAt);
    assert.equal(policy.revoked, false);
  });

  it('reverts when createPolicy uses an invalid beneficiary, cap, or expiry', async () => {
    const { networkHelpers, viem, receiver, vault } = await deployFixture();
    const validCap = 10n * USDC;
    const now = await latestTimestamp(networkHelpers);
    const futureExpiry = now + 3600n;

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([zeroAddress, validCap, futureExpiry]),
      vault,
      'ZeroAddress',
    );

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([receiver.account.address, 0n, futureExpiry]),
      vault,
      'ZeroAmount',
    );

    await viem.assertions.revertWithCustomError(
      vault.write.createPolicy([receiver.account.address, validCap, now]),
      vault,
      'InvalidExpiry',
    );
  });

  it('lets the owner revoke once, keeps remaining unchanged, and emits PolicyRevoked', async () => {
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

  it('reverts when a non-owner revokes or when the policy is already revoked', async () => {
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

    await waitForTransaction(publicClient, await vault.write.revokePolicy([policyId]));

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.revokePolicy([policyId]),
      vault,
      'PolicyIsRevoked',
      [policyId],
    );
  });

  it('lets the beneficiary charge within cap, updates post-state balances, and emits Charged', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, token, vault } =
      await deployFixture();
    const deposited = 18n * USDC;
    const cap = 12n * USDC;
    const charged = 7n * USDC;

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
        cap - charged,
      ],
    );

    const policy = await vault.read.getPolicy([policyId]);

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), deposited - charged);
    assert.equal(await vault.read.remaining([policyId]), cap - charged);
    assert.equal(await token.read.balanceOf([receiver.account.address]), charged);
    assert.equal(await token.read.balanceOf([vault.address]), deposited - charged);
    assert.equal(policy.spent, charged);
    assert.equal(policy.revoked, false);
  });

  it('reverts when a non-beneficiary charges and when current vault funding is insufficient', async () => {
    const { networkHelpers, viem, publicClient, owner, receiver, outsider, token, vault } =
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
      vault.write.charge([policyId, 1n * USDC], { account: outsider.account }),
      vault,
      'NotBeneficiary',
      [policyId, getAddress(outsider.account.address)],
    );

    await viem.assertions.revertWithCustomErrorWithArgs(
      vault.write.charge([policyId, requested], { account: receiver.account }),
      vault,
      'InsufficientVaultBalance',
      [requested, deposited],
    );

    const policy = await vault.read.getPolicy([policyId]);

    assert.equal(await vault.read.vaultBalanceOf([owner.account.address]), deposited);
    assert.equal(await vault.read.remaining([policyId]), cap);
    assert.equal(policy.spent, 0n);
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

async function latestTimestamp(networkHelpers: Fixture['networkHelpers']) {
  return BigInt(await networkHelpers.time.latest());
}

const zeroAddress = '0x0000000000000000000000000000000000000000';
