export function DepositPanel() {
  return (
    <section className="card stack">
      <h2 className="panel-title">Deposit</h2>
      <div className="form-row">
        <label className="label" htmlFor="deposit-amount">
          Amount
        </label>
        <input id="deposit-amount" placeholder="100.00 mUSDC" />
      </div>
      <div
        className="stack"
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
        }}
      >
        <button type="button">Approve + deposit</button>
        <button type="button" className="secondary">
          Permit + deposit
        </button>
      </div>
      <p className="note">
        Keep both paths visible. The interview story is stronger when the UI makes approve vs permit explicit.
      </p>
    </section>
  );
}
