# $permit-path-guard

Use this skill when implementing or refactoring `depositWithPermit`.

## Rules

- keep the permit path a thin wrapper around the normal deposit path
- validate amount and deadline behavior clearly
- use `IERC20Permit` directly and keep assumptions explicit
- do not make the permit path the only funding path
- if local mock-token support is missing, document the fallback clearly

## Tests to expect

- expired or invalid permit fails
- valid permit funds the vault without a separate approval transaction
- permit path leaves the same vault state as the normal deposit path
