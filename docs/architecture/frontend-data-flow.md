# Frontend data flow

The UI exists to make the contract state legible.

## Current dashboard slice

The current UI renders one small dashboard with five cards:

- wallet connection and balance state
- approve + deposit
- permit + deposit
- create policy
- inspect policy by id
- charge
- revoke
- withdraw
- recent PolicyVault event timeline with contract/demo status copy

## Reads

- generated address availability
- lightweight `getCode` probe against the configured `MockUSDC` and `PolicyVault` addresses
- connected account
- connected chain
- token name, symbol, and decimals
- wallet token balance
- vault balance
- allowance to the vault
- next permit nonce for the connected owner
- on-demand `getPolicy(policyId)`
- on-demand `remaining(policyId)`
- recent `Deposited`, `PolicyCreated`, `Charged`, `PolicyRevoked`, and `Withdrawn` logs from the
  configured PolicyVault address
- block timestamps for the visible timeline slice

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

Before enabling contract reads or writes, the dashboard first proves four setup states:

1. no configured addresses
2. no usable RPC / public client
3. configured addresses present but missing deployed bytecode at `MockUSDC` and/or `PolicyVault`
4. ready

For the classic deposit path:

1. parse the amount with the live token decimals
2. read the live allowance from the token
3. simulate `approve` if the allowance is too small
4. wait for the approval receipt if it was needed
5. simulate `deposit`
6. submit the deposit transaction
7. wait for receipt and refresh balance, allowance, vault, and timeline reads

For the permit path:

1. parse the amount with the live token decimals
2. read the live token name and owner nonce
3. build the EIP-2612 domain from the live token name, configured chain id, and token address
4. ask the wallet to sign typed data
5. simulate `depositWithPermit`
6. submit the deposit transaction
7. wait for receipt and refresh balance, allowance, vault balance, nonce, and timeline reads

For policy creation:

1. parse the beneficiary address, cap amount, and expiry timestamp
2. simulate `createPolicy`
3. submit the transaction
4. wait for receipt
5. use the simulated return value as the created policy id shown in the UI
6. refresh wallet reads, refresh the timeline, and load the created policy by id

For policy lookup:

1. validate that the entered policy id is a 32-byte hex value
2. read `getPolicy(policyId)` and `remaining(policyId)` from the local RPC
3. display owner, beneficiary, cap, spent, remaining, expiry, and revoked status

For charge and revoke:

1. parse the policy id, and for charge also parse the charge amount with the live token decimals
2. simulate the contract write
3. submit the transaction
4. wait for receipt
5. refresh wallet reads, refresh the timeline, and reload the same policy id

For withdraw:

1. parse the withdraw amount with the live token decimals
2. parse the receiver address
3. simulate `withdraw`
4. submit the transaction
5. wait for receipt and refresh wallet reads plus the timeline

For the event timeline:

1. read recent PolicyVault events directly from the configured public client
2. query only the five user-visible event types needed for the demo
3. merge them into one list and sort deterministically by block number, transaction index, and log
   index
4. fetch block timestamps only for the visible slice
5. render a concise human-readable row instead of raw JSON
6. refresh after successful writes, poll lightly, and keep a manual refresh button for demo use

The UI keeps owner-only and beneficiary-only actions visible. If the connected wallet is the wrong
actor for a button, the simulation error is surfaced in the panel copy instead of hiding the action.

If the generated addresses are placeholders, the local RPC is down, or the wallet is on the wrong
chain, or the configured addresses point at empty contracts on a fresh localhost node, the UI
should disable writes, keep policy lookup status explicit, show the timeline contract status, and
avoid crashing.

The UI should help explain the system, not hide it.
