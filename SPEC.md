# PolicyVault specification

## Purpose

PolicyVault gives a wallet owner a safer alternative to broad direct token approvals for repeatable service charging.

Instead of letting a service spend directly from the user's wallet balance, the user moves a bounded amount of tokens into a vault and creates a beneficiary-specific policy with a hard cap and expiry. The service can only charge within those limits.

## User-visible value

For the owner:

- bounded blast radius
- explicit on-chain policy state
- policy revocation
- clearer event trail than a broad token allowance alone

For the beneficiary or service:

- deterministic charge path
- visible remaining capacity
- no ambiguity about the currently authorized spend ceiling

## MVP scope

### Must

- single ERC-20 asset (`MockUSDC` locally)
- `deposit(amount)`
- `depositWithPermit(amount, deadline, v, r, s)`
- `withdraw(amount, receiver)`
- `createPolicy(beneficiary, cap, expiresAt)`
- `revokePolicy(policyId)`
- `charge(policyId, amount)`
- view helpers for vault balance, remaining spend, nonce, and policy data
- events for deposit, withdraw, policy create, revoke, and charge
- tests for happy paths and failure paths
- local deploy, seed, and demo scripts
- tiny UI showing balances, allowance / permit path, policy actions, and event timeline

### Should

- ABI sync into the UI
- transaction preflight via `simulateContract` in scripts and app
- 5-minute demo runbook
- clean README with architecture and trade-offs

### Could

- Sepolia or Base Sepolia deploy after the local flow is rock-solid
- one-off typed-data charge authorization as a stretch
- screenshots in the README

## Explicit non-goals for v1

- upgradeable proxies
- admin drains
- multi-token support
- backend services
- subgraph / indexer
- account abstraction
- AMM or DEX routing
- off-chain policy creation
- recurring scheduling logic beyond cap + expiry + revoke

## Canonical contract interface

```solidity
function deposit(uint256 amount) external;
function depositWithPermit(
    uint256 amount,
    uint256 deadline,
    uint8 v,
    bytes32 r,
    bytes32 s
) external;
function withdraw(uint256 amount, address receiver) external;
function createPolicy(address beneficiary, uint256 cap, uint64 expiresAt)
    external
    returns (bytes32 policyId);
function revokePolicy(bytes32 policyId) external;
function charge(bytes32 policyId, uint256 amount) external;
function vaultBalanceOf(address owner) external view returns (uint256);
function remaining(bytes32 policyId) external view returns (uint256);
function nextPolicyNonce(address owner) external view returns (uint256);
function getPolicy(bytes32 policyId) external view returns (Policy memory);
```

## State model

Each policy is:

- `owner`
- `beneficiary`
- `cap`
- `spent`
- `expiresAt`
- `revoked`

Recommended policy id:

`keccak256(abi.encode(owner, beneficiary, cap, expiresAt, ownerNonce))`

## Core invariants

1. Vault balance for an owner never goes negative.
2. A charge can only be executed by the policy beneficiary.
3. A charge cannot exceed the remaining cap.
4. A charge cannot execute after expiry.
5. A revoked policy cannot be charged.
6. Withdrawal cannot exceed the owner's remaining vault balance.
7. Deposit and charge paths emit stable, demo-friendly events.

## Acceptance bar

The MVP is done when:

- contract tests are green
- `demo.ts` runs end-to-end on a fresh local chain
- the UI can show the happy path and at least one revert case
- the README and plan docs are up to date
- you can explain every mapping, event, and revert from memory
