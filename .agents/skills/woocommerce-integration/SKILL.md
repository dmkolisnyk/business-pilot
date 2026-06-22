# WooCommerce Integration Skill

Use this skill for WooCommerce connection, credential validation, REST API access, sync planning, and webhook planning.

## Workflow

1. Verify the task is WooCommerce-first and REST API based.
2. Require store URL, Consumer Key, and Consumer Secret for connection flows.
3. Validate credentials before saving them.
4. Keep WooCommerce-specific code isolated from generic integration, analytics, and recommendation logic.
5. Plan initial sync before incremental sync or webhooks.

## Rules

- Prefer read-only access for MVP.
- Encrypt Consumer Key and Consumer Secret before storage.
- Never send secrets to the frontend and never log them.
- Store external WooCommerce IDs for idempotency.
- Handle pagination, retries, slow stores, invalid credentials, partial failures, and changed permissions.

## Output

Document endpoints, service boundaries, sync inputs, error handling, and security notes.
