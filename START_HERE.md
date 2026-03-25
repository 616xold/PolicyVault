# Start here

This repository is intentionally opinionated so that you can open it in the Codex app and start building immediately.

## First run in Codex

Open the repository root in the Codex app.

Then start a fresh thread and give Codex this prompt:

```text
Read README.md, SPEC.md, AGENTS.md, PLANS.md, plans/ROADMAP.md, and plans/EP-0001-contract-spine.md.

Summarize the active milestone in 8-12 lines, then implement only the next unfinished submilestone in EP-0001.

Keep the code modular, preserve the repo boundaries, update the ExecPlan Progress and Decision Log as you work, and run the narrowest useful validation commands after each meaningful step. Report:
1) files changed,
2) tests or compile commands run,
3) remaining risks,
4) the exact next submilestone.
```

## Recommended operating pattern

Use one Codex thread per submilestone.

Before starting a thread, read `.agents/skills/README.md` and use the matching bundle for the current milestone.

Suggested thread names:

- `PV-M1.1-contract-interface-and-storage`
- `PV-M1.2-deposit-withdraw-core`
- `PV-M1.3-policy-create-revoke-charge`
- `PV-M1.4-contract-tests`
- `PV-M2.1-permit-deposit`
- `PV-M2.2-scripts-and-abi-sync`
- `PV-M2.3-ui-spine-and-event-timeline`

## Review ritual

After each submilestone:

1. review the diff
2. confirm the touched files respect module boundaries
3. confirm the ExecPlan was updated
4. run the specified validation commands
5. only then move to the next submilestone

## Use the repo skills

Skill bundles live in `.agents/skills/README.md`.

For the contract core, start with this bundle:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $solidity-security-guard $hardhat-test-first-driver $policy-state-machine-guard $interview-readability-guard
```

For scripts and ABI wiring, use this bundle:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $abi-surface-sync-guard $viem-wagmi-integration-guard $demo-proof-auditor $docs-runbook-keeper
```

Example:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $solidity-security-guard $hardhat-test-first-driver $policy-state-machine-guard $interview-readability-guard

Read README.md, SPEC.md, AGENTS.md, PLANS.md, plans/ROADMAP.md, plans/EP-0001-contract-spine.md, and .agents/skills/README.md.

Implement only the deposit and withdraw path for PolicyVault.
Keep state updates before token transfers, use custom errors, keep helper functions small, update the ExecPlan as you work, and stop when the current acceptance check is green.
Add or update focused tests for zero amount, missing allowance, happy-path deposit, insufficient balance withdrawal, zero receiver, and event emission.
```

## What not to do first

Do not start with:

- testnet deployment
- account abstraction
- multi-token support
- backend services
- subgraph indexing
- generic dashboard polish
- typed-data one-off charge authorizations
- proxies or admin roles

## The correct first success

The first success is simple and valuable:

> `MockUSDC` exists, `PolicyVault` compiles, and the approve + deposit + createPolicy + charge + revoke + withdraw path is green under local tests.
