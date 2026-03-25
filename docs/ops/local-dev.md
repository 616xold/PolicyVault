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

Once the contract core exists:

```bash
pnpm deploy:local
pnpm seed:local
pnpm abi:sync
```

Copy the emitted addresses into `app/.env.local` if your scripts do not update them automatically.

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
