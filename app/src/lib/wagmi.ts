import { createConfig, http } from 'wagmi';
import { localhost } from 'wagmi/chains';
import { injected } from 'wagmi/connectors';

import { projectConfig } from './config.js';

export const wagmiConfig = createConfig({
  chains: [localhost],
  connectors: [injected()],
  ssr: true,
  transports: {
    [localhost.id]: http(projectConfig.rpcUrl),
  },
});
