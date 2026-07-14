# BP-002: Authentication and organization bootstrap

## Metadata

- Status: completed
- Phase: complete
- Risk: high (authentication, password storage, and tenant bootstrap)
- Owner: backend
- Created: 2026-07-12
- Updated: 2026-07-12
- GitHub repository: `dmkolisnyk/business-pilot`
- GitHub issue: #2
- GitHub Project item: not synchronized
- GitHub Project status: stale; reported closed on `feature/1`
- Authorized implementation branch: `feature/2-authentication-bootstrap`
- Branch verified locally: `feature/2-authentication-bootstrap` on 2026-07-12
- Review agents: database, security, review

## External-state resolution

The GitHub metadata reported for Issue #2 is stale: it says the issue is closed
and associates the work with `feature/1`. On 2026-07-12 the user explicitly
authorized implementation of Issue #2 on the existing local branch
`feature/2-authentication-bootstrap`, instructed the agent not to switch to or
modify `development`, `master`, or `main`, and instructed the agent not to mutate
GitHub or merge a pull request. That direct instruction resolves the known
GitHub/local mismatch for this execution only.

Do not close, reopen, edit, comment on, relabel, or otherwise mutate the GitHub
issue or Project item. Do not create, push, merge, or modify a pull request. Stop
if the local branch is no longer `feature/2-authentication-bootstrap`, if a new
external-state conflict appears after the explicit instruction above, or if the
work would require another branch.

## Goal

Deliver a tested NestJS authentication bootstrap in which a new user can register
with an email and password, the API atomically creates that user's organization
and `owner` membership, the user can log in, bearer authentication protects
`GET /auth/me`, and no password hash or authentication secret is exposed by an
API response or log.

The outcome is measurable when all endpoint contracts and failure cases below
are covered by unit and HTTP E2E tests and every required verification command
passes on `feature/2-authentication-bootstrap`.

## Context

- The backend is a NestJS modular monolith in `apps/api` with a global
  `PrismaModule` and no authentication module yet.
- `User`, `Organization`, and `OrganizationMember` already exist in
  `apps/api/prisma/schema.prisma`.
- `User.email` is unique, `User.passwordHash` is available, an organization has a
  unique slug, and `OrganizationMember` already supports the schema value
  `owner`. The lowercase schema value is the canonical representation of the
  product's OWNER role.
- Registration must use an explicit Prisma transaction so user, organization,
  and membership creation either all commit or all roll back.
- Email uniqueness will be made case-insensitive at the application boundary by
  trimming and lowercasing every registration and login email before persistence
  or lookup. A future database-level case-insensitive constraint is outside this
  task.
- The current dependency set has all required NestJS, Prisma, test, and Node.js
  capabilities. The implementation must use built-in `node:crypto`; it must not
  add an authentication, JWT, validation, or password-hashing package.
- `JWT_SECRET` already exists in `apps/api/.env.example` and Docker configuration.
  The example must not contain a usable secret, and runtime configuration must
  fail closed when the secret is absent or too short.

## Scope

### Backend module and application wiring

- Add one cohesive `auth` NestJS module under `apps/api/src/auth`.
- Keep `AuthController` limited to HTTP input/output mapping and delegate
  registration, login, and principal lookup to services.
- Add explicit DTO/input validation implemented with Nest primitives and local
  code, without a new package.
- Import `AuthModule` from `AppModule`.
- Keep existing `GET /` and `GET /health` behavior public and unchanged.

### Registration

- Implement `POST /auth/register`.
- Normalize and validate the request before hashing or querying.
- Hash the password outside the database transaction so the transaction does not
  remain open during an intentionally expensive cryptographic operation.
- Inside one `PrismaService.$transaction` callback, create exactly one user, one
  organization, and one `OrganizationMember` with role `owner`.
- Generate an organization slug from the organization name plus a random suffix
  so unrelated tenants do not collide. Use a safe `workspace` base when the
  normalized name has no ASCII slug characters.
- Convert a Prisma unique-email race to the declared `409 EMAIL_ALREADY_EXISTS`
  response. Do not return raw Prisma error text.
- Return a bearer access token and safe user/organization projections; never
  return a Prisma model directly.

### Login

- Implement `POST /auth/login`.
- Normalize email identically to registration.
- Compare password hashes with the password service and return one generic
  response for an unknown email, a user without a local password hash, and an
  incorrect password.
- Perform a real scrypt verification against a fixed valid dummy hash when the
  account is missing or has no password hash so obvious lookup timing does not
  reveal account existence.
- Return the same session response shape as registration after valid credentials.

### Bearer authentication and current user

- Implement a reusable Nest guard that reads exactly one
  `Authorization: Bearer <access-token>` credential, verifies it, resolves the
  current database user and memberships, and attaches only a safe authenticated
  principal to the request.
- Implement protected `GET /auth/me` using that guard.
- Treat a missing, malformed, tampered, expired, wrong-issuer, wrong-audience, or
  otherwise invalid token, and a token whose subject no longer resolves to a
  user, as `401 AUTHENTICATION_REQUIRED`.
- Keep registration and login public. Do not install a global guard in this task.

### Tests and documentation-adjacent configuration

- Add focused unit tests for password hashing, token handling, authentication
  service behavior, and guard behavior where it adds coverage beyond E2E tests.
- Add HTTP E2E coverage using a deterministic stateful Prisma test double. The
  E2E suite must not require a developer database or modify persistent data.
- Preserve the existing application E2E test and update only its test environment
  setup if fail-closed JWT configuration requires it.
- Update `apps/api/.env.example` only as needed to leave `JWT_SECRET` blank with a
  clear minimum-strength comment. Never add a real or reusable secret.
- Update this contract and `.agent/status.md` during the implementation loop as
  required by `.agent/README.md`.

## Out of scope

- Frontend registration, login, session storage, or onboarding UI.
- Refresh tokens, cookies, server-side sessions, logout/revocation, password
  reset, email verification, invitations, social login, MFA, or SSO.
- Rate limiting, CAPTCHA, account lockout, breached-password checks, and audit
  event persistence. These remain security follow-up work; generic login errors
  and timing mitigation are still required now.
- Organization switching, invitations, role management, or authorization for
  tenant-owned business resources.
- Embedding an organization ID or role in the access token. Current membership
  must be read from the database so stale token claims cannot grant tenant access.
- A global authentication policy. Root and health endpoints remain public.
- Changes to the Prisma schema, generated Prisma client, migrations, database
  collation, or database extensions.
- New dependencies or changes to `package.json`, `pnpm-lock.yaml`, or
  `pnpm-workspace.yaml`.
- Changes to shared contracts, frontend code, Docker services, cloud services, or
  production configuration/resources.
- GitHub mutations, commits, pushes, pull requests, merges, deployments, or
  production database operations.

## API contracts

All responses use JSON. Authentication responses must set `Cache-Control:
no-store`. Unknown request properties must be rejected or stripped before they
reach a service and must never be persisted.

### `POST /auth/register`

Request body:

```json
{
  "email": "owner@example.com",
  "password": "a-long-registration-passphrase",
  "name": "Store Owner",
  "organizationName": "Example Store"
}
```

Rules:

- `email`: required string; trim; lowercase; maximum 254 characters; reject
  whitespace, missing local/domain portions, and malformed basic email syntax.
- `password`: required string; do not trim, case-fold, normalize, or silently
  truncate; 15 to 128 Unicode code points and at most 512 UTF-8 bytes.
- `name`: optional string; trim; when supplied, 1 to 100 characters.
- `organizationName`: optional string; trim; when supplied, 1 to 100 characters;
  default to `My Workspace` so registration with only email and password fulfills
  the issue contract.

Successful response: `201 Created`.

```json
{
  "accessToken": "<jwt>",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "user": {
    "id": "<user-id>",
    "email": "owner@example.com",
    "name": "Store Owner"
  },
  "organizations": [
    {
      "id": "<organization-id>",
      "name": "Example Store",
      "slug": "example-store-<random-suffix>",
      "role": "owner"
    }
  ]
}
```

The `name` field is `null` when omitted. A successful registration returns
exactly the newly created owner organization in `organizations`.

Failure responses:

- `400 VALIDATION_ERROR` for an invalid body.
- `409 EMAIL_ALREADY_EXISTS` when the normalized email already exists, including
  a concurrent unique-constraint race.

### `POST /auth/login`

Request body:

```json
{
  "email": "owner@example.com",
  "password": "a-long-registration-passphrase"
}
```

The email and password input rules are the same as registration except login must
not disclose which individual rule caused credential rejection after a
well-formed request.

Successful response: `200 OK` with the same session response shape as
registration. `organizations` contains all current memberships in deterministic
creation order and uses safe projections only.

Failure responses:

- `400 VALIDATION_ERROR` for a structurally invalid body.
- `401 INVALID_CREDENTIALS` with the same public message, `Invalid email or
  password`, for an unknown email, missing local password hash, or wrong password.

### `GET /auth/me`

Request header:

```text
Authorization: Bearer <access-token>
```

Successful response: `200 OK`.

```json
{
  "user": {
    "id": "<user-id>",
    "email": "owner@example.com",
    "name": "Store Owner"
  },
  "organizations": [
    {
      "id": "<organization-id>",
      "name": "Example Store",
      "slug": "example-store-<random-suffix>",
      "role": "owner"
    }
  ]
}
```

Failure response:

- `401 AUTHENTICATION_REQUIRED` with public message `Authentication required`
  for every missing or invalid authentication condition.

### Error body shape

Validation response:

```json
{
  "statusCode": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Email is invalid"
    }
  ]
}
```

Non-validation response:

```json
{
  "statusCode": 401,
  "code": "INVALID_CREDENTIALS",
  "message": "Invalid email or password"
}
```

Error arrays must be deterministic so E2E assertions are stable. Internal error
objects, stack traces, password values, password hashes, tokens, and secrets must
not be included.

## Cryptographic and security invariants

The dependency-free approach is approved for this deliberately narrow internal
MVP contract only. Stop for a security decision if interoperability, multiple
issuers/audiences, asymmetric signing, third-party identity, refresh/revocation,
or key rotation is required.

### Password hashes

- Use asynchronous `node:crypto.scrypt`, never a fast digest and never the
  synchronous event-loop-blocking API.
- Use a unique 16-byte cryptographically random salt per password.
- Use `N=32768`, `r=8`, `p=3`, a 32-byte derived key, and an explicit `maxmem` of
  at least 64 MiB. These parameters implement a current OWASP-listed scrypt
  configuration without adding an external package.
- Store a versioned, self-describing ASCII encoding such as
  `scrypt$v1$32768$8$3$<salt-base64url>$<hash-base64url>` in `passwordHash`.
- Strictly parse and bound every stored parameter before invoking scrypt. Invalid
  or unsupported encodings fail authentication without exposing an error.
- Compare equal-length derived keys with `timingSafeEqual` and handle malformed or
  wrong-length input before calling it.
- Never log, serialize, select unnecessarily, or return a plaintext password or
  password hash.

### Access tokens

- Use compact JWT serialization signed with HMAC-SHA-256 from `node:crypto`.
- Accept only the hard-coded `HS256` algorithm and `JWT` type. Never choose an
  algorithm from untrusted header input and never accept `none`.
- Include only `sub` (user ID), `iss`, `aud`, `iat`, and `exp`. Do not put email,
  password state, organization IDs, or roles in the token.
- Use fixed issuer `business-pilot-api`, audience `business-pilot-web`, and a
  3,600-second lifetime. Verify issuer, audience, subject shape, issued-at bounds,
  and expiration on every protected request.
- Require canonical three-segment base64url input, valid JSON objects, a maximum
  token size of 4 KiB, and a 32-byte HMAC signature.
- Compare the supplied and expected signatures as equal-length buffers with
  `timingSafeEqual` before trusting claims.
- Read `JWT_SECRET` only from server environment configuration. Require at least
  32 UTF-8 bytes and fail application initialization when it is missing or weak.
- Do not log tokens or echo rejected authorization headers.
- Use bearer headers only. No cookie is introduced, so cookie/CSRF behavior is
  outside this task.

## Detailed implementation checklist

1. [x] Reconfirm `git branch --show-current` is exactly
       `feature/2-authentication-bootstrap`; inspect `git status --short`; stop
       for overlapping changes.
2. [x] Mark this task and `.agent/status.md` `in_progress` for iteration 1 without
       changing GitHub state.
3. [x] Record the current focused backend lint, typecheck, unit-test, E2E, and
       build baseline before implementation; distinguish pre-existing failures.
4. [x] Add local auth contract types that expose only safe user and organization
       fields and do not reuse generated Prisma model types as API responses.
5. [x] Add registration/login DTOs and deterministic validation/normalization
       pipes with the exact field rules and error shape above.
6. [x] Add a password service implementing versioned asynchronous scrypt hash and
       verification, strict decoding, the fixed dummy hash path, and focused unit
       tests.
7. [x] Add an access-token service implementing fixed HS256 signing and strict
       verification, strong `JWT_SECRET` initialization checks, and focused tests
       for valid, expired, malformed, algorithm-confusion, issuer/audience, and
       tampering cases.
8. [x] Add `AuthService.register` with password hashing outside and user,
       organization, and `owner` membership creation inside one explicit Prisma
       transaction; select a safe response projection; map email conflicts to
       `409`; and cover transaction input/rollback-facing behavior in unit tests.
9. [x] Add `AuthService.login` with normalized lookup, generic invalid-credential
       behavior, dummy verification for missing password accounts, safe membership
       projection, and tests.
10. [x] Add authenticated-principal lookup that reads current memberships from
        Prisma in deterministic order and treats a missing token subject as
        unauthenticated.
11. [x] Add the bearer guard and request-principal plumbing; reject missing,
        multiple, malformed, invalid, and expired credentials uniformly.
12. [x] Add the thin `AuthController` and `AuthModule`; wire the module into
        `AppModule`; leave `/` and `/health` unchanged.
13. [x] Add `Cache-Control: no-store` to register, login, and me responses and
        verify no sensitive fields appear in success or failure bodies.
14. [x] Make the `.env.example` JWT guidance compatible with fail-closed startup
        validation without adding a secret.
15. [x] Add stateful HTTP E2E tests for registration, normalized duplicate email,
        login success, generic login failure, missing/invalid bearer rejection,
        authenticated `/auth/me`, safe projections, and unchanged public root and
        health behavior.
16. [x] Run all focused and repository-wide verification commands exactly as
        listed below. A skipped or failed required command is not a pass.
17. [x] Inspect the complete diff for scope, secrets, generated artifacts, schema,
        manifest, and lockfile drift; update the implementation log and status.
18. [x] Delegate independent reviews in order to database, security, and review;
        address actionable in-scope findings and rerun affected verification.
19. [x] Move the task to `in_review` only after required checks pass and all three
        review verdicts are recorded. Do not commit, push, open, or merge a PR.

## Acceptance criteria

- [x] `POST /auth/register` accepts a valid normalized email and password and
      returns `201` with the declared safe session response.
- [x] Registration with only email and password creates a default-named
      organization; optional user and organization names are validated and used.
- [x] User, organization, and `OrganizationMember(role=owner)` are created inside
      the same explicit Prisma transaction, with no partial writes on failure.
- [x] Stored email is trimmed/lowercased and stored password material is a unique,
      salted, versioned scrypt hash rather than plaintext or a fast digest.
- [x] A duplicate normalized email, including case/whitespace variants and a
      database unique-constraint race, returns `409 EMAIL_ALREADY_EXISTS` and does
      not create another organization or membership.
- [x] `POST /auth/login` returns `200` and a valid one-hour bearer token for valid
      credentials.
- [x] Unknown email, nullable password hash, and wrong password return the same
      `401 INVALID_CREDENTIALS` body and exercise a comparable scrypt path.
- [x] Missing, malformed, tampered, expired, wrong-algorithm, wrong-issuer, and
      wrong-audience tokens cannot access protected endpoints and return the same
      `401 AUTHENTICATION_REQUIRED` body.
- [x] `GET /auth/me` requires authentication and returns the current persisted
      user plus current organization memberships using only safe projections.
- [x] Deleting or failing to resolve the token subject makes `/auth/me` return
      `401`; organization roles are not trusted from token claims.
- [x] `GET /` and `GET /health` remain public and retain their existing contracts.
- [x] Validation failures use the declared deterministic `400` shape; internal
      Prisma/crypto errors and sensitive input are not exposed.
- [x] No response or log contains a plaintext password, password hash,
      `JWT_SECRET`, or bearer token.
- [x] Unit tests cover the cryptographic boundaries and service transaction/error
      behavior; HTTP E2E tests cover the complete required user flows.
- [x] Backend and repository-wide lint, typecheck, unit tests, E2E tests, and build
      all pass on the authorized branch.
- [x] `apps/api/prisma/schema.prisma`, generated Prisma code, package manifests,
      and `pnpm-lock.yaml` remain unchanged.
- [x] Database, security, and final review agents complete independent read-only
      reviews and all accepted in-scope findings are resolved and reverified.
- [x] No GitHub item, commit, remote branch, pull request, protected local branch,
      deployment, production resource, or production data is changed.

## Expected files or areas

Expected implementation changes:

- `apps/api/src/auth/auth.module.ts`
- `apps/api/src/auth/auth.controller.ts`
- `apps/api/src/auth/auth.service.ts`
- `apps/api/src/auth/auth.guard.ts`
- `apps/api/src/auth/auth.types.ts`
- `apps/api/src/auth/dto/`
- `apps/api/src/auth/password.service.ts`
- `apps/api/src/auth/token.service.ts`
- `apps/api/src/auth/**/*.spec.ts`
- `apps/api/src/app.module.ts`
- `apps/api/test/auth.e2e-spec.ts`
- `apps/api/test/app.e2e-spec.ts` only if test-only JWT configuration setup is
  required
- `apps/api/.env.example`
- `.agent/tasks/issue-2-authentication-bootstrap.md`
- `.agent/status.md`

Explicitly unexpected changes:

- `apps/api/prisma/schema.prisma`
- `apps/api/prisma/migrations/`
- `apps/api/src/generated/`
- `apps/api/package.json`
- `package.json`
- `pnpm-lock.yaml`
- `pnpm-workspace.yaml`
- `apps/web/`
- `packages/shared/`

This list guides scope and does not authorize unrelated edits.

## Verification commands

Run from the repository root on the pinned Node.js 24.18.0 and pnpm 11.11.0
toolchain. Capture each result in the implementation log.

### Branch and change-scope checks

```powershell
git branch --show-current
git status --short
git diff --check
git diff -- apps/api .agent/tasks/issue-2-authentication-bootstrap.md .agent/status.md
```

The first command must print exactly `feature/2-authentication-bootstrap`.

### Focused backend checks

```powershell
pnpm --filter ./apps/api lint
pnpm --filter ./apps/api typecheck
pnpm --filter ./apps/api test --runInBand
pnpm --filter ./apps/api test:e2e --runInBand
pnpm --filter ./apps/api build
```

### Required repository baseline

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm build
```

### Forbidden-drift checks

```powershell
git diff --exit-code -- apps/api/prisma/schema.prisma apps/api/package.json package.json pnpm-lock.yaml pnpm-workspace.yaml
git status --short
```

If an unrelated pre-existing change makes an `--exit-code` check fail, compare it
to the pre-implementation status and stop if it overlaps this task. Do not revert
or overwrite user-owned changes.

## Dependencies and data changes

- New dependency required: no
- Package manifest change required: no
- Lockfile regeneration required: no
- Prisma schema change required: no
- Database migration required: no
- Generated Prisma client change required: no
- Runtime data writes: yes; registration creates one user, organization, and owner
  membership atomically
- Destructive data operation required: no
- Public API contract change required: yes; the three new `/auth` endpoints in
  this contract were explicitly authorized by the user's Issue #2 implementation
  request on 2026-07-12
- Environment contract change required: no new variable; existing `JWT_SECRET`
  becomes fail-closed with a documented minimum strength
- Production resource or credential required: no

The existing schema is sufficient. Stop rather than introducing a migration or
dependency. Use of built-in Node cryptography avoids package and lockfile changes;
the security reviewers must still assess the implementation.

## Risks and mitigations

- **Authentication bypass or forged tokens:** hard-code HS256, issuer, audience,
  and lifetime; strictly parse tokens; compare signatures in constant time; cover
  negative cases.
- **Offline password cracking:** use versioned asynchronous scrypt with a unique
  salt and an OWASP-listed work configuration.
- **Event-loop or resource exhaustion:** use async scrypt, validate password size,
  and strictly bound stored scrypt parameters. Rate limiting remains a required
  future hardening task.
- **Account enumeration:** use generic login failures and a dummy scrypt check.
  Registration necessarily reports duplicate email per acceptance criteria.
- **Partial tenant bootstrap:** perform all three creates in one Prisma
  transaction and convert uniqueness races only after rollback.
- **Case-sensitive database uniqueness:** normalize every application write and
  lookup. Direct out-of-band mixed-case inserts remain a documented limitation
  until a separately approved database decision/migration.
- **Stale authorization:** keep organizations and roles out of JWT claims and load
  memberships for each protected request.
- **Secret misuse:** fail initialization for missing/short JWT secrets; keep the
  example blank; never log configuration or authorization headers.
- **Hand-written JWT scope growth:** this implementation is acceptable only for
  the fixed internal access-token contract. Any broader identity requirement is
  a mandatory stop and architecture/security decision.
- **Test fidelity:** HTTP E2E tests use a stateful Prisma double and do not prove
  PostgreSQL behavior. Prisma transaction usage and error mapping require focused
  service tests and database-agent review; a real-database integration suite can
  be proposed separately.

## Loop budget

- Maximum implementation iterations: 5
- Stop after consecutive iterations without measurable progress: 2
- Independent review required: yes
- Required reviewers: database, security, review
- Parallel implementation tasks: none

An iteration has measurable progress only when it completes an unchecked
implementation item, adds a passing acceptance test, resolves a verified defect,
or changes a required verification command from failing to passing without
weakening the check.

## Task-specific stop conditions

Stop in addition to the repository-wide conditions when:

- the current branch differs from `feature/2-authentication-bootstrap`
- implementation would switch to or change `development`, `master`, or `main`
- GitHub mutation, commit, push, pull request, merge, deployment, production
  access, or production data is required
- a dependency, manifest edit, lockfile regeneration, Prisma schema edit,
  generated-client edit, migration, or destructive data operation appears
  necessary
- fixed internal HS256 access tokens no longer meet the required identity model
- password policy, token configuration, tenant ownership, or error disclosure
  becomes ambiguous beyond this contract
- unrelated local changes overlap an expected file and cannot be preserved safely
- a required verification command cannot run or fails after two consecutive
  iterations without measurable progress
- the five-iteration budget is exhausted
- any test or acceptance criterion would need to be weakened or skipped
- new GitHub state after the 2026-07-12 user resolution contradicts this contract

## Readiness checklist

- [x] Unique task ID assigned: BP-002.
- [x] Goal, scope, and out-of-scope are unambiguous.
- [x] Endpoint, response, validation, and error contracts are explicit.
- [x] Authentication and tenant-bootstrap security invariants are explicit.
- [x] Acceptance criteria are measurable.
- [x] Verification commands exist and are runnable on the pinned toolchain.
- [x] Dependency, schema, migration, and data-write impacts are documented.
- [x] Risks, residual limitations, and stop conditions are documented.
- [x] Known GitHub/local metadata disagreement is explicitly resolved by the user
      for this execution.
- [x] Required independent review handoff is defined.
- [x] Status is `ready`.

## Implementation log

Planning does not count as an implementation iteration. Add later iterations in
the same format and do not report a skipped or failed command as passing.

### Iteration 1

- Status: implementation and verification complete; independent reviews pending
- Change made: Added the dependency-free NestJS auth module, deterministic DTO
  validation, async versioned scrypt hashing, strict fixed-HS256 access tokens,
  atomic organization bootstrap, generic login failures, current-membership
  bearer authentication, safe response contracts, environment guidance, unit
  tests, and stateful HTTP E2E tests.
- Measurable progress: All implementation checklist items through diff inspection
  are complete. Focused and repository-wide checks pass, with 37 unit tests and
  5 E2E tests.
- Files changed: `.agent/status.md`,
  `.agent/tasks/issue-2-authentication-bootstrap.md`, `apps/api/.env.example`,
  `apps/api/src/app.module.ts`, `apps/api/src/auth/**`,
  `apps/api/test/app.e2e-spec.ts`, `apps/api/test/auth.e2e-spec.ts`.
- Commands run: pre-change and post-change branch/status checks; focused backend
  lint, typecheck, unit tests, E2E tests, and build; root `pnpm lint`,
  `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`, and `pnpm build`;
  `git diff --check`; forbidden-drift `git diff --exit-code`.
- Results: Branch remains `feature/2-authentication-bootstrap`; pnpm 11.11.0;
  focused and root lint/typecheck/tests/E2E/build passed; 5 unit suites with 37
  tests passed; 2 E2E suites with 5 tests passed; schema, generated client,
  manifests, lockfile, web, and shared package remain unchanged.
- Failed or skipped checks: No command failed or was skipped. The host Node.js is
  22.17.0 rather than the pinned 24.18.0, so the same green suite has not been
  rerun on the exact pinned Node runtime.
- Review findings addressed:
- Remaining blocker or risk:
- Consecutive iterations without progress: 0

### Iteration 2

- Status: review findings resolved; closure reviews pending
- Change made: Added transaction-time `P2002` rollback coverage and strict Prisma
  select behavior in the stateful double; rejected duplicate physical bearer
  headers; applied `no-store` before guard failures; rejected ill-formed Unicode
  passwords; counted optional-name limits by code point; normalized dummy scrypt
  failures to generic credential errors; aligned the Docker environment example;
  and expanded unit/E2E coverage for every accepted review finding.
- Measurable progress: Initial database, security, and final reviews moved from
  identified gaps to implemented fixes with 2 additional unit tests and 1
  additional E2E test; all required commands now pass on the exact pinned
  runtime.
- Files changed: Prior iteration files plus `.env.docker.example`.
- Commands run: Focused backend lint, typecheck, unit tests, E2E tests, and build;
  root lint, typecheck, unit tests, E2E tests, and build; Node/pnpm version checks;
  official Node archive SHA-256 verification; branch/status/diff/forbidden-drift
  checks.
- Results: Official checksum-verified portable Node.js 24.18.0 with pnpm 11.11.0;
  all focused and root commands passed; 5 unit suites with 39 tests and 2 E2E
  suites with 6 tests passed; forbidden schema/generated/manifest/lock drift is
  still absent.
- Failed or skipped checks: none
- Review findings addressed: Database race rollback and select fidelity; physical
  duplicate authorization headers; guard-failure cache headers; ill-formed
  Unicode password collisions; dummy-verification failure normalization; Docker
  secret-example mismatch; code-point name limits; pinned-runtime verification.
- Remaining blocker or risk: none. Production rate limiting, token lifecycle
  hardening, database-level case-insensitive email uniqueness, and
  real-PostgreSQL integration coverage remain documented out-of-scope follow-ups.
- Consecutive iterations without progress: 0

## Review handoff

Reviews are read-only and occur after implementation and required verification.
Reviewers must return actionable findings with file/line evidence, acceptance
criteria impact, and a verdict of `approve`, `approve with follow-up`, or
`changes requested`. Reviewers must not edit files, mutate GitHub, or merge a PR.

### Database review

- Reviewer: database
- Status: complete after one fix/re-review cycle
- Focus: explicit transaction boundary; no partial user/organization/membership
  writes; normalized unique-email races; `owner` membership; safe Prisma selects;
  no schema, migration, generated-client, or cross-tenant drift.
- Verdict: approve
- Findings: Initial review requested deterministic transaction-time `P2002`
  rollback coverage and stricter Prisma select fidelity in the E2E double. Both
  were implemented and the closure review reported no remaining actionable
  finding or database/schema issue.

### Security review

- Reviewer: security
- Status: complete after two fix/re-review cycles
- Focus: scrypt parameters/encoding/bounds; password and token disclosure;
  constant-time comparisons; dummy verification; JWT algorithm, claim, expiry,
  issuer/audience and secret validation; bearer parsing; generic auth failures;
  tenant-membership freshness; negative test coverage.
- Verdict: approve
- Findings: Initial review requested exact physical authorization-header
  cardinality, guard-failure `no-store`, ill-formed Unicode rejection, and
  generic dummy-scrypt failure handling. Closure review found and then verified
  the final trailing-high-surrogate edge fix. Remaining rate limiting, token
  rotation/revocation, and production-secret provisioning are out-of-scope
  hardening follow-ups.

### Final code review

- Reviewer: review
- Status: complete after one fix/re-review cycle
- Focus: complete acceptance-criteria traceability; thin controller/cohesive
  service boundaries; deterministic API contracts; test quality; unchanged public
  endpoints; forbidden drift; all required verification results.
- Verdict: approve
- Findings: Initial review repeated the transaction, physical-header, cache,
  pinned-runtime, Docker example, and code-point name gaps. All were resolved;
  the final reviewer confirmed no actionable findings and reconfirmed approval
  after the trailing-surrogate fix.

### Final implementation handoff

- Summary: Implemented dependency-free NestJS registration, atomic organization
  bootstrap with owner membership, login, strict bearer JWT authentication, and
  protected current-user lookup with safe current memberships.
- Files changed: `.agent/status.md`, this task contract,
  `.env.docker.example`, `apps/api/.env.example`, `apps/api/src/app.module.ts`,
  `apps/api/src/auth/**`, `apps/api/test/app.e2e-spec.ts`, and
  `apps/api/test/auth.e2e-spec.ts`.
- Acceptance criteria result: all criteria passed.
- Focused verification result: lint, typecheck, 39 unit tests, 6 E2E tests, and
  API build passed on Node.js 24.18.0 and pnpm 11.11.0.
- Repository baseline result: root lint, typecheck, unit tests, E2E tests, and
  build passed on Node.js 24.18.0 and pnpm 11.11.0.
- Failed or skipped checks: none.
- Database review verdict: approve.
- Security review verdict: approve.
- Final code review verdict: approve.
- Remaining risks: Rate limiting/account-abuse controls, refresh/revocation/key
  rotation, database-level case-insensitive email uniqueness, and a real
  PostgreSQL integration suite remain future hardening work outside BP-002.
- GitHub/commit/PR/merge/deploy actions taken: none
