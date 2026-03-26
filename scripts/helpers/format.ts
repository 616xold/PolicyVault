import { type Address, formatUnits } from 'viem';

export function section(title: string): void {
  console.log(`\n=== ${title} ===`);
}

export function divider(): void {
  console.log('-'.repeat(56));
}

export function kv(label: string, value: string | number | bigint | boolean): void {
  console.log(`${label}: ${value}`);
}

export function formatToken(amount: bigint, decimals: number, symbol: string): string {
  return `${formatUnits(amount, decimals)} ${symbol}`;
}

export function shortAddress(address: Address): string {
  return `${address.slice(0, 10)}...${address.slice(-4)}`;
}
