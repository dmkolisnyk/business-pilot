# Loop Engineering Decisions

This file records durable workflow decisions. Product and architecture decisions
continue to live in `docs/decisions/`.

## LE-001: Separate planning from implementation contracts

- Status: accepted
- Date: 2026-07-11

Decision:

- GitHub Project will hold priority, assignee, and planning status after it is
  connected.
- GitHub Issues will hold the problem statement and discussion.
- `.agent/tasks/BP-XXX.md` will hold the executable implementation contract.
- A mismatch between external and local state is a blocking conflict.

Reason:

Planning cards are useful for coordination, while implementation needs stricter
scope, acceptance, verification, and stop conditions.

## LE-002: Keep external actions human-controlled

- Status: accepted
- Date: 2026-07-11

Decision:

Creating or updating GitHub items, commits, pushes, pull requests, merges,
deployments, migrations, and production changes requires explicit user
authorization.

Reason:

Local implementation and verification are reversible. External actions can affect
other people, shared history, data, or production systems.

## LE-003: Use bounded implementation loops

- Status: accepted
- Date: 2026-07-11

Decision:

- Each task has a default limit of 5 implementation iterations.
- A loop stops after 2 consecutive iterations without measurable progress.
- Failed or skipped required checks prevent task completion.

Reason:

Bounded loops prevent repeated speculative edits and force ambiguous decisions
back to a human.

## LE-004: Pin and verify the dependency supply chain

- Status: accepted
- Date: 2026-07-11

Decision:

- Direct external dependencies use exact versions.
- Node.js, pnpm, and TypeScript versions are pinned and aligned across the
  workspace.
- The pnpm lockfile, minimum release age, publisher trust checks, strict engine
  and peer validation, and the dependency build allowlist are enforced.
- OpenAI and Codex npm packages require explicit user approval.

Reason:

Agent-driven changes must not introduce unreviewed packages, silent version drift,
or newly published supply-chain risk.
