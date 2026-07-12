---
name: nestjs-backend
description: Use for NestJS modules, controllers, services, DTOs, Prisma access, queues, API boundaries, and backend test planning.
---

# NestJS Backend Skill

Use this skill for backend architecture, modules, controllers, services, DTOs, tests, and API boundaries.

## Workflow

1. Keep controllers thin and put business logic in services.
2. Organize modules by domain: auth, users, organizations, integrations, WooCommerce, sync, analytics, recommendations, email campaigns, competitors, reports, and admin.
3. Use DTO validation for inputs and do not expose database models directly to the frontend.
4. Keep WooCommerce clients, analytics calculations, and AI recommendation preparation in separate services.
5. Add tests for important services, calculations, sync idempotency, and authorization boundaries.

## Rules

- Use Prisma for database access when persistence is added.
- Use BullMQ workers for long-running tasks.
- Scope tenant-owned data by `organization_id`.
- Document required environment variables in `.env.example`.

## Output

Return module boundaries, endpoint contracts, service responsibilities, and test coverage notes.
