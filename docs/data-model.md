# Business Pilot Data Model

## Database Strategy

Business Pilot uses PostgreSQL as the main database.

Prisma is used for:

- schema definition
- migrations
- type-safe database access
- local development database workflows

The data model must support a multi-tenant SaaS architecture.

Most business data must be scoped by `organization_id`.

## Multi-Tenancy Rule

Business Pilot is a multi-tenant SaaS.

Each store owner belongs to an organization.

Tenant-owned records must include:

```text
organization_id
```

Examples:

- integrations
- WooCommerce connections
- customers
- products
- orders
- order items
- refunds
- coupons
- analytics snapshots
- reports
- recommendations
- email campaign drafts
- competitors

Authorization must ensure that users can only access data for organizations they belong to.

## Identity Tables

### users

Represents a user account.

Possible fields:

```text
id
email
password_hash
name
created_at
updated_at
```

Future fields:

```text
email_verified_at
last_login_at
status
```

### organizations

Represents a business workspace.

Possible fields:

```text
id
name
slug
created_at
updated_at
```

### organization_members

Connects users to organizations.

Possible fields:

```text
id
organization_id
user_id
role
created_at
updated_at
```

Initial roles:

```text
owner
admin
member
```

## Integration Tables

### integrations

Generic external integration record.

Possible fields:

```text
id
organization_id
provider
status
created_at
updated_at
last_connected_at
last_error_at
last_error_message
```

Initial provider:

```text
woocommerce
```

Future providers:

```text
shopify
stripe
klaviyo
mailchimp
```

### woocommerce_connections

WooCommerce-specific connection details.

Possible fields:

```text
id
organization_id
integration_id
store_url
store_name
store_currency
woocommerce_version
wordpress_version
status
created_at
updated_at
last_validated_at
last_sync_at
```

Do not store plain Consumer Key or Consumer Secret here.

### integration_credentials

Stores encrypted credentials.

Possible fields:

```text
id
organization_id
integration_id
encrypted_consumer_key
encrypted_consumer_secret
encryption_version
created_at
updated_at
```

Rules:

- credentials must be encrypted
- credentials must never be returned to frontend
- credentials must never be logged

## Sync Tables

### sync_jobs

Tracks background sync jobs.

Possible fields:

```text
id
organization_id
integration_id
type
status
started_at
finished_at
created_at
updated_at
error_message
retry_count
```

Job types:

```text
initial_sync
incremental_sync
manual_sync
webhook_sync
```

Statuses:

```text
pending
running
completed
failed
cancelled
partial
```

### sync_logs

Stores sync event logs.

Possible fields:

```text
id
organization_id
sync_job_id
level
message
resource_type
external_id
created_at
```

Do not store secrets in sync logs.

### sync_cursors

Stores pagination or incremental sync state.

Possible fields:

```text
id
organization_id
integration_id
resource_type
cursor_value
last_synced_at
created_at
updated_at
```

Resource types:

```text
orders
customers
products
refunds
coupons
```

## Commerce Tables

### customers

Normalized customer table.

Possible fields:

```text
id
organization_id
integration_id
external_customer_id
email
first_name
last_name
country
city
total_spent
orders_count
first_order_at
last_order_at
created_at
updated_at
raw_payload
```

Indexes:

```text
organization_id
organization_id + external_customer_id
organization_id + email
organization_id + last_order_at
```

### products

Normalized product table.

Possible fields:

```text
id
organization_id
integration_id
external_product_id
name
sku
status
price
regular_price
sale_price
currency
created_at
updated_at
raw_payload
```

Indexes:

```text
organization_id
organization_id + external_product_id
organization_id + sku
```

### orders

Normalized order table.

Possible fields:

```text
id
organization_id
integration_id
external_order_id
external_customer_id
customer_id
status
currency
total_amount
subtotal_amount
discount_amount
tax_amount
shipping_amount
refund_amount
payment_method
billing_country
shipping_country
created_at_external
paid_at
completed_at
created_at
updated_at
raw_payload
```

Indexes:

```text
organization_id
organization_id + external_order_id
organization_id + customer_id
organization_id + created_at_external
organization_id + status
```

### order_items

Normalized order item table.

Possible fields:

```text
id
organization_id
order_id
product_id
external_order_item_id
external_product_id
name
sku
quantity
unit_price
total_amount
created_at
updated_at
raw_payload
```

Indexes:

```text
organization_id
organization_id + order_id
organization_id + product_id
organization_id + external_order_item_id
```

### refunds

Normalized refund table.

Possible fields:

```text
id
organization_id
integration_id
order_id
external_refund_id
amount
reason
created_at_external
created_at
updated_at
raw_payload
```

Indexes:

```text
organization_id
organization_id + order_id
organization_id + external_refund_id
organization_id + created_at_external
```

### coupons

Normalized coupon table.

Possible fields:

```text
id
organization_id
integration_id
external_coupon_id
code
discount_type
amount
usage_count
created_at_external
created_at
updated_at
raw_payload
```

Indexes:

```text
organization_id
organization_id + external_coupon_id
organization_id + code
```

## Analytics Tables

### analytics_snapshots

Stores precomputed analytics for dashboards and reports.

Possible fields:

```text
id
organization_id
period_start
period_end
gross_revenue
net_revenue
orders_count
average_order_value
refund_rate
repeat_customer_rate
created_at
updated_at
```

Indexes:

```text
organization_id
organization_id + period_start + period_end
```

### metric_snapshots

Flexible metric storage for future analytics.

Possible fields:

```text
id
organization_id
metric_key
metric_value
period_start
period_end
metadata
created_at
updated_at
```

## AI And Reports Tables

### business_reports

Stores generated business reports.

Possible fields:

```text
id
organization_id
period_start
period_end
status
summary
generated_at
created_at
updated_at
```

### recommendations

Stores generated recommendations.

Possible fields:

```text
id
organization_id
business_report_id
type
title
finding
evidence
business_impact
recommended_action
confidence
data_limitations
status
created_at
updated_at
```

Possible statuses:

```text
new
viewed
accepted
dismissed
completed
```

## Email Retention Tables

### customer_segments

Stores generated customer segments.

Possible fields:

```text
id
organization_id
name
description
criteria
customer_count
created_at
updated_at
```

Example segments:

```text
inactive_customers
one_time_buyers
repeat_buyers
high_value_customers
customers_with_refunds
recent_purchasers
```

### email_campaign_drafts

Stores draft campaigns.

Possible fields:

```text
id
organization_id
segment_id
title
goal
subject
body
offer_suggestion
status
created_at
updated_at
```

Statuses:

```text
draft
reviewed
archived
```

MVP should not send emails automatically.

## Competitor Tables

### competitors

Stores competitor records.

Possible fields:

```text
id
organization_id
name
url
notes
created_at
updated_at
```

### competitor_snapshots

Stores competitor observations.

Possible fields:

```text
id
organization_id
competitor_id
title
description
pricing_notes
offer_notes
positioning_notes
snapshot_data
created_at
updated_at
```

## Sensitive Data Rules

Do not store unnecessary sensitive data.

Do not send raw customer PII to AI providers by default.

Do not log:

- WooCommerce Consumer Secret
- encrypted credentials
- decrypted credentials
- access tokens
- passwords
- full customer payloads unless explicitly sanitized

## Prisma Implementation Notes

Prisma schema should be implemented only after this document is reviewed.

Initial Prisma work should include:

- User
- Organization
- OrganizationMember
- Integration
- WooCommerceConnection
- IntegrationCredential
- SyncJob
- SyncLog
- SyncCursor

Commerce tables can be added immediately after integration skeleton is ready.

Avoid overbuilding analytics tables before real synced data exists.
