# BP-XXX: Short task title

Do not execute this template directly. Copy it to `BP-XXX-short-name.md`, replace
every placeholder, and move the task to `ready` only when the readiness checklist
is complete.

## Metadata

- Status: draft
- Risk: low | medium | high
- Owner: unassigned
- Created: YYYY-MM-DD
- Updated: YYYY-MM-DD
- GitHub repository: not linked
- GitHub issue: not linked
- GitHub Project item: not linked
- GitHub Project status: not synchronized

## Goal

Describe one measurable outcome for the user or system.

## Context

Explain why the task exists and include only the context required to implement it.

## Scope

- Add the exact behavior included in this task.
- Name the affected application, package, or module.

## Out of scope

- List adjacent behavior that must not be implemented.
- List migrations, integrations, UI, or infrastructure changes that are excluded.

## Acceptance criteria

- [ ] Criterion 1 is observable and testable.
- [ ] Criterion 2 covers the expected failure behavior.
- [ ] Existing behavior remains compatible unless explicitly changed above.
- [ ] No secrets or sensitive customer data are exposed in code, logs, or output.
- [ ] Tenant-owned data remains scoped to `organization_id`, or this criterion is
      documented as not applicable.

## Expected files or areas

- `path/to/expected-area`

This list guides scope but does not authorize unrelated changes.

## Verification commands

Run commands from the repository root unless stated otherwise.

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Add focused tests and checks required by this task. Do not remove required baseline
commands merely to shorten a loop.

## Dependencies and data changes

- New dependency required: no
- Database migration required: no
- Public API contract change required: no
- Production resource or credential required: no

Any `yes` answer requires explicit approval before implementation begins.

## Loop budget

- Maximum implementation iterations: 5
- Stop after consecutive iterations without measurable progress: 2
- Independent review required: yes | no

## Task-specific stop conditions

Stop in addition to the repository-wide conditions when:

- a required product decision is missing
- implementation would exceed the declared scope
- a required check cannot be run
- the GitHub item and this contract disagree
- security, tenant isolation, or data ownership is unclear

## Readiness checklist

- [ ] All placeholders have been replaced.
- [ ] Goal, scope, and out-of-scope are unambiguous.
- [ ] Acceptance criteria are measurable.
- [ ] Verification commands exist and are runnable.
- [ ] Risks and stop conditions are documented.
- [ ] Required human decisions are resolved.
- [ ] Status is changed from `draft` to `ready`.

## Implementation log

### Iteration 1

- Change made:
- Measurable progress:
- Commands run:
- Result:
- Remaining blocker or risk:

## Review handoff

- Summary:
- Files changed:
- Acceptance criteria result:
- Verification result:
- Failed or skipped checks:
- Remaining risks:
- Reviewer verdict: not reviewed
