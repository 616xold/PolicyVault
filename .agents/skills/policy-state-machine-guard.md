# $policy-state-machine-guard

Use this skill whenever vault balances, policy lifecycle, or charge logic changes.

## Core invariants

- `vaultBalanceOf(owner)` tracks the owner's currently withdrawable, unspent vault balance
- a successful `charge` decreases owner vault balance by exactly the charged amount
- a successful `charge` increases `policy.spent` by exactly the charged amount
- `policy.spent` must never exceed `policy.cap`
- revoked or expired policies must never allow `charge`
- policy owner and beneficiary are immutable after creation
- owner nonce increments only after successful policy creation
- events must reflect post-state values, not stale pre-state values

## Review questions

- is the state machine still easy to draw on a whiteboard?
- can every state-changing path be explained in one or two sentences?
- would a beneficiary ever be able to drain more than the owner intended?
