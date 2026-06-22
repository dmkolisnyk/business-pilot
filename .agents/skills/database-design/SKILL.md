# Database Design Skill

Use this skill for PostgreSQL, Prisma schema planning, migrations, indexes, and multi-tenant data modeling.

## Workflow

1. Identify tenant-owned records and add `organization_id` where applicable.
2. Keep normalized tables for analytics and reporting.
3. Store external WooCommerce IDs for idempotent sync.
4. Add indexes for `organization_id`, external IDs, timestamps, and analytics queries.
5. Document major schema decisions in `docs/data-model.md` or a decision record.

## Core Areas

Plan users, organizations, organization members, integrations, WooCommerce connections, sync jobs/logs/cursors, customers, products, orders, order items, refunds, coupons, analytics snapshots, reports, recommendations, segments, email drafts, competitors, and competitor snapshots.

## Rules

- Avoid premature sharding, CQRS, event sourcing, or multiple databases.
- Avoid storing unnecessary PII.
- Encrypt external credentials.

## Output

Return entity definitions, relationships, indexes, constraints, and migration notes.
