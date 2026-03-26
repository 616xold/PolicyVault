import { network } from 'hardhat';

import {
  LOCALHOST_NETWORK_NAME,
  assertLocalhostChain,
  writeLocalhostDeployment,
} from './helpers/deployments.js';
import { divider, kv, section } from './helpers/format.js';

async function main(): Promise<void> {
  section('deploy');

  const { viem } = await network.connect();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  if (!deployer) {
    throw new Error('No deployer wallet was available from the localhost node.');
  }

  const chainId = Number(await publicClient.getChainId());
  assertLocalhostChain(chainId);

  kv('network', LOCALHOST_NETWORK_NAME);
  kv('chainId', chainId);
  kv('deployer', deployer.account.address);
  divider();

  const mockUsdc = await viem.deployContract('MockUSDC', [], {
    client: { public: publicClient, wallet: deployer },
  });
  const policyVault = await viem.deployContract('PolicyVault', [mockUsdc.address], {
    client: { public: publicClient, wallet: deployer },
  });

  const deploymentPath = await writeLocalhostDeployment({
    chainId,
    network: LOCALHOST_NETWORK_NAME,
    deployer: deployer.account.address,
    mockUsdc: mockUsdc.address,
    policyVault: policyVault.address,
  });

  kv('MockUSDC', mockUsdc.address);
  kv('PolicyVault', policyVault.address);
  kv('artifact', deploymentPath);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
