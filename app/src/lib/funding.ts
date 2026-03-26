import { parseSignature, parseUnits, type Hex } from 'viem';

export const fundingTokenDefaults = {
  decimals: 6,
  name: 'Mock USDC',
  symbol: 'mUSDC',
} as const;

export const permitTypes = {
  Permit: [
    { name: 'owner', type: 'address' },
    { name: 'spender', type: 'address' },
    { name: 'value', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
    { name: 'deadline', type: 'uint256' },
  ],
} as const;

export type FundingActionMode = 'approve' | 'permit';
export type FundingActionStep = 'approving' | 'depositing' | 'signing';

export type FundingActionState =
  | { phase: 'idle' }
  | {
      phase: 'pending';
      mode: FundingActionMode;
      step: FundingActionStep;
      message: string;
      txHash?: `0x${string}`;
    }
  | {
      phase: 'success';
      mode: FundingActionMode;
      message: string;
      txHash: `0x${string}`;
    }
  | {
      phase: 'error';
      mode: FundingActionMode;
      message: string;
    };

export function buildPermitDomain(
  tokenName: string,
  chainId: number,
  verifyingContract: `0x${string}`,
) {
  // OpenZeppelin ERC20Permit uses version "1", so the live token name is the critical domain field.
  return {
    name: tokenName,
    version: '1',
    chainId,
    verifyingContract,
  } as const;
}

export function parseFundingAmountInput(value: string, decimals: number): bigint {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('Enter a deposit amount.');
  }

  const amount = parseUnits(normalized, decimals);
  if (amount <= 0n) {
    throw new Error('Enter an amount above zero.');
  }

  return amount;
}

export function splitPermitSignature(signature: Hex) {
  const parsedSignature = parseSignature(signature);
  if (!('v' in parsedSignature) || parsedSignature.v === undefined) {
    throw new Error('Wallet returned an unsupported permit signature.');
  }

  return {
    r: parsedSignature.r,
    s: parsedSignature.s,
    v: Number(parsedSignature.v),
  } as const;
}

export function getActionErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null) {
    const shortMessage =
      'shortMessage' in error && typeof error.shortMessage === 'string'
        ? error.shortMessage
        : undefined;
    const message =
      'message' in error && typeof error.message === 'string' ? error.message : undefined;
    const rawMessage = shortMessage ?? message;

    if (rawMessage) {
      return rawMessage.replace(/^Error:\s*/, '').split('\n')[0] ?? 'Transaction failed.';
    }
  }

  return 'Transaction failed.';
}
