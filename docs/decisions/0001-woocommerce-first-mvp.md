# 0001 - WooCommerce-First MVP

## Status

Accepted

## Context

Business Pilot is an AI/SaaS platform for ecommerce store owners.

The platform needs a first ecommerce integration so it can import store data, analyze business performance, generate recommendations, and create email campaign drafts.

Possible first integrations:

- WooCommerce
- Shopify
- Stripe
- other payment gateways
- marketplaces

## Decision

Business Pilot MVP will start with WooCommerce.

The first integration will use WooCommerce REST API keys:

```text
Store URL
Consumer Key
Consumer Secret
```

A future version may add a Business Pilot WordPress plugin to simplify onboarding and webhook configuration.

## Reasons

WooCommerce is a strong fit for the MVP because:

- it is widely used by small and medium ecommerce stores
- many WooCommerce store owners lack advanced analytics
- a plugin-based future onboarding path is possible
- store owners can provide REST API keys manually in MVP
- WooCommerce gives access to orders, customers, products, refunds, coupons, and payment method data
- it is a good market for an AI business advisor focused on revenue growth

## Consequences

The product will optimize first for WooCommerce data structure and WooCommerce sync problems.

The backend must handle:

- slow stores
- broken plugins
- pagination
- partial sync failures
- revoked API keys
- inconsistent data
- WordPress hosting issues

The platform should not add Shopify, Stripe, or other integrations until the WooCommerce integration proves value.

## MVP Scope

MVP includes:

- WooCommerce connection
- credential validation
- initial data sync
- basic incremental sync
- analytics dashboard
- AI recommendations
- customer segments
- email campaign drafts

MVP excludes:

- Shopify
- Stripe
- marketplaces
- automatic email sending
- complex marketing automation
- advanced BI builder
