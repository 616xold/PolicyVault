# PolicyVault

PolicyVault is a bounded ERC-20 spending MVP built for a Web3/AI interview sprint.

It is intentionally focused. A user deposits a single ERC-20 asset into a vault, creates beneficiary-specific spending policies with a cap and expiry, and a beneficiary can only charge within those on-chain limits. The owner can revoke a policy and withdraw unused funds.

## Product boundary for v1

PolicyVault v1 is intentionally narrow:

- single ERC-20 asset in the MVP
- owner-funded vault balances
- on-chain policy creation
- beneficiary-side charge execution
- classic approve + deposit path
- permit + deposit path when token support is available
- no upgradeability
- no proxy layer
- no backend or indexer in the critical path
- no multi-token support
- no off-chain authorization flow in v1

The point of v1 is not to be broad. The point is to be clean, auditable, and easy to explain in a technical interview.

## What is already decided

1. **Single-asset first.** The MVP uses `MockUSDC` locally so the state machine stays readable.
2. **Bounded spend policy is the core abstraction.** A policy is `(owner, beneficiary, cap, spent, expiry, revoked)`.
3. **On-chain policy creation in v1.** Off-chain typed authorization is explicitly deferred.
4. **Safe token movement matters.** Use `SafeERC20`, `ReentrancyGuard`, custom errors, and checks-effects-interactions ordering.
5. **Simulate before write.** Scripts and UI should preflight contract writes before submitting transactions.
6. **Docs and ExecPlans are first-class.** Treat `SPEC.md`, `AGENTS.md`, and the active plan in `plans/` as the source of truth.

## Repository map

```text
.
├── AGENTS.md
├── PLANS.md
├── README.md
├── SPEC.md
├── START_HERE.md
├── WORKFLOW.md
├── contracts
│   ├── MockUSDC.sol
│   ├── PolicyVault.sol
│   └── interfaces
│       └── IPolicyVault.sol
├── docs
│   ├── adrs
│   ├── architecture
│   └── ops
├── plans
│   ├── ROADMAP.md
│   ├── EP-0001-contract-spine.md
│   ├── EP-0002-ui-and-demo.md
│   └── templates
├── scripts
│   ├── deploy.ts
│   ├── seed.ts
│   ├── demo.ts
│   └── sync-abi.ts
├── test
│   └── PolicyVault.t.ts
└── app
    └── ...
```

## Immediate implementation order

1. Read `START_HERE.md`.
2. Read `AGENTS.md`.
3. Read `PLANS.md`.
4. Read `plans/ROADMAP.md`.
5. Start with `plans/EP-0001-contract-spine.md`.
6. Keep all meaningful progress updates inside the active ExecPlan.
7. Do not skip tests, docs, or event design.

Before starting a real implementation thread, read `.agents/skills/README.md` and invoke the matching skill bundle for the current milestone.

## Local development

### Prerequisites

- Node 22+
- pnpm 10+
- wallet extension for local UI testing
- Codex app or Codex CLI
- local dev chain via `pnpm node`

### Bootstrap

```bash
cp .env.example .env
cp app/.env.local.example app/.env.local
pnpm install
pnpm compile
pnpm test
```

In a second terminal:

```bash
pnpm node
```

In a third terminal, once the contract core is implemented:

```bash
pnpm deploy:local
pnpm seed:local
pnpm abi:sync
pnpm web:dev
```

## Correct first success

The first success is not a pretty UI.

The first success is this:

> A user can approve and deposit `MockUSDC`, create a capped policy for a beneficiary, execute a charge within the cap, see the correct events, revoke the policy, and withdraw the unused balance.

If that path is solid, everything else compounds on top of it.

## Key docs

- `SPEC.md` is the ground-truth product spec.
- `docs/architecture/overview.md` is the mental model.
- `docs/architecture/security-model.md` is the contract-safety checklist.
- `docs/ops/demo-runbook.md` is the interview demo sequence.
- `plans/ROADMAP.md` is the build order.
- `plans/EP-0001-contract-spine.md` is the current implementation plan.
