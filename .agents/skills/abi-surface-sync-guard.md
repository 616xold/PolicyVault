# $abi-surface-sync-guard

Use this skill whenever a public function, event, custom error, or struct shape changes.

## Required actions

- update the Solidity interface first if the public surface changed
- note the change in the active ExecPlan
- run the ABI sync flow after compile
- update any app or script code that depends on the changed surface
- update docs if the interview story or state machine changed

## Guardrails

- do not duplicate ABI definitions across the repo
- generated ABI files should stay generated
- if the interface is unstable, say so explicitly in the ExecPlan instead of silently patching callers
