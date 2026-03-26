import { getAddress, parseUnits, type Hex } from 'viem';

export type PolicyDetails = {
  owner: `0x${string}`;
  beneficiary: `0x${string}`;
  cap: bigint;
  spent: bigint;
  remaining: bigint;
  expiresAt: bigint;
  revoked: boolean;
};

export type PolicyLookupState = {
  phase: 'idle' | 'loading' | 'success' | 'error';
  message: string;
};

export type PolicyWriteAction = 'create' | 'charge' | 'revoke' | 'withdraw';

export type PolicyWriteState =
  | { phase: 'idle' }
  | {
      phase: 'pending';
      action: PolicyWriteAction;
      message: string;
      txHash?: `0x${string}`;
    }
  | {
      phase: 'success';
      action: PolicyWriteAction;
      message: string;
      txHash: `0x${string}`;
    }
  | {
      phase: 'error';
      action: PolicyWriteAction;
      message: string;
    };

export const initialPolicyLookupState: PolicyLookupState = {
  phase: 'idle',
  message:
    'Load a policy id to inspect owner, beneficiary, cap, spent, remaining, expiry, and revoke state.',
};

export function parsePolicyAmountInput(
  value: string,
  decimals: number,
  fieldLabel: string,
): bigint {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Enter a ${fieldLabel}.`);
  }

  const amount = parseUnits(normalized, decimals);
  if (amount <= 0n) {
    throw new Error(`Enter a ${fieldLabel} above zero.`);
  }

  return amount;
}

export function parseExpiryInput(value: string): bigint {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('Enter an expiry unix timestamp.');
  }

  if (!/^\d+$/.test(normalized)) {
    throw new Error('Enter a whole-number unix timestamp.');
  }

  const expiresAt = BigInt(normalized);
  const now = BigInt(Math.floor(Date.now() / 1000));
  if (expiresAt <= now) {
    throw new Error('Enter a future unix timestamp.');
  }

  return expiresAt;
}

export function parseAddressInput(value: string, fieldLabel: string): `0x${string}` {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`Enter a ${fieldLabel} address.`);
  }

  try {
    return getAddress(normalized);
  } catch {
    throw new Error(`Enter a valid ${fieldLabel} address.`);
  }
}

export function parsePolicyIdInput(value: string): Hex {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error('Enter a policy id.');
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(normalized)) {
    throw new Error('Enter a valid 32-byte policy id.');
  }

  return normalized as Hex;
}
