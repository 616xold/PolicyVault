# PolicyVault ExecPlans

This file defines the required standard for executable plans in this repository.

Use an ExecPlan whenever work spans multiple files, more than one subsystem, or more than 45 minutes of implementation time.

An ExecPlan is a living design and implementation document that a coding agent or human can follow without prior memory.

## Rules

1. Every ExecPlan must be self-contained.
2. Every ExecPlan must explain the user-visible purpose first.
3. Every ExecPlan must define exact files, modules, commands, and acceptance checks.
4. Every ExecPlan must be updated as work proceeds.
5. Every ExecPlan must keep `Progress`, `Surprises & Discoveries`, `Decision Log`, and `Outcomes & Retrospective` up to date.
6. Every ExecPlan must prefer additive, testable changes.
7. Every ExecPlan must state rollback or retry guidance for risky steps.
8. Every ExecPlan must include validation commands.
9. Every ExecPlan must describe evidence of success, not just code changes.

## Required sections

Every ExecPlan must contain these sections, in this order:

1. `#`
2. `## Purpose / Big Picture`
3. `## Progress`
4. `## Surprises & Discoveries`
5. `## Decision Log`
6. `## Context and Orientation`
7. `## Plan of Work`
8. `## Concrete Steps`
9. `## Validation and Acceptance`
10. `## Idempotence and Recovery`
11. `## Artifacts and Notes`
12. `## Interfaces and Dependencies`
13. `## Outcomes & Retrospective`

## Formatting rules

- Write in plain prose.
- Prefer sentences over giant bullet lists.
- Be concrete about files and commands.
- Use checkboxes only in `Progress`.
- Use UTC timestamps in `Progress` entries once work starts.
- Do not rely on "as discussed before".
- Repeat assumptions if they matter.

## Repository-specific requirements

For PolicyVault ExecPlans:

- name the target milestone and submilestones explicitly
- mention any changes to the contract interface
- mention any new events or custom errors
- mention any ABI sync implications for `app/src/lib/abi.ts`
- mention any changes required in the UI or demo scripts
- mention if a change affects the interview demo story
- mention the security implications of any new state-changing path

## When you are implementing an ExecPlan

- proceed milestone by milestone
- do not ask for "next steps" after every tiny change
- keep the plan updated after meaningful progress
- if scope changes, record the reason in the `Decision Log`
- if a safer or simpler design emerges, prefer it and document the change

## Template

Use `plans/templates/execplan-template.md` as the starting point for new ExecPlans.
