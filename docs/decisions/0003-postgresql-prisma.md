# 0003 - PostgreSQL + Prisma

## Status

Accepted

## Context

Business Pilot needs a database for SaaS users, organizations, WooCommerce integrations, synced ecommerce data, analytics snapshots, recommendations, reports, and customer segments.

The database must support relational data and analytics queries.

## Decision

Business Pilot will use PostgreSQL as the main database and Prisma as the ORM/migration tool.

Prisma will live in the NestJS backend application:

```text
apps/api/prisma/schema.prisma
```

## Reasons

PostgreSQL is a good fit because:

- ecommerce data is relational
- SaaS tenant data needs strong relationships
- orders, customers, products, refunds, and reports need joins and indexes
- PostgreSQL supports JSONB for selective raw payload storage
- managed PostgreSQL is widely available

Prisma is a good fit because:

- the backend is TypeScript/NestJS
- it provides type-safe database access
- it supports migrations
- it keeps schema definition explicit

## Consequences

The data model must be designed before Prisma schema implementation.

Most business tables must include:

```text
organization_id
```

The schema must support:

- users
- organizations
- memberships
- integrations
- WooCommerce connections
- encrypted credentials
- sync jobs
- customers
- products
- orders
- order items
- refunds
- coupons
- analytics snapshots
- recommendations
- email campaign drafts
- competitors

## Rules

Do not use MongoDB for the primary database.

Do not introduce multiple databases in MVP.

Do not introduce sharding in MVP.

Do not design CQRS/event sourcing in MVP.

Use normalized tables for analytics.

Use raw JSON payload only where useful for debugging.
