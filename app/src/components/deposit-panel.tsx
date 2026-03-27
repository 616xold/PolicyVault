'use client';

import type { FundingActionState } from '../lib/funding.js';

type DepositPanelProps = {
  actionState: FundingActionState;
  allowanceHint: string;
  amount: string;
  amountPreview: string;
  disabledReason?: string;
  isBusy: boolean;
  onAmountChange: (value: string) => void;
  onApproveDeposit: () => void;
  onPermitDeposit: () => void;
  tokenName: string;
  tokenSymbol: string;
  walletBalance: string;
};

export function DepositPanel({
  actionState,
  allowanceHint,
  amount,
  amountPreview,
  disabledReason,
  isBusy,
  onAmountChange,
  onApproveDeposit,
  onPermitDeposit,
  tokenName,
  tokenSymbol,
  walletBalance,
}: DepositPanelProps) {
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
          <p className="panel-eyebrow">01 Fund vault</p>
          <h3 className="panel-title">Move {tokenSymbol} into PolicyVault</h3>
        </div>
      </div>
      <p className="panel-intro">
        Use approval or permit, then land in the same vault balance with a visible receipt trail.
      </p>
      <div className="form-row">
        <label className="label" htmlFor="deposit-amount">
          Amount
        </label>
        <input
          id="deposit-amount"
          inputMode="decimal"
          placeholder={`100.00 ${tokenSymbol}`}
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <div className="inline-meta">
          <span className="label">Wallet balance</span>
          <span className="value small-value">{walletBalance}</span>
        </div>
        <div className="inline-meta">
          <span className="label">Preview</span>
          <span className="value small-value">{amountPreview || 'Enter an amount'}</span>
        </div>
      </div>
      <p className="note">{disabledReason ?? allowanceHint}</p>
      <div className="button-row">
        <button
          type="button"
          disabled={Boolean(disabledReason) || isBusy || !amount.trim()}
          onClick={onApproveDeposit}
        >
          {isBusy && actionState.phase === 'pending' && actionState.mode === 'approve'
            ? 'Processing…'
            : 'Approve + deposit'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={Boolean(disabledReason) || isBusy || !amount.trim()}
          onClick={onPermitDeposit}
        >
          Permit + deposit
        </button>
      </div>
      {actionState.phase !== 'idle' ? (
        <div className={`status-box ${statusClass}`}>
          <p className="status-copy">{actionState.message}</p>
          {statusTxHash ? (
            <p className="status-copy label">Tx {statusTxHash}</p>
          ) : null}
        </div>
      ) : null}
      <p className="note">
        {tokenName} stays explicit here so the approve-versus-permit trade-off remains easy to
        narrate.
      </p>
    </section>
  );
}
