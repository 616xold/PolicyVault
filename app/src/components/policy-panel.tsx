'use client';

import { formatTokenAmount, formatUnixTimestamp, shortAddress } from '../lib/format.js';
import type { PolicyDetails, PolicyLookupState, PolicyWriteState } from '../lib/policy.js';

type PolicyPanelProps = {
  beneficiary: string;
  cap: string;
  capPreview: string;
  createDisabledReason?: string;
  createState: PolicyWriteState;
  createdPolicyId?: `0x${string}`;
  expiry: string;
  isCreateBusy: boolean;
  isLookupBusy: boolean;
  loadedPolicy?: PolicyDetails;
  loadedPolicyId?: `0x${string}`;
  lookupDisabledReason?: string;
  lookupPolicyId: string;
  lookupState: PolicyLookupState;
  onBeneficiaryChange: (value: string) => void;
  onCapChange: (value: string) => void;
  onClearCreateState: () => void;
  onCreatePolicy: () => void;
  onExpiryChange: (value: string) => void;
  onLoadPolicy: () => void;
  onLookupPolicyIdChange: (value: string) => void;
  tokenDecimals: number;
  tokenSymbol: string;
};

export function PolicyPanel({
  beneficiary,
  cap,
  capPreview,
  createDisabledReason,
  createState,
  createdPolicyId,
  expiry,
  isCreateBusy,
  isLookupBusy,
  loadedPolicy,
  loadedPolicyId,
  lookupDisabledReason,
  lookupPolicyId,
  lookupState,
  onBeneficiaryChange,
  onCapChange,
  onClearCreateState,
  onCreatePolicy,
  onExpiryChange,
  onLoadPolicy,
  onLookupPolicyIdChange,
  tokenDecimals,
  tokenSymbol,
}: PolicyPanelProps) {
  const createStatusClass =
    createState.phase === 'pending'
      ? 'pending'
      : createState.phase === 'success'
        ? 'success'
        : createState.phase === 'error'
          ? 'error'
          : '';
  const createStatusTxHash =
    createState.phase === 'pending' || createState.phase === 'success'
      ? createState.txHash
      : undefined;

  return (
    <section className="workflow-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">02 Create</p>
          <h3 className="panel-title">Policy</h3>
        </div>
      </div>
      <p className="panel-intro">Set the beneficiary, limit, and expiry.</p>
      <div className="form-row">
        <label className="label field-label" htmlFor="beneficiary">
          Beneficiary
        </label>
        <input
          id="beneficiary"
          placeholder="0x..."
          value={beneficiary}
          onChange={(event) => onBeneficiaryChange(event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="cap">
          Cap
        </label>
        <input
          id="cap"
          inputMode="decimal"
          placeholder={`25.00 ${tokenSymbol}`}
          value={cap}
          onChange={(event) => onCapChange(event.target.value)}
        />
        <div className="inline-meta">
          <span className="label">Preview</span>
          <span className="value small-value">{capPreview || 'Enter a cap amount'}</span>
        </div>
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="expiry">
          Expiry
        </label>
        <input
          id="expiry"
          inputMode="numeric"
          placeholder="1735689600"
          value={expiry}
          onChange={(event) => onExpiryChange(event.target.value)}
        />
      </div>
      <p className="note form-note">
        {createDisabledReason ?? 'Owner wallet required.'}
      </p>
      <div className="button-row">
        <button
          type="button"
          disabled={
            Boolean(createDisabledReason) ||
            isCreateBusy ||
            !beneficiary.trim() ||
            !cap.trim() ||
            !expiry.trim()
          }
          onClick={onCreatePolicy}
        >
          {isCreateBusy ? 'Creating…' : 'Create policy'}
        </button>
        <button
          type="button"
          className="ghost"
          disabled={createState.phase === 'idle'}
          onClick={onClearCreateState}
        >
          Clear
        </button>
      </div>
      {createState.phase !== 'idle' ? (
        <div className={`status-box action-status ${createStatusClass}`}>
          <p className="status-copy">{createState.message}</p>
          {createStatusTxHash ? (
            <p className="status-meta code" title={createStatusTxHash}>
              Tx {shortAddress(createStatusTxHash)}
            </p>
          ) : null}
        </div>
      ) : null}
      {createdPolicyId ? (
        <div className="detail-row detail-row-stack detail-callout">
          <span className="label">Policy id</span>
          <span className="value code small-value" title={createdPolicyId}>
            {shortAddress(createdPolicyId)}
          </span>
        </div>
      ) : null}

      <div className="panel-divider" />

      <div className="subsection-header">
        <p className="subsection-title">Lookup</p>
        <p className="note">Review a saved policy.</p>
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="lookup-policy-id">
          Policy id
        </label>
        <input
          id="lookup-policy-id"
          placeholder="0x..."
          value={lookupPolicyId}
          onChange={(event) => onLookupPolicyIdChange(event.target.value)}
        />
      </div>
      <p className="note form-note">
        {lookupDisabledReason ?? 'Review policy details anytime.'}
      </p>
      <button
        type="button"
        className="ghost"
        disabled={Boolean(lookupDisabledReason) || isLookupBusy || !lookupPolicyId.trim()}
        onClick={onLoadPolicy}
      >
        {isLookupBusy ? 'Loading…' : 'Review'}
      </button>
      {lookupState.phase === 'loading' || lookupState.phase === 'error' ? (
        <div className={`status-box ${lookupState.phase === 'error' ? 'error' : 'pending'}`}>
          <p className="status-copy">{lookupState.message}</p>
        </div>
      ) : null}
      {loadedPolicy && loadedPolicyId ? (
        <div className="detail-list">
          <div className="detail-row detail-row-stack">
            <span className="label">Policy id</span>
            <span className="value code small-value" title={loadedPolicyId}>
              {shortAddress(loadedPolicyId)}
            </span>
          </div>
          <div className="detail-row detail-row-stack">
            <span className="label">Owner</span>
            <span className="value code small-value" title={loadedPolicy.owner}>
              {shortAddress(loadedPolicy.owner)}
            </span>
          </div>
          <div className="detail-row detail-row-stack">
            <span className="label">Beneficiary</span>
            <span className="value code small-value" title={loadedPolicy.beneficiary}>
              {shortAddress(loadedPolicy.beneficiary)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Cap</span>
            <span className="value small-value">
              {formatTokenAmount(loadedPolicy.cap, tokenDecimals, tokenSymbol)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Spent</span>
            <span className="value small-value">
              {formatTokenAmount(loadedPolicy.spent, tokenDecimals, tokenSymbol)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Remaining</span>
            <span className="value small-value">
              {formatTokenAmount(loadedPolicy.remaining, tokenDecimals, tokenSymbol)}
            </span>
          </div>
          <div className="detail-row">
            <span className="label">Expiry</span>
            <span className="value small-value">{formatUnixTimestamp(loadedPolicy.expiresAt)}</span>
          </div>
          <div className="detail-row">
            <span className="label">Revoked</span>
            <span className="value small-value">{loadedPolicy.revoked ? 'Yes' : 'No'}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
