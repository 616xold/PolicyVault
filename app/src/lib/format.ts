import { formatUnits } from 'viem';

export function shortAddress(value: string): string {
  if (value.length < 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

export function formatTokenAmount(
  value: bigint | undefined,
  decimals: number,
  symbol?: string,
): string {
  if (value === undefined) {
    return symbol ? `-- ${symbol}` : '--';
  }

  const [wholePart = '0', fractionalPart = ''] = formatUnits(value, decimals).split('.');
  const trimmedFraction = fractionalPart.replace(/0+$/, '').slice(0, 4);
  const formatted = trimmedFraction ? `${wholePart}.${trimmedFraction}` : wholePart;

  return symbol ? `${formatted} ${symbol}` : formatted;
}

export function formatUnixTimestamp(value: bigint | undefined): string {
  if (value === undefined) {
    return '--';
  }

  const seconds = value.toString();
  const numericSeconds = Number(seconds);
  if (!Number.isSafeInteger(numericSeconds)) {
    return `${seconds} (unix)`;
  }

  const iso = new Date(numericSeconds * 1000)
    .toISOString()
    .replace('T', ' ')
    .replace('.000Z', ' UTC');
  return `${iso} (${seconds})`;
}
