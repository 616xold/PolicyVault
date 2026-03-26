'use client';

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
  return (
    <section className="card stack">
      <h2 className="panel-title">Wallet state</h2>
      <div className="kv">
        <span className="label">Connection</span>
        <span className={`tag status-tag ${isConnected ? 'status-live' : 'status-muted'}`}>
          {connectionStatus}
        </span>
      </div>
      <div className="kv">
        <span className="label">Connected address</span>
        <span className="value code">{address ?? 'Not connected'}</span>
      </div>
      <div className="kv">
        <span className="label">{tokenLabel} balance</span>
        <span className="value">{tokenBalance}</span>
      </div>
      <div className="kv">
        <span className="label">Vault balance</span>
        <span className="value">{vaultBalance}</span>
      </div>
      <div className="kv">
        <span className="label">Allowance to PolicyVault</span>
        <span className="value">{allowance}</span>
      </div>
      <div className="button-row">
        {isConnected ? (
          <button type="button" className="secondary" disabled={isDisconnectPending} onClick={onDisconnect}>
            {isDisconnectPending ? 'Disconnecting…' : 'Disconnect'}
          </button>
        ) : (
          <button type="button" disabled={disableConnect || isConnectPending} onClick={onConnect}>
            {disableConnect ? 'Wallet not detected' : isConnectPending ? 'Connecting…' : 'Connect wallet'}
          </button>
        )}
      </div>
      {connectError ? <p className="status-copy error-copy">{connectError}</p> : null}
      <p className="note">
        {note}
      </p>
    </section>
  );
}
