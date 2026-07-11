# Business Pilot Loop Engineering

This directory stores the repository-local state for controlled Loop Engineering.
It is separate from `.agents/`, which contains reusable Codex skills.

Loop Engineering is not autonomous deployment. A loop may inspect, implement,
verify, and prepare a change, but external actions remain human-controlled.

## Sources of truth

| Concern | Source of truth |
| --- | --- |
| Priority, assignee, and planning status | GitHub Project |
| Problem statement and discussion | GitHub Issue |
| Implementation scope and acceptance criteria | `.agent/tasks/BP-XXX.md` |
| Current local execution state | `.agent/status.md` |
| Architecture and workflow decisions | `.agent/decisions.md` |
| Local backlog mirror | `.agent/todo.md` |

The GitHub Project is not connected yet. Until its repository, project URL, and
status fields are configured, `.agent/todo.md` is maintained manually.

If a GitHub item and its local task contract disagree, stop. Do not choose one
silently. Record the conflict as a blocker and ask for human direction.

## Task lifecycle

The allowed local transitions are:

| Current status | Allowed next status |
| --- | --- |
| `draft` | `ready`, `cancelled` |
| `ready` | `in_progress`, `cancelled` |
| `in_progress` | `blocked`, `in_review` |
| `blocked` | `ready`, `in_progress`, `cancelled` |
| `in_review` | `in_progress`, `blocked`, `completed`, `cancelled` |
| `completed` | terminal |
| `cancelled` | terminal |

A task can move to `ready` only when it has:

- a unique Business Pilot task ID
- a measurable goal
- explicit scope and out-of-scope sections
- testable acceptance criteria
- verification commands
- risk and stop conditions
- no unresolved product or architecture decision required to start

Suggested GitHub Project status mapping:

| Local status | GitHub Project status |
| --- | --- |
| `draft` | Backlog |
| `ready` | Ready |
| `in_progress` | In progress |
| `in_review` | In review |
| `blocked` | Blocked |
| `completed` | Done |
| `cancelled` | Cancelled |

The actual field names must be confirmed against the existing GitHub Project
before any synchronization is enabled.

## Controlled loop

1. Select one task whose status is `ready`.
2. Read `AGENTS.md`, this file, `decisions.md`, `status.md`, and the complete task
   contract.
3. Confirm that the repository baseline is green or record pre-existing failures.
4. Mark the task and local status as `in_progress`.
5. Implement only the declared scope.
6. Run every verification command from the task contract.
7. Inspect the complete change and update the implementation log.
8. Move the task to `in_review` only when all required checks pass.
9. Obtain independent review for risky or cross-boundary changes.
10. Mark the task `completed` only after its acceptance criteria and review
    requirements are satisfied.

## Loop limits

- Default maximum implementation iterations: 5.
- Stop after 2 consecutive iterations without measurable progress.
- Work on one implementation task at a time unless the user explicitly approves
  independent parallel tasks.
- A failed required check prevents `in_review` and `completed`.
- A skipped required check must be reported; it is not a passing check.
- Do not weaken tests or acceptance criteria to make a loop pass.

## Mandatory stop conditions

Stop and request human direction when:

- the task contract is incomplete or contradictory
- a public API contract must change outside the declared scope
- a database migration or destructive data operation becomes necessary
- authentication, authorization, tenant isolation, encryption, or secret handling
  is ambiguous
- a new dependency, paid service, or infrastructure resource is required without
  prior approval
- production credentials, customer data, or production access would be needed
- the repository has unrelated changes that overlap the task
- the iteration budget is exhausted
- two consecutive iterations make no measurable progress
- GitHub and local task state disagree

## Human-controlled actions

Do not create or update GitHub issues or project items, commit, push, open or
merge a pull request, deploy, run production migrations, or modify production
resources unless the user explicitly authorizes that action.
