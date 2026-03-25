export function PolicyPanel() {
  return (
    <section className="card stack">
      <h2 className="panel-title">Create policy</h2>
      <div className="form-row">
        <label className="label" htmlFor="beneficiary">
          Beneficiary
        </label>
        <input id="beneficiary" placeholder="0x..." />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="cap">
          Cap
        </label>
        <input id="cap" placeholder="25.00" />
      </div>
      <div className="form-row">
        <label className="label" htmlFor="expiry">
          Expiry (unix timestamp)
        </label>
        <input id="expiry" placeholder="1735689600" />
      </div>
      <button type="button">Create policy</button>
      <p className="note">
        Once wired, this panel should also display the resulting policy id, remaining spend, and revoked status.
      </p>
    </section>
  );
}
