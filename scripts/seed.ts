import { network } from 'hardhat';

import {
  LOCALHOST_DEPLOYMENT_PATH,
  assertLocalhostChain,
  assertLocalhostDeployment,
  assertLocalhostDeploymentHasCode,
  readLocalhostDeployment,
} from './helpers/deployments.js';
import { divider, formatToken, kv, section, shortAddress } from './helpers/format.js';

const USDC = 1_000_000n;
const SEED_TARGETS = [250n * USDC, 80n * USDC, 40n * USDC] as const;
const SEED_LABELS = ['wallet 1 owner', 'wallet 2 beneficiary', 'wallet 3 recovery'] as const;

async function main(): Promise<void> {
  section('seed');

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
  await assertLocalhostDeploymentHasCode(publicClient, deployment);

  const token = await viem.getContractAt('MockUSDC', deployment.mockUsdc, {
    client: { public: publicClient, wallet: owner },
  });
  const decimals = Number(await token.read.decimals());
  const symbol = await token.read.symbol();

  kv('artifact', LOCALHOST_DEPLOYMENT_PATH);
  kv('token', deployment.mockUsdc);
  kv('minter', owner.account.address);

  const wallets = [owner, beneficiary, recoveryReceiver] as const;

  for (const [index, wallet] of wallets.entries()) {
    const label = SEED_LABELS[index];
    const target = SEED_TARGETS[index];
    const before = await token.read.balanceOf([wallet.account.address]);
    const mintAmount = before < target ? target - before : 0n;

    if (mintAmount > 0n) {
      const simulation = await token.simulate.mint([wallet.account.address, mintAmount], {
        account: owner.account,
      });
      const hash = await owner.writeContract(simulation.request);
      await publicClient.waitForTransactionReceipt({ hash });
    }

    const after = await token.read.balanceOf([wallet.account.address]);

    divider();
    kv('account', `${label} (${shortAddress(wallet.account.address)})`);
    kv('address', wallet.account.address);
    kv('before', formatToken(before, decimals, symbol));
    kv('target', formatToken(target, decimals, symbol));
    kv('minted', formatToken(mintAmount, decimals, symbol));
    kv('after', formatToken(after, decimals, symbol));
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
