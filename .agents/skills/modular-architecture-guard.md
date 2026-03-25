# $modular-architecture-guard

Protect clear boundaries.

## Rules

- contract interfaces belong under `contracts/interfaces`
- the main Solidity contract should expose a readable external API and small internal helpers
- tests should describe behavior, not implementation details
- scripts should not contain business rules that belong on-chain
- UI components should stay presentational where possible
- ABI and address wiring should live under `app/src/lib`
