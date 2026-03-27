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
      return 'Fund';
    case 'policy-created':
      return 'Policy';
    case 'charge':
      return 'Charge';
    case 'policy-revoked':
      return 'Revoke';
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
  const showLoadStateMessage = loadState.phase !== 'success' || entries.length === 0;

  return (
    <section className="context-panel evidence-panel">
      <div className="panel-header timeline-header">
        <div>
          <p className="panel-eyebrow">Activity</p>
          <h3 className="panel-title">Receipts</h3>
        </div>
        <button
          type="button"
          className="ghost"
          disabled={loadState.phase === 'loading'}
          onClick={onRefresh}
        >
          {loadState.phase === 'loading' ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="timeline-status-grid">
        <div className="status-box timeline-status-card">
          <div className="inline-meta">
            <span className="label">Status</span>
            <span className={`tag status-tag ${statusToneClass(contractStatusTone)}`}>
              {contractStatusLabel}
            </span>
          </div>
          <p className="note">{contractStatusDetail}</p>
        </div>

        <div className="status-box timeline-status-card">
          <div className="inline-meta">
            <span className="label">Latest</span>
            <span className={`timeline-status-copy ${statusToneClass(lastActionTone)}`}>
              {lastActionLabel}
            </span>
          </div>
        </div>
      </div>

      {showLoadStateMessage
        ? loadState.phase === 'loading' || loadState.phase === 'error'
          ? (
              <div className={`status-box ${loadState.phase === 'error' ? 'error' : 'pending'}`}>
                <p className="status-copy">{loadState.message}</p>
              </div>
            )
          : (
              <p className="note meta-note timeline-load-note">{loadState.message}</p>
            )
        : null}

      <div className="timeline">
        {entries.length > 0 ? (
          entries.map((entry, index) => (
            <div
              className={`timeline-item ${index === 0 ? 'timeline-item-latest' : ''}`}
              key={entry.key}
            >
              <div className="timeline-item-header">
                <span className="tag">{eventLabel(entry.kind)}</span>
                <span className="label timeline-stamp">{entry.stamp}</span>
              </div>
              <div className="timeline-item-body">
                <div className="value timeline-title">{entry.title}</div>
                <div className="timeline-summary">{entry.summary}</div>
                <div className="timeline-meta code">{entry.metadata}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="timeline-item timeline-item-empty">
            <div className="value timeline-title">No receipts yet.</div>
            <div className="note">Your next confirmed action appears here.</div>
          </div>
        )}
      </div>
    </section>
  );
}
