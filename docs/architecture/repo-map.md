# Repository map

## Top-level reasoning files

- `README.md`: repo narrative and build order
- `SPEC.md`: product scope and invariants
- `AGENTS.md`: repository instructions for Codex
- `PLANS.md`: ExecPlan standard
- `WORKFLOW.md`: repo-level working contract

## Core implementation

- `contracts/MockUSDC.sol`: local ERC-20 with permit
- `contracts/PolicyVault.sol`: vault and policy state machine
- `contracts/interfaces/IPolicyVault.sol`: public interface, errors, and events
- `test/PolicyVault.t.ts`: contract behavior tests
- `scripts/`: deploy, seed, demo, ABI sync

## UI

- `app/src/app`: page and providers
- `app/src/components`: dashboard panels
- `app/src/lib`: chain config, addresses, ABI wiring, formatting

## Plans

- `plans/ROADMAP.md`: milestone order
- `plans/EP-0001-contract-spine.md`: current contract-focused ExecPlan
- `plans/EP-0002-ui-and-demo.md`: UI/demo follow-on ExecPlan
