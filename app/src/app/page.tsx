import { FundingSlice } from '../components/funding-slice.js';

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
        <FundingSlice />
      </div>

      <p className="note section-note">
        This UI slice intentionally stops at funding. Policy creation, charge, revoke, withdraw, and
        the event timeline stay deferred to the next submilestones.
      </p>
    </main>
  );
}
