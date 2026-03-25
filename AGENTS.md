# PolicyVault repository instructions for Codex

You are working on PolicyVault, a bounded ERC-20 spending MVP for wallet and service-style charging flows.

Read this file before doing any work. For non-trivial work, also read `SPEC.md`, `PLANS.md`, `plans/ROADMAP.md`, and the active ExecPlan in `plans/`.

## Non-negotiable working rules

1. **Prefer modular code.**  
   Keep interfaces, core state logic, UI components, and scripts separated. Do not collapse unrelated concerns into one file.

2. **Use an ExecPlan for meaningful work.**  
   If the task spans multiple files or is likely to take more than 45 minutes, create or update an ExecPlan first. Follow `PLANS.md` exactly.

2a. **Invoke the right skill bundle up front.**  
   For any non-trivial thread, use the relevant bundle from `.agents/skills/README.md` so scope, tests, docs, and chain boundaries stay explicit.

3. **Preserve repo boundaries.**  
   - `contracts/`: Solidity contracts and interfaces only  
   - `test/`: contract tests only  
   - `scripts/`: deploy, seed, demo, and ABI sync tooling only  
   - `app/src/components`: UI panels and presentation  
   - `app/src/lib`: chain config, ABI wiring, formatting, and client helpers  
   - `docs/`: architecture, operations, and decisions  
   - `plans/`: executable plans and roadmap

4. **Keep the contract easy to explain.**  
   If a design choice makes the interview story worse, cut it or defer it.

5. **State changes require tests.**  
   Every new state-changing behavior must have at least one happy-path test and one failure-path test.

6. **Token movement must be explicit and safe.**  
   Use `SafeERC20`, keep checks-effects-interactions ordering, and use `ReentrancyGuard` on external mutating functions.

7. **No hidden policy.**  
   If a workflow rule matters, encode it in code, `SPEC.md`, `WORKFLOW.md`, or a plan.

8. **Simulate before write.**  
   Scripts and UI interactions should use transaction simulation before sending writes where practical.

9. **Narrow scope beats diluted scope.**  
   Prefer one strong vertical slice over three half-built features.

10. **Keep repo hygiene explicit.**  
    Never commit generated artifacts, local env files, `.next`, `artifacts`, or `cache`.

## Definition of done for any milestone

A milestone is not done until all of the following are true:

- code exists in the right module boundaries
- tests exist for the touched behavior
- the relevant docs are updated if behavior changed
- the active ExecPlan progress section is updated
- there is an explicit acceptance check a human can run
- event emission is documented for user-visible state changes

## Modular code preferences

Use these patterns by default:

- `interfaces/` for public Solidity contracts and event / error contracts
- small internal helpers in the main contract instead of giant functions
- `scripts/helpers/` for script formatting and reusable helpers
- `components/` for UI cards and forms
- `lib/` for ABI/config/client helpers
- `docs/architecture/` for system reasoning
- `docs/ops/` for commands, demo flow, and runbooks

## Default implementation preferences

- Solidity `0.8.34`
- OpenZeppelin Contracts
- `SafeERC20`
- `ReentrancyGuard`
- custom errors
- `uint128` packing for `cap` and `spent`
- viem for scripts and frontend interaction
- wagmi for the frontend wallet flow
- minimal but clean styling
- deterministic, readable console output in scripts

## Skills in this repo

Skills live in `.agents/skills`.

Read `.agents/skills/README.md` before starting a non-trivial thread.

Core skills already included in the base scaffold:

- `$execplan-orchestrator` for any multi-file milestone
- `$modular-architecture-guard` when implementing or refactoring
- `$solidity-security-guard` for any token transfer or policy logic
- `$demo-proof-auditor` when shipping the demo script, README, or screenshots

Additional skills added for tighter Codex behavior:

- `$scope-lock-enforcer` to prevent milestone drift
- `$hardhat-test-first-driver` to keep contract work driven by focused tests
- `$policy-state-machine-guard` to protect vault and policy invariants
- `$abi-surface-sync-guard` when the public contract surface changes
- `$viem-wagmi-integration-guard` for scripts, ABI wiring, and UI chain interaction
- `$permit-path-guard` for `depositWithPermit`
- `$interview-readability-guard` to optimize the code for technical explanation
- `$docs-runbook-keeper` to keep the demo and docs truthful

### Recommended skill bundles

- Contract core (`M1.1` to `M1.4`):  
  `$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $solidity-security-guard $hardhat-test-first-driver $policy-state-machine-guard $interview-readability-guard`

- Permit (`M2.1`):  
  `$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $solidity-security-guard $hardhat-test-first-driver $policy-state-machine-guard $permit-path-guard $abi-surface-sync-guard $interview-readability-guard`

- Scripts and ABI (`M2.2`):  
  `$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $abi-surface-sync-guard $viem-wagmi-integration-guard $demo-proof-auditor $docs-runbook-keeper`

- UI (`M2.3`):  
  `$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $viem-wagmi-integration-guard $interview-readability-guard $demo-proof-auditor $docs-runbook-keeper`

## Forbidden shortcuts

Avoid these unless an ExecPlan explicitly approves them:

- adding proxy or upgrade logic
- adding admin roles "just in case"
- multi-token support in v1
- off-chain authorizations before the on-chain policy model is green
- route or UI files containing contract ABI hand-edit churn across multiple places
- skipping event assertions
- burying important trade-offs in chat instead of checked-in docs

## Reporting progress

At each stopping point:

- update the active ExecPlan `Progress` section
- record any design changes in the `Decision Log`
- mention exactly what remains
- mention the exact next submilestone

## Repo-specific north star

The first compelling proof point is not visual polish.

It is this:

> a user deposits `MockUSDC`, creates a bounded policy, a beneficiary charges within the cap, the policy can be revoked, unused funds can be withdrawn, and the full flow is supported by tests, scripts, and explainable events.
