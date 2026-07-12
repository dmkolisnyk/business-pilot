---
name: repo-review
description: Use for repository structure, scripts, documentation, environment examples, dependency hygiene, Codex configuration, and readiness reviews.
---

# Repository Review Skill

Use this skill for repository hygiene, structure review, contributor workflow review, and readiness checks.

## Workflow

1. Read `AGENTS.md` before reviewing.
2. Inspect the repository structure, `docs/`, `.agents/skills/`, and `.codex/agents/`.
3. Check that application code stays under `apps/web`, `apps/api`, and shared contracts under `packages/shared`.
4. Verify commands, environment examples, documentation, and skill files match the current project stage.
5. Report conflicts, missing decisions, unnecessary dependencies, and changes that violate MVP scope.

## Rules

- Do not modify files during review unless explicitly asked.
- Do not create commits unless explicitly requested.
- Do not claim tests passed unless they were actually run.
- Keep feedback focused on risks and actionable fixes.

## Output

Return findings by severity, open questions, commands reviewed, and recommended next steps.
