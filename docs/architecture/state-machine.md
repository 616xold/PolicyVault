# Policy state machine

## Owner balance state

`_vaultBalance[owner]` tracks the amount the owner has already moved into the vault.

Transitions:

- `deposit`: increases owner vault balance
- `charge`: decreases owner vault balance and increases policy spent
- `withdraw`: decreases owner vault balance

`createPolicy` does not reserve funds. A policy cap is an authorization ceiling, while current vault
funding is checked later when `charge` executes.

For the user-visible funding paths, `Deposited` and `Withdrawn` both report the
post-state vault balance so logs match the new stored balance.

## Policy state

A policy is valid if:

- it exists
- it is not revoked
- the current time is before or at `expiresAt`
- `spent + amount <= cap`

A policy stays active while `block.timestamp <= expiresAt`. It expires only once
`block.timestamp > expiresAt`.

For any existing policy, `remaining(policyId)` is always `cap - spent`, independent of revoked or
expired status.

### Creation

`createPolicy` writes a new policy keyed by a deterministic id derived from owner, beneficiary, cap,
expiry, and the owner's current nonce. It stores `spent = 0`, `revoked = false`, and increments the
owner nonce only after the policy has been stored successfully.

### Charging

`charge` is beneficiary-only. It checks caller permission, revoke state, expiry, remaining cap, and
the owner's current vault balance. It updates `policy.spent` and the owner's vault balance before
moving tokens out of the vault to the beneficiary, and its event reports post-state `spent` and
`remaining`.

### Revocation

`revokePolicy` is owner-only and one-way. Re-revoking reverts, and revocation does not change
`spent`, `cap`, or `remaining`.

## Why deterministic policy ids

Deterministic ids make the system easy to explain and test. They also make logs and UI wiring simpler in the MVP.
