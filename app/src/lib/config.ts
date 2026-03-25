export const projectConfig = {
  name: 'PolicyVault',
  description: 'Bounded ERC-20 spending for services and AI agents',
  chainId: Number(process.env.NEXT_PUBLIC_CHAIN_ID ?? 31337),
  rpcUrl: process.env.NEXT_PUBLIC_RPC_URL ?? 'http://127.0.0.1:8545',
} as const;
