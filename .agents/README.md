# Business Pilot Codex Skills

Repository-scoped skills live in `.agents/skills/<skill-name>/SKILL.md`.

Each skill includes YAML frontmatter with a unique `name` and a concise `description`, followed by focused workflow instructions. Codex can select a skill implicitly from its description or explicitly through `/skills` or `$skill-name`.

## Available skills

- `business-pilot-product`
- `woocommerce-integration`
- `ecommerce-analytics`
- `data-sync`
- `database-design`
- `ai-recommendations`
- `email-retention`
- `nestjs-backend`
- `nextjs-frontend`
- `hosting-planning`
- `security-review`
- `repo-review`

## Verification

Launch Codex from the repository root and run:

```text
/skills
```

All twelve skills should be listed. If recent changes are not visible, restart the Codex session.

Validate the complete repository agent configuration:

```bash
pnpm agents:validate
```
