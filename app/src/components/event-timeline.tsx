const placeholderEvents = [
  'Deposited(owner, amount, newVaultBalance)',
  'PolicyCreated(policyId, owner, beneficiary, cap, expiresAt)',
  'Charged(policyId, owner, beneficiary, amount, spent, remaining)',
  'PolicyRevoked(policyId, owner, beneficiary)',
  'Withdrawn(owner, receiver, amount, newVaultBalance)',
];

export function EventTimeline() {
  return (
    <section className="card stack">
      <h2 className="panel-title">Recent event timeline</h2>
      <div className="timeline">
        {placeholderEvents.map((item) => (
          <div className="timeline-item" key={item}>
            <div className="value">{item}</div>
            <div className="label">Replace placeholder entries with live contract event reads.</div>
          </div>
        ))}
      </div>
      <p className="note">
        The timeline is part of the product explanation. It should help narrate what happened after each action.
      </p>
    </section>
  );
}
