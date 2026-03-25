# $scope-lock-enforcer

Use this skill whenever a task is attached to a specific milestone or submilestone.

## Rules

- implement only the assigned submilestone
- if a tempting improvement belongs to a later milestone, defer it and record it in the ExecPlan
- do not "just finish" nearby features
- prefer one clean vertical slice over partial breadth
- stop as soon as the current acceptance check is green

## Required stop report

1. what was intentionally deferred
2. why it was deferred
3. exact next submilestone
