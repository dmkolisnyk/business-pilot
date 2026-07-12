---
name: security-review
description: Use to review authentication, authorization, tenant isolation, secrets, WooCommerce credentials, webhooks, CORS, logs, and sensitive data.
---

# Security Review Skill

Use this skill to review authentication, authorization, integrations, secrets, data handling, and tenant isolation.

## Workflow

1. Identify secrets, credentials, PII, and tenant-owned records.
2. Check that records are scoped by `organization_id` where applicable.
3. Verify WooCommerce credentials are encrypted, never logged, and never returned to the frontend.
4. Review input validation, CORS, webhook verification plans, and rate-limiting needs.
5. Document sensitive data flows and unresolved risks.

## Rules

- Do not commit real secrets or customer exports.
- Use `.env.example` for safe placeholders only.
- Never claim security is complete without review.
- Avoid storing unnecessary PII.

## Output

Return findings ordered by severity, affected area, risk, recommendation, and verification steps.
