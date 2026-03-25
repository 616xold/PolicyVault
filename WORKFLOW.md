---
name: policyvault-repo-workflow
workspace:
  root: .
agent:
  runtime: codex-app
  default_model: ${CODEX_DEFAULT_MODEL}
approval_policy: on-request
sandbox: workspaceWrite
network_access: restricted
policies:
  require_execplan_for_multi_file_work: true
  require_tests_for_state_changes: true
  require_docs_for_contract_api_changes: true
  require_event_notes_for_user_visible_flows: true
hooks:
  before_run: |
    test -f package.json && echo "policyvault workspace ready"
  after_run: |
    echo "review plan updates, tests, and demo evidence"
---

# PolicyVault repository workflow contract

This file exists for two reasons.

First, the repo should be easy to operate inside the Codex app.
Second, the project itself is supposed to demonstrate disciplined AI-native execution, not just fast code generation.

## Intent

When an agent works on this repo, it should:

1. respect the architecture and file boundaries
2. keep work inside the assigned submilestone
3. update the active ExecPlan while working
4. run validation before proposing completion
5. preserve a clean interview story

## Acceptance defaults

Unless an ExecPlan says otherwise, a code task in this repo is only complete when:

- `pnpm compile` passes
- `pnpm test` passes
- touched docs are updated
- the active ExecPlan is updated
- new state changes are covered by event-aware tests or explicit event assertions are added later in the same milestone
- any UI contract changes are reflected in the ABI/address sync notes

## Notes

This repo is intentionally smaller than Pocket CTO. The workflow contract still exists because it helps control Codex scope and keeps the implementation explainable.

For non-trivial work, start the thread with a skill bundle from `.agents/skills/README.md` so the Codex operating pattern is explicit instead of implied.
