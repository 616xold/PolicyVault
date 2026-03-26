# Local development

## Bootstrap

```bash
cp .env.example .env
cp app/.env.local.example app/.env.local
pnpm install
pnpm compile
pnpm test
```

## Run the local chain

```bash
pnpm node
```

This exposes a local JSON-RPC node at `http://127.0.0.1:8545`.

## Deploy and seed

With the local node running in a second terminal:

```bash
pnpm deploy:local
pnpm seed:local
pnpm demo:local
```

`pnpm deploy:local` writes `deployments/localhost.json` with the localhost `chainId`,
network name, deployer, `MockUSDC` address, and `PolicyVault` address.

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

ABI sync and UI wiring remain separate from this milestone:

```bash
pnpm abi:sync
pnpm web:dev
```

For M2.2, `deployments/localhost.json` is the source of truth for local addresses.

## Run the UI

```bash
pnpm web:dev
```

## Recommended wallet setup

Use the local chain in your wallet extension:

- RPC URL: `http://127.0.0.1:8545`
- Chain ID: `31337`
- Currency symbol: `ETH`

Import one of the dev accounts printed by `pnpm node`.
