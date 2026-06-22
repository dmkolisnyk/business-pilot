# Business Pilot Architecture

## Product Summary

Business Pilot is a WooCommerce-first AI/SaaS platform for ecommerce store owners.

A store owner connects their WooCommerce store so Business Pilot can analyze store data, generate actionable recommendations, help return customers through email campaign drafts, and provide basic competitor insights.

The MVP focuses on WooCommerce only. Future integrations may include Shopify, Stripe, payment gateways, marketplaces, and email platforms.

## MVP Goal

The MVP should prove one core value:

A WooCommerce store owner can connect their store and quickly understand what is happening in the business, where revenue is being lost, and what actions can increase sales.

The MVP should not become a complex marketing automation platform, BI builder, or multi-integration system.

## High-Level Architecture

```text
User Browser
  ↓
Next.js Web App
  ↓
NestJS API
  ↓
PostgreSQL

NestJS API
  ↓
BullMQ Queue / Redis
  ↓
Worker Process
  ↓
WooCommerce REST API
  ↓
PostgreSQL
  ↓
Analytics Engine
  ↓
AI Recommendation Engine
  ↓
Reports / Recommendations / Email Drafts
```

## Applications

### apps/web

Next.js frontend application.

Responsible for:

- authentication screens
- onboarding
- WooCommerce connection flow
- dashboard
- analytics pages
- recommendations pages
- email campaign draft pages
- competitor tracking pages
- settings

### apps/api

NestJS backend application.

Responsible for:

- authentication
- user and organization management
- WooCommerce integration
- background sync orchestration
- analytics calculations
- AI recommendation generation
- email campaign draft generation
- competitor tracking
- API endpoints for frontend

### packages/shared

Shared TypeScript package.

Responsible for:

- shared API response types
- shared enums
- shared DTO-like contracts when useful
- shared constants used by both frontend and backend

This package should not become a dumping ground. Only put code here when both frontend and backend genuinely need it.

## Backend Module Boundaries

Recommended NestJS modules:

```text
auth/
users/
organizations/
integrations/
woocommerce/
sync/
analytics/
recommendations/
email-campaigns/
competitors/
reports/
admin/
```

### auth

Handles registration, login, sessions/JWT, password reset later, and user identity.

### users

Handles user profile and account-level settings.

### organizations

Handles SaaS workspace/company logic.

Every store owner belongs to an organization. Most business data must be scoped by `organization_id`.

### integrations

Common abstraction for external integrations.

MVP integration:

- WooCommerce

Future integrations:

- Shopify
- Stripe
- Klaviyo
- Mailchimp
- marketplaces
- payment gateways

### woocommerce

WooCommerce-specific integration module.

Responsible for:

- store URL validation
- REST API credential validation
- encrypted credential storage
- WooCommerce API client
- WooCommerce sync preparation
- webhook handling later

WooCommerce-specific code must not leak into analytics or recommendations modules.

### sync

Handles background jobs, sync status, sync logs, sync cursors, retries, and idempotency.

Long-running operations must never run inside normal HTTP request/response flow.

### analytics

Calculates ecommerce metrics from normalized database tables.

Initial metrics:

- gross revenue
- net revenue
- order count
- average order value
- refund rate
- repeat customer rate
- top products
- top customers
- inactive customers
- revenue by country
- revenue by payment method

### recommendations

Generates actionable business recommendations from analytics summaries.

AI recommendations must be based on available data and should include evidence, impact, action, confidence, and limitations.

### email-campaigns

Generates customer segments and email campaign drafts.

MVP should generate drafts only. Automatic email sending comes later.

### competitors

Stores competitor URLs and competitor snapshots.

MVP competitor tracking can be basic and manual. Automated crawling/monitoring can come later.

### reports

Stores generated business reports and report history.

## Frontend Areas

Recommended frontend structure:

```text
apps/web/src/app/
  login/
  onboarding/
  dashboard/
  analytics/
  recommendations/
  campaigns/
  competitors/
  settings/
  integrations/
    woocommerce/

apps/web/src/features/
  auth/
  onboarding/
  dashboard/
  analytics/
  recommendations/
  campaigns/
  competitors/
  woocommerce/

apps/web/src/shared/
  api/
  components/
  lib/
  types/
```

Frontend rules:

- keep API client centralized
- include loading states
- include error states
- include empty states
- do not expose secrets to the browser
- keep onboarding simple
- avoid complex state management until necessary

## Main User Flow

1. User creates an account.
2. User creates or joins an organization.
3. User opens onboarding.
4. User enters WooCommerce store URL, Consumer Key, and Consumer Secret.
5. Backend validates credentials.
6. Backend encrypts and stores credentials.
7. Backend creates an initial sync job.
8. Worker imports WooCommerce data.
9. Backend normalizes and stores data in PostgreSQL.
10. Analytics engine calculates metrics.
11. AI engine generates business report and recommendations.
12. User opens dashboard and sees insights.
13. User reviews customer segments and email campaign drafts.
14. User optionally adds competitors for basic tracking.

## Background Job Flow

```text
Frontend
  ↓
POST /integrations/woocommerce/connect
  ↓
NestJS API validates credentials
  ↓
NestJS API creates sync job
  ↓
BullMQ Queue
  ↓
Worker process
  ↓
WooCommerce REST API
  ↓
Normalize data
  ↓
PostgreSQL
  ↓
Analytics recalculation
  ↓
AI report generation
```

## MVP Boundaries

MVP includes:

- authentication
- organization/workspace setup
- WooCommerce connection
- initial data sync
- basic incremental sync
- analytics dashboard
- AI business report
- actionable recommendations
- customer segments
- email campaign drafts
- basic competitor tracking

MVP excludes:

- Shopify integration
- Stripe integration
- automatic email sending
- complex marketing automation builder
- complex BI/report builder
- microservices
- Kubernetes
- real-time analytics unless proven necessary
- advanced competitor crawling
- multi-region infrastructure

## Future Architecture

Future versions may add:

- Shopify integration
- Stripe integration
- email provider integration
- marketplace integrations
- automated campaign sending
- advanced segmentation
- competitor monitoring
- scheduled reports
- richer analytics snapshots
- admin/support tooling
- staging and production environments
- object storage for report exports
- advanced observability

The MVP should stay modular but not distributed. Use a modular monolith first.
