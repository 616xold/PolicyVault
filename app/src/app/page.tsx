import { ChargePanel } from '../components/charge-panel';
import { DepositPanel } from '../components/deposit-panel';
import { EventTimeline } from '../components/event-timeline';
import { PolicyPanel } from '../components/policy-panel';
import { WalletState } from '../components/wallet-state';

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
        <WalletState />
        <DepositPanel />
        <PolicyPanel />
        <ChargePanel />
      </div>

      <div className="grid" style={{ marginTop: 16 }}>
        <EventTimeline />
      </div>
    </main>
  );
}
