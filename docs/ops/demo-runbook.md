# Demo runbook

This is the 5-minute demo sequence for the interview.

## Goal

Show that the project is a real, bounded on-chain MVP with both contract and TypeScript/UI surfaces.

## Scripted flow

1. Show the repo structure and say why the scope is intentionally narrow.
2. Show `MockUSDC` and `PolicyVault` in the contract layer.
3. Run or describe `demo.ts`:
   - mint local tokens
   - approve + deposit
   - create policy
   - charge within cap
   - show over-cap or expired revert
   - revoke policy
   - withdraw unused funds
4. Show the UI panels:
   - wallet token balance
   - vault balance
   - deposit path
   - policy creation
   - charge / revoke / withdraw
   - recent event timeline
5. Close with the security and UX trade-off:
   - bounded delegated spend
   - permit vs approve
   - why on-chain policy state improves clarity

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

A clean revert story makes the demo feel much more credible.
