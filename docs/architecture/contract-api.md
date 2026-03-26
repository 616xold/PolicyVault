# Contract API notes

## `MockUSDC`

Purpose: local ERC-20 for testing and demoing.

Important choices:

- 6 decimals to feel closer to a stablecoin UX
- public faucet mint for local development only
- permit support to exercise the single-transaction deposit path

## `PolicyVault`

Purpose: bounded owner-funded spending with beneficiary-specific policies.

### External actions

- `deposit`
- `depositWithPermit`
- `withdraw`
- `createPolicy`
- `revokePolicy`
- `charge`

`depositWithPermit` is intentionally a thin wrapper. It validates `amount`, calls ERC-2612
`permit` on the configured `asset`, and then reuses the same funding path as `deposit`, so the
resulting vault state and `Deposited` event semantics stay identical to the classic approve flow.

`createPolicy` records an authorization ceiling, not a funding guarantee. The owner's current vault
balance is enforced later by `charge`, not at policy creation time.

### View actions

- `vaultBalanceOf`
- `remaining`
- `nextPolicyNonce`
- `getPolicy`
- `computePolicyId`

### Event model

The UI and demo should be able to reconstruct the main story from events alone:

- owner deposited with the post-state vault balance in `Deposited(owner, amount, newVaultBalance)`
- policy creation is visible in `PolicyCreated(policyId, owner, beneficiary, cap, expiresAt)`
- beneficiary charging is visible in `Charged(policyId, owner, beneficiary, amount, spent, remaining)`
  where `spent` and `remaining` are post-state values
- owner revocation is visible in `PolicyRevoked(policyId, owner, beneficiary)`
- owner withdrew with the post-state vault balance in
  `Withdrawn(owner, receiver, amount, newVaultBalance)`

`remaining(policyId)` is always defined as `cap - spent` for an existing policy, even after that
policy has been revoked or expired.

### Custom errors

Prefer short, typed, explainable errors over string-heavy reverts. They are cheaper and better for targeted debugging.
