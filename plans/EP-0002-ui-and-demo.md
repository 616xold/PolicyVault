# EP-0002 UI and demo spine

## Purpose / Big Picture

This plan turns the contract core into a visible product asset.

The user-visible outcome is a small dashboard that can connect a wallet, show balances and recent events, and run the main bounded-spend flow in a way that is easy to narrate in an interview.

## Progress

- [x] 2026-03-26T00:15:16Z M2.1 implement permit deposit path with a shared internal deposit helper, focused permit tests, and no public ABI change.
- [x] 2026-03-26T01:23:41Z M2.2 wire localhost deploy / seed / demo scripts with a deterministic deployment artifact, simulate-before-write demo flow, and live validation on a local node.
- [x] 2026-03-26T01:33:26Z M2.3 make ABI and localhost address sync deterministic for the app by generating `app/src/lib/generated/abi.ts` from artifacts, generating `app/src/lib/generated/addresses.ts` from `deployments/localhost.json` with a placeholder fallback, and resolving app contract wiring from those generated files first.
- [x] 2026-03-26T01:59:54Z M2.4 build the first real funding UI slice with a funding-only page, live wallet and balance reads, approve + deposit and permit + deposit actions, simulation-before-write, and production app build validation.
- [ ] M2.5 add event timeline and final runbook

## Surprises & Discoveries

- The live ERC-2612 domain name for the local token is `Mock USDC`, so tests should derive the
  typed-data domain from the deployed token instead of guessing from the Solidity contract name.
- The OpenZeppelin permit failure paths are available for focused test assertions once the contract
  is recompiled with the implemented permit path.
- Hardhat warns that Node.js `25.6.1` is unsupported, but `pnpm compile`, `pnpm test`,
  `pnpm deploy:local`, `pnpm seed:local`, and `pnpm demo:local` still completed successfully in
  live localhost validation.
- The policy cap is not reserved escrow; it is enforced against the owner's current vault balance
  at charge time, so the demo and runbook need to narrate withdraw as recovering remaining vault
  funds after revoke.
- Using the `IPolicyVault` interface artifact for app ABI sync keeps the generated vault ABI tied to
  the public surface and much easier to inspect than the full implementation artifact.
- Next.js production type checking under NodeNext required explicit `.js` relative imports across
  `app/src`, and the full `pnpm web:build` pass also surfaced two small strict-typing gaps in
  `app/src/lib/contract-addresses.ts` and `app/src/lib/format.ts` before the funding slice could be
  considered truly build-valid.
- On a fresh localhost node under Node.js `25.6.1`, `pnpm deploy:local` hit a Hardhat
  `compile-cache.json.tmp` rename failure, so live happy-path UI validation still depends on a
  supported Node 22 LTS setup even though the funding page now renders and degrades cleanly.

## Decision Log

- The UI is explanatory before it is beautiful.
- The event timeline is part of the demo surface, not a nice-to-have.
- We will not add backend services or indexing in v1.
- `depositWithPermit` preserves the classic `deposit` story by validating zero amount at the vault
  layer, calling `IERC20Permit`, and then reusing a small internal `_depositFrom` helper for the
  shared state update, token transfer, and `Deposited` event emission.
- The public ABI surface stays unchanged for M2.1, so there is no ABI sync or app wiring work in
  this submilestone.
- M2.2 uses a single human-inspectable `deployments/localhost.json` artifact as the source of
  truth for local addresses, and explicitly defers ABI sync into the app to M2.3.
- The seed script tops up the first three localhost wallets to readable demo balances instead of
  adding reset or burn mechanics to `MockUSDC`.
- The demo script simulates every state-changing call before sending it and uses an intentional
  over-cap simulation as the failing path so the revert is visible without broadcasting a known-bad
  transaction.
- M2.3 keeps `deployments/localhost.json` as the single source of truth for local addresses, and
  `pnpm abi:sync` now materializes those addresses into `app/src/lib/generated/addresses.ts` so the
  app no longer depends on manual address copy-paste.
- Generated localhost addresses win over env configuration when the deployment artifact exists; the
  `NEXT_PUBLIC_POLICYVAULT_ADDRESS` and `NEXT_PUBLIC_MOCKUSDC_ADDRESS` env vars remain only as a
  last-resort fallback when `deployments/localhost.json` is missing.
- `PolicyVaultAbi` is now generated from the `IPolicyVault` interface artifact, and `MockUSDCAbi`
  is filtered down to the app-used ERC-20 and permit surface so the generated app imports stay
  typed, reviewable, and free of inherited implementation noise.
- M2.4 intentionally renders only the funding slice on the main page. Policy panels and the event
  timeline stay hidden until their own submilestones are ready.
- The funding UI uses one small client container to own the wagmi and viem interaction path, while
  `WalletState` and `DepositPanel` stay presentational and easy to explain.
- The approve flow reads live allowance before deciding whether approval is needed, and both funding
  paths simulate their contract writes immediately before sending them.
- The permit UI derives the live token name and nonce from the token contract, while keeping the
  OpenZeppelin permit version `1` as an explicit app-side assumption.

## Context and Orientation

Relevant files:

- `scripts/deploy.ts`
- `scripts/seed.ts`
- `scripts/demo.ts`
- `scripts/sync-abi.ts`
- `app/src/app/*`
- `app/src/components/*`
- `app/src/lib/*`
- `docs/architecture/frontend-data-flow.md`
- `docs/ops/local-dev.md`
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
pnpm demo:local
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
focused happy-path and failure-path tests for zero amount, expiry, and signature replay.

M2.2 is now complete. `deploy.ts` deploys `MockUSDC` and `PolicyVault` on localhost and writes a
deterministic deployment artifact. `seed.ts` reads that artifact and mints readable demo balances
to the first three localhost wallets. `demo.ts` reads the same artifact and runs the live
approve-and-deposit, permit deposit, create policy, charge, over-cap revert, revoke, and withdraw
flow using simulation before every contract write. The validated next submilestone is M2.3 ABI
sync into the app.

M2.3 is now complete. `sync-abi.ts` generates `app/src/lib/generated/abi.ts` from the current
artifact set and `app/src/lib/generated/addresses.ts` from `deployments/localhost.json`, while
also emitting a safe placeholder addresses file when the localhost deployment artifact is missing.
`app/src/lib/contracts.ts`, `app/src/lib/contract-addresses.ts`, and `app/src/lib/config.ts` now
consume the generated ABI and address files directly, preferring generated localhost data over env
fallbacks so the app and scripts do not drift. `pnpm compile` and `pnpm abi:sync` both completed
successfully against the current repo state. The exact next submilestone is M2.4 build UI state
panels.

M2.4 is now complete. The page now renders only the funding slice for this milestone, with a single
client-side funding container that reads connected wallet state, live `MockUSDC` balances, current
vault balance, and allowance from the generated ABI and address wiring. `DepositPanel` now drives
both approve + deposit and permit + deposit flows with live allowance and permit reads, viem
simulation before each write, wallet signature collection for the permit path, and explicit
pending, success, and failure copy. `pnpm compile`, `pnpm abi:sync`, and `pnpm web:build` all
completed successfully. I also loaded the page in a live local browser session and confirmed the UI
renders a clear disabled status instead of crashing when the localhost RPC or deployed contracts are
not in a usable state. Manual happy-path wallet validation remains a follow-up on a supported local
Node 22 LTS setup because a fresh localhost deploy hit a Hardhat cache issue under Node 25.6.1. The
exact next submilestone is M2.5 add event timeline and final runbook.
