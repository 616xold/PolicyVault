# $viem-wagmi-integration-guard

Use this skill when touching scripts, ABI sync, or the Next.js wallet UI.

## Rules

- use viem as the source of truth for chain interaction
- simulate contract writes before sending them where practical
- centralize ABI and address wiring under `app/src/lib`
- keep bigint parsing and formatting in helpers, not inline everywhere
- UI components should not contain contract business rules
- surface transaction hashes and clear pending/success/failure states in the demo

## Review questions

- is there one obvious place for ABI wiring?
- can the demo flow be run from a clean local chain without hidden manual steps?
- would a reviewer understand the chain interaction path in under a minute?
