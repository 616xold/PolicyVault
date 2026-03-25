import { defineConfig } from 'hardhat/config';
import hardhatToolboxViem from '@nomicfoundation/hardhat-toolbox-viem';

export default defineConfig({
  plugins: [hardhatToolboxViem],
  solidity: {
    version: '0.8.34',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  paths: {
    sources: './contracts',
    tests: {
      nodejs: './test',
    },
    cache: './cache',
    artifacts: './artifacts',
  },
  networks: {
    localhost: {
      type: 'http',
      chainType: 'l1',
      url: process.env.LOCAL_RPC_URL ?? 'http://127.0.0.1:8545',
      chainId: 31337,
    },
  },
});
