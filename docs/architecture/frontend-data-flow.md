# Frontend data flow

The UI exists to make the contract state legible.

## Current funding slice

M2.4 intentionally renders only the funding surface:

- wallet connection and balance state
- approve + deposit
- permit + deposit

Policy creation, charge, revoke, withdraw, and the event timeline stay deferred until later
submilestones.

## Reads

- generated address availability
- connected account
- connected chain
- token name, symbol, and decimals
- wallet token balance
- vault balance
- allowance to the vault
- next permit nonce for the connected owner

## Writes

- approve token spend to the vault
- deposit
- deposit with permit

## Interaction discipline

The funding container owns the wallet and chain logic so the visible panels can stay
presentation-first.

For the classic deposit path:

1. parse the amount with the live token decimals
2. read the live allowance from the token
3. simulate `approve` if the allowance is too small
4. wait for the approval receipt if it was needed
5. simulate `deposit`
6. submit the deposit transaction
7. wait for receipt and refresh balance, allowance, and vault reads

For the permit path:

1. parse the amount with the live token decimals
2. read the live token name and owner nonce
3. build the EIP-2612 domain from the live token name, configured chain id, and token address
4. ask the wallet to sign typed data
5. simulate `depositWithPermit`
6. submit the deposit transaction
7. wait for receipt and refresh balance, allowance, vault balance, and nonce reads

If the generated addresses are placeholders, the local RPC is down, or the wallet is on the wrong
chain, the UI should disable funding actions and show a short status instead of crashing.

The UI should help explain the system, not hide it.
