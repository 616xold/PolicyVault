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
   - if a later `seed:local` or `demo:local` run says the artifact exists but no contract code is
     present, you restarted localhost on a fresh node and should rerun `pnpm deploy:local`
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

## UI walkthrough

The UI now supports the full narratable flow, including the recent-event timeline:

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
- recent `Deposited`, `PolicyCreated`, `Charged`, `PolicyRevoked`, and `Withdrawn` rows from
  PolicyVault logs
- a small status surface showing whether the local deploy is ready and what the last write did

Use it as an optional companion after `pnpm web:dev`:

1. connect the owner wallet
2. confirm the timeline card says `Demo ready`; if it says `Missing local deploy`, run
   `pnpm deploy:local` and `pnpm abi:sync`; if it says `RPC offline`, start `pnpm node`
3. fund the vault and point out that the timeline refreshes after the deposit receipt lands
4. create a policy, copy the created policy id, and show the matching `PolicyCreated` row
5. load that policy id to show owner, beneficiary, cap, spent, remaining, expiry, and revoked
   state
6. switch to the beneficiary wallet to charge and call out the `Charged` row with spent and
   remaining values
7. switch back to the owner wallet to revoke and withdraw, then show the final revoke and withdraw
   rows together
8. use the manual `Refresh timeline` button only if you want to prove the log reads are direct and
   not backed by an indexer

If you want one clear UI-side revert, either try an over-cap charge or click an owner-only or
beneficiary-only action from the wrong wallet. The buttons stay visible on purpose so the contract
result can be narrated directly.

The scripted demo remains the fastest proof path, but the UI can now narrate the same lifecycle
with readable event rows instead of raw log data.

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
