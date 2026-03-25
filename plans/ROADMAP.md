# PolicyVault roadmap

This roadmap is the working build order for the repo. It is intentionally specific.

If you change the sequence, record the reason in the active ExecPlan.

## Build philosophy

Build one strong vertical slice at a time.

The first version should prove that PolicyVault can:

1. hold owner-funded ERC-20 balances
2. create deterministic beneficiary policies
3. enforce cap, expiry, and revoke rules on-chain
4. emit useful events
5. drive a clean local demo through scripts and a small UI

## Milestone map

### M0 - Scaffold and repo hygiene

Goal: establish docs, plans, and clean boundaries.

Status: complete in the scaffold.

Exit criteria:

- top-level docs exist
- the roadmap exists
- the contract, test, script, and app directories exist
- the first ExecPlan exists

### M1 - Contract spine

Goal: make the core contracts compile and support the bounded spend state machine.

Submilestones:

- M1.1 finalize public interface, storage, errors, and events
- M1.2 implement approve + deposit and withdraw
- M1.3 implement policy create, revoke, and charge
- M1.4 add first contract tests for happy and failure paths

Exit criteria:

- `MockUSDC` and `PolicyVault` compile
- deposit / withdraw / create / revoke / charge all work
- at least one revert case is covered for each critical path

### M2 - Permit path, scripts, and ABI sync

Goal: prove the TypeScript integration path and better UX story.

Submilestones:

- M2.1 implement `depositWithPermit`
- M2.2 add deploy, seed, and demo scripts
- M2.3 add ABI sync into the app
- M2.4 tighten console output for deterministic demos

Exit criteria:

- permit deposit works locally
- scripts can run the full happy path
- app can consume current ABIs without manual copy-paste churn

### M3 - UI spine

Goal: make the state machine visible in a small wallet-connected interface.

Submilestones:

- M3.1 wallet state and balances
- M3.2 allowance / deposit panel
- M3.3 policy creation and policy view
- M3.4 charge / revoke / withdraw actions
- M3.5 recent event timeline

Exit criteria:

- the UI can narrate the happy path
- the UI can show at least one failing state clearly

### M4 - Polish and interview asset

Goal: turn the MVP into something easy to present.

Submilestones:

- M4.1 README polish
- M4.2 screenshots and runbook
- M4.3 optional testnet deploy if local flow is already solid
- M4.4 rehearse the 60-second and 3-minute explanations

Exit criteria:

- demo is green
- docs are green
- you can explain every state transition from memory
