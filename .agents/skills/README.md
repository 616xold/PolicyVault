# PolicyVault skills

PolicyVault is designed to be built inside the Codex app with explicit skill bundles.

Use skills intentionally. Start every non-trivial thread with the right bundle instead of relying on implicit behavior.

## Recommended bundles

### Contract core bundle (`M1.1` to `M1.4`)

Use this when implementing or refactoring the Solidity core:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $solidity-security-guard $hardhat-test-first-driver $policy-state-machine-guard $interview-readability-guard
```

### Permit bundle (`M2.1`)

Use this when implementing `depositWithPermit`:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $solidity-security-guard $hardhat-test-first-driver $policy-state-machine-guard $permit-path-guard $abi-surface-sync-guard $interview-readability-guard
```

### Scripts and ABI bundle (`M2.2`)

Use this when wiring deploy, seed, demo, or ABI sync:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $abi-surface-sync-guard $viem-wagmi-integration-guard $demo-proof-auditor $docs-runbook-keeper
```

### UI bundle (`M2.3`)

Use this when wiring the Next.js demo UI:

```text
$execplan-orchestrator $scope-lock-enforcer $modular-architecture-guard $viem-wagmi-integration-guard $interview-readability-guard $demo-proof-auditor $docs-runbook-keeper
```

## How to use them

1. Read the repo docs first.
2. Invoke the skill bundle at the top of the Codex prompt.
3. Stay inside the active submilestone.
4. Update the ExecPlan as work progresses.
5. Stop with a concrete report: files changed, commands run, results, risks, and exact next step.

## Stop conditions

A thread should stop when the assigned submilestone is complete and validated. Do not drift into the next milestone just because the code context is warm.
