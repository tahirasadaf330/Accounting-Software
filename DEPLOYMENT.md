# Deployment Guide — Accounting SaaS

Production deployment guide for the multi-tenant Accounting SaaS platform.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Server Requirements](#2-server-requirements)
3. [Domain & DNS Setup](#3-domain--dns-setup)
4. [Server Initial Setup](#4-server-initial-setup)
5. [Install Dependencies](#5-install-dependencies)
6. [PostgreSQL Setup](#6-postgresql-setup)
7. [Redis Setup](#7-redis-setup)
8. [Application Deployment](#8-application-deployment)
9. [Environment Configuration](#9-environment-configuration)
10. [Database Migration & Seeding](#10-database-migration--seeding)
11. [Build & Start Services](#11-build--start-services)
12. [Nginx Reverse Proxy & SSL](#12-nginx-reverse-proxy--ssl)
13. [Process Management (PM2)](#13-process-management-pm2)
14. [Docker Deployment (Alternative)](#14-docker-deployment-alternative)
15. [CI/CD Pipeline](#15-cicd-pipeline)
16. [Backup Strategy](#16-backup-strategy)
17. [Monitoring & Logging](#17-monitoring--logging)
18. [Security Hardening](#18-security-hardening)
    - [18.4 Internal API — Preventing Public Exposure](#184-internal-api--preventing-public-exposure)
19. [Maintenance & Updates](#19-maintenance--updates)
20. [Troubleshooting](#20-troubleshooting)

---

## 1. Architecture Overview

```
                    ┌─────────────────────────────────┐
                    │          Load Balancer           │
                    │     (Nginx / Cloud LB)           │
                    └──────────┬──────────────────────┘
                               │
                    ┌──────────▼──────────────────────┐
                    │        Nginx Reverse Proxy       │
                    │    SSL Termination (Let's Encrypt)│
                    └──────┬──────────────┬───────────┘
                           │              │
               ┌───────────▼───┐   ┌──────▼──────────┐
               │   Next.js 14  │   │   NestJS API    │
               │  Frontend App │   │   (Fastify)     │
               │  Port: 3000   │   │   Port: 3001    │
               └───────────────┘   └──────┬──────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                  ┌───────▼──────┐ ┌──────▼──────┐ ┌─────▼──────┐
                  │ PostgreSQL 16│ │   Redis 7   │ │   SMTP     │
                  │  Port: 5432  │ │  Port: 6379 │ │  Service   │
                  └──────────────┘ └─────────────┘ └────────────┘
```

| Component         | Technology        | Purpose                          |
|-------------------|-------------------|----------------------------------|
| Frontend          | Next.js 14        | Web application (SSR + SPA)      |
| Backend API       | NestJS + Fastify  | REST API (`/api/v1`)             |
| Database          | PostgreSQL 16     | Primary data store               |
| Cache             | Redis 7           | Session store, caching           |
| ORM               | Prisma 6          | Database access & migrations     |
| Reverse Proxy     | Nginx             | SSL termination, load balancing  |
| Process Manager   | PM2               | Process supervision & clustering |
| Package Manager   | pnpm 9.15         | Monorepo dependency management   |
| Build System      | Turborepo         | Monorepo build orchestration     |

---

## 2. Server Requirements

### Minimum (Small Team / Startup)

| Resource | Specification          |
|----------|------------------------|
| CPU      | 2 vCPUs                |
| RAM      | 4 GB                   |
| Storage  | 40 GB SSD              |
| OS       | Ubuntu 22.04/24.04 LTS |
| Network  | 1 Gbps                 |

### Recommended (Production / 50+ Users)

| Resource | Specification          |
|----------|------------------------|
| CPU      | 4+ vCPUs               |
| RAM      | 8–16 GB                |
| Storage  | 100 GB SSD (NVMe)      |
| OS       | Ubuntu 22.04/24.04 LTS |
| Network  | 1 Gbps                 |

### Cloud Provider Options

- **AWS:** EC2 (t3.medium+) or ECS/Fargate
- **DigitalOcean:** Droplet (4 GB+) or App Platform
- **Hetzner:** CX31+ (great price/performance)
- **Linode/Akamai:** Dedicated 4 GB+
- **Azure:** B2s+ VM or Azure App Service
- **GCP:** e2-medium+ or Cloud Run

---

## 3. Domain & DNS Setup

### DNS Records

Configure the following DNS records at your registrar:

```
Type    Name              Value                   TTL
A       yourdomain.com    <SERVER_IP>             300
A       www               <SERVER_IP>             300
A       api               <SERVER_IP>             300
```

**Option A — Single Domain (Recommended):**
```
https://yourdomain.com        → Frontend (Next.js)
https://yourdomain.com/api/   → Backend API (proxied)
```

**Option B — Subdomain Split:**
```
https://app.yourdomain.com    → Frontend
https://api.yourdomain.com    → Backend API
```

---

## 4. Server Initial Setup

### 4.1 Connect to Server

```bash
ssh root@<SERVER_IP>
```

### 4.2 Create Deploy User

```bash
# Create a non-root user for deployment
adduser deploy
usermod -aG sudo deploy

# Set up SSH key authentication
mkdir -p /home/deploy/.ssh
cp ~/.ssh/authorized_keys /home/deploy/.ssh/
chown -R deploy:deploy /home/deploy/.ssh
chmod 700 /home/deploy/.ssh
chmod 600 /home/deploy/.ssh/authorized_keys
```

### 4.3 Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
ufw status
```

### 4.4 System Updates

```bash
apt update && apt upgrade -y
apt install -y curl git build-essential software-properties-common
```

### 4.5 Set Timezone

```bash
timedatectl set-timezone UTC
```

### 4.6 Configure Swap (if RAM < 4 GB)

```bash
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

---

## 5. Install Dependencies

### 5.1 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
apt install -y nodejs
node -v  # Should show v20.x
```

### 5.2 pnpm

```bash
npm install -g pnpm@9.15.4
pnpm -v
```

### 5.3 PM2 (Process Manager)

```bash
npm install -g pm2
pm2 startup systemd
```

### 5.4 Nginx

```bash
apt install -y nginx
systemctl enable nginx
systemctl start nginx
```

### 5.5 Certbot (SSL)

```bash
apt install -y certbot python3-certbot-nginx
```

---

## 6. PostgreSQL Setup

### 6.1 Install PostgreSQL 16

```bash
# Add PostgreSQL APT repository
sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg
apt update
apt install -y postgresql-16 postgresql-client-16
```

### 6.2 Create Database & User

```bash
sudo -u postgres psql
```

```sql
-- Create production user (use a strong password)
CREATE USER accounting_user WITH PASSWORD 'YOUR_STRONG_PASSWORD_HERE';

-- Create production database
CREATE DATABASE accounting_prod OWNER accounting_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE accounting_prod TO accounting_user;

-- Enable UUID extension
\c accounting_prod
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

\q
```

### 6.3 Configure PostgreSQL for Production

Edit `/etc/postgresql/16/main/postgresql.conf`:

```ini
# Connection Settings
listen_addresses = 'localhost'          # Only local connections
max_connections = 100

# Memory (adjust based on server RAM)
shared_buffers = 1GB                    # 25% of RAM
effective_cache_size = 3GB              # 75% of RAM
work_mem = 16MB
maintenance_work_mem = 256MB

# WAL & Checkpoints
wal_buffers = 64MB
checkpoint_completion_target = 0.9
max_wal_size = 2GB

# Query Planner
random_page_cost = 1.1                  # For SSD storage
effective_io_concurrency = 200          # For SSD storage

# Logging
log_min_duration_statement = 1000       # Log slow queries (>1s)
log_line_prefix = '%m [%p] %q%u@%d '
```

Edit `/etc/postgresql/16/main/pg_hba.conf`:

```
# Only allow local connections with password
local   all   accounting_user   scram-sha-256
host    all   accounting_user   127.0.0.1/32   scram-sha-256
```

Restart PostgreSQL:

```bash
systemctl restart postgresql
```

---

## 7. Redis Setup

### 7.1 Install Redis 7

```bash
curl -fsSL https://packages.redis.io/gpg | gpg --dearmor -o /usr/share/keyrings/redis-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/redis-archive-keyring.gpg] https://packages.redis.io/deb $(lsb_release -cs) main" | tee /etc/apt/sources.list.d/redis.list
apt update
apt install -y redis-server
```

### 7.2 Configure Redis for Production

Edit `/etc/redis/redis.conf`:

```ini
bind 127.0.0.1
port 6379
requirepass YOUR_REDIS_PASSWORD_HERE

# Memory Management
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence
save 900 1
save 300 10
save 60 10000

# Security
protected-mode yes
```

```bash
systemctl restart redis-server
systemctl enable redis-server
```

---

## 8. Application Deployment

### 8.1 Create Directory Structure

```bash
# Switch to deploy user
su - deploy

# Create application directories
mkdir -p /home/deploy/accounting-saas
mkdir -p /home/deploy/backups
mkdir -p /home/deploy/logs
```

### 8.2 Clone Repository

```bash
cd /home/deploy/accounting-saas
git clone <YOUR_REPO_URL> .

# Or if using SSH
git clone git@github.com:<org>/accounting-saas.git .
```

### 8.3 Install Dependencies

```bash
cd /home/deploy/accounting-saas
pnpm install --frozen-lockfile
```

---

## 9. Environment Configuration

### 9.1 Create Production `.env`

```bash
cp .env.example .env
nano .env
```

### 9.2 Production Environment Variables

```env
# ============================================
# PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================

# --- Node ---
NODE_ENV="production"

# --- Database ---
DATABASE_URL="postgresql://accounting_user:YOUR_STRONG_PASSWORD_HERE@localhost:5432/accounting_prod?schema=public"

# --- Redis ---
REDIS_URL="redis://:YOUR_REDIS_PASSWORD_HERE@localhost:6379"

# --- JWT (Generate unique secrets!) ---
JWT_SECRET="<GENERATE: openssl rand -base64 64>"
JWT_REFRESH_SECRET="<GENERATE: openssl rand -base64 64>"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# --- Ports ---
API_PORT=3001
WEB_PORT=3000

# --- MFA ---
MFA_APP_NAME="YourCompanyName"

# --- SMTP (Use production email service) ---
SMTP_HOST="smtp.your-email-provider.com"
SMTP_PORT=587
SMTP_USER="your-smtp-username"
SMTP_PASS="your-smtp-password"
SMTP_FROM="Your Company <noreply@yourdomain.com>"

# --- App URL (your production domain) ---
APP_URL="https://yourdomain.com"

# --- Super Admin ---
SUPER_ADMIN_EMAIL="admin@yourdomain.com"
SUPER_ADMIN_PASSWORD="<USE_A_VERY_STRONG_PASSWORD>"
```

### 9.3 Generate JWT Secrets

```bash
# Run these commands and paste output into .env
echo "JWT_SECRET: $(openssl rand -base64 64 | tr -d '\n')"
echo "JWT_REFRESH_SECRET: $(openssl rand -base64 64 | tr -d '\n')"
```

### 9.4 Secure the `.env` File

```bash
chmod 600 /home/deploy/accounting-saas/.env
```

---

## 10. Database Migration & Seeding

### 10.1 Generate Prisma Client

```bash
cd /home/deploy/accounting-saas
pnpm prisma:generate
```

### 10.2 Run Migrations

```bash
# Deploy migrations to production (non-interactive)
cd apps/api
npx prisma migrate deploy
```

> **Important:** Use `prisma migrate deploy` (not `prisma migrate dev`) in production. This only applies existing migrations without creating new ones.

### 10.3 Seed Initial Data

```bash
cd /home/deploy/accounting-saas
pnpm prisma:seed
```

This seeds:
- 15 currencies (USD, EUR, GBP, PKR, etc.)
- Super Admin account
- Demo tenant with demo users
- Chart of accounts templates

### 10.4 Verify Database

```bash
cd apps/api
npx prisma studio
# Opens Prisma Studio on port 5555 — use only for verification, then close
```

---

## 11. Build & Start Services

### 11.1 Build All Applications

```bash
cd /home/deploy/accounting-saas
pnpm build
```

This runs Turborepo and builds:
1. `packages/shared` — Shared types & enums
2. `apps/api` — NestJS backend → `apps/api/dist/`
3. `apps/web` — Next.js frontend → `apps/web/.next/`

### 11.2 Verify Builds

```bash
# Check API build
ls apps/api/dist/main.js

# Check Web build
ls apps/web/.next/BUILD_ID
```

### 11.3 Test Services Manually

```bash
# Test API
cd apps/api && node dist/main.js
# Should show: "Application is running on: http://0.0.0.0:3001"
# Ctrl+C to stop

# Test Frontend
cd apps/web && pnpm start
# Should show: "Ready on http://localhost:3000"
# Ctrl+C to stop
```

---

## 12. Nginx Reverse Proxy & SSL

### 12.1 Create Nginx Configuration

Create `/etc/nginx/sites-available/accounting-saas`:

```nginx
# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL certificates (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml;

    # Client max body size (for file uploads)
    client_max_body_size 20M;

    # API Backend
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90s;
        proxy_send_timeout 90s;
    }

    # Frontend (Next.js)
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Next.js Static Assets (caching)
    location /_next/static/ {
        proxy_pass http://127.0.0.1:3000;
        expires 365d;
        add_header Cache-Control "public, immutable";
    }

    # Favicon & Static Files
    location /favicon.ico {
        proxy_pass http://127.0.0.1:3000;
        expires 30d;
    }
}
```

### 12.2 Enable Site

```bash
ln -s /etc/nginx/sites-available/accounting-saas /etc/nginx/sites-enabled/
rm /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
```

### 12.3 Obtain SSL Certificate

```bash
certbot --nginx -d yourdomain.com -d www.yourdomain.com --non-interactive --agree-tos -m admin@yourdomain.com
```

### 12.4 Auto-Renew SSL

```bash
# Test renewal
certbot renew --dry-run

# Certbot automatically adds a cron job / systemd timer for renewal
systemctl status certbot.timer
```

---

## 13. Process Management (PM2)

### 13.1 Create PM2 Ecosystem File

Create `/home/deploy/accounting-saas/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'accounting-api',
      cwd: './apps/api',
      script: 'dist/main.js',
      instances: 'max',          // Use all CPU cores
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      max_memory_restart: '1G',
      error_file: '/home/deploy/logs/api-error.log',
      out_file: '/home/deploy/logs/api-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
    {
      name: 'accounting-web',
      cwd: './apps/web',
      script: 'node_modules/.bin/next',
      args: 'start --port 3000',
      instances: 1,              // Next.js handles its own clustering
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      max_memory_restart: '1G',
      error_file: '/home/deploy/logs/web-error.log',
      out_file: '/home/deploy/logs/web-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      watch: false,
      max_restarts: 10,
      restart_delay: 5000,
    },
  ],
};
```

### 13.2 Start Services

```bash
cd /home/deploy/accounting-saas
pm2 start ecosystem.config.js
pm2 save
```

### 13.3 PM2 Commands

```bash
pm2 status                     # View all processes
pm2 logs                       # View all logs
pm2 logs accounting-api        # View API logs
pm2 logs accounting-web        # View frontend logs
pm2 restart all                # Restart all
pm2 reload accounting-api      # Zero-downtime reload (cluster mode)
pm2 stop all                   # Stop all
pm2 monit                      # Real-time monitoring dashboard
```

---

## 14. Docker Deployment (Alternative)

If you prefer Docker-based deployment, use the following setup.

### 14.1 API Dockerfile

Create `apps/api/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.4

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/api/node_modules ./apps/api/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @accounting-saas/shared build
RUN cd apps/api && npx prisma generate
RUN pnpm --filter api build

# --- Production ---
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nestjs
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/node_modules ./node_modules
COPY --from=builder /app/apps/api/prisma ./prisma
COPY --from=builder /app/apps/api/package.json ./
USER nestjs
EXPOSE 3001
CMD ["node", "dist/main.js"]
```

### 14.2 Web Dockerfile

Create `apps/web/Dockerfile`:

```dockerfile
FROM node:20-alpine AS base
RUN npm install -g pnpm@9.15.4

# --- Dependencies ---
FROM base AS deps
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/
COPY packages/shared/package.json packages/shared/
RUN pnpm install --frozen-lockfile --prod=false

# --- Build ---
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY --from=deps /app/packages/shared/node_modules ./packages/shared/node_modules
COPY . .
RUN pnpm --filter @accounting-saas/shared build
RUN pnpm --filter web build

# --- Production ---
FROM node:20-alpine AS runner
WORKDIR /app
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
COPY --from=builder /app/apps/web/.next/standalone ./
COPY --from=builder /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder /app/apps/web/public ./apps/web/public
USER nextjs
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
```

### 14.3 Production Docker Compose

Create `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    restart: always
    environment:
      POSTGRES_USER: accounting_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: accounting_prod
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - '127.0.0.1:5432:5432'
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U accounting_user -d accounting_prod']
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - '127.0.0.1:6379:6379'
    healthcheck:
      test: ['CMD', 'redis-cli', '-a', '${REDIS_PASSWORD}', 'ping']
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build:
      context: .
      dockerfile: apps/api/Dockerfile
    restart: always
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://accounting_user:${DB_PASSWORD}@postgres:5432/accounting_prod?schema=public
      REDIS_URL: redis://:${REDIS_PASSWORD}@redis:6379
      JWT_SECRET: ${JWT_SECRET}
      JWT_REFRESH_SECRET: ${JWT_REFRESH_SECRET}
      JWT_EXPIRATION: 15m
      JWT_REFRESH_EXPIRATION: 7d
      API_PORT: 3001
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      SMTP_FROM: ${SMTP_FROM}
      APP_URL: ${APP_URL}
      MFA_APP_NAME: ${MFA_APP_NAME}
      SUPER_ADMIN_EMAIL: ${SUPER_ADMIN_EMAIL}
      SUPER_ADMIN_PASSWORD: ${SUPER_ADMIN_PASSWORD}
    ports:
      - '127.0.0.1:3001:3001'

  web:
    build:
      context: .
      dockerfile: apps/web/Dockerfile
    restart: always
    depends_on:
      - api
    environment:
      NODE_ENV: production
    ports:
      - '127.0.0.1:3000:3000'

  nginx:
    image: nginx:alpine
    restart: always
    depends_on:
      - api
      - web
    ports:
      - '80:80'
      - '443:443'
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf
      - /etc/letsencrypt:/etc/letsencrypt:ro
    healthcheck:
      test: ['CMD', 'wget', '--spider', '-q', 'http://localhost/health']
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  postgres_data:
  redis_data:
```

### 14.4 Docker Deployment Commands

```bash
# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Run migrations
docker compose -f docker-compose.prod.yml exec api npx prisma migrate deploy

# Seed database
docker compose -f docker-compose.prod.yml exec api npx prisma db seed

# View logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web

# Restart services
docker compose -f docker-compose.prod.yml restart

# Stop everything
docker compose -f docker-compose.prod.yml down
```

---

## 15. CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

env:
  SERVER_HOST: ${{ secrets.SERVER_HOST }}
  SERVER_USER: deploy
  APP_DIR: /home/deploy/accounting-saas

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: test_user
          POSTGRES_PASSWORD: test_pass
          POSTGRES_DB: accounting_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
      redis:
        image: redis:7-alpine
        ports:
          - 6379:6379

    steps:
      - uses: actions/checkout@v4

      - uses: pnpm/action-setup@v4
        with:
          version: 9.15.4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - run: pnpm install --frozen-lockfile
      - run: pnpm prisma:generate
      - run: pnpm build
      - run: pnpm --filter api test
        env:
          DATABASE_URL: postgresql://test_user:test_pass@localhost:5432/accounting_test?schema=public
          REDIS_URL: redis://localhost:6379

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: deploy
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd ${{ env.APP_DIR }}
            git pull origin main
            pnpm install --frozen-lockfile
            pnpm prisma:generate
            cd apps/api && npx prisma migrate deploy && cd ../..
            pnpm build
            pm2 reload ecosystem.config.js
            echo "Deployment complete: $(date)"
```

### Required GitHub Secrets

| Secret            | Description                          |
|-------------------|--------------------------------------|
| `SERVER_HOST`     | Server IP or hostname                |
| `SSH_PRIVATE_KEY` | SSH key for `deploy` user            |

---

## 16. Backup Strategy

### 16.1 Database Backup Script

Create `/home/deploy/scripts/backup-db.sh`:

```bash
#!/bin/bash
set -euo pipefail

# Configuration
BACKUP_DIR="/home/deploy/backups"
DB_NAME="accounting_prod"
DB_USER="accounting_user"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="${BACKUP_DIR}/db_${DB_NAME}_${DATE}.sql.gz"

# Create backup
echo "[$(date)] Starting database backup..."
PGPASSWORD="${DB_PASSWORD}" pg_dump \
  -h localhost \
  -U "${DB_USER}" \
  -d "${DB_NAME}" \
  --format=custom \
  --compress=9 \
  --verbose \
  -f "${BACKUP_FILE}"

echo "[$(date)] Backup created: ${BACKUP_FILE} ($(du -h ${BACKUP_FILE} | cut -f1))"

# Remove old backups
find "${BACKUP_DIR}" -name "db_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
echo "[$(date)] Cleaned backups older than ${RETENTION_DAYS} days"

# Optional: Upload to S3 / remote storage
# aws s3 cp "${BACKUP_FILE}" s3://your-bucket/backups/
```

```bash
chmod +x /home/deploy/scripts/backup-db.sh
```

### 16.2 Schedule Automated Backups

```bash
crontab -e
```

```cron
# Daily database backup at 2:00 AM
0 2 * * * /home/deploy/scripts/backup-db.sh >> /home/deploy/logs/backup.log 2>&1

# Weekly full backup (Sunday 3:00 AM)
0 3 * * 0 /home/deploy/scripts/backup-db.sh >> /home/deploy/logs/backup-weekly.log 2>&1
```

### 16.3 Restore from Backup

```bash
# Restore a backup
pg_restore -h localhost -U accounting_user -d accounting_prod --clean --if-exists backup_file.sql.gz
```

---

## 17. Monitoring & Logging

### 17.1 PM2 Monitoring

```bash
# Real-time monitoring
pm2 monit

# Process list with metrics
pm2 status

# Memory & CPU usage
pm2 describe accounting-api
```

### 17.2 Log Rotation

Create `/etc/logrotate.d/accounting-saas`:

```
/home/deploy/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 0640 deploy deploy
    sharedscripts
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 17.3 Health Check Endpoint

The API includes a health endpoint. Verify with:

```bash
curl -s http://localhost:3001/api/v1/health | jq .
```

### 17.4 Server Monitoring (Optional)

For comprehensive monitoring, consider:

| Tool       | Purpose                   | Notes                    |
|------------|---------------------------|--------------------------|
| **htop**   | System resources          | `apt install htop`       |
| **Netdata**| Real-time server metrics  | Free, lightweight        |
| **UptimeRobot** | Uptime monitoring    | Free tier available      |
| **Sentry** | Error tracking            | Free tier for small apps |
| **Grafana + Prometheus** | Full observability | For larger deployments |

---

## 18. Security Hardening

### 18.1 SSH Hardening

Edit `/etc/ssh/sshd_config`:

```
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
AllowUsers deploy
```

```bash
systemctl restart sshd
```

### 18.2 Fail2Ban

```bash
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log

[nginx-limit-req]
enabled = true
port = http,https
filter = nginx-limit-req
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl start fail2ban
```

### 18.3 Nginx Rate Limiting

Add to `/etc/nginx/nginx.conf` (inside `http` block):

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
```

Add to API location block:

```nginx
location /api/v1/auth/login {
    limit_req zone=login burst=3 nodelay;
    proxy_pass http://127.0.0.1:3001;
    # ... other proxy settings
}

location /api/ {
    limit_req zone=api burst=50 nodelay;
    proxy_pass http://127.0.0.1:3001;
    # ... other proxy settings
}
```

### 18.4 Internal API — Preventing Public Exposure

The NestJS API should **never** be directly accessible from the public internet. All API traffic should be routed through the frontend (Next.js) or the reverse proxy with strict access controls.

#### Why Keep the API Private?

- Reduces attack surface — no direct brute-force on auth endpoints from the internet
- Prevents API enumeration and scraping
- Swagger/API docs (`/api/docs`) stay internal
- All requests are funneled through a single entry point with centralized rate limiting and logging

#### Strategy A — Single Domain, No API Subdomain (Recommended)

Use **Option A** from [Section 3](#3-domain--dns-setup). The API lives behind `/api/` on the same domain, proxied by Nginx. There is **no public DNS record** for `api.yourdomain.com`.

```
DNS:   yourdomain.com  →  A record → <SERVER_IP>
       (NO api.yourdomain.com record)

Flow:  Browser → https://yourdomain.com/api/* → Nginx → 127.0.0.1:3001
```

The API port (3001) only listens on `127.0.0.1` (localhost). The firewall (`ufw`) only allows ports 22, 80, and 443 — port 3001 is never exposed.

This is the simplest and most secure approach. Skip to the [Security Checklist](#185-security-checklist) if using this strategy.

#### Strategy B — API Subdomain, Restricted Access

If you need `api.yourdomain.com` for internal tooling, CI/CD webhooks, or mobile app communication, restrict it so it is **not open to the public**.

**Option 1 — Nginx IP Allowlist**

Create `/etc/nginx/sites-available/api-internal`:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name api.yourdomain.com;

    # SSL (managed by Certbot)
    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # --- ACCESS CONTROL ---
    # Allow only the server itself (frontend → API)
    allow 127.0.0.1;
    allow ::1;

    # Allow your office / VPN IP(s)
    allow <YOUR_OFFICE_IP>/32;
    # allow <VPN_CIDR>;

    # Block everything else
    deny all;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/api-internal /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

**Option 2 — Cloudflare Access (Zero Trust)**

If using Cloudflare as your DNS/CDN provider:

1. Proxy `api.yourdomain.com` through Cloudflare (orange cloud ON)
2. Go to **Cloudflare Zero Trust → Access → Applications**
3. Create an application for `api.yourdomain.com`
4. Set policy: **Allow** only specific emails, IP ranges, or service tokens
5. CI/CD and mobile apps authenticate via **Cloudflare Service Tokens** (sent as `CF-Access-Client-Id` / `CF-Access-Client-Secret` headers)

This gives you SSO-protected API access without exposing anything publicly.

**Option 3 — Firewall-Level Block with Service Token Bypass**

If you only need the API subdomain for server-to-server calls (e.g., mobile apps, webhooks):

```bash
# Block all direct access to API port from outside
ufw deny 3001

# API is only reachable via Nginx on 443
# Nginx validates a secret header before proxying
```

Add a secret header check in the Nginx API subdomain config:

```nginx
location / {
    # Reject requests without the internal service token
    if ($http_x_internal_token != "YOUR_SECRET_SERVICE_TOKEN") {
        return 403;
    }

    proxy_pass http://127.0.0.1:3001;
    # ... proxy settings
}
```

Your frontend Next.js app (server-side) or mobile app passes this header:
```
X-Internal-Token: YOUR_SECRET_SERVICE_TOKEN
```

#### Strategy C — Next.js API Route Proxy (Defense in Depth)

For maximum isolation, make the browser **never** talk to the API directly. Instead, Next.js server-side routes act as a proxy:

```
Browser → Next.js (port 3000) → API (port 3001, localhost only)
```

In `apps/web/next.config.mjs`, configure rewrites:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:3001/api/:path*',
      },
    ];
  },
};
```

With this approach, remove the `/api/` proxy block from the main Nginx config entirely — Nginx only talks to Next.js, and Next.js talks to the API internally.

#### Verifying API is Not Publicly Accessible

After setup, verify from an **external machine** (not the server):

```bash
# These should all FAIL or return 403 from outside
curl -v https://api.yourdomain.com/api/v1/health    # Should fail (no DNS / 403)
curl -v http://<SERVER_IP>:3001/api/v1/health        # Should fail (port blocked)

# This should SUCCEED (API accessed through frontend proxy)
curl -v https://yourdomain.com/api/v1/health         # Should return 200 OK
```

```bash
# On the server itself, verify API only listens on localhost
ss -tlnp | grep 3001
# Expected output: LISTEN  127.0.0.1:3001  (not 0.0.0.0:3001)
```

> **Important:** If `ss` shows `0.0.0.0:3001`, the API is listening on all interfaces. Fix by setting `HOST=127.0.0.1` in the API's environment configuration or in `apps/api/src/main.ts`.

---

### 18.5 Security Checklist

- [ ] SSH keys only (no password auth)
- [ ] Firewall enabled (UFW — ports 22, 80, 443 only)
- [ ] Fail2Ban installed and active
- [ ] PostgreSQL accepts only local connections
- [ ] Redis requires password and binds to localhost
- [ ] `.env` file has 600 permissions
- [ ] Strong JWT secrets (64+ characters)
- [ ] Strong database and Redis passwords
- [ ] Super Admin password changed from default
- [ ] HTTPS enforced with HSTS
- [ ] Security headers configured in Nginx
- [ ] Rate limiting on auth endpoints
- [ ] Automatic SSL renewal configured
- [ ] Regular security updates enabled

---

## 19. Maintenance & Updates

### 19.1 Deploy Updates

```bash
# SSH into server
ssh deploy@yourdomain.com

# Pull latest code
cd /home/deploy/accounting-saas
git pull origin main

# Install any new dependencies
pnpm install --frozen-lockfile

# Regenerate Prisma client (if schema changed)
pnpm prisma:generate

# Run new migrations
cd apps/api && npx prisma migrate deploy && cd ../..

# Rebuild
pnpm build

# Zero-downtime reload
pm2 reload ecosystem.config.js

# Verify
pm2 status
curl -s https://yourdomain.com/api/v1/health
```

### 19.2 Rollback

```bash
# View recent deployments
git log --oneline -10

# Rollback to previous commit
git checkout <previous-commit-hash>
pnpm install --frozen-lockfile
pnpm build
pm2 reload ecosystem.config.js
```

### 19.3 System Updates

```bash
# Monthly security updates
sudo apt update && sudo apt upgrade -y

# Check Node.js version
node -v

# Update PM2
npm install -g pm2@latest
pm2 update
```

---

## 20. Troubleshooting

### Common Issues

| Issue | Diagnosis | Fix |
|-------|-----------|-----|
| **502 Bad Gateway** | App not running | `pm2 status` → `pm2 restart all` |
| **Database connection failed** | Check PostgreSQL | `systemctl status postgresql` |
| **Redis connection refused** | Check Redis | `systemctl status redis-server` |
| **Build fails** | Missing deps | `pnpm install --frozen-lockfile` |
| **Migration fails** | Schema conflict | Check `apps/api/prisma/migrations/` |
| **SSL certificate expired** | Certbot issue | `certbot renew --force-renewal` |
| **High memory usage** | Memory leak | `pm2 monit` → restart the service |
| **Slow queries** | Database tuning | Check PostgreSQL slow query log |

### Useful Debug Commands

```bash
# Check all services
systemctl status nginx postgresql redis-server
pm2 status

# Check disk space
df -h

# Check memory
free -m

# Check application logs
pm2 logs accounting-api --lines 100
pm2 logs accounting-web --lines 100

# Check Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Test database connection
psql -h localhost -U accounting_user -d accounting_prod -c "SELECT 1;"

# Test Redis connection
redis-cli -a YOUR_REDIS_PASSWORD ping

# Check open ports
ss -tlnp
```

---

## Quick Reference

### Service Ports

| Service    | Port  | Access           |
|------------|-------|------------------|
| Frontend   | 3000  | localhost only    |
| API        | 3001  | localhost only    |
| PostgreSQL | 5432  | localhost only    |
| Redis      | 6379  | localhost only    |
| Nginx HTTP | 80    | public (→ 443)   |
| Nginx HTTPS| 443   | public            |

### Key File Locations

| File/Directory                                  | Purpose                  |
|-------------------------------------------------|--------------------------|
| `/home/deploy/accounting-saas/`                 | Application root         |
| `/home/deploy/accounting-saas/.env`             | Environment config       |
| `/home/deploy/accounting-saas/ecosystem.config.js` | PM2 config            |
| `/home/deploy/logs/`                            | Application logs         |
| `/home/deploy/backups/`                         | Database backups         |
| `/home/deploy/scripts/`                         | Maintenance scripts      |
| `/etc/nginx/sites-available/accounting-saas`    | Nginx config             |
| `/etc/letsencrypt/`                             | SSL certificates         |

### Default URLs

| URL                                    | Description        |
|----------------------------------------|--------------------|
| `https://yourdomain.com`               | Application        |
| `https://yourdomain.com/api/docs`      | Swagger API Docs   |
| `https://yourdomain.com/api/v1/health` | Health Check       |

---

*Document Version: 1.0*
*Last Updated: February 2026*
*Application: Accounting SaaS (Multi-Tenant)*
