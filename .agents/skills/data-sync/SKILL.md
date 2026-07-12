---
name: data-sync
description: Use for background synchronization, BullMQ jobs, retries, cursors, idempotency, partial failures, and analytics recalculation workflows.
---

# Data Sync Skill

Use this skill for background jobs, WooCommerce initial sync, incremental sync, analytics recalculation, and job status design.

## Workflow

1. Keep large sync work out of HTTP request handlers.
2. Model sync as BullMQ jobs backed by Redis.
3. Make each job idempotent and scoped to `organization_id`.
4. Track status, cursor, retry count, started/completed timestamps, and safe error details.
5. Trigger analytics recalculation after successful sync.

## Expected Jobs

Use names such as `woocommerce.initial-sync`, `woocommerce.incremental-sync`, `woocommerce.validate-connection`, `analytics.recalculate`, `recommendations.generate`, and `email-campaigns.generate-drafts`.

## Rules

- Use retries with backoff.
- Support partial failure and resumption.
- Never log external credentials or sensitive customer data.

## Output

Return job contracts, queue names, idempotency strategy, and failure handling.
