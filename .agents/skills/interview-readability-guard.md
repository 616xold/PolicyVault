# $interview-readability-guard

Use this skill whenever code, docs, or scripts will likely be shown or described in the interview.

## Rules

- prefer explicit names over clever names
- keep core mutating functions short enough to explain without scrolling forever
- extract helpers only when they clarify one invariant
- use events and custom errors with names that make the story obvious
- avoid abstractions that save lines but make the explanation worse
- keep the main state machine easy to whiteboard in under 90 seconds

## Final check

Be able to answer:
1. what problem this function solves
2. what invariant it protects
3. what event proves it happened
