# Architecture overview

PolicyVault is deliberately small but layered.

## Layers

### 1. Asset layer

`MockUSDC` is the local dev asset. It gives the project a realistic ERC-20 with 6 decimals and permit support without depending on a live external token.

### 2. Vault layer

`PolicyVault` is the only core stateful product contract. It tracks owner balances and beneficiary-specific policies.

### 3. Interaction layer

- contract tests prove state transitions
- scripts prove deterministic demo flows
- the Next.js app provides wallet interaction and visibility into state

## Core state machine

The owner funds the vault. Then the owner creates a policy for one beneficiary with a cap and expiry. The beneficiary can charge within the cap. The owner can revoke the policy and withdraw unused funds.

The MVP is intentionally single-asset and explicit so it can be explained on a whiteboard in minutes.

## Why this is interview-relevant

It touches the exact concepts a Web3 engineer is likely to care about in a wallet-adjacent product discussion:

- ERC-20 approvals
- `transferFrom`
- permit vs approve UX
- stateful on-chain policy enforcement
- event observability
- safe token transfer patterns
