# Business Pilot Services

## Service Overview

Business Pilot uses a simple MVP-focused service architecture.

The goal is to keep the first production version manageable while still preparing for future growth.

## Next.js

Used for the frontend web application.

Responsible for:

- SaaS dashboard
- onboarding
- WooCommerce connection UI
- analytics UI
- recommendations UI
- email campaign draft UI
- competitor tracking UI
- settings UI

Local URL:

```text
http://localhost:3000
```

Production hosting candidate:

- Vercel

## NestJS

Used for the backend API.

Responsible for:

- authentication
- organizations
- WooCommerce integration
- sync orchestration
- analytics
- AI recommendations
- email campaign drafts
- competitor tracking
- frontend API endpoints

Local URL:

```text
http://localhost:4000
```

Production hosting candidates:

- Render
- Railway
- Fly.io
- DigitalOcean App Platform

## PostgreSQL

Main relational database.

Used for:

- users
- organizations
- organization members
- integrations
- WooCommerce connections
- synced customers
- synced products
- synced orders
- synced refunds
- analytics snapshots
- recommendations
- reports
- email campaign drafts
- competitors

Why PostgreSQL:

- strong relational model
- good fit for SaaS data
- good fit for ecommerce analytics
- supports JSONB for selective raw WooCommerce payload storage
- mature backup and managed hosting options

Local development:

- Docker

Production:

- managed PostgreSQL

Candidates:

- Neon
- Supabase
- Railway PostgreSQL
- Render PostgreSQL
- AWS RDS later

## Prisma

ORM and migration tool for the NestJS backend.

Used for:

- database schema definition
- migrations
- type-safe database queries
- local development schema management

Prisma should live inside:

```text
apps/api/prisma/
```

Recommended files:

```text
apps/api/prisma/schema.prisma
apps/api/src/prisma/prisma.service.ts
apps/api/src/prisma/prisma.module.ts
```

## Redis

Queue backend for background jobs.

Used for:

- WooCommerce initial sync jobs
- WooCommerce incremental sync jobs
- analytics recalculation jobs
- AI report generation jobs
- email draft generation jobs later

Redis is not the main database.

Local development:

- Docker

Production:

- managed Redis

Candidates:

- Upstash
- Railway Redis
- Render Redis
- Redis Cloud

## BullMQ

Background job system built on Redis.

Used for:

- reliable sync jobs
- retries
- delayed jobs
- worker processing
- job status tracking

Initial queues:

```text
woocommerce-sync
analytics
recommendations
email-drafts
competitors
```

Initial jobs:

```text
woocommerce.initial-sync
woocommerce.incremental-sync
analytics.recalculate
recommendations.generate
email-drafts.generate
competitors.snapshot
```

## WooCommerce REST API

Primary MVP data source.

Used for importing:

- orders
- order items
- customers
- products
- refunds
- coupons
- order statuses
- payment methods
- billing/shipping country
- created/paid/completed dates

Connection method for MVP:

- store URL
- Consumer Key
- Consumer Secret

Future connection method:

- Business Pilot WordPress plugin

## WooCommerce Webhooks

Used later for incremental updates.

Potential webhook events:

- order created
- order updated
- order deleted
- product created
- product updated
- customer created
- customer updated

MVP can start with scheduled incremental sync before webhooks are added.

## AI Provider

Used for:

- business report generation
- recommendation generation
- insight explanations
- email draft generation

Initial candidate:

- OpenAI API

AI input should be structured and minimized.

Do not send full raw WooCommerce payloads to the AI provider unless explicitly required.

Preferred AI input:

- analytics summary
- customer segments
- top products
- refund patterns
- inactive customers
- revenue trends
- known data limitations

## Email Provider

Used later for email sending.

MVP should generate email drafts only.

Future candidates:

- Resend
- Postmark
- SendGrid
- Amazon SES later

Future responsibilities:

- send campaigns
- track delivery status
- handle bounces
- handle unsubscribe links
- manage sender domains

## Sentry

Error tracking and monitoring.

Used for:

- frontend runtime errors
- backend runtime errors
- worker failures
- WooCommerce sync exceptions
- API failures

Should be added after the basic app structure is stable.

## Cloudflare

Used for:

- DNS
- SSL
- basic WAF
- domain management
- protection rules

Cloudflare should sit in front of public production services.

## Vercel

Recommended MVP frontend hosting.

Used for:

- Next.js frontend deployment
- preview deployments
- environment variables for frontend
- automatic deployments from GitHub

## Backend Hosting Provider

Recommended MVP backend hosting options:

- Render
- Railway
- Fly.io
- DigitalOcean App Platform

The backend should run at least two processes:

```text
api process
worker process
```

The API process handles HTTP requests.

The worker process handles background jobs.

## Object Storage

Not required for the first MVP.

May be needed later for:

- report exports
- CSV exports
- uploaded assets
- generated files
- long-term log/archive storage

Future candidates:

- AWS S3
- Cloudflare R2
- Backblaze B2
- MinIO for self-hosting later

## Services Not Needed In MVP

Do not add these in MVP unless there is a strong reason:

- Kubernetes
- microservices
- Kafka
- Elasticsearch
- multiple databases
- data warehouse
- complex event bus
- custom auth server
- full marketing automation platform
