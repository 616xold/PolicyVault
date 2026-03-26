# EP-0002 UI and demo spine

## Purpose / Big Picture

This plan turns the contract core into a visible product asset.

The user-visible outcome is a small dashboard that can connect a wallet, show balances and recent events, and run the main bounded-spend flow in a way that is easy to narrate in an interview.

## Progress

- [x] 2026-03-26T00:15:16Z M2.1 implement permit deposit path with a shared internal deposit helper, focused permit tests, and no public ABI change.
- [ ] M2.2 wire deploy / seed / demo scripts
- [ ] M2.3 sync ABI into the app
- [ ] M2.4 build UI state panels
- [ ] M2.5 add event timeline and final runbook

## Surprises & Discoveries

- The live ERC-2612 domain name for the local token is `Mock USDC`, so tests should derive the
  typed-data domain from the deployed token instead of guessing from the Solidity contract name.
- The OpenZeppelin permit failure paths are available for focused test assertions once the contract
  is recompiled with the implemented permit path.

## Decision Log

- The UI is explanatory before it is beautiful.
- The event timeline is part of the demo surface, not a nice-to-have.
- We will not add backend services or indexing in v1.
- `depositWithPermit` preserves the classic `deposit` story by validating zero amount at the vault
  layer, calling `IERC20Permit`, and then reusing a small internal `_depositFrom` helper for the
  shared state update, token transfer, and `Deposited` event emission.
- The public ABI surface stays unchanged for M2.1, so there is no ABI sync or app wiring work in
  this submilestone.

## Context and Orientation

Relevant files:

- `scripts/deploy.ts`
- `scripts/seed.ts`
- `scripts/demo.ts`
- `scripts/sync-abi.ts`
- `app/src/app/*`
- `app/src/components/*`
- `app/src/lib/*`
- `docs/ops/demo-runbook.md`

## Plan of Work

First, finish the permit deposit path and scriptable demo flow. Then make ABI/address sync deterministic. Then wire the UI to the contract reads and writes, keeping the interface small and the panels legible.

## Concrete Steps

1. implement `depositWithPermit`
2. add or tighten permit tests
3. implement `deploy.ts`, `seed.ts`, and `demo.ts`
4. make `sync-abi.ts` produce a stable app import
5. wire app reads and write handlers
6. add event timeline
7. update README and runbook

## Validation and Acceptance

```bash
pnpm compile
pnpm test
pnpm deploy:local
pnpm seed:local
pnpm abi:sync
pnpm web:build
```

Acceptance checks:

- permit deposit works or is explicitly documented as deferred if blocked by tooling
- the demo script shows the happy path and one revert path
- the UI can explain the product clearly

## Idempotence and Recovery

If the UI path starts dragging the schedule:

- freeze interface changes
- fall back to a tighter event timeline plus balances view
- keep the demo script as the primary proof path

## Artifacts and Notes

Expected artifacts:

- local deployed addresses
- ABI sync output
- screenshots
- a clean 5-minute demo path

## Interfaces and Dependencies

Depends on a stable `IPolicyVault` API.

Any contract interface changes must be reflected in the UI wiring docs and in `scripts/sync-abi.ts`.

## Outcomes & Retrospective

M2.1 is complete. `depositWithPermit` now works against `MockUSDC` without a prior `approve`
transaction, emits the same `Deposited` event shape as the classic deposit path, and is covered by
focused happy-path and failure-path tests for zero amount, expiry, and signature replay. M2.2
remains next.
