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

### 6. Cap and funding are separate checks

`createPolicy` does not lock or reserve `cap` worth of tokens for a beneficiary. The policy cap is
an authorization ceiling, and `charge` separately enforces the owner's current vault balance at the
moment of execution.

### 7. Checks-effects-interactions on token-moving paths

`withdraw` and `charge` both update contract state before calling `safeTransfer`, so the stored
vault balance and policy spend stay ahead of the external token transfer boundary.

For `depositWithPermit`, the vault validates zero amount before touching the token's permit path so
a reverting call cannot consume a permit nonce or leave an allowance side effect. Once `permit`
succeeds, the vault reuses the same deposit logic and `Deposited` event semantics as the classic
approve-plus-deposit path.

## Things to say in the interview

- broad wallet approvals can be dangerous because the spender can often move funds directly from the wallet within the allowance
- PolicyVault narrows that risk by moving funds into a contract with explicit on-chain policy checks
- permit improves UX by removing the extra approval transaction for tokens that support ERC-2612
- `charge` is still a token-moving path, so reentrancy thinking and ordering still matter
- the policy cap is an authorization ceiling, not a promise that the vault is already funded to that full amount
