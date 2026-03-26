import { generatedAddresses, hasGeneratedLocalhostAddresses } from './generated/addresses.js';

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const generatedLocalhostAddresses = generatedAddresses.localhost;
type ContractAddresses = {
  chainId: number;
  policyVault: `0x${string}`;
  mockUsdc: `0x${string}`;
};

function parseEnvChainId(value: string | undefined, fallbackChainId: number): number {
  const normalizedValue = value?.trim();
  if (!normalizedValue) {
    return fallbackChainId;
  }

  const parsed = Number(normalizedValue);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return fallbackChainId;
  }

  return parsed;
}

function readEnvAddress(
  name: 'NEXT_PUBLIC_POLICYVAULT_ADDRESS' | 'NEXT_PUBLIC_MOCKUSDC_ADDRESS',
): `0x${string}` | undefined {
  const value = process.env[name];
  if (!value || value === ZERO_ADDRESS) {
    return undefined;
  }

  return value as `0x${string}`;
}

const envFallbackAddresses = {
  policyVault: readEnvAddress('NEXT_PUBLIC_POLICYVAULT_ADDRESS'),
  mockUsdc: readEnvAddress('NEXT_PUBLIC_MOCKUSDC_ADDRESS'),
} as const;

export const hasEnvAddressFallback =
  envFallbackAddresses.policyVault !== undefined && envFallbackAddresses.mockUsdc !== undefined;
const envFallbackContractAddresses: ContractAddresses | undefined = hasEnvAddressFallback
  ? {
      chainId: parseEnvChainId(
        process.env.NEXT_PUBLIC_CHAIN_ID,
        generatedLocalhostAddresses.chainId,
      ),
      policyVault: envFallbackAddresses.policyVault!,
      mockUsdc: envFallbackAddresses.mockUsdc!,
    }
  : undefined;

export const contractAddressSource = hasGeneratedLocalhostAddresses
  ? 'generated-localhost'
  : hasEnvAddressFallback
    ? 'env-fallback'
    : 'placeholder';

export const contractAddresses: ContractAddresses =
  hasGeneratedLocalhostAddresses || envFallbackContractAddresses === undefined
    ? {
        chainId: generatedLocalhostAddresses.chainId,
        policyVault: generatedLocalhostAddresses.policyVault,
        mockUsdc: generatedLocalhostAddresses.mockUsdc,
      }
    : envFallbackContractAddresses;

export const hasConfiguredAddresses =
  contractAddresses.policyVault !== ZERO_ADDRESS && contractAddresses.mockUsdc !== ZERO_ADDRESS;
