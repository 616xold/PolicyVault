'use client';

import { shortAddress } from '../lib/format.js';

type WalletStateProps = {
  address?: `0x${string}`;
  allowance: string;
  connectError?: string;
  connectionStatus: string;
  disableConnect: boolean;
  isConnectPending: boolean;
  isConnected: boolean;
  isDisconnectPending: boolean;
  note: string;
  onConnect: () => void;
  onDisconnect: () => void;
  tokenBalance: string;
  tokenLabel: string;
  vaultBalance: string;
};

export function WalletState({
  address,
  allowance,
  connectError,
  connectionStatus,
  disableConnect,
  isConnectPending,
  isConnected,
  isDisconnectPending,
  note,
  onConnect,
  onDisconnect,
  tokenBalance,
  tokenLabel,
  vaultBalance,
}: WalletStateProps) {
  const addressLabel = address ? shortAddress(address) : 'Not connected';

  return (
    <section className="context-panel wallet-panel">
      <div className="panel-header">
        <div>
          <p className="panel-eyebrow">Wallet</p>
          <h3 className="panel-title">Balances and access</h3>
        </div>
        <span className={`tag status-tag ${isConnected ? 'status-live' : 'status-muted'}`}>
          {connectionStatus}
        </span>
      </div>

      <div className="stats-grid">
        <div className="stat-block">
          <span className="label">{tokenLabel} balance</span>
          <span className="value">{tokenBalance}</span>
        </div>
        <div className="stat-block">
          <span className="label">Vault balance</span>
          <span className="value">{vaultBalance}</span>
        </div>
        <div className="stat-block">
          <span className="label">Allowance</span>
          <span className="value">{allowance}</span>
        </div>
      </div>

      <div className="detail-list">
        <div className="detail-row detail-row-stack">
          <span className="label">Address</span>
          <span className="value code small-value" title={address}>
            {addressLabel}
          </span>
        </div>
      </div>

      <div className="button-row">
        {isConnected ? (
          <button
            type="button"
            className="ghost"
            disabled={isDisconnectPending}
            onClick={onDisconnect}
          >
            {isDisconnectPending ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : (
          <button type="button" disabled={disableConnect || isConnectPending} onClick={onConnect}>
            {disableConnect
              ? 'Wallet not detected'
              : isConnectPending
                ? 'Connecting…'
                : 'Connect wallet'}
          </button>
        )}
      </div>
      {connectError ? <p className="status-copy error-copy">{connectError}</p> : null}
      <p className="note form-note">{note}</p>
    </section>
  );
}
