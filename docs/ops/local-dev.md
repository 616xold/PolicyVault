# Local development

## Bootstrap

```bash
cp .env.example .env
cp app/.env.local.example app/.env.local
pnpm install
pnpm compile
pnpm test
```

Hardhat local scripts are safest on Node 22 LTS. Hardhat currently warns on Node 25.x, and a fresh
localhost deploy may hit cache-related issues there even though compile and app builds still work.

## Run the local chain

```bash
pnpm node
```

This exposes a local JSON-RPC node at `http://127.0.0.1:8545`.

## Deploy and seed

With the local node running in a second terminal:

```bash
pnpm deploy:local
pnpm abi:sync
pnpm seed:local
pnpm demo:local
```

`pnpm deploy:local` writes `deployments/localhost.json` with the localhost `chainId`,
network name, deployer, `MockUSDC` address, and `PolicyVault` address.

`pnpm abi:sync` reads the current contract artifacts and `deployments/localhost.json`, then writes:

- `app/src/lib/generated/abi.ts`
- `app/src/lib/generated/addresses.ts`

If `deployments/localhost.json` is missing, `pnpm abi:sync` still generates a safe placeholder
`app/src/lib/generated/addresses.ts` with zero addresses and an explicit warning comment. The app
prefers generated localhost addresses when they exist and only falls back to `NEXT_PUBLIC_*`
address env vars when that deployment artifact is missing.

`pnpm seed:local` mints readable demo balances to the first three localhost wallets:

- wallet 1 owner: `250 mUSDC`
- wallet 2 beneficiary: `80 mUSDC`
- wallet 3 recovery: `40 mUSDC`

`pnpm demo:local` reads the deployment artifact and runs the validated interview flow:

- approve + deposit
- permit + deposit
- create policy
- charge within cap
- intentional over-cap revert
- revoke
- withdraw unused funds

If `deployments/localhost.json` exists but you restarted localhost on a fresh node, `pnpm seed:local`
and `pnpm demo:local` now fail early with a missing-bytecode message. Re-run `pnpm deploy:local`
before continuing.

The local UI now reads its ABI and localhost address source of truth from the generated files:

```bash
pnpm web:dev
```

## Run the UI

```bash
pnpm web:dev
```

The current UI scope is intentionally narrow:

- wallet connection and funding state
- approve + deposit
- permit + deposit
- create policy
- load policy by id
- charge
- revoke
- withdraw
- recent event timeline

The dashboard now covers the full MVP narration path in one place:

- wallet state
- approve + deposit
- permit + deposit
- create policy
- load policy by id
- charge
- revoke
- withdraw
- recent `Deposited`, `PolicyCreated`, `Charged`, `PolicyRevoked`, and `Withdrawn` rows

Readiness is intentionally explicit before the dashboard claims it is usable:

- `Missing local deploy`: run `pnpm deploy:local` and `pnpm abi:sync`
- `RPC offline`: start `pnpm node`
- `No contract code`: localhost restarted and the saved addresses point at empty contracts, so rerun
  `pnpm deploy:local` and `pnpm abi:sync`
- `Demo ready`: the local RPC is answering and both configured addresses have deployed bytecode

If the generated addresses are placeholders, the local RPC is down, or the wallet is on the wrong
chain, or the configured addresses have no deployed bytecode on the current node, the dashboard
keeps reads and writes disabled and shows a short truthful status instead of crashing.

For a manual happy-path dashboard check in the browser:

1. run `pnpm node`
2. run `pnpm deploy:local`
3. run `pnpm abi:sync`
4. run `pnpm seed:local`
5. run `pnpm web:dev`
6. connect localhost account `#0` in the wallet extension
7. confirm the timeline card says `Demo ready`
8. fund the vault through either the approve or permit path and confirm the balances refresh after
   receipt
9. create a policy, load it by id, then switch wallets to charge, revoke, and withdraw while the
   timeline updates

## Recommended wallet setup

Use the local chain in your wallet extension:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one of the dev accounts printed by `pnpm node`.
