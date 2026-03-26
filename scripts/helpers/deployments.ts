import { promises as fs } from 'node:fs';
import path from 'node:path';

export const LOCALHOST_CHAIN_ID = 31337;
export const LOCALHOST_NETWORK_NAME = 'localhost';
export const LOCALHOST_DEPLOYMENT_PATH = path.join(process.cwd(), 'deployments', 'localhost.json');

export type LocalhostDeployment = {
  chainId: number;
  network: 'localhost';
  deployer: `0x${string}`;
  mockUsdc: `0x${string}`;
  policyVault: `0x${string}`;
};

export function assertLocalhostChain(chainId: number): void {
  if (chainId !== LOCALHOST_CHAIN_ID) {
    throw new Error(
      `Expected localhost chain id ${LOCALHOST_CHAIN_ID}, received ${chainId}. Start the local node and run the localhost scripts against it.`,
    );
  }
}

export function assertLocalhostDeployment(deployment: LocalhostDeployment, chainId: number): void {
  assertLocalhostChain(chainId);

  if (deployment.network !== LOCALHOST_NETWORK_NAME) {
    throw new Error(
      `Expected deployment artifact network "${LOCALHOST_NETWORK_NAME}", found "${deployment.network}".`,
    );
  }

  if (deployment.chainId !== chainId) {
    throw new Error(
      `Deployment artifact chain id ${deployment.chainId} does not match connected chain id ${chainId}. Re-run pnpm deploy:local on a fresh localhost node.`,
    );
  }
}

export async function writeLocalhostDeployment(deployment: LocalhostDeployment): Promise<string> {
  await fs.mkdir(path.dirname(LOCALHOST_DEPLOYMENT_PATH), { recursive: true });
  await fs.writeFile(LOCALHOST_DEPLOYMENT_PATH, JSON.stringify(deployment, null, 2) + '\n', 'utf8');

  return LOCALHOST_DEPLOYMENT_PATH;
}

export async function readLocalhostDeployment(): Promise<LocalhostDeployment> {
  try {
    const raw = await fs.readFile(LOCALHOST_DEPLOYMENT_PATH, 'utf8');
    return JSON.parse(raw) as LocalhostDeployment;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        `Missing deployment artifact at ${LOCALHOST_DEPLOYMENT_PATH}. Run pnpm deploy:local first.`,
      );
    }

    throw error;
  }
}
