import { VaultDashboard } from '../components/vault-dashboard.js';

export default function Page() {
  return (
    <main className="app-shell">
      <section className="masthead">
        <div className="masthead-copy">
          <p className="eyebrow">Bounded ERC-20 spending surface</p>
          <h1>PolicyVault</h1>
          <p className="masthead-lede">
            Fund a dedicated vault, create a beneficiary policy with a cap and expiry, and operate
            the full spend path against live on-chain state.
          </p>
        </div>
        <p className="masthead-meta">
          MockUSDC on localhost. Manual policy ids. Direct event evidence.
        </p>
      </section>
      <VaultDashboard />
    </main>
  );
}
