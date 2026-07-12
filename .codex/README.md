# Business Pilot Codex Agents

Project-scoped custom subagents are defined as standalone TOML files under `.codex/agents/`.

## Available agents

- `product_architect`
- `woocommerce_engineer`
- `backend_engineer`
- `frontend_engineer`
- `database_architect`
- `hosting_planner`
- `security_reviewer`
- `repo_reviewer`

Global project limits are configured in `.codex/config.toml`:

- maximum concurrent threads: 6
- maximum subagent nesting depth: 1
- interrupted agent turns are surfaced to the parent session

Use subagents for parallel planning and review. Do not spawn all agents for routine, isolated code changes.

Validate the complete repository agent configuration:

```bash
pnpm agents:validate
```
