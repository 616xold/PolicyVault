import { type PublicClient } from 'viem';

export type MissingContractCodeTarget = 'MockUSDC' | 'PolicyVault';

export type ContractReadinessState =
  | { kind: 'missing-addresses' }
  | { kind: 'rpc-unavailable' }
  | { kind: 'checking-contracts' }
  | {
      kind: 'missing-bytecode';
      missingContracts: MissingContractCodeTarget[];
    }
  | { kind: 'ready' };

type ProbeContractReadinessOptions = {
  mockUsdcAddress: `0x${string}`;
  policyVaultAddress: `0x${string}`;
};

function hasBytecode(code: `0x${string}` | undefined) {
  return code !== undefined && code !== '0x';
}

export async function probeContractReadiness(
  publicClient: PublicClient,
  options: ProbeContractReadinessOptions,
): Promise<ContractReadinessState> {
  try {
    const [mockUsdcCode, policyVaultCode] = await Promise.all([
      publicClient.getCode({
        address: options.mockUsdcAddress,
      }),
      publicClient.getCode({
        address: options.policyVaultAddress,
      }),
    ]);

    const missingContracts: MissingContractCodeTarget[] = [];

    if (!hasBytecode(mockUsdcCode)) {
      missingContracts.push('MockUSDC');
    }

    if (!hasBytecode(policyVaultCode)) {
      missingContracts.push('PolicyVault');
    }

    return missingContracts.length > 0
      ? {
          kind: 'missing-bytecode',
          missingContracts,
        }
      : {
          kind: 'ready',
        };
  } catch {
    return {
      kind: 'rpc-unavailable',
    };
  }
}
