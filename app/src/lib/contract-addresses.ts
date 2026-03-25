export const contractAddresses = {
  policyVault: (process.env.NEXT_PUBLIC_POLICYVAULT_ADDRESS ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
  mockUsdc: (process.env.NEXT_PUBLIC_MOCKUSDC_ADDRESS ??
    '0x0000000000000000000000000000000000000000') as `0x${string}`,
} as const;

export const hasConfiguredAddresses =
  contractAddresses.policyVault !== '0x0000000000000000000000000000000000000000' &&
  contractAddresses.mockUsdc !== '0x0000000000000000000000000000000000000000';
