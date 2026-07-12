# Business Pilot Repository Guidelines

## Product Context

Business Pilot is a WooCommerce-first AI/SaaS platform for ecommerce store owners.

A store owner connects their WooCommerce store so Business Pilot can:

- analyze sales, orders, customers, products, refunds, coupons, payments, and customer behavior
- generate actionable recommendations to increase sales and reduce lost revenue
- identify customer segments for retention and reactivation
- generate email campaign drafts for winback, upsell, cross-sell, and repeat purchase campaigns
- analyze competitors, offers, pricing, positioning, and market opportunities

The MVP starts with WooCommerce only.

Future integrations may include Shopify, Stripe, payment gateways, email platforms, marketplaces, ad platforms, analytics tools, and CRM systems.

Business Pilot should be treated as a B2B SaaS product with multi-tenant data isolation.

## Current Development Stage

The repository is in the foundation/setup stage.

Current priorities:

1. Keep the monorepo clean.
2. Configure Next.js frontend and NestJS backend.
3. Define architecture, hosting, services, data model, and Codex workflows.
4. Configure project-local Codex skills and agents.
5. Add PostgreSQL, Prisma, Redis, and BullMQ only after the architecture and data model are documented.
6. Implement WooCommerce connection and sync only after the data model and security rules are clear.

Do not rush into business logic before the project structure, data model, and integration strategy are stable.

## Technical Stack

Frontend:

- Next.js
- React
- TypeScript
- Tailwind CSS

Backend:

- NestJS
- TypeScript
- PostgreSQL
- Prisma
- BullMQ
- Redis

Repository:

- pnpm monorepo
- `apps/web` for frontend
- `apps/api` for backend
- `packages/shared` for shared types/contracts

Infrastructure target:

- Cloudflare for DNS, SSL, and basic protection
- Vercel or equivalent for Next.js frontend
- Render, Railway, Fly.io, or equivalent for NestJS API and worker
- Managed PostgreSQL for production database
- Managed Redis for production queue
- Sentry for error tracking
- Resend or Postmark later for email sending
- S3-compatible storage later for exports, report snapshots, and large files if needed

## Product Principles

Business Pilot must help store owners make better business decisions.

Every feature should answer at least one of these questions:

- How can the store owner increase revenue?
- How can the store owner recover lost revenue?
- Which customers should be targeted?
- Which products are performing best or worst?
- What business risks or opportunities are visible in the data?
- What concrete action should the store owner take next?

Avoid generic dashboards, vanity metrics, and vague AI advice.

## MVP Scope

The MVP should include:

1. User registration and login.
2. Organization/workspace setup.
3. WooCommerce connection.
4. Initial WooCommerce data sync.
5. Basic analytics dashboard.
6. AI business report.
7. Actionable recommendations.
8. Customer segments.
9. Email campaign drafts.
10. Basic competitor tracking.

Do not build in MVP:

- complex marketing automation builder
- many integrations at once
- microservices
- Kubernetes
- complex BI/report builder
- automatic email sending before draft generation is useful
- real-time analytics unless required
- advanced role/permission system unless required
- multi-region infrastructure
- custom billing engine
- full WordPress plugin before REST API connection is validated

## Architecture Rules

- Use a modular monolith for MVP.
- Do not use microservices in MVP.
- Do not use Kubernetes in MVP.
- Keep WooCommerce-specific logic isolated from analytics and recommendations.
- Keep integration logic isolated from domain analytics logic.
- Use background jobs for long-running sync, analytics recalculation, report generation, and AI tasks.
- Store external credentials encrypted.
- Never log WooCommerce Consumer Secret.
- Treat the project as multi-tenant SaaS.
- Every tenant-owned business record must be scoped by `organization_id` where applicable.
- Prefer simple, production-ready architecture over over-engineering.
- Do not introduce distributed systems unless a documented requirement justifies it.
- Document architecture decisions in `docs/decisions/`.

## Expected Project Structure

Expected structure:

```text
apps/
  web/
  api/

packages/
  shared/

docs/
  architecture.md
  hosting.md
  services.md
  data-model.md
  woocommerce-integration.md
  decisions/

.agents/
  skills/

.codex/
  agents/
```

Frontend should live in:

```text
apps/web
```

Backend should live in:

```text
apps/api
```

Shared types/contracts should live in:

```text
packages/shared
```

Do not place application source code directly in the repository root.

## Development Commands

Root commands:

```bash
pnpm dev
pnpm dev:web
pnpm dev:api
pnpm build
pnpm lint
pnpm test
pnpm typecheck
```

Frontend:

```bash
pnpm --filter ./apps/web dev
pnpm --filter ./apps/web build
pnpm --filter ./apps/web lint
pnpm --filter ./apps/web typecheck
```

Backend:

```bash
pnpm --filter ./apps/api dev
pnpm --filter ./apps/api build
pnpm --filter ./apps/api lint
pnpm --filter ./apps/api test
pnpm --filter ./apps/api typecheck
```

Shared package:

```bash
pnpm --filter @business-pilot/shared typecheck
```

When adding a new script, update the relevant `package.json` and document it in `README.md` if contributors need to run it.

## Backend Rules

NestJS backend rules:

- Keep controllers thin.
- Put business logic in services.
- Use modules by domain.
- Use DTO validation for inputs.
- Keep services cohesive and small.
- Keep WooCommerce API client isolated.
- Keep analytics calculations separate from raw integration code.
- Use Prisma for database access.
- Use queues/workers for WooCommerce sync and heavy processing.
- Do not expose database models directly to the frontend.
- Add tests for important services and calculations.
- Keep environment variables documented in `.env.example`.
- Do not add dependencies unless they solve a clear problem.

Recommended backend modules:

```text
auth
users
organizations
integrations
woocommerce
sync
analytics
recommendations
email-campaigns
competitors
reports
admin
```

## Frontend Rules

Next.js frontend rules:

- Keep pages and features grouped by domain.
- Prioritize clear SaaS UX over visual complexity.
- Always include loading, error, and empty states.
- Do not expose secrets in client code.
- Keep API client centralized.
- Validate forms.
- Avoid complex state management unless needed.
- Keep onboarding simple.
- Prefer reusable UI components, but do not over-abstract too early.
- Keep user-facing copy clear and practical.

Important frontend areas:

```text
login
onboarding
WooCommerce connection
dashboard
analytics
recommendations
email campaign drafts
competitors
settings
```

## Shared Package Rules

Use `packages/shared` only for contracts genuinely shared by frontend and backend.

Good candidates:

- response types
- shared enums
- DTO-like contracts
- stable constants
- ID aliases
- public API response shapes

Do not put backend-only business logic, Prisma models, server secrets, or frontend UI logic in `packages/shared`.

## Database Rules

Use PostgreSQL as the primary database.

Use Prisma for schema definition, migrations, and type-safe database access.

Database rules:

- Treat Business Pilot as a multi-tenant SaaS.
- Tenant-owned records must include `organization_id` where applicable.
- Store WooCommerce external IDs for idempotent sync.
- Add indexes for `organization_id`, external IDs, timestamps, and analytics queries.
- Avoid premature sharding, CQRS, event sourcing, or multiple databases.
- Keep normalized tables for analytics.
- Store raw external payloads only where useful for debugging.
- Avoid storing unnecessary sensitive data.
- Document major schema decisions in `docs/data-model.md`.

Expected database areas:

```text
users
organizations
organization_members
integrations
woocommerce_connections
sync_jobs
sync_logs
sync_cursors
customers
products
orders
order_items
refunds
coupons
analytics_snapshots
business_reports
recommendations
customer_segments
email_campaign_drafts
competitors
competitor_snapshots
```

## WooCommerce Rules

Start with WooCommerce REST API keys.

Initial connection should require:

- store URL
- Consumer Key
- Consumer Secret

WooCommerce rules:

- Prefer read-only access first.
- Validate store URL and credentials before saving.
- Encrypt Consumer Key and Consumer Secret before storage.
- Never send WooCommerce secrets to the frontend.
- Never log WooCommerce secrets.
- Use background jobs for sync.
- Make sync idempotent.
- Store external WooCommerce IDs.
- Store sync status and sync errors.
- Separate initial sync from incremental sync.
- Use pagination and retry logic.
- Handle slow stores, broken plugins, network errors, partial sync failures, invalid credentials, and changed permissions.
- Add webhooks only after initial sync works reliably.
- Keep WooCommerce-specific code isolated from generic integration logic.

Sync first:

```text
orders
order_items
customers
products
refunds
coupons
payment_method
order_statuses
billing_country
shipping_country
created_date
paid_date
completed_date
```

## Sync and Queue Rules

Use Redis + BullMQ for background jobs.

Do not run large WooCommerce sync operations inside HTTP request handlers.

Expected jobs:

```text
woocommerce.initial-sync
woocommerce.incremental-sync
woocommerce.validate-connection
analytics.recalculate
recommendations.generate
email-campaigns.generate-drafts
competitors.scan
```

Sync rules:

- Jobs must be idempotent.
- Jobs must support retries with backoff.
- Jobs must track status.
- Jobs must record errors safely.
- Jobs must not log secrets.
- Jobs must support partial failure.
- Jobs must be scoped to `organization_id`.
- Analytics should be recalculated after successful sync.

## Analytics Rules

Analytics must help the store owner make decisions.

Initial metrics:

```text
gross_revenue
net_revenue
orders_count
average_order_value
refund_rate
repeat_purchase_rate
top_products
top_customers
inactive_customers
one_time_buyers
revenue_by_product
revenue_by_country
revenue_by_payment_method
```

Every metric should define:

1. Business question answered.
2. Source data needed.
3. Calculation method.
4. Data limitations.
5. Recommendation that can be generated.
6. Action the store owner can take.

Avoid vanity metrics unless they support a decision.

## AI Recommendation Rules

AI recommendations must be:

- based on available store data
- specific
- explainable
- actionable
- prioritized by business impact
- honest about missing or weak data
- not generic marketing advice

Each recommendation should include:

- finding
- supporting evidence
- business impact
- recommended action
- expected result
- confidence level
- data limitations

Do not invent facts.

Do not send raw sensitive customer data to an AI provider unless the data sharing policy and privacy implications are explicitly documented.

Prefer sending aggregated analytics summaries, segments, and anonymized examples.

## Email Campaign Rules

In MVP, generate email campaign drafts only.

Do not send emails automatically until drafts, segmentation, consent, unsubscribe handling, and compliance requirements are reviewed.

Campaigns should be based on customer behavior.

Useful segments:

```text
inactive customers
one-time buyers
repeat buyers
high-value customers
customers who bought product A but not product B
customers with refunds
recent purchasers
customers from specific countries
```

Each campaign draft should include:

- target segment
- why this segment matters
- campaign goal
- subject line
- email body
- offer suggestion
- expected business impact
- compliance risks
- unsubscribe/privacy notes

## Competitor Analysis Rules

Competitor analysis starts simple.

MVP competitor tracking may include:

- competitor URLs
- manually added competitors
- pricing observations
- offer observations
- positioning notes
- product/category overlap
- AI summary based on collected public data

Do not build aggressive scraping, bypass protections, or violate website terms.

Prefer user-provided competitor URLs and conservative public-page analysis.

## Security Rules

Do not commit:

- API keys
- tokens
- private keys
- database credentials
- production secrets
- real WooCommerce credentials
- real customer data exports
- real payment data exports

Use local secret files:

```text
.env
.env.local
```

Use safe examples only:

```text
.env.example
```

Security requirements:

- Encrypt WooCommerce credentials.
- Do not expose secrets to frontend.
- Do not log secrets.
- Validate and sanitize inputs.
- Enforce organization-level authorization.
- Verify webhooks when implemented.
- Keep CORS restricted to known frontend origins.
- Use rate limiting later for auth and integration endpoints.
- Avoid storing unnecessary PII.
- Document sensitive data flows.
- Never claim security is complete without review.

## Environment Variables

All required environment variables must be documented in `.env.example`.

Expected variables:

```text
NODE_ENV
NEXT_PUBLIC_API_URL
API_PORT
FRONTEND_URL
CORS_ORIGIN
DATABASE_URL
REDIS_URL
JWT_SECRET
APP_ENCRYPTION_KEY
WOOCOMMERCE_WEBHOOK_SECRET
OPENAI_API_KEY
EMAIL_PROVIDER_API_KEY
EMAIL_FROM
```

Never place real values in `.env.example`.

## Hosting Rules

Local development:

- Next.js runs on `http://localhost:3000`.
- NestJS API runs on `http://localhost:4000`.
- The complete development stack can run through Docker Compose: web, API, PostgreSQL, and Redis.
- PostgreSQL is exposed on host port `5434` by default.
- Redis is exposed on host port `6380` by default.
- A separate worker service should be added when BullMQ job processors are implemented.

MVP production target:

- Cloudflare for DNS, SSL, and basic protection.
- Vercel or equivalent for frontend.
- Render, Railway, Fly.io, or equivalent for API and worker.
- Managed PostgreSQL.
- Managed Redis.
- Sentry for error tracking.
- Provider environment variables for secrets.

Future production:

- Containerized API and worker.
- Dedicated staging and production environments.
- Structured logs.
- Backups and restore tests.
- Object storage for exports/report snapshots if needed.
- More integration workers if sync load grows.

Do not add Kubernetes for MVP.

## Documentation Rules

Keep documentation in `docs/`.

Required docs:

```text
docs/architecture.md
docs/hosting.md
docs/services.md
docs/data-model.md
docs/woocommerce-integration.md
docs/decisions/
```

Use decision records for major decisions:

```text
docs/decisions/0001-woocommerce-first.md
docs/decisions/0002-nextjs-nestjs-monorepo.md
docs/decisions/0003-postgresql-prisma.md
docs/decisions/0004-redis-bullmq-sync.md
```

Each decision record should include:

- context
- decision
- alternatives considered
- consequences
- follow-up work

## Testing Rules

Add tests for important behavior, especially:

- analytics calculations
- sync idempotency
- WooCommerce credential validation
- organization authorization boundaries
- AI recommendation input preparation
- campaign segment generation
- security-sensitive services

Do not claim tests passed unless they were actually run.

When tests cannot be run, explain why.

## Dependency Rules

Before adding a dependency, explain:

- what problem it solves
- why existing tools are not enough
- whether it runs in frontend, backend, or both
- security implications
- maintenance risk

Do not add libraries just because they are popular.

## Codex Working Rules

Before changing code, Codex must:

1. Read `AGENTS.md`.
2. Inspect the current repository structure.
3. Check `docs/`, `.agents/skills/`, and `.codex/agents/`.
4. Prefer small changes.
5. Explain new dependencies, services, or architecture choices.
6. Keep changes scoped to the requested task.
7. Report files changed.
8. Report commands/tests run.

Codex must not:

- add unnecessary libraries
- add OpenAI or Codex npm packages without explicit user approval
- add non-workspace dependencies without exact versions
- regenerate `pnpm-lock.yaml` with a pnpm version other than the pinned version
- create unrelated files
- introduce cloud services without explanation
- rewrite project structure without clear reason
- implement business logic before architecture and data model are clear
- claim tests passed unless they were actually run
- commit changes unless explicitly requested
- use real credentials, real secrets, or real customer data

Read `docs/dependency-security.md` before adding, removing, or updating a package.

## Codex Skills Policy

Project skills live in:

```text
.agents/skills/
```

Recommended skills:

```text
business-pilot-product
woocommerce-integration
ecommerce-analytics
data-sync
database-design
ai-recommendations
email-retention
nestjs-backend
nextjs-frontend
hosting-planning
security-review
repo-review
```

Each skill must include a `SKILL.md` with YAML frontmatter containing a unique `name` and a concise trigger-focused `description`.

Create a skill only for repeatable workflows or important domain rules.

## Codex Agents Policy

Project agents live in:

```text
.codex/agents/
```

Recommended agents:

```text
product-architect
woocommerce-engineer
backend-engineer
frontend-engineer
database-architect
hosting-planner
security-reviewer
repo-reviewer
```

Use subagents for reviews and planning, not for every small implementation task.

Recommended review prompt:

```text
Spawn product-architect, woocommerce-engineer, backend-engineer, frontend-engineer, database-architect, hosting-planner, security-reviewer, and repo-reviewer as subagents.

Ask them to review the planning docs only.
Do not modify files.
Return conflicts, risks, missing decisions, and recommended changes.
```

## Loop Engineering Workflow

Repository-local Loop Engineering state lives in `.agent/`. Do not confuse it
with `.agents/`, which contains reusable skills.

Before implementing a loop task:

1. Read `.agent/README.md`, `.agent/decisions.md`, `.agent/status.md`, and the
   complete `.agent/tasks/BP-XXX.md` contract.
2. Confirm that the task status is `ready`.
3. Confirm that goal, scope, out-of-scope, acceptance criteria, verification
   commands, risks, and stop conditions are complete.
4. Work on one implementation task at a time unless the user explicitly approves
   independent parallel tasks.
5. Keep GitHub planning state and the local contract linked when identifiers are
   available.

During and after implementation:

- stay inside the task contract
- update the task implementation log and `.agent/status.md`
- run every required verification command
- never treat a skipped or failed check as passed
- use at most 5 implementation iterations by default
- stop after 2 consecutive iterations without measurable progress
- stop when a migration, public contract change, dependency, security decision,
  production access, or overlapping unrelated change is required outside scope
- stop when GitHub and local task state disagree

Creating or updating GitHub issues or Project items, committing, pushing, opening
or merging pull requests, deploying, running production migrations, and changing
production resources require explicit user authorization.

Full workflow rules and status definitions are in `.agent/README.md`. Start new
contracts from `.agent/tasks/_template.md`.

## Git Rules

Do not commit unless explicitly requested.

When committing is requested:

- keep commits small and focused
- use imperative commit messages
- do not include secrets
- mention tests run
- mention follow-up work

Example commit messages:

```text
chore: configure Business Pilot monorepo
chore: add Codex skills
docs: add WooCommerce-first architecture plan
feat: add WooCommerce connection validation
```

## Final Response Rules for Codex

When completing a task, Codex should report:

- summary of changes
- files changed
- commands run
- tests run
- remaining risks
- suggested next step

If no tests were run, say that clearly.
