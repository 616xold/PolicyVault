# Policy state machine

## Owner balance state

`_vaultBalance[owner]` tracks the amount the owner has already moved into the vault.

Transitions:

- `deposit`: increases owner vault balance
- `charge`: decreases owner vault balance and increases policy spent
- `withdraw`: decreases owner vault balance

For the user-visible funding paths, `Deposited` and `Withdrawn` both report the
post-state vault balance so logs match the new stored balance.

## Policy state

A policy is valid if:

- it exists
- it is not revoked
- the current time is before or at `expiresAt`
- `spent + amount <= cap`

### Creation

`createPolicy` writes a new policy keyed by a deterministic id derived from owner, beneficiary, cap, expiry, and owner nonce.

### Charging

`charge` is beneficiary-only. It checks active status and remaining capacity, then moves tokens out of the vault to the beneficiary.

### Revocation

`revokePolicy` is owner-only. After revocation, `charge` must revert.

## Why deterministic policy ids

Deterministic ids make the system easy to explain and test. They also make logs and UI wiring simpler in the MVP.
