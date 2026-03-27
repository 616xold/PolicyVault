'use client';

import type { FundingActionState } from '../lib/funding.js';
import { shortAddress } from '../lib/format.js';

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
          <p className="panel-eyebrow">01 Fund</p>
          <h3 className="panel-title">Add vault balance</h3>
        </div>
      </div>
      <p className="panel-intro">Deposit with approval or permit.</p>
      <div className="form-row">
        <label className="label field-label" htmlFor="deposit-amount">
          Amount
        </label>
        <input
          id="deposit-amount"
          inputMode="decimal"
          placeholder={`100.00 ${tokenSymbol}`}
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <div className="form-meta-grid">
          <div className="inline-meta">
            <span className="label">Wallet balance</span>
            <span className="value small-value">{walletBalance}</span>
          </div>
          <div className="inline-meta">
            <span className="label">Parsed amount</span>
            <span className="value small-value">{amountPreview || 'Enter an amount'}</span>
          </div>
        </div>
      </div>
      <p className="note form-note">{disabledReason ?? allowanceHint}</p>
      <div className="button-row">
        <button
          type="button"
          disabled={Boolean(disabledReason) || isBusy || !amount.trim()}
          onClick={onApproveDeposit}
        >
          {isBusy && actionState.phase === 'pending' && actionState.mode === 'approve'
            ? 'Processing…'
            : 'Approve + fund'}
        </button>
        <button
          type="button"
          className="secondary"
          disabled={Boolean(disabledReason) || isBusy || !amount.trim()}
          onClick={onPermitDeposit}
        >
          Permit + fund
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
