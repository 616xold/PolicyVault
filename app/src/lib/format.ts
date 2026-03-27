import { formatUnits } from 'viem';

export function shortAddress(value: string): string {
  if (value.length < 10) return value;
  return `${value.slice(0, 6)}…${value.slice(-4)}`;
}

function formatUtcDate(value: bigint | undefined) {
  if (value === undefined) {
    return undefined;
  }

  const seconds = value.toString();
  const numericSeconds = Number(seconds);
  if (!Number.isSafeInteger(numericSeconds)) {
    return undefined;
  }

  const date = new Date(numericSeconds * 1000);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');

  return `${year}-${month}-${day} ${hours}:${minutes} UTC`;
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

  const compact = formatUtcDate(value);
  if (!compact) {
    const seconds = value.toString();
    return `${seconds} (unix)`;
  }

  return `${compact} (${value.toString()})`;
}

export function formatCompactTimestamp(value: bigint | undefined): string {
  if (value === undefined) {
    return '--';
  }

  return formatUtcDate(value) ?? `${value.toString()} (unix)`;
}
