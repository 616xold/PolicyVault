import {
  contractAddresses,
  contractAddressSource,
  hasConfiguredAddresses,
} from './contract-addresses.js';
import { MockUSDCAbi, PolicyVaultAbi } from './generated/abi.js';

export const mockUsdcContract = {
  address: contractAddresses.mockUsdc,
  abi: MockUSDCAbi,
} as const;

export const policyVaultContract = {
  address: contractAddresses.policyVault,
  abi: PolicyVaultAbi,
} as const;

export const contractConfig = {
  addressSource: contractAddressSource,
  chainId: contractAddresses.chainId,
  hasConfiguredAddresses,
} as const;
