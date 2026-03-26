# Local development

## Bootstrap

```bash
cp .env.example .env
cp app/.env.local.example app/.env.local
pnpm install
pnpm compile
pnpm test
```

Hardhat local scripts are safest on Node 22 LTS. The repo includes `.nvmrc` with `22`, and a
fresh localhost deploy may fail under newer unsupported Node releases even when compile, test, or
Next.js builds still pass.

## Terminal workflow

After bootstrap, use this command order:

```bash
pnpm node
pnpm deploy:local
pnpm abi:sync
pnpm seed:local
# optional after manual browser testing
pnpm demo:local
pnpm web:dev
```

What each command does:

- `pnpm node` starts the localhost JSON-RPC at `http://127.0.0.1:8545`.
- `pnpm deploy:local` deploys `MockUSDC` and `PolicyVault`, verifies bytecode, and writes the
  tracked `deployments/localhost.json` artifact.
- `pnpm abi:sync` reads the current contract artifacts plus `deployments/localhost.json` and writes
  `app/src/lib/generated/abi.ts` and `app/src/lib/generated/addresses.ts`.
- `pnpm seed:local` mints readable balances to the first three localhost wallets:
  - wallet 1 owner: `250 mUSDC`
  - wallet 2 beneficiary: `80 mUSDC`
  - wallet 3 recovery: `40 mUSDC`
- `pnpm demo:local` runs the scripted approve deposit, permit deposit, create policy, charge,
  over-cap revert, revoke, and withdraw flow.
- `pnpm web:dev` starts the Next.js dashboard.

If `deployments/localhost.json` exists but you restarted localhost on a fresh node, `pnpm seed:local`
and `pnpm demo:local` fail early with a missing-bytecode message. Re-run `pnpm deploy:local`, then
`pnpm abi:sync`, before continuing.

## Manual UI first

For a clean browser walkthrough, skip `pnpm demo:local` until after you have driven the flow in the
dashboard yourself. The scripted demo consumes the same state transitions and will otherwise leave
you with a partially used vault and a pre-populated event timeline.

Manual browser check:

1. Run `pnpm node`.
2. Run `pnpm deploy:local`.
3. Run `pnpm abi:sync`.
4. Run `pnpm seed:local`.
5. Run `pnpm web:dev`.
6. Connect localhost account `#0` in the wallet extension.
7. Confirm the dashboard reports `Demo ready`.
8. Deposit through either approve or permit and confirm the wallet, allowance, vault, and timeline
   reads refresh after receipt.
9. Create a policy, note the returned policy id, and load it by id.
10. Switch to localhost account `#1` to charge within cap.
11. Switch back to account `#0` to revoke the policy and withdraw the remaining vault balance.

## Current UI scope

The dashboard currently supports:

- wallet state
- approve + deposit
- permit + deposit
- create policy
- load policy by id
- charge
- revoke
- withdraw
- recent event timeline

The timeline reads `Deposited`, `PolicyCreated`, `Charged`, `PolicyRevoked`, and `Withdrawn` logs
directly from `PolicyVault`.

## Readiness states

Before enabling reads and writes, the dashboard distinguishes:

- `Missing local deploy`: run `pnpm deploy:local` and `pnpm abi:sync`
- `RPC offline`: start `pnpm node`
- `No contract code`: configured addresses exist, but the current localhost node has no bytecode at
  one or both addresses; rerun `pnpm deploy:local` and `pnpm abi:sync`
- `Demo ready`: the local RPC is answering and both configured addresses have deployed bytecode

If the generated addresses are placeholders, the RPC is down, the wallet is on the wrong chain, or
the configured addresses point at empty contracts on the current node, the dashboard keeps reads
and writes disabled and surfaces the blocker instead of crashing.

## Tracked vs generated files

The repo keeps a few local-development files tracked on purpose:

- `deployments/localhost.json` is tracked as the human-inspectable localhost deployment source of truth.
- `app/next-env.d.ts` is tracked as stable Next.js app scaffold.
- `.nvmrc` and `pnpm-lock.yaml` are tracked repo metadata.

The repo does not track local build output such as `app/.next`, `artifacts`, `cache`, or
`node_modules`.

## Recommended wallet setup

Use the local chain in your wallet extension:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one of the dev accounts printed by `pnpm node`.
