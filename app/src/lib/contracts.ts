import { contractAddresses } from './contract-addresses';
import { MockUSDCAbi, PolicyVaultAbi } from './generated/abi';

export const mockUsdcContract = {
  address: contractAddresses.mockUsdc,
  abi: MockUSDCAbi,
} as const;

export const policyVaultContract = {
  address: contractAddresses.policyVault,
  abi: PolicyVaultAbi,
} as const;
