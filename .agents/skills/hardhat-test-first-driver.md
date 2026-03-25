# $hardhat-test-first-driver

Use this skill whenever contract behavior changes.

## Workflow

1. state the behavior and key revert cases in plain English
2. add or update the narrowest focused test first
3. implement the smallest contract diff that makes the test pass
4. run the narrowest useful test
5. run the full relevant test suite before stopping

## Expectations

- assert custom errors where practical
- assert events for user-visible state changes
- assert final balances and stored state, not just success
- keep test setup helpers small and obvious
- prefer readable bigint constants and helpers over magic numbers
