# $solidity-security-guard

Use this skill whenever token movement or policy state changes are involved.

## Checklist

- use `SafeERC20`
- prefer custom errors over long revert strings
- perform validation before state changes
- apply checks-effects-interactions ordering
- use `ReentrancyGuard` on external mutating functions
- avoid unbounded loops on the core execution path
- emit events on user-visible state transitions
- be explicit about owner-only vs beneficiary-only actions
- add at least one failure-path test for every new state transition
