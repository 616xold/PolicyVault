'use client';

import type { TimelineEntry, TimelineLoadState } from '../lib/events.js';

type TimelineStatusTone = 'live' | 'muted' | 'warning' | 'error';

type EventTimelineProps = {
  contractStatusDetail: string;
  contractStatusLabel: string;
  contractStatusTone: TimelineStatusTone;
  entries: TimelineEntry[];
  lastActionLabel: string;
  lastActionTone: TimelineStatusTone;
  loadState: TimelineLoadState;
  onRefresh: () => void;
};

function statusToneClass(tone: TimelineStatusTone) {
  switch (tone) {
    case 'live':
      return 'status-live';
    case 'warning':
      return 'status-warning';
    case 'error':
      return 'status-error';
    default:
      return 'status-muted';
  }
}

function eventLabel(kind: TimelineEntry['kind']) {
  switch (kind) {
    case 'deposit':
      return 'Deposit';
    case 'policy-created':
      return 'Policy created';
    case 'charge':
      return 'Charge';
    case 'policy-revoked':
      return 'Policy revoked';
    case 'withdraw':
      return 'Withdraw';
  }
}

export function EventTimeline({
  contractStatusDetail,
  contractStatusLabel,
  contractStatusTone,
  entries,
  lastActionLabel,
  lastActionTone,
  loadState,
  onRefresh,
}: EventTimelineProps) {
  return (
    <section className="card stack">
      <div className="timeline-header">
        <h2 className="panel-title">Recent event timeline</h2>
        <button
          type="button"
          className="secondary"
          disabled={loadState.phase === 'loading'}
          onClick={onRefresh}
        >
          {loadState.phase === 'loading' ? 'Refreshing…' : 'Refresh timeline'}
        </button>
      </div>

      <div className="status-box">
        <div className="inline-meta">
          <span className="label">Contract status</span>
          <span className={`tag status-tag ${statusToneClass(contractStatusTone)}`}>
            {contractStatusLabel}
          </span>
        </div>
        <p className="note">{contractStatusDetail}</p>
        <div className="inline-meta">
          <span className="label">Last action</span>
          <span className={`timeline-status-copy ${statusToneClass(lastActionTone)}`}>
            {lastActionLabel}
          </span>
        </div>
      </div>

      {loadState.phase === 'loading' || loadState.phase === 'error' ? (
        <div className={`status-box ${loadState.phase === 'error' ? 'error' : 'pending'}`}>
          <p className="status-copy">{loadState.message}</p>
        </div>
      ) : (
        <p className="note">{loadState.message}</p>
      )}

      <div className="timeline">
        {entries.length > 0 ? (
          entries.map((entry) => (
            <div className="timeline-item" key={entry.key}>
              <div className="timeline-item-header">
                <span className="tag">{eventLabel(entry.kind)}</span>
                <span className="label">#{entry.blockNumber.toString()}</span>
              </div>
              <div className="value">{entry.title}</div>
              <div className="timeline-summary">{entry.summary}</div>
              <div className="timeline-meta">{entry.metadata}</div>
            </div>
          ))
        ) : (
          <div className="timeline-item">
            <div className="value">No PolicyVault events yet.</div>
            <div className="label">
              The first deposit, policy create, charge, revoke, or withdraw will show up here.
            </div>
          </div>
        )}
      </div>

      <p className="note">
        This stays intentionally simple: direct log reads from the configured PolicyVault contract,
        deterministic ordering, and no indexer in the middle.
      </p>
    </section>
  );
}
