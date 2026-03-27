import { createConfig, http } from 'wagmi';
import { hardhat } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

import { projectConfig } from './config.js';

const publicRpcUrl =
  typeof window === 'undefined'
    ? projectConfig.rpcUrl
    : new URL('/api/rpc', window.location.origin).toString();

export const wagmiConfig = createConfig({
  chains: [hardhat],
  connectors: [injected()],
  ssr: false,
  transports: {
    [hardhat.id]: http(publicRpcUrl),
  },
});
