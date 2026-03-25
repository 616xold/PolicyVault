export function ChargePanel() {
  return (
    <section className="card stack">
      <h2 className="panel-title">Charge / revoke / withdraw</h2>
      <div className="form-row">
        <label className="label" htmlFor="policy-id">
          Policy id
        </label>
        <input id="policy-id" placeholder="0x..." />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="charge-amount">
          Charge amount
        </label>
        <input id="charge-amount" placeholder="10.00" />
      </div>
      <div
        className="stack"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
        }}
      >
        <button type="button">Charge</button>
        <button type="button" className="secondary">
          Revoke
        </button>
        <button type="button" className="secondary">
          Withdraw
        </button>
      </div>
      <p className="note">
        The finished UI should make it obvious which actions belong to the owner and which belong to the beneficiary.
      </p>
    </section>
  );
}
