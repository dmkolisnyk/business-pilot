---
name: ai-recommendations
description: Use for AI business reports, recommendation inputs, recommendation quality, evidence, confidence, and data-limitation handling.
---

# AI Recommendations Skill

Use this skill for AI business reports, recommendation generation, prompt inputs, and recommendation quality review.

## Workflow

1. Start from available store data and analytics summaries.
2. Prefer aggregated or anonymized inputs over raw sensitive customer data.
3. Require each recommendation to include finding, evidence, business impact, action, expected result, confidence, and limitations.
4. Rank recommendations by likely business impact and clarity.
5. Flag missing or weak data instead of inventing facts.

## Rules

- Recommendations must be specific, explainable, and actionable.
- Do not provide generic marketing advice.
- Do not send raw sensitive customer data to an AI provider without documented privacy review.
- Keep recommendation generation separate from WooCommerce sync code.

## Output

Return prompt input shape, recommendation schema, quality checks, and privacy notes.
