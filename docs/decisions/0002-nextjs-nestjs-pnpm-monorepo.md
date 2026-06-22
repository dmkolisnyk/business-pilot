# 0002 - Next.js + NestJS pnpm Monorepo

## Status

Accepted

## Context

Business Pilot needs a frontend, backend, shared types, and a clean development structure.

The selected stack is:

- Next.js for frontend
- NestJS for backend
- TypeScript for both
- pnpm monorepo for workspace management

## Decision

Business Pilot will use a pnpm monorepo.

Repository structure:

```text
apps/
  web/
  api/

packages/
  shared/
```

`apps/web` contains the Next.js frontend.

`apps/api` contains the NestJS backend.

`packages/shared` contains shared TypeScript contracts used by frontend and backend.

## Reasons

This structure is useful because:

- frontend and backend both use TypeScript
- shared API contracts can live in one package
- root scripts can run both apps
- development setup stays simple
- the repository remains easy to understand
- future packages can be added without splitting repositories

## Consequences

The root `package.json` manages common commands.

The root `pnpm-workspace.yaml` defines workspace packages.

App-specific dependencies should be added to the correct package.

Examples:

```bash
pnpm --filter ./apps/web add <package>
pnpm --filter ./apps/api add <package>
pnpm --filter @business-pilot/shared add <package>
```

## Rules

Do not put application code in the root.

Do not put backend-only code in `packages/shared`.

Do not put frontend-only code in `packages/shared`.

Do not create separate Git repositories inside `apps/web` or `apps/api`.

Use one root Git repository.
