export function WalletState() {
  return (
    <section className="card stack">
      <h2 className="panel-title">Wallet state</h2>
      <div className="kv">
        <span className="label">Connection</span>
        <span className="tag">UI scaffold only</span>
      </div>
      <div className="kv">
        <span className="label">Wallet token balance</span>
        <span className="value">TODO</span>
      </div>
      <div className="kv">
        <span className="label">Vault balance</span>
        <span className="value">TODO</span>
      </div>
      <p className="note">
        Wire this panel to wagmi reads after the core contract flow is implemented and deployed locally.
      </p>
    </section>
  );
}
