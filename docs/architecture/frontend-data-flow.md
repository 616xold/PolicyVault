# Frontend data flow

The UI exists to make the contract state legible.

## Reads

- connected account
- wallet token balance
- vault balance
- allowance to the vault
- selected policy details
- recent vault events

## Writes

- approve token spend to the vault
- deposit
- deposit with permit
- create policy
- charge
- revoke policy
- withdraw

## Interaction discipline

For each write path:

1. gather form data
2. preflight with simulation if the path is already wired
3. submit the transaction
4. wait for receipt
5. refresh affected reads
6. show the resulting state transition

The UI should help explain the system, not hide it.
