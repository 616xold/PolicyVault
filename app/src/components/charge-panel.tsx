'use client';

import { shortAddress } from '../lib/format.js';
import type { PolicyWriteState } from '../lib/policy.js';

type ChargePanelProps = {
  actionPolicyId: string;
  actionState: PolicyWriteState;
  chargeAmount: string;
  chargePreview: string;
  disabledReason?: string;
  isBusy: boolean;
  onActionPolicyIdChange: (value: string) => void;
  onCharge: () => void;
  onChargeAmountChange: (value: string) => void;
  onClearStatus: () => void;
  onRevoke: () => void;
  onWithdraw: () => void;
  onWithdrawAmountChange: (value: string) => void;
  onWithdrawReceiverChange: (value: string) => void;
  tokenSymbol: string;
  withdrawAmount: string;
  withdrawPreview: string;
  withdrawReceiver: string;
};

export function ChargePanel({
  actionPolicyId,
  actionState,
  chargeAmount,
  chargePreview,
  disabledReason,
  isBusy,
  onActionPolicyIdChange,
  onCharge,
  onChargeAmountChange,
  onClearStatus,
  onRevoke,
  onWithdraw,
  onWithdrawAmountChange,
  onWithdrawReceiverChange,
  tokenSymbol,
  withdrawAmount,
  withdrawPreview,
  withdrawReceiver,
}: ChargePanelProps) {
  const statusClass =
    actionState.phase === 'pending'
      ? 'pending'
      : actionState.phase === 'success'
        ? 'success'
        : actionState.phase === 'error'
          ? 'error'
          : '';
  const statusTxHash =
    actionState.phase === 'pending' || actionState.phase === 'success'
      ? actionState.txHash
      : undefined;

  return (
    <section className="workflow-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">03 Use</p>
          <h3 className="panel-title">Charge or unwind</h3>
        </div>
      </div>
      <p className="panel-intro">Beneficiary charges. Owner revokes and withdraws.</p>
      <div className="subsection-header">
        <p className="subsection-title">Policy actions</p>
        <p className="note">Use one policy id for charge or revoke.</p>
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="policy-id">
          Policy id
        </label>
        <input
          id="policy-id"
          placeholder="0x..."
          value={actionPolicyId}
          onChange={(event) => onActionPolicyIdChange(event.target.value)}
        />
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="charge-amount">
          Charge amount
        </label>
        <input
          id="charge-amount"
          inputMode="decimal"
          placeholder={`10.00 ${tokenSymbol}`}
          value={chargeAmount}
          onChange={(event) => onChargeAmountChange(event.target.value)}
        />
        <div className="inline-meta">
          <span className="label">Parsed amount</span>
          <span className="value small-value">{chargePreview || 'Enter a charge amount'}</span>
        </div>
      </div>
      <p className="note form-note">
        {disabledReason ?? 'Charge with the beneficiary wallet.'}
      </p>
      <div className="button-row">
        <button
          type="button"
          disabled={
            Boolean(disabledReason) || isBusy || !actionPolicyId.trim() || !chargeAmount.trim()
          }
          onClick={onCharge}
        >
          {isBusy && actionState.phase === 'pending' && actionState.action === 'charge'
            ? 'Charging…'
            : 'Charge'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={Boolean(disabledReason) || isBusy || !actionPolicyId.trim()}
          onClick={onRevoke}
        >
          {isBusy && actionState.phase === 'pending' && actionState.action === 'revoke'
            ? 'Revoking…'
            : 'Revoke'}
        </button>
      </div>

      <div className="panel-divider" />

      <div className="subsection-header">
        <p className="subsection-title">Withdraw balance</p>
        <p className="note">Send unused funds to a receiver.</p>
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="withdraw-amount">
          Withdraw amount
        </label>
        <input
          id="withdraw-amount"
          inputMode="decimal"
          placeholder={`25.00 ${tokenSymbol}`}
          value={withdrawAmount}
          onChange={(event) => onWithdrawAmountChange(event.target.value)}
        />
        <div className="inline-meta">
          <span className="label">Parsed amount</span>
          <span className="value small-value">{withdrawPreview || 'Enter a withdraw amount'}</span>
        </div>
      </div>
      <div className="form-row">
        <label className="label field-label" htmlFor="withdraw-receiver">
          Receiver
        </label>
        <input
          id="withdraw-receiver"
          placeholder="0x..."
          value={withdrawReceiver}
          onChange={(event) => onWithdrawReceiverChange(event.target.value)}
        />
      </div>
      <p className="note form-note">
        {disabledReason ?? 'Withdraw with the owner wallet.'}
      </p>
      <div className="button-row">
        <button
          type="button"
          className="secondary"
          disabled={
            Boolean(disabledReason) || isBusy || !withdrawAmount.trim() || !withdrawReceiver.trim()
          }
          onClick={onWithdraw}
        >
          {isBusy && actionState.phase === 'pending' && actionState.action === 'withdraw'
            ? 'Withdrawing…'
            : 'Withdraw'}
        </button>
        <button
          type="button"
          className="ghost"
          disabled={actionState.phase === 'idle'}
          onClick={onClearStatus}
        >
          Clear
        </button>
      </div>
      {actionState.phase !== 'idle' ? (
        <div className={`status-box action-status ${statusClass}`}>
          <p className="status-copy">{actionState.message}</p>
          {statusTxHash ? (
            <p className="status-meta code" title={statusTxHash}>
              Tx {shortAddress(statusTxHash)}
            </p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
