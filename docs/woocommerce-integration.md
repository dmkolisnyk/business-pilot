# WooCommerce Integration

## Integration Goal

Business Pilot starts with WooCommerce as the first ecommerce integration.

The goal is to let a store owner connect their WooCommerce store and allow Business Pilot to import enough data to generate useful analytics, recommendations, customer segments, and email campaign drafts.

## MVP Connection Method

MVP uses WooCommerce REST API keys.

The user provides:

```text
Store URL
Consumer Key
Consumer Secret
```

The backend validates these credentials before saving them.

Future versions may use a Business Pilot WordPress plugin to simplify onboarding and webhook setup.

## Required Access

For MVP, prefer read-only access.

Business Pilot should not modify store data during the first MVP.

Initial required data:

- orders
- order items
- customers
- products
- refunds
- coupons
- order statuses
- payment methods
- billing country
- shipping country
- created date
- paid date
- completed date

## Credential Handling

WooCommerce credentials are sensitive.

Rules:

- never expose Consumer Secret to frontend after submission
- never log Consumer Secret
- encrypt Consumer Key and Consumer Secret before database storage
- decrypt credentials only inside backend integration services or workers
- do not include credentials in job logs
- do not include credentials in error responses
- do not send credentials to AI providers

## Connection Flow

```text
User enters store URL, Consumer Key, Consumer Secret
  ↓
Frontend sends credentials to NestJS API over HTTPS
  ↓
Backend validates URL format
  ↓
Backend validates WooCommerce API access
  ↓
Backend encrypts credentials
  ↓
Backend stores connection
  ↓
Backend creates initial sync job
  ↓
Worker starts initial sync
```

## Store URL Validation

The backend should validate:

- URL is present
- URL uses HTTPS in production
- URL does not contain suspicious local/internal addresses in production
- URL points to a reachable WordPress/WooCommerce site
- WooCommerce REST API is accessible

Local development may allow HTTP for testing.

Production should require HTTPS.

## Initial Sync

Initial sync imports historical store data.

The initial sync should run in a background worker.

Do not run initial sync inside a normal HTTP request.

Initial resources:

```text
orders
customers
products
refunds
coupons
```

Orders should include:

```text
order items
totals
taxes if available
discounts
refunds if available
billing/shipping info
payment method
status
created/paid/completed timestamps
```

## Incremental Sync

Incremental sync updates changed data after the initial sync.

Possible strategies:

1. Scheduled sync.
2. Webhook-based sync.
3. Hybrid scheduled + webhook sync.

MVP can start with scheduled sync.

Recommended future approach:

```text
initial full sync
  ↓
scheduled incremental sync
  ↓
webhooks after core sync is stable
```

## Pagination

WooCommerce stores may have many orders and products.

The sync process must support pagination.

Rules:

- never assume all data fits in one request
- store progress using sync cursors
- handle partial sync failure
- allow retry from the last known safe point
- avoid duplicate records through external IDs and idempotency

## Idempotency

Sync must be idempotent.

Business Pilot should store external WooCommerce IDs.

Recommended uniqueness rules:

```text
organization_id + integration_id + external_customer_id
organization_id + integration_id + external_product_id
organization_id + integration_id + external_order_id
organization_id + integration_id + external_order_item_id
organization_id + integration_id + external_refund_id
organization_id + integration_id + external_coupon_id
```

If the same WooCommerce object is imported again, update the existing record instead of creating a duplicate.

## Error Handling

WooCommerce stores can fail for many reasons:

- slow hosting
- broken plugins
- invalid credentials
- expired/revoked API keys
- rate limits
- malformed data
- missing fields
- network timeouts
- SSL issues
- plugin conflicts
- WordPress REST API disabled

The sync system should track:

- sync status
- current step
- failed resource type
- error message
- retry count
- last successful sync time
- next retry time

Do not expose internal stack traces to the user.

## Sync Statuses

Recommended statuses:

```text
pending
running
completed
failed
cancelled
partial
```

## Webhooks

Webhooks are not required for the first MVP but should be designed for later.

Potential webhook events:

```text
order.created
order.updated
order.deleted
product.created
product.updated
customer.created
customer.updated
```

Webhook rules:

- verify webhook signature
- reject unknown stores
- reject unknown integration IDs
- enqueue jobs instead of processing heavy work inside webhook request
- log webhook processing status
- do not trust webhook payload blindly

## Raw Payload Storage

Business Pilot should mainly store normalized data.

Raw WooCommerce payload can be stored selectively for debugging.

Rules:

- do not store unnecessary sensitive data
- do not send raw payloads to AI by default
- do not use raw payload as the main analytics source
- use normalized tables for analytics

## Future WordPress Plugin

A future Business Pilot WordPress plugin may:

- simplify connection
- create API keys automatically or use an app token
- configure webhooks
- show connection health
- send store metadata
- help with troubleshooting

The plugin is not required for the first MVP.
