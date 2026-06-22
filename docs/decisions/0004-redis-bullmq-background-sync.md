# 0004 - Redis + BullMQ Background Sync

## Status

Accepted

## Context

Business Pilot needs to sync WooCommerce stores.

WooCommerce stores may contain many orders, products, customers, refunds, and coupons.

Sync operations can be slow and unreliable because WooCommerce stores may have:

- slow hosting
- plugin conflicts
- invalid credentials
- network timeouts
- pagination
- partial failures
- rate limits
- malformed data

These operations should not run inside normal HTTP requests.

## Decision

Business Pilot will use Redis and BullMQ for background jobs.

Redis will act as the queue backend.

BullMQ will manage jobs, retries, delays, and workers.

## Reasons

Background jobs are needed for:

- initial WooCommerce sync
- incremental WooCommerce sync
- analytics recalculation
- AI report generation
- email draft generation later
- competitor snapshot jobs later

This keeps the API responsive and allows retrying failed work.

## Consequences

The backend deployment must include at least two processes:

```text
api process
worker process
```

The API process creates jobs.

The worker process executes jobs.

Redis is required in local development and production.

## Initial Queues

```text
woocommerce-sync
analytics
recommendations
email-drafts
competitors
```

## Initial Jobs

```text
woocommerce.initial-sync
woocommerce.incremental-sync
analytics.recalculate
recommendations.generate
email-drafts.generate
competitors.snapshot
```

## Rules

Do not run large sync operations inside HTTP requests.

Do not process heavy webhook work directly in webhook handlers.

Webhook handlers should validate the request and enqueue a job.

Jobs must be idempotent.

Jobs must not log secrets.

Failed jobs must store enough error information for debugging.
