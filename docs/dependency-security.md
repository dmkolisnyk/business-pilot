# Dependency Security

## Runtime baseline

- Node.js: `24.18.0` LTS
- pnpm: `11.11.0`
- TypeScript: `5.9.3` in every workspace package

Use Corepack and the versions declared by the repository. Do not use npm or Yarn
to install workspace dependencies and do not commit another lockfile.

## Package policy

- Every direct external dependency uses an exact version.
- `latest`, `^`, `~`, and bare major version specifiers are not allowed for direct
  external dependencies.
- `workspace:*` is allowed for private packages that belong to this monorepo.
- OpenAI and Codex npm packages are not allowed unless the user explicitly approves
  a specific package and use case.
- New packages must exist in the configured npm registry and include integrity
  metadata in `pnpm-lock.yaml`.
- Do not add Git, tarball URL, or local file dependencies without explicit review.

## Supply-chain controls

`pnpm-workspace.yaml` enforces:

- a 24-hour minimum release age
- strict peer dependency and Node engine validation
- blocking exotic transitive dependency sources
- publisher trust downgrade detection for recent packages
- exact version saving
- explicit allowlisting of dependency build scripts

The lockfile is part of the trusted source. CI and clean local validation must use:

```bash
pnpm install --frozen-lockfile
```

## Approved dependency build scripts

Only these packages may run dependency build scripts:

- `@prisma/engines`
- `prisma`
- `sharp`
- `unrs-resolver`

Adding another package to `allowBuilds` requires review of the package, version,
publisher, install script, and reason it needs code execution during installation.

## Security overrides

The workspace currently pins patched transitive versions for:

- `@hono/node-server`
- `js-yaml` 3.x
- `nanoid` 3.x
- `postcss`

Do not remove an override merely because a direct dependency was updated. First
run a clean audit and confirm that the patched transitive version is selected
without the override.

## Update workflow

1. Check the package name, repository, publisher, deprecation status, engines,
   peer dependencies, release date, and integrity metadata.
2. Wait for the configured minimum release age unless an urgent security fix is
   explicitly approved.
3. Change one related dependency group at a time.
4. Regenerate `pnpm-lock.yaml` with the pinned pnpm version.
5. Run a frozen-lockfile install from a clean directory.
6. Run `pnpm audit`, lint, typecheck, unit tests, e2e tests, and build.
7. Review the complete manifest and lockfile diff before commit.
