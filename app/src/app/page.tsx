import { VaultDashboard } from '../components/vault-dashboard.js';

export default function Page() {
  return (
    <main className="app-shell">
      <section className="masthead">
        <div className="masthead-copy">
          <p className="eyebrow">Spend controls</p>
          <h1>PolicyVault</h1>
          <p className="masthead-lede">
            Dedicated balance, clear limits, and instant revocation for repeat charges.
          </p>
        </div>
        <div aria-label="PolicyVault flow" className="masthead-flow">
          <span>Fund</span>
          <span>Policy</span>
          <span>Use</span>
        </div>
      </section>
      <VaultDashboard />
    </main>
  );
}
