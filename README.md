# Business Pilot

Business Pilot is a WooCommerce-first SaaS platform that helps ecommerce store owners understand their business data, identify revenue opportunities, and make better decisions.

The platform is designed to connect to a WooCommerce store, synchronize commerce data, calculate key business metrics, generate AI-assisted recommendations, create customer segments, and prepare retention campaign drafts.

> Business Pilot is currently in the foundation and MVP development stage.

## Product Vision

Many small and medium-sized ecommerce businesses have access to large amounts of store data but lack the time, expertise, or tools needed to turn that data into practical actions.

Business Pilot aims to answer questions such as:

* Which products generate the most revenue?
* Which customers are likely to purchase again?
* Where is revenue being lost?
* Which customer segments should receive a retention campaign?
* What actions could improve sales, repeat purchases, or average order value?
* How does the store compare with its competitors?

The goal is not to build another generic analytics dashboard. Business Pilot should provide clear, explainable, and actionable business recommendations.

## Current Status

The project is currently focused on its technical foundation.

Implemented or configured:

* pnpm monorepo
* Next.js frontend application
* NestJS backend application
* shared TypeScript contracts
* PostgreSQL and Redis local infrastructure
* Prisma 7 integration
* initial multi-tenant database foundation
* Docker Compose configuration
* architecture and product documentation
* Codex agents and reusable project skills

Planned MVP functionality:

* user registration and authentication
* organization and workspace management
* WooCommerce store connection
* encrypted integration credentials
* initial and incremental data synchronization
* ecommerce analytics dashboard
* AI-assisted business reports
* actionable recommendations
* customer segmentation
* email campaign draft generation
* basic competitor tracking

## Core Features

### WooCommerce Integration

Business Pilot will connect to WooCommerce through the REST API using read-only credentials.

The integration is designed to synchronize:

* orders
* order items
* customers
* products
* refunds
* coupons
* payment methods
* order statuses
* billing and shipping locations
* creation, payment, and completion dates

Synchronization will be processed asynchronously through background jobs.

### Ecommerce Analytics

The initial analytics layer will include:

* gross revenue
* net revenue
* order count
* average order value
* refund rate
* repeat customer rate
* top-performing products
* top customers
* inactive customers
* revenue by country
* revenue by payment method

### AI-Assisted Recommendations

Recommendations should be:

* based on available store data
* specific and explainable
* prioritized by business impact
* actionable for a store owner
* transparent about missing or incomplete data

Each recommendation may include:

* finding
* supporting evidence
* estimated business impact
* recommended action
* confidence level
* data limitations

### Customer Retention

Business Pilot will help store owners identify useful customer segments, including:

* inactive customers
* one-time buyers
* repeat buyers
* high-value customers
* customers with refunds
* recent purchasers
* customers who purchased one product but not a related product

The MVP will generate campaign drafts only. Automatic email delivery is outside the initial scope.

## Technology Stack

### Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS

### Backend

* NestJS
* TypeScript
* Prisma 7
* PostgreSQL
* Redis
* BullMQ

### Infrastructure

* Docker
* Docker Compose
* pnpm workspaces
* Cloudflare for DNS and edge protection
* Vercel for frontend deployment
* managed backend, PostgreSQL, and Redis services for production

## Architecture

Business Pilot follows a modular monolith architecture for the MVP.

```text
User
  │
  ▼
Next.js Web Application
  │
  ▼
NestJS API
  │
  ├── PostgreSQL
  │
  └── Redis / BullMQ
          │
          ▼
      Worker Process
          │
          ▼
 WooCommerce REST API
```

Long-running operations such as store synchronization, analytics recalculation, and report generation are handled by background workers instead of normal HTTP requests.

The system is designed as a multi-tenant SaaS application. Tenant-owned business data must be scoped by an organization identifier.

## Repository Structure

```text
business-pilot/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # NestJS backend
├── packages/
│   └── shared/              # Shared TypeScript contracts
├── docs/
│   ├── decisions/           # Architecture decision records
│   ├── architecture.md
│   ├── data-model.md
│   ├── hosting.md
│   ├── services.md
│   └── woocommerce-integration.md
├── .agents/
│   └── skills/              # Reusable Codex skills
├── .codex/
│   └── agents/              # Specialized Codex agents
├── docker-compose.yml
├── pnpm-workspace.yaml
└── AGENTS.md
```

## Requirements

Before running the project locally, install:

* Node.js 24 LTS (`24.18.0` is pinned in `.nvmrc` and `.node-version`)
* pnpm `11.11.0` through Corepack
* Docker Desktop
* Git

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/dmkolisnyk/business-pilot.git
cd business-pilot
```

### 2. Install dependencies

```bash
corepack enable
pnpm install --frozen-lockfile
```

The exact pnpm version is declared in the root `package.json`. Do not install
dependencies with npm or Yarn and do not commit an alternative lockfile.

### 3. Configure environment variables

Copy the example environment files:

```powershell
Copy-Item .env.example .env
Copy-Item apps\api\.env.example apps\api\.env
```

Review the generated files and replace placeholder values where necessary.

Never commit real credentials or secrets.

### 4. Start the complete Docker stack

Optionally copy the Docker environment template:

```powershell
Copy-Item .env.docker.example .env
```

Build and start the frontend, API, PostgreSQL, and Redis:

```bash
pnpm docker:up
```

Check container health:

```bash
pnpm docker:ps
```

Follow logs:

```bash
pnpm docker:logs
```

Run the complete PowerShell smoke test:

```powershell
./scripts/docker/smoke-test.ps1
```

### 5. Host-based development (optional)

The Docker API container generates Prisma Client during image build and applies the current development schema with `prisma db push` during startup. The build uses a non-secret placeholder database URL only because Prisma 7 loads `prisma.config.ts` while generating the client; runtime connections always use the Compose `DATABASE_URL`. For host-based development, generate the client manually.

### 6. Generate the Prisma client

```bash
pnpm --filter ./apps/api prisma:generate
```

### 7. Apply database migrations

```bash
pnpm --filter ./apps/api prisma:migrate -- --name init_foundation
```

### 8. Start the applications on the host

Run the frontend and backend together:

```bash
pnpm dev
```

The services are available at:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:4000
Health:   http://localhost:4000/health
```

## Available Commands

Run all applications:

```bash
pnpm dev
```

Run only the frontend:

```bash
pnpm dev:web
```

Run only the backend:

```bash
pnpm dev:api
```

Build all workspace packages:

```bash
pnpm build
```

Run linting:

```bash
pnpm lint
```

Run tests:

```bash
pnpm test
```

Run TypeScript checks:

```bash
pnpm typecheck
```

Generate the Prisma client:

```bash
pnpm --filter ./apps/api prisma:generate
```

Create or apply a development migration:

```bash
pnpm --filter ./apps/api prisma:migrate -- --name migration_name
```

Open Prisma Studio:

```bash
pnpm --filter ./apps/api prisma:studio
```

Stop local infrastructure:

```bash
docker compose down
```

## Environment Variables

The project uses environment variables for application configuration and secrets.

Important variables include:

```text
NODE_ENV
NEXT_PUBLIC_API_URL
API_PORT
FRONTEND_URL
CORS_ORIGIN
DATABASE_URL
REDIS_URL
JWT_SECRET
APP_ENCRYPTION_KEY
WOOCOMMERCE_WEBHOOK_SECRET
OPENAI_API_KEY
EMAIL_PROVIDER_API_KEY
EMAIL_FROM
```

Safe examples are available in:

```text
.env.example
apps/api/.env.example
```

Do not commit:

* database credentials
* JWT secrets
* encryption keys
* WooCommerce credentials
* AI provider keys
* email provider keys
* production environment files

## Security Principles

Business Pilot handles ecommerce, customer, and integration data.

Core security requirements include:

* encrypting WooCommerce credentials before storage
* never returning stored credentials to the frontend
* never logging decrypted credentials
* isolating tenant data by organization
* validating authorization for every organization-owned resource
* minimizing customer data sent to AI providers
* processing integration work through controlled background jobs
* requiring HTTPS in production
* verifying webhook signatures

Security issues should not be reported through public GitHub issues. See `SECURITY.md` for responsible disclosure instructions.

## Documentation

Technical and product documentation is located in the `docs` directory:

* `docs/architecture.md`
* `docs/services.md`
* `docs/woocommerce-integration.md`
* `docs/data-model.md`
* `docs/hosting.md`

Architecture decisions are recorded in:

```text
docs/decisions/
```

## MVP Scope

The initial MVP focuses on:

1. Authentication
2. Organization setup
3. WooCommerce connection
4. Initial store synchronization
5. Incremental synchronization
6. Analytics dashboard
7. AI-assisted business report
8. Actionable recommendations
9. Customer segments
10. Email campaign drafts
11. Basic competitor tracking

The following are intentionally outside the initial MVP:

* Shopify integration
* Stripe integration
* automatic email sending
* complex marketing automation
* custom BI report builders
* microservices
* Kubernetes
* multi-region infrastructure
* real-time analytics without a validated need

## Roadmap

### Foundation

* [x] Configure pnpm monorepo
* [x] Create Next.js application
* [x] Create NestJS application
* [x] Add shared TypeScript package
* [x] Add PostgreSQL and Redis through Docker Compose
* [x] Configure Prisma 7
* [x] Define initial multi-tenant data model
* [x] Add architecture documentation
* [x] Configure Codex project agents and skills

### Backend Foundation

* [ ] Add configuration validation
* [ ] Add authentication module
* [ ] Add users module
* [ ] Add organizations module
* [ ] Add organization authorization
* [ ] Add integrations module
* [ ] Add synchronization module
* [ ] Add BullMQ workers

### WooCommerce Integration

* [ ] Add credential validation
* [ ] Add encrypted credential storage
* [ ] Add WooCommerce API client
* [ ] Add initial synchronization
* [ ] Add incremental synchronization
* [ ] Add synchronization logs and status
* [ ] Add webhook support

### Product Features

* [ ] Add analytics calculations
* [ ] Add dashboard
* [ ] Add business reports
* [ ] Add AI-assisted recommendations
* [ ] Add customer segments
* [ ] Add email campaign drafts
* [ ] Add competitor tracking

## Codex Agents and Skills

Repository-scoped skills live in `.agents/skills/`, and project-scoped custom subagents live in `.codex/agents/`. Agent concurrency limits are defined in `.codex/config.toml`.

Launch Codex from the repository root and run `/skills` to verify that all repository skills are discovered. See `.agents/README.md` and `.codex/README.md` for the complete lists. Run `pnpm agents:validate` to validate all skill metadata, custom agent definitions, and global agent limits without installing any additional package.

## GitHub Repository and Project

The repository is `dmkolisnyk/business-pilot`. To find or create the `Business Pilot MVP` GitHub Project, link it to the repository, and create the agent workflow fields, run the PowerShell setup script with the official GitHub CLI:

```powershell
./scripts/github/setup-project.ps1
```

See `docs/github-project.md` for prerequisites and behavior.

## Contributing

The project is currently under active development.

Before making changes:

1. Read `AGENTS.md`.
2. Review the relevant documentation in `docs/`.
3. Keep changes focused and small.
4. Do not introduce unnecessary dependencies.
5. Add or update tests for important behavior.
6. Do not commit secrets or local environment files.

## License

This project is licensed under the MIT License.
