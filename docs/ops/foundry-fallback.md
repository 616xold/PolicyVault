# Foundry fallback

Use this only if the Hardhat toolchain is fighting you for more than ~45 minutes.

## Principle

The MVP matters more than tool purity.

## Allowed fallback

- keep the Solidity contracts unchanged
- move contract tests to Foundry if that is faster
- keep viem and the Next.js UI
- document the reason in the active ExecPlan

## Not allowed as a fallback

- changing the project idea
- dropping tests
- dropping permit because of one transient package issue without documenting it
- expanding scope to "make up for" toolchain churn
