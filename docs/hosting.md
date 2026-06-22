# Business Pilot Hosting Plan

## Hosting Strategy

Business Pilot should use a simple managed hosting strategy for MVP.

The goal is to avoid infrastructure complexity while keeping the system production-ready enough for early customers.

Avoid in MVP:

- Kubernetes
- microservices
- manually managed database servers
- complex cloud networking
- multi-region deployment
- custom deployment platform

## Local Development

Local services:

```text
Next.js Web App: http://localhost:3000
NestJS API:      http://localhost:4000
PostgreSQL:      Docker
Redis:           Docker
Worker:          local Node process later
```

Recommended local development stack:

```text
pnpm
Docker Compose
PostgreSQL
Redis
```

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

## MVP Production Hosting

Recommended MVP architecture:

```text
Cloudflare
  ↓
Vercel - Next.js frontend
  ↓
Backend provider - NestJS API
  ↓
Managed PostgreSQL
  ↓
Managed Redis
  ↓
Worker process
```

## Frontend Hosting

Recommended provider:

```text
Vercel
```

Used for:

- Next.js deployment
- preview deployments
- production frontend hosting
- frontend environment variables

Frontend environment variables:

```text
NEXT_PUBLIC_API_URL
```

## Backend Hosting

Recommended candidates:

```text
Render
Railway
Fly.io
DigitalOcean App Platform
```

Backend should run at least one API process:

```text
api
```

The API process handles:

- HTTP requests
- authentication
- frontend API calls
- WooCommerce connection validation
- sync job creation
- analytics/report endpoints

Backend environment variables:

```text
NODE_ENV
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

## Worker Hosting

The worker should be deployed as a separate process from the API.

Worker process handles:

- WooCommerce initial sync
- WooCommerce incremental sync
- analytics recalculation
- AI report generation
- email draft generation later
- competitor snapshot jobs later

Why separate worker:

- sync jobs can be slow
- WooCommerce stores may have many orders
- API requests should stay fast
- failed jobs should not crash the API
- workers can be scaled independently later

## PostgreSQL Hosting

Local:

```text
Docker PostgreSQL
```

Production:

```text
Managed PostgreSQL
```

Candidate providers:

```text
Neon
Supabase
Railway PostgreSQL
Render PostgreSQL
AWS RDS later
```

Requirements:

- automated backups
- connection string through environment variable
- ability to restore backups
- basic monitoring
- production/staging separation later

## Redis Hosting

Local:

```text
Docker Redis
```

Production:

```text
Managed Redis
```

Candidate providers:

```text
Upstash
Railway Redis
Render Redis
Redis Cloud
```

Used for:

- BullMQ queues
- background job processing
- retry/delay state

Redis should not be the source of truth for business data.

## Cloudflare

Cloudflare should be used for:

- DNS
- SSL
- basic WAF
- domain management
- security rules
- future rate limiting or bot protection

Cloudflare should sit in front of production public domains.

## Monitoring

Initial monitoring:

```text
Sentry
provider logs
database provider metrics
```

Monitor:

- frontend errors
- backend errors
- worker errors
- failed sync jobs
- WooCommerce API failures
- queue depth
- database errors

## Logging

Logging rules:

- log sync job status
- log integration failures
- log API errors
- log worker failures
- do not log secrets
- do not log WooCommerce Consumer Secret
- do not log full customer PII payloads
- do not log decrypted credentials

## Backups

PostgreSQL backups are required for production.

MVP backup requirements:

- automated daily database backups
- restore procedure documented
- backup retention based on provider defaults initially
- manual restore test before serious production use

Redis does not need to be backed up as source of truth.

## Environments

Initial environments:

```text
local
production
```

Recommended next environment:

```text
staging
```

Future environment split:

```text
local
staging
production
```

Each environment should have separate:

- database
- Redis
- environment variables
- API URL
- frontend URL
- secrets
- webhook URLs

## CI/CD

Initial CI/CD should use GitHub integration through hosting providers.

Future GitHub Actions should run:

```text
pnpm install
pnpm typecheck
pnpm lint
pnpm test
pnpm build
```

Do not add complex CI/CD until project structure stabilizes.

## Scaling Path

MVP:

```text
one frontend deployment
one API process
one worker process
managed PostgreSQL
managed Redis
```

Growth stage:

```text
scale API horizontally
scale workers separately
add queue monitoring
add scheduled jobs
add object storage
add staging environment
improve observability
```

Later:

```text
separate heavy analytics jobs
add data warehouse only if needed
add advanced reporting infrastructure only if justified
```

## Object Storage

Not required in MVP.

May be added later for:

- CSV exports
- report exports
- generated report files
- long-term archives
- large competitor snapshots

Candidate providers:

```text
AWS S3
Cloudflare R2
Backblaze B2
```

## Production Readiness Checklist

Before production:

- frontend deployed
- API deployed
- worker deployed
- managed PostgreSQL configured
- managed Redis configured
- environment variables configured
- secrets are not in Git
- CORS configured
- database backups enabled
- Sentry configured
- health endpoint working
- sync failure logging exists
- no WooCommerce secrets in logs
