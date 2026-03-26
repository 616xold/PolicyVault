import { VaultDashboard } from '../components/vault-dashboard.js';

export default function Page() {
  return (
    <main>
      <section className="hero">
        <span className="tag">Interview-targeted Web3 MVP</span>
        <h1>PolicyVault</h1>
        <p>
          A bounded ERC-20 spending demo where an owner deposits funds into a vault, creates a
          beneficiary-specific spending policy with a cap and expiry, and the beneficiary can only
          charge within those on-chain limits.
        </p>
      </section>

      <div className="grid two">
        <VaultDashboard />
      </div>

      <p className="note section-note">
        Policy ids stay intentionally manual in this MVP, and the recent-event timeline helps
        narrate the latest deposit, policy, charge, revoke, and withdraw transitions without adding
        an indexer.
      </p>
    </main>
  );
}
