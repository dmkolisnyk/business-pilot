---
name: ecommerce-analytics
description: Use when defining ecommerce metrics, dashboard calculations, analytics snapshots, reports, or the business actions supported by metrics.
---

# Ecommerce Analytics Skill

Use this skill when defining metrics, dashboards, analytics snapshots, or business reports.

## Workflow

1. Identify the business question the metric answers.
2. List source data needed from WooCommerce.
3. Define the calculation method and limitations.
4. Connect each metric to at least one recommendation or store-owner action.
5. Separate raw sync data from analytics calculations.

## Initial Metrics

Prioritize gross revenue, net revenue, order count, average order value, refund rate, repeat purchase rate, top products, top customers, inactive customers, one-time buyers, and revenue by product, country, or payment method.

## Rules

- Avoid vanity metrics.
- Keep calculations explainable and testable.
- Scope every tenant-owned calculation by `organization_id`.

## Output

Return metric definitions, required data, formulas, caveats, and suggested tests.
