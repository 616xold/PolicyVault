import { type PublicClient } from 'viem';

import {
  formatActivityTimestamp,
  formatCompactTimestamp,
  formatTokenAmount,
  shortAddress,
} from './format.js';
import { PolicyVaultAbi } from './generated/abi.js';

const TIMELINE_BLOCK_WINDOW = 2_000n;
const DEFAULT_TIMELINE_LIMIT = 12;

export type TimelineLoadState = {
  phase: 'idle' | 'loading' | 'success' | 'error';
  message: string;
};

export type TimelineEntryKind =
  | 'deposit'
  | 'policy-created'
  | 'charge'
  | 'policy-revoked'
  | 'withdraw';

export type TimelineEntry = {
  blockNumber: bigint;
  key: string;
  kind: TimelineEntryKind;
  metadata: string;
  stamp: string;
  summary: string;
  title: string;
};

type FetchTimelineOptions = {
  address: `0x${string}`;
  maxItems?: number;
  tokenDecimals: number;
  tokenSymbol: string;
};

type TimelineRecord =
  | {
      amount: bigint;
      blockNumber: bigint;
      kind: 'deposit';
      logIndex: number;
      newVaultBalance: bigint;
      owner: `0x${string}`;
      transactionHash: `0x${string}`;
      transactionIndex: number;
    }
  | {
      beneficiary: `0x${string}`;
      blockNumber: bigint;
      cap: bigint;
      expiresAt: bigint;
      kind: 'policy-created';
      logIndex: number;
      owner: `0x${string}`;
      policyId: `0x${string}`;
      transactionHash: `0x${string}`;
      transactionIndex: number;
    }
  | {
      amount: bigint;
      beneficiary: `0x${string}`;
      blockNumber: bigint;
      kind: 'charge';
      logIndex: number;
      owner: `0x${string}`;
      policyId: `0x${string}`;
      remaining: bigint;
      spent: bigint;
      transactionHash: `0x${string}`;
      transactionIndex: number;
    }
  | {
      beneficiary: `0x${string}`;
      blockNumber: bigint;
      kind: 'policy-revoked';
      logIndex: number;
      owner: `0x${string}`;
      policyId: `0x${string}`;
      transactionHash: `0x${string}`;
      transactionIndex: number;
    }
  | {
      amount: bigint;
      blockNumber: bigint;
      kind: 'withdraw';
      logIndex: number;
      newVaultBalance: bigint;
      owner: `0x${string}`;
      receiver: `0x${string}`;
      transactionHash: `0x${string}`;
      transactionIndex: number;
    };

function hasConfirmedOrdering(
  blockNumber: bigint | null,
  transactionHash: `0x${string}` | null,
  transactionIndex: number | null,
  logIndex: number | null,
): blockNumber is bigint {
  return (
    blockNumber !== null &&
    transactionHash !== null &&
    transactionIndex !== null &&
    logIndex !== null
  );
}

function buildMetadata(record: TimelineRecord, extraDetail?: string): string {
  const parts = [`Tx ${shortAddress(record.transactionHash)}`];

  if (extraDetail) {
    parts.push(extraDetail);
  }

  return parts.join(' · ');
}

function compareTimelineRecords(left: TimelineRecord, right: TimelineRecord): number {
  if (left.blockNumber !== right.blockNumber) {
    return left.blockNumber > right.blockNumber ? -1 : 1;
  }

  if (left.transactionIndex !== right.transactionIndex) {
    return left.transactionIndex > right.transactionIndex ? -1 : 1;
  }

  if (left.logIndex !== right.logIndex) {
    return left.logIndex > right.logIndex ? -1 : 1;
  }

  return left.kind.localeCompare(right.kind);
}

function formatTimelineRecord(
  record: TimelineRecord,
  blockTimestamp: bigint | undefined,
  tokenDecimals: number,
  tokenSymbol: string,
): TimelineEntry {
  const tokenAmount = (value: bigint) => formatTokenAmount(value, tokenDecimals, tokenSymbol);

  switch (record.kind) {
    case 'deposit':
      return {
        blockNumber: record.blockNumber,
        key: `${record.transactionHash}-${record.logIndex}`,
        kind: record.kind,
        metadata: buildMetadata(record),
        stamp: formatActivityTimestamp(blockTimestamp),
        summary: `Owner ${shortAddress(record.owner)}. Vault balance ${tokenAmount(record.newVaultBalance)}.`,
        title: `Funded ${tokenAmount(record.amount)}`,
      };
    case 'policy-created':
      return {
        blockNumber: record.blockNumber,
        key: `${record.transactionHash}-${record.logIndex}`,
        kind: record.kind,
        metadata: buildMetadata(record, `Policy ${shortAddress(record.policyId)}`),
        stamp: formatActivityTimestamp(blockTimestamp),
        summary: `Cap ${tokenAmount(record.cap)}. Expires ${formatCompactTimestamp(record.expiresAt)}.`,
        title: `Policy for ${shortAddress(record.beneficiary)}`,
      };
    case 'charge':
      return {
        blockNumber: record.blockNumber,
        key: `${record.transactionHash}-${record.logIndex}`,
        kind: record.kind,
        metadata: buildMetadata(record, `Policy ${shortAddress(record.policyId)}`),
        stamp: formatActivityTimestamp(blockTimestamp),
        summary: `${tokenAmount(record.remaining)} left after ${tokenAmount(record.spent)} spent.`,
        title: `Charged ${tokenAmount(record.amount)}`,
      };
    case 'policy-revoked':
      return {
        blockNumber: record.blockNumber,
        key: `${record.transactionHash}-${record.logIndex}`,
        kind: record.kind,
        metadata: buildMetadata(record, `Policy ${shortAddress(record.policyId)}`),
        stamp: formatActivityTimestamp(blockTimestamp),
        summary: `${shortAddress(record.beneficiary)} can no longer charge.`,
        title: 'Revoked policy',
      };
    case 'withdraw':
      return {
        blockNumber: record.blockNumber,
        key: `${record.transactionHash}-${record.logIndex}`,
        kind: record.kind,
        metadata: buildMetadata(record),
        stamp: formatActivityTimestamp(blockTimestamp),
        summary: `Sent to ${shortAddress(record.receiver)}. Vault balance ${tokenAmount(record.newVaultBalance)}.`,
        title: `Withdrew ${tokenAmount(record.amount)}`,
      };
  }
}

export async function fetchPolicyVaultTimeline(
  publicClient: PublicClient,
  options: FetchTimelineOptions,
): Promise<TimelineEntry[]> {
  const latestBlock = await publicClient.getBlockNumber();
  const fromBlock = latestBlock > TIMELINE_BLOCK_WINDOW ? latestBlock - TIMELINE_BLOCK_WINDOW : 0n;

  const [depositedLogs, createdLogs, chargedLogs, revokedLogs, withdrawnLogs] = await Promise.all([
    publicClient.getContractEvents({
      abi: PolicyVaultAbi,
      address: options.address,
      eventName: 'Deposited',
      fromBlock,
    }),
    publicClient.getContractEvents({
      abi: PolicyVaultAbi,
      address: options.address,
      eventName: 'PolicyCreated',
      fromBlock,
    }),
    publicClient.getContractEvents({
      abi: PolicyVaultAbi,
      address: options.address,
      eventName: 'Charged',
      fromBlock,
    }),
    publicClient.getContractEvents({
      abi: PolicyVaultAbi,
      address: options.address,
      eventName: 'PolicyRevoked',
      fromBlock,
    }),
    publicClient.getContractEvents({
      abi: PolicyVaultAbi,
      address: options.address,
      eventName: 'Withdrawn',
      fromBlock,
    }),
  ]);

  const mergedRecords = [
    ...depositedLogs.map((log) => {
      if (
        !hasConfirmedOrdering(
          log.blockNumber,
          log.transactionHash,
          log.transactionIndex,
          log.logIndex,
        )
      ) {
        return undefined;
      }

      return {
        amount: log.args.amount,
        blockNumber: log.blockNumber,
        kind: 'deposit' as const,
        logIndex: log.logIndex,
        newVaultBalance: log.args.newVaultBalance,
        owner: log.args.owner,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
      };
    }),
    ...createdLogs.map((log) => {
      if (
        !hasConfirmedOrdering(
          log.blockNumber,
          log.transactionHash,
          log.transactionIndex,
          log.logIndex,
        )
      ) {
        return undefined;
      }

      return {
        beneficiary: log.args.beneficiary,
        blockNumber: log.blockNumber,
        cap: log.args.cap,
        expiresAt: log.args.expiresAt,
        kind: 'policy-created' as const,
        logIndex: log.logIndex,
        owner: log.args.owner,
        policyId: log.args.policyId,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
      };
    }),
    ...chargedLogs.map((log) => {
      if (
        !hasConfirmedOrdering(
          log.blockNumber,
          log.transactionHash,
          log.transactionIndex,
          log.logIndex,
        )
      ) {
        return undefined;
      }

      return {
        amount: log.args.amount,
        beneficiary: log.args.beneficiary,
        blockNumber: log.blockNumber,
        kind: 'charge' as const,
        logIndex: log.logIndex,
        owner: log.args.owner,
        policyId: log.args.policyId,
        remaining: log.args.remaining,
        spent: log.args.spent,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
      };
    }),
    ...revokedLogs.map((log) => {
      if (
        !hasConfirmedOrdering(
          log.blockNumber,
          log.transactionHash,
          log.transactionIndex,
          log.logIndex,
        )
      ) {
        return undefined;
      }

      return {
        beneficiary: log.args.beneficiary,
        blockNumber: log.blockNumber,
        kind: 'policy-revoked' as const,
        logIndex: log.logIndex,
        owner: log.args.owner,
        policyId: log.args.policyId,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
      };
    }),
    ...withdrawnLogs.map((log) => {
      if (
        !hasConfirmedOrdering(
          log.blockNumber,
          log.transactionHash,
          log.transactionIndex,
          log.logIndex,
        )
      ) {
        return undefined;
      }

      return {
        amount: log.args.amount,
        blockNumber: log.blockNumber,
        kind: 'withdraw' as const,
        logIndex: log.logIndex,
        newVaultBalance: log.args.newVaultBalance,
        owner: log.args.owner,
        receiver: log.args.receiver,
        transactionHash: log.transactionHash,
        transactionIndex: log.transactionIndex,
      };
    }),
  ].filter((record): record is TimelineRecord => record !== undefined);

  const recentRecords = mergedRecords
    .sort(compareTimelineRecords)
    .slice(0, options.maxItems ?? DEFAULT_TIMELINE_LIMIT);

  const blockNumbers = [
    ...new Set(recentRecords.map((record) => record.blockNumber.toString())),
  ].map((blockNumber) => BigInt(blockNumber));

  const blocks = await Promise.all(
    blockNumbers.map((blockNumber) =>
      publicClient.getBlock({
        blockNumber,
      }),
    ),
  );

  const blocksByNumber = new Map(blocks.map((block) => [block.number, block]));

  return recentRecords.map((record) =>
    formatTimelineRecord(
      record,
      blocksByNumber.get(record.blockNumber)?.timestamp,
      options.tokenDecimals,
      options.tokenSymbol,
    ),
  );
}
