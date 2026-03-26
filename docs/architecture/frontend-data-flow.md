# Frontend data flow

The UI exists to make the contract state legible.

## Current dashboard slice

The current UI renders one small dashboard with four cards:

- wallet connection and balance state
- approve + deposit
- permit + deposit
- create policy
- inspect policy by id
- charge
- revoke
- withdraw

The event timeline is still intentionally deferred until the next UI submilestone.

## Reads

- generated address availability
- connected account
- connected chain
- token name, symbol, and decimals
- wallet token balance
- vault balance
- allowance to the vault
- next permit nonce for the connected owner
- on-demand `getPolicy(policyId)`
- on-demand `remaining(policyId)`

## Writes

- approve token spend to the vault
- deposit
- deposit with permit
- create policy
- charge
- revoke policy
- withdraw

## Interaction discipline

The dashboard container owns the wallet and chain logic so the visible panels can stay
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

For policy creation:

1. parse the beneficiary address, cap amount, and expiry timestamp
2. simulate `createPolicy`
3. submit the transaction
4. wait for receipt
5. use the simulated return value as the created policy id shown in the UI
6. refresh wallet reads and load the created policy by id

For policy lookup:

1. validate that the entered policy id is a 32-byte hex value
2. read `getPolicy(policyId)` and `remaining(policyId)` from the local RPC
3. display owner, beneficiary, cap, spent, remaining, expiry, and revoked status

For charge and revoke:

1. parse the policy id, and for charge also parse the charge amount with the live token decimals
2. simulate the contract write
3. submit the transaction
4. wait for receipt
5. refresh wallet reads and reload the same policy id

For withdraw:

1. parse the withdraw amount with the live token decimals
2. parse the receiver address
3. simulate `withdraw`
4. submit the transaction
5. wait for receipt and refresh wallet reads

The UI keeps owner-only and beneficiary-only actions visible. If the connected wallet is the wrong
actor for a button, the simulation error is surfaced in the panel copy instead of hiding the action.

If the generated addresses are placeholders, the local RPC is down, or the wallet is on the wrong
chain, the UI should disable writes, keep policy lookup status explicit, and show a short status
instead of crashing.

The UI should help explain the system, not hide it.
