# Demo runbook

This is the 5-minute demo sequence for the interview.

## Goal

Show that the project is a real, bounded on-chain MVP with a clean contract and TypeScript proof path.

## Environment prep

Use this exact setup order:

1. Run `pnpm node`.
2. Run `pnpm deploy:local`.
3. Run `pnpm abi:sync`.
4. Run `pnpm seed:local`.
5. Optionally run `pnpm demo:local`.
6. Run `pnpm web:dev` if you want the browser walkthrough.

Call out two repo truths while setting up:

- `deployments/localhost.json` is the tracked localhost deployment source of truth.
- If `seed:local`, `demo:local`, or the UI reports that addresses exist but no contract code is
  present, localhost was restarted on a fresh node and you should rerun `pnpm deploy:local`, then
  `pnpm abi:sync`.

## Fast scripted proof path

This is still the quickest way to prove the whole lifecycle.

1. Show the repo structure and explain the intentionally narrow scope.
2. Point at `MockUSDC` and `PolicyVault` as the only product contracts.
3. Show the tracked `deployments/localhost.json` artifact after `pnpm deploy:local`.
4. Show the readable seeded balances after `pnpm seed:local`:
   - owner: `250 mUSDC`
   - beneficiary: `80 mUSDC`
   - recovery receiver: `40 mUSDC`
5. Run `pnpm demo:local` and narrate each scripted transition:
   - approve + deposit `60 mUSDC`
   - permit + deposit `15 mUSDC`
   - create a `30 mUSDC` policy
   - charge `12 mUSDC` within cap
   - intentional over-cap simulation revert as `CapExceeded(...)`
   - revoke the policy
   - withdraw the remaining `63 mUSDC` vault balance to the recovery receiver
6. Close with the product point:
   - bounded delegated spend
   - permit vs approve UX
   - on-chain policy state and events instead of a vague wallet allowance alone

## Important narration note

The policy cap is a spending ceiling, not a separately reserved escrow bucket.

That means the demo should explain withdraw as "the owner recovering the remaining vault balance
after revoke," not "unlocking escrowed policy funds."

## UI walkthrough

For a clean manual browser walkthrough, do this before `pnpm demo:local` so the first deposit,
policy, charge, revoke, and withdraw still happen live in the dashboard.

The current UI supports the full narratable flow:

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
- a small status surface showing readiness and the last confirmed write outcome

Use it as an optional companion after `pnpm web:dev`:

1. connect the owner wallet
2. confirm the dashboard reaches `Ready`
3. if the readiness state is not `Ready`, explain it directly:
   - `Missing local deploy`: rerun `pnpm deploy:local` and `pnpm abi:sync`
   - `RPC offline`: start `pnpm node`
   - `No contract code`: rerun `pnpm deploy:local` and `pnpm abi:sync` on the current node
4. fund the vault and point out that the timeline refreshes after the deposit receipt lands
5. create a policy, copy the returned policy id, and show the matching `PolicyCreated` row
6. load that policy id to show owner, beneficiary, cap, spent, remaining, expiry, and revoked state
7. switch to the beneficiary wallet to charge and call out the `Charged` row with spent and remaining values
8. switch back to the owner wallet to revoke and withdraw, then show the final revoke and withdraw rows together
9. use the `Refresh` button only if you want to prove the log reads are direct and
   not backed by an indexer

If you want one clear UI-side revert, either try an over-cap charge or click an owner-only or
beneficiary-only action from the wrong wallet. The buttons stay visible on purpose so the contract
result can be narrated directly.

The scripted demo remains the fastest proof path, but the UI now narrates the same lifecycle with
readable event rows, explicit readiness states, and manual policy-id lookup instead of a hidden
indexer or policy list.

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

The current scripted demo uses the over-cap case and prints the custom error cleanly before any bad
write is sent.
