# EP-0001 contract spine

## Purpose / Big Picture

This plan delivers the core interview asset: a clean Solidity state machine for bounded ERC-20 spending.

The user-visible outcome is that an owner can fund a vault, create a beneficiary-specific spending policy with a cap and expiry, let the beneficiary charge within those limits, revoke the policy, and withdraw unused funds. If this milestone is solid, everything else in the repo becomes easier to demo and explain.

## Progress

- [ ] M1.1 finalize the public interface, storage, events, and errors
- [x] 2026-03-25T22:24:38Z M1.2 implement approve + deposit and withdraw, add focused deposit/withdraw tests, and validate post-state `Deposited`/`Withdrawn` events
- [ ] M1.3 implement policy create, revoke, and charge
- [ ] M1.4 add first contract tests for happy and failure paths

## Surprises & Discoveries

2026-03-25T22:24:38Z: the scaffold could not compile because `IPolicyVault` declared both
`error PolicyRevoked(...)` and `event PolicyRevoked(...)`. Solidity treats that as an
identifier collision, so M1.2 needed a minimal interface cleanup before any tests could run.

Potential places to watch:

- permit domain mismatches if token naming or chain config changes
- ABI sync drift once the contract interface stabilizes
- test setup differences between Hardhat and local UI assumptions

## Decision Log

- We are keeping v1 single-asset.
- We are using on-chain policy creation in v1.
- We are deferring off-chain typed charge authorizations.
- We are using `MockUSDC` as the local dev token.
- We are optimizing for a clean interview story, not generalized production breadth.
- 2026-03-25T22:24:38Z: keep the user-visible `PolicyRevoked` event name stable and rename the
  conflicting custom error to `PolicyIsRevoked`; `app/src/lib/generated/abi.ts` remains a placeholder,
  so no ABI sync action is needed yet in this M1.2 thread.
- 2026-03-25T22:24:38Z: `deposit` credits `_vaultBalance` before `safeTransferFrom` and `withdraw`
  debits before `safeTransfer`, so both funding-path events expose post-state balances while keeping
  checks-effects-interactions ordering.

## Context and Orientation

Relevant files for this milestone:

- `contracts/interfaces/IPolicyVault.sol`
- `contracts/MockUSDC.sol`
- `contracts/PolicyVault.sol`
- `test/PolicyVault.t.ts`
- `docs/architecture/contract-api.md`
- `docs/architecture/state-machine.md`
- `docs/architecture/security-model.md`

Current scaffold state:

- `MockUSDC` exists and is effectively complete as a local dev token skeleton.
- `PolicyVault` has interface, storage, and view scaffolding.
- the mutating functions are intentionally left as stubs so they can be implemented milestone by milestone.

Keep the contract easy to whiteboard. Avoid introducing abstractions that make the interview explanation worse.

## Plan of Work

First, stabilize the contract surface and make sure the interface, struct, events, and custom errors are correct. Next, implement the owner funding path and owner withdrawal path. After that, implement policy creation, policy revocation, and beneficiary charging with cap and expiry enforcement. Finally, add targeted tests that prove the state transitions and key failure cases.

This milestone is complete when the full approve + deposit + createPolicy + charge + revoke + withdraw flow is green locally.

## Concrete Steps

1. Finalize `IPolicyVault.sol`.
   - confirm the `Policy` struct shape
   - confirm errors and events
   - confirm view helper signatures

2. Implement `PolicyVault` owner-balance logic.
   - `deposit`
   - `withdraw`
   - internal balance checks
   - state updates before token transfers where appropriate

3. Implement `PolicyVault` policy logic.
   - deterministic policy id generation
   - owner nonce handling
   - `createPolicy`
   - `revokePolicy`
   - `charge`
   - active-policy validation helpers

4. Write tests in `test/PolicyVault.t.ts`.
   - deposit without allowance reverts
   - approve + deposit happy path
   - withdraw above vault balance reverts
   - create policy stores correct data
   - beneficiary charge within cap succeeds
   - charge above remaining cap reverts
   - charge after expiry reverts
   - charge after revoke reverts
   - only beneficiary can charge
   - only owner can revoke

5. Update docs.
   - if the final interface changes, update `docs/architecture/contract-api.md`
   - if the state machine changes materially, update `docs/architecture/state-machine.md`

## Validation and Acceptance

Minimum commands for this milestone:

```bash
pnpm compile
pnpm test
```

Acceptance checks:

- contracts compile cleanly
- the happy path is green
- the main revert cases are green
- custom errors are used on key failures
- events are emitted for all user-visible state changes

## Idempotence and Recovery

If an implementation branch becomes messy:

1. stop broadening scope
2. update the Decision Log with what failed
3. revert to the last passing compile/test state
4. re-implement only the next smallest missing step

If token transfer logic becomes confusing, write or update the smallest focused test first and re-drive the code from that test.

## Artifacts and Notes

Expected outputs after this milestone:

- green compile
- green tests
- stable contract API
- stable event names
- a credible contract story for the interview

## Interfaces and Dependencies

Dependencies:

- OpenZeppelin Contracts
- Hardhat viem toolbox

Interface stability matters here because M2 and M3 depend on it. If any public function, event, or custom error changes, note the impact on:

- `scripts/demo.ts`
- `scripts/sync-abi.ts`
- `app/src/lib/abi.ts`
- `app/src/lib/contracts.ts`

## Outcomes & Retrospective

Not completed yet.
