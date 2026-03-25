# Security model

This is not a production audit. It is the intended safety model for the MVP.

## Core design choices

### 1. Single-asset v1

One asset keeps the storage model and UI readable. Multi-token support is a future extension, not an MVP requirement.

### 2. Safe token transfers

Use `SafeERC20` for all token movement.

### 3. Reentrancy awareness

Even though the asset is an ERC-20, external token transfer is still an interaction boundary. Use `ReentrancyGuard` on external mutating functions and keep state updates ordered carefully.

### 4. Explicit permission model

- owner deposits, withdraws, creates policies, and revokes policies
- beneficiary executes `charge`
- nobody else should mutate that policy

### 5. No admin escape hatch

Do not add owner-admin drains, pausers, or privileged backdoors for the interview MVP.

## Things to say in the interview

- broad wallet approvals can be dangerous because the spender can often move funds directly from the wallet within the allowance
- PolicyVault narrows that risk by moving funds into a contract with explicit on-chain policy checks
- permit improves UX by removing the extra approval transaction for tokens that support ERC-2612
- `charge` is still a token-moving path, so reentrancy thinking and ordering still matter
