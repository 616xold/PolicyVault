import { network } from 'hardhat';
import { BaseError, ContractFunctionRevertedError, parseSignature } from 'viem';

import {
  LOCALHOST_DEPLOYMENT_PATH,
  assertLocalhostChain,
  assertLocalhostDeployment,
  readLocalhostDeployment,
} from './helpers/deployments.js';
import { divider, formatToken, kv, section } from './helpers/format.js';

const USDC = 1_000_000n;
const APPROVE_DEPOSIT_AMOUNT = 60n * USDC;
const PERMIT_DEPOSIT_AMOUNT = 15n * USDC;
const POLICY_CAP = 30n * USDC;
const CHARGE_AMOUNT = 12n * USDC;

async function main(): Promise<void> {
  section('demo');

  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [owner, beneficiary, recoveryReceiver] = await viem.getWalletClients();

  if (!owner || !beneficiary || !recoveryReceiver) {
    throw new Error('Expected at least 3 funded localhost wallets.');
  }

  const chainId = Number(await publicClient.getChainId());
  assertLocalhostChain(chainId);

  const deployment = await readLocalhostDeployment();
  assertLocalhostDeployment(deployment, chainId);

  const token = await viem.getContractAt('MockUSDC', deployment.mockUsdc, {
    client: { public: publicClient, wallet: owner },
  });
  const vault = await viem.getContractAt('PolicyVault', deployment.policyVault, {
    client: { public: publicClient, wallet: owner },
  });
  const decimals = Number(await token.read.decimals());
  const symbol = await token.read.symbol();

  const printFundingState = async (label: string) => {
    divider();
    kv('state', label);
    kv(
      'owner wallet',
      formatToken(await token.read.balanceOf([owner.account.address]), decimals, symbol),
    );
    kv(
      'owner vault',
      formatToken(await vault.read.vaultBalanceOf([owner.account.address]), decimals, symbol),
    );
    kv('vault token', formatToken(await token.read.balanceOf([vault.address]), decimals, symbol));
    kv(
      'allowance',
      formatToken(
        await token.read.allowance([owner.account.address, vault.address]),
        decimals,
        symbol,
      ),
    );
  };

  const printWalletBalance = async (label: string, address: `0x${string}`) => {
    kv(label, formatToken(await token.read.balanceOf([address]), decimals, symbol));
  };

  const printPolicyState = async (label: string, policyId: `0x${string}`) => {
    const policy = await vault.read.getPolicy([policyId]);
    const remaining = await vault.read.remaining([policyId]);

    divider();
    kv('policy state', label);
    kv('policyId', policyId);
    kv('owner', policy.owner);
    kv('beneficiary', policy.beneficiary);
    kv('cap', formatToken(policy.cap, decimals, symbol));
    kv('spent', formatToken(policy.spent, decimals, symbol));
    kv('remaining', formatToken(remaining, decimals, symbol));
    kv('expiresAt', policy.expiresAt);
    kv('revoked', policy.revoked);
  };

  const signPermit = async (amount: bigint, deadline: bigint) => {
    const [nonce, name] = await Promise.all([
      token.read.nonces([owner.account.address]),
      token.read.name(),
    ]);

    const signature = await owner.signTypedData({
      account: owner.account,
      domain: {
        name,
        version: '1',
        chainId,
        verifyingContract: token.address,
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
        owner: owner.account.address,
        spender: vault.address,
        value: amount,
        nonce,
        deadline,
      },
    });

    return parseSignature(signature);
  };

  const minimumOwnerBalance = APPROVE_DEPOSIT_AMOUNT + PERMIT_DEPOSIT_AMOUNT;
  const ownerBalance = await token.read.balanceOf([owner.account.address]);
  if (ownerBalance < minimumOwnerBalance) {
    throw new Error(
      `Owner wallet only has ${formatToken(ownerBalance, decimals, symbol)}. Run pnpm seed:local on a fresh localhost chain before pnpm demo:local.`,
    );
  }

  kv('artifact', LOCALHOST_DEPLOYMENT_PATH);
  kv('mockUsdc', deployment.mockUsdc);
  kv('policyVault', deployment.policyVault);
  kv('owner', owner.account.address);
  kv('beneficiary', beneficiary.account.address);
  kv('recoveryReceiver', recoveryReceiver.account.address);

  await printFundingState('initial');
  await printWalletBalance('beneficiary wallet', beneficiary.account.address);
  await printWalletBalance('recovery receiver wallet', recoveryReceiver.account.address);

  section('step 1 approve plus deposit');
  const approveSimulation = await token.simulate.approve([vault.address, APPROVE_DEPOSIT_AMOUNT], {
    account: owner.account,
  });
  const approveHash = await owner.writeContract(approveSimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  kv('approve tx', approveHash);

  const depositSimulation = await vault.simulate.deposit([APPROVE_DEPOSIT_AMOUNT], {
    account: owner.account,
  });
  const depositHash = await owner.writeContract(depositSimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: depositHash });
  kv('deposit tx', depositHash);

  await printFundingState('after approve plus deposit');

  section('step 2 permit deposit');
  const permitDeadline = (await publicClient.getBlock()).timestamp + 3600n;
  const permit = await signPermit(PERMIT_DEPOSIT_AMOUNT, permitDeadline);
  const permitSimulation = await vault.simulate.depositWithPermit(
    [PERMIT_DEPOSIT_AMOUNT, permitDeadline, permit.v, permit.r, permit.s],
    { account: owner.account },
  );
  const permitHash = await owner.writeContract(permitSimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: permitHash });
  kv('permit deposit tx', permitHash);

  await printFundingState('after permit deposit');

  section('step 3 create policy');
  const expiresAt = (await publicClient.getBlock()).timestamp + 3600n;
  const nonce = await vault.read.nextPolicyNonce([owner.account.address]);
  const policyId = await vault.read.computePolicyId([
    owner.account.address,
    beneficiary.account.address,
    POLICY_CAP,
    expiresAt,
    nonce,
  ]);
  const createPolicySimulation = await vault.simulate.createPolicy(
    [beneficiary.account.address, POLICY_CAP, expiresAt],
    { account: owner.account },
  );
  const createPolicyHash = await owner.writeContract(createPolicySimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: createPolicyHash });
  kv('create policy tx', createPolicyHash);

  await printPolicyState('after create policy', policyId);
  await printFundingState('after create policy');

  section('step 4 charge within cap');
  await printWalletBalance('beneficiary wallet before charge', beneficiary.account.address);
  const chargeSimulation = await vault.simulate.charge([policyId, CHARGE_AMOUNT], {
    account: beneficiary.account,
  });
  const chargeHash = await beneficiary.writeContract(chargeSimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: chargeHash });
  kv('charge tx', chargeHash);

  await printPolicyState('after charge', policyId);
  await printFundingState('after charge');
  await printWalletBalance('beneficiary wallet after charge', beneficiary.account.address);

  section('step 5 intentional revert over cap');
  const remaining = await vault.read.remaining([policyId]);
  const overCapAmount = remaining + 1n * USDC;

  let revertMessage: string | null = null;
  try {
    await vault.simulate.charge([policyId, overCapAmount], {
      account: beneficiary.account,
    });
  } catch (error) {
    revertMessage = formatRevert(error);
  }

  if (revertMessage === null) {
    throw new Error('Expected the over-cap charge simulation to revert, but it succeeded.');
  }

  kv('revert', revertMessage);
  await printPolicyState('after intentional revert', policyId);
  await printFundingState('after intentional revert');

  section('step 6 revoke policy');
  const revokeSimulation = await vault.simulate.revokePolicy([policyId], {
    account: owner.account,
  });
  const revokeHash = await owner.writeContract(revokeSimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: revokeHash });
  kv('revoke tx', revokeHash);

  await printPolicyState('after revoke', policyId);

  section('step 7 withdraw unused funds');
  await printWalletBalance('recovery receiver before withdraw', recoveryReceiver.account.address);
  const withdrawAmount = await vault.read.vaultBalanceOf([owner.account.address]);
  const withdrawSimulation = await vault.simulate.withdraw(
    [withdrawAmount, recoveryReceiver.account.address],
    { account: owner.account },
  );
  const withdrawHash = await owner.writeContract(withdrawSimulation.request);
  await publicClient.waitForTransactionReceipt({ hash: withdrawHash });
  kv('withdraw tx', withdrawHash);
  kv('withdrawn', formatToken(withdrawAmount, decimals, symbol));

  await printFundingState('final');
  await printWalletBalance('beneficiary wallet final', beneficiary.account.address);
  await printWalletBalance('recovery receiver final', recoveryReceiver.account.address);
}

function formatRevert(error: unknown): string {
  if (error instanceof ContractFunctionRevertedError) {
    return formatContractRevertedError(error);
  }

  if (error instanceof BaseError) {
    const reverted = error.walk((cause) => cause instanceof ContractFunctionRevertedError);
    if (reverted instanceof ContractFunctionRevertedError) {
      return formatContractRevertedError(reverted);
    }

    return error.shortMessage;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function formatContractRevertedError(error: ContractFunctionRevertedError): string {
  if (error.data) {
    const args = error.data.args?.map(formatRevertArg).join(', ') ?? '';
    return args.length > 0 ? `${error.data.errorName}(${args})` : error.data.errorName;
  }

  return error.reason ?? error.shortMessage;
}

function formatRevertArg(value: unknown): string {
  if (typeof value === 'bigint') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return `[${value.map(formatRevertArg).join(', ')}]`;
  }

  return String(value);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
