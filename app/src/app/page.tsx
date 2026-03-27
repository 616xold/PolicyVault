import { VaultDashboard } from '../components/vault-dashboard.js';

export default function Page() {
  return (
    <main className="app-shell">
      <section className="masthead">
        <div className="masthead-copy">
          <p className="eyebrow">Bounded spend</p>
          <h1>PolicyVault</h1>
          <p className="masthead-lede">
            Fund a vault, set a spend policy, and keep repeat charges inside clear limits.
          </p>
        </div>
        <div aria-label="PolicyVault flow" className="masthead-flow">
          <span>Fund</span>
          <span>Create</span>
          <span>Use</span>
        </div>
      </section>
      <VaultDashboard />
    </main>
  );
}
