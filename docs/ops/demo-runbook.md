# Demo runbook

This is the 5-minute demo sequence for the interview.

## Goal

Show that the project is a real, bounded on-chain MVP with a clean contract and TypeScript proof path.

## Current proof path

1. Show the repo structure and say why the scope is intentionally narrow.
2. Show `MockUSDC` and `PolicyVault` in the contract layer.
3. In a second terminal, run `pnpm node`.
4. In a third terminal, run `pnpm deploy:local` and show the deterministic
   `deployments/localhost.json` artifact.
5. Run `pnpm seed:local` and point out the readable starting balances:
   - owner: `250 mUSDC`
   - beneficiary: `80 mUSDC`
   - recovery receiver: `40 mUSDC`
6. Run `pnpm demo:local` and narrate each validated transition:
   - approve + deposit `60 mUSDC`
   - permit + deposit `15 mUSDC`
   - create a `30 mUSDC` policy
   - charge `12 mUSDC` within cap
   - show the intentional over-cap revert as `CapExceeded(...)`
   - revoke the policy
   - withdraw the remaining `63 mUSDC` vault balance to the recovery receiver
7. Close with the security and UX trade-off:
   - bounded delegated spend
   - permit vs approve
   - why on-chain policy state improves clarity

## Important narration note

The policy cap is a spending ceiling, not a separately reserved escrow bucket.

That means the demo should explain withdraw as "the owner recovering the remaining vault balance
after revoke," not "unlocking escrowed policy funds."

## UI note

The UI now supports the full policy/action slice short of the event timeline:

- connected wallet state
- wallet balance, vault balance, and allowance
- approve + deposit
- permit + deposit
- create policy with beneficiary, cap, and expiry inputs
- show the created policy id
- load a policy by id
- charge
- revoke
- withdraw

Use it as an optional companion after `pnpm web:dev`:

1. connect the owner wallet
2. fund the vault
3. create a policy and copy the created policy id
4. load that policy id to show owner, beneficiary, cap, spent, remaining, expiry, and revoked
   state
5. switch to the beneficiary wallet to charge
6. switch back to the owner wallet to revoke and withdraw

If you want one clear UI-side revert, either try an over-cap charge or click an owner-only or
beneficiary-only action from the wrong wallet. The buttons stay visible on purpose so the contract
result can be narrated directly.

The event timeline is still deferred, so the scripted demo remains the primary proof path for full
event narration.

## Best talking points

- I chose a project adjacent to real wallet UX and approval problems.
- I kept it single-asset and on-chain first so the state machine stayed explainable.
- I used AI-native implementation speed, but kept the scope disciplined and test-first.
- I wrote it to be easy to whiteboard, not just to compile.

## Revert case to show

Always include one explicit failing path:

- charge over remaining cap
- charge after expiry
- withdraw above available vault balance

The current scripted demo uses the over-cap case and prints the custom error cleanly before any bad write is sent.
