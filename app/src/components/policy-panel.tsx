'use client';

import { formatTokenAmount, formatUnixTimestamp } from '../lib/format.js';
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
    <section className="card stack">
      <h2 className="panel-title">Policy</h2>
      <p className="note">
        Create a bounded policy as the connected owner, then load by policy id to inspect the exact
        on-chain state without adding a list or index layer.
      </p>
      <div className="form-row">
        <label className="label" htmlFor="beneficiary">
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
        <label className="label" htmlFor="cap">
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
        <label className="label" htmlFor="expiry">
          Expiry (unix timestamp)
        </label>
        <input
          id="expiry"
          inputMode="numeric"
          placeholder="1735689600"
          value={expiry}
          onChange={(event) => onExpiryChange(event.target.value)}
        />
      </div>
      <p className="note">
        {createDisabledReason ??
          'Create policy is an owner-side action. The contract still decides whether the connected wallet is allowed to send it.'}
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
          className="secondary"
          disabled={createState.phase === 'idle'}
          onClick={onClearCreateState}
        >
          Clear status
        </button>
      </div>
      {createState.phase !== 'idle' ? (
        <div className={`status-box ${createStatusClass}`}>
          <p className="status-copy">{createState.message}</p>
          {createStatusTxHash ? <p className="status-copy label">Tx {createStatusTxHash}</p> : null}
        </div>
      ) : null}
      {createdPolicyId ? (
        <div className="form-row">
          <span className="label">Last created policy id</span>
          <span className="value code small-value">{createdPolicyId}</span>
        </div>
      ) : null}

      <div className="form-row">
        <label className="label" htmlFor="lookup-policy-id">
          Load policy by id
        </label>
        <input
          id="lookup-policy-id"
          placeholder="0x..."
          value={lookupPolicyId}
          onChange={(event) => onLookupPolicyIdChange(event.target.value)}
        />
      </div>
      <p className="note">
        {lookupDisabledReason ??
          'Policy id is the MVP lookup key. Loading works from the local RPC even if a wallet is disconnected.'}
      </p>
      <button
        type="button"
        className="secondary"
        disabled={Boolean(lookupDisabledReason) || isLookupBusy || !lookupPolicyId.trim()}
        onClick={onLoadPolicy}
      >
        {isLookupBusy ? 'Loading…' : 'Load policy'}
      </button>
      {lookupState.phase === 'loading' || lookupState.phase === 'error' ? (
        <div className={`status-box ${lookupState.phase === 'error' ? 'error' : 'pending'}`}>
          <p className="status-copy">{lookupState.message}</p>
        </div>
      ) : null}
      {loadedPolicy && loadedPolicyId ? (
        <div className="stack">
          <div className="form-row">
            <span className="label">Loaded policy id</span>
            <span className="value code small-value">{loadedPolicyId}</span>
          </div>
          <div className="form-row">
            <span className="label">Owner</span>
            <span className="value code small-value">{loadedPolicy.owner}</span>
          </div>
          <div className="form-row">
            <span className="label">Beneficiary</span>
            <span className="value code small-value">{loadedPolicy.beneficiary}</span>
          </div>
          <div className="inline-meta">
            <span className="label">Cap</span>
            <span className="value small-value">
              {formatTokenAmount(loadedPolicy.cap, tokenDecimals, tokenSymbol)}
            </span>
          </div>
          <div className="inline-meta">
            <span className="label">Spent</span>
            <span className="value small-value">
              {formatTokenAmount(loadedPolicy.spent, tokenDecimals, tokenSymbol)}
            </span>
          </div>
          <div className="inline-meta">
            <span className="label">Remaining</span>
            <span className="value small-value">
              {formatTokenAmount(loadedPolicy.remaining, tokenDecimals, tokenSymbol)}
            </span>
          </div>
          <div className="inline-meta">
            <span className="label">Expiry</span>
            <span className="value small-value">{formatUnixTimestamp(loadedPolicy.expiresAt)}</span>
          </div>
          <div className="inline-meta">
            <span className="label">Revoked</span>
            <span className="value small-value">{loadedPolicy.revoked ? 'Yes' : 'No'}</span>
          </div>
        </div>
      ) : null}
    </section>
  );
}
