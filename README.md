# Accounting SaaS

A multi-tenant, double-entry accounting platform built as a monorepo. Designed for small-to-enterprise teams needing role-based access, multi-currency support, and full audit compliance.

## Tech Stack

| Layer          | Technology                        |
|----------------|-----------------------------------|
| Frontend       | Next.js 14 (SSR + SPA)            |
| Backend API    | NestJS + Fastify (REST `/api/v1`) |
| Database       | PostgreSQL 16 via Prisma 6        |
| Cache/Sessions | Redis 7                           |
| Monorepo       | Turborepo + pnpm workspaces       |
| Shared Types   | `packages/shared` (TypeScript)    |

## Project Structure

```
accounting-saas/
├── apps/
│   ├── api/          # NestJS backend (port 3001)
│   └── web/          # Next.js frontend (port 3000)
├── packages/
│   └── shared/       # Shared types, enums, constants
├── docker-compose.yml
└── turbo.json
```

## Prerequisites

- Node.js 20+
- pnpm 9.15+
- Docker & Docker Compose (for local Postgres + Redis)

## Getting Started

**1. Install dependencies**

```bash
pnpm install
```

**2. Start infrastructure**

```bash
docker compose up -d
```

This starts PostgreSQL 16 on port `5432` and Redis 7 on port `6379`.

**3. Configure environment**

```bash
cp .env.example apps/api/.env
cp .env.example apps/web/.env.local
```

Edit both files as needed (JWT secrets, SMTP, etc.).

**4. Run database migrations and seed**

```bash
pnpm prisma:migrate
pnpm prisma:seed
```

The seed creates a Super Admin account using the credentials in your `.env`:

```
SUPER_ADMIN_EMAIL=admin@accounting-saas.local
SUPER_ADMIN_PASSWORD=ChangeMe123!
```

**5. Start development servers**

```bash
pnpm dev
```

- Frontend: http://localhost:3000
- API: http://localhost:3001/api/v1

## Available Scripts

| Command               | Description                              |
|-----------------------|------------------------------------------|
| `pnpm dev`            | Start all apps in dev mode (Turborepo)   |
| `pnpm build`          | Build all apps                           |
| `pnpm lint`           | Lint all packages                        |
| `pnpm format`         | Format all files with Prettier           |
| `pnpm prisma:migrate` | Run Prisma migrations on the API         |
| `pnpm prisma:seed`    | Seed the database                        |
| `pnpm prisma:studio`  | Open Prisma Studio (database GUI)        |
| `pnpm prisma:generate`| Regenerate Prisma client                 |

## Key Features

- **Multi-tenant architecture** — complete data isolation per organization
- **Double-entry accounting** — voucher-based journal entries with approval workflows
- **Chart of accounts** — 4-level hierarchy (Category → Group → Sub-group → Account)
- **Role-based access control** — Owner, Chief Accountant, Accountant + custom roles
- **Multi-currency support** — exchange rates, currency conversion
- **Bank reconciliation** — import statements, auto/manual transaction matching
- **Financial reports** — Trial Balance, Income Statement, Balance Sheet, Statement of Account
- **Fiscal year management** — per-tenant fiscal periods
- **MFA support** — TOTP-based two-factor authentication
- **Audit trail** — full change history for compliance

## User Roles

| Role              | Scope             | Key Permissions                                     |
|-------------------|-------------------|-----------------------------------------------------|
| Super Admin       | Platform-wide     | Manage all tenants, billing, system config          |
| Owner             | Organization-wide | Full access including billing and user management   |
| Chief Accountant  | Accounting-wide   | Approve transactions, manage accountants, reports   |
| Accountant        | Assigned modules  | Create/post transactions, generate reports          |

## Environment Variables

See [`.env.example`](.env.example) for all required variables. Key ones:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/accounting_dev
REDIS_URL=redis://localhost:6379
JWT_SECRET=<random secret>
JWT_REFRESH_SECRET=<random secret>
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

## Deployment

See [`DEPLOYMENT.md`](DEPLOYMENT.md) for full production deployment instructions covering Nginx, PM2, SSL, Docker, CI/CD, backups, and security hardening.

## Architecture (Production)

```
Load Balancer (Nginx)
        │
   Nginx Reverse Proxy (SSL)
   ┌────┴─────┐
Next.js 14   NestJS API
(port 3000)  (port 3001)
                  │
    ┌─────────────┼──────────┐
PostgreSQL 16   Redis 7    SMTP
```
