'use client';

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
          <p className="panel-eyebrow">03 Operate policy</p>
          <h3 className="panel-title">Charge, revoke, or withdraw</h3>
        </div>
      </div>
      <p className="panel-intro">
        Charge must come from the beneficiary. Revoke and withdraw must come from the owner.
        Wrong-actor attempts stay visible as contract results instead of disappearing buttons.
      </p>
      <div className="form-row">
        <label className="label" htmlFor="policy-id">
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
        <label className="label" htmlFor="charge-amount">
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
          <span className="label">Charge preview</span>
          <span className="value small-value">{chargePreview || 'Enter a charge amount'}</span>
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="withdraw-amount">
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
          <span className="label">Withdraw preview</span>
          <span className="value small-value">{withdrawPreview || 'Enter a withdraw amount'}</span>
        </div>
      </div>
      <div className="form-row">
        <label className="label" htmlFor="withdraw-receiver">
          Withdraw receiver
        </label>
        <input
          id="withdraw-receiver"
          placeholder="0x..."
          value={withdrawReceiver}
          onChange={(event) => onWithdrawReceiverChange(event.target.value)}
        />
      </div>
      <p className="note">
        {disabledReason ??
          'Use the policy id for charge and revoke. Withdraw uses the connected owner wallet and the explicit receiver address.'}
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
          className="secondary"
          disabled={actionState.phase === 'idle'}
          onClick={onClearStatus}
        >
          Clear status
        </button>
      </div>
      {actionState.phase !== 'idle' ? (
        <div className={`status-box ${statusClass}`}>
          <p className="status-copy">{actionState.message}</p>
          {statusTxHash ? <p className="status-copy label">Tx {statusTxHash}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
