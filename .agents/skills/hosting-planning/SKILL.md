# Hosting Planning Skill

Use this skill for local, staging, and production hosting plans for Business Pilot.

## Workflow

1. Keep MVP hosting simple and production-ready.
2. Separate frontend, API, worker, PostgreSQL, and Redis responsibilities.
3. Define environment variables, deployment targets, logging, backups, and monitoring.
4. Document decisions in `docs/hosting.md`, `docs/services.md`, or `docs/decisions/`.

## Target Stack

Use Cloudflare for DNS, SSL, and basic protection. Use Vercel or equivalent for Next.js. Use Render, Railway, Fly.io, or equivalent for NestJS API and worker. Use managed PostgreSQL and managed Redis. Add Sentry for error tracking.

## Rules

- Do not add Kubernetes for MVP.
- Prefer managed services over custom infrastructure.
- Keep staging and production secrets separate.

## Output

Return deployment topology, service list, environment variables, risks, and migration steps.
