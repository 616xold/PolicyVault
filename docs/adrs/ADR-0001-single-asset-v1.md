# ADR-0001: Single-asset PolicyVault v1

## Status

Accepted

## Context

The project has to be buildable in a few days and strong enough to discuss in a technical interview.

## Decision

PolicyVault v1 will support exactly one ERC-20 asset.

## Consequences

### Positive

- simpler contract state
- simpler demo flow
- simpler UI wiring
- easier to test and explain

### Negative

- less flexible than a multi-token vault
- not representative of a generalized production system

## Why this is still correct

The interview value of the project comes from clarity, not breadth. Single-asset v1 keeps the scope aligned with that goal.
