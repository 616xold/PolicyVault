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

### View actions

- `vaultBalanceOf`
- `remaining`
- `nextPolicyNonce`
- `getPolicy`
- `computePolicyId`

### Event model

The UI and demo should be able to reconstruct the main story from events alone:

- owner deposited with the post-state vault balance in `Deposited(owner, amount, newVaultBalance)`
- policy created
- beneficiary charged
- owner revoked
- owner withdrew with the post-state vault balance in
  `Withdrawn(owner, receiver, amount, newVaultBalance)`

### Custom errors

Prefer short, typed, explainable errors over string-heavy reverts. They are cheaper and better for targeted debugging.
