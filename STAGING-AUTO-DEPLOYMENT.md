# Staging Auto Deployment — Git Bare Repo + Work-Tree

Zero-downtime push-to-deploy setup for the **staging instance**, running alongside the live deployment on the same server.
Every `git push staging main` automatically checks out code, installs dependencies, builds, migrates, and restarts services.

---

## Concept

```
Local Machine                        Server
─────────────                        ──────
  git push  ──────────────────►  /home/deploy/repos/accounting-staging.git  (bare repo)
                                              │
                                      post-receive hook
                                              │
                                              ▼
                                  /var/www/accounting-staging  (work-tree)
```

Both instances run independently on the same server:

| | Live | Staging |
|---|---|---|
| Bare repo | `/home/deploy/repos/accounting.git` | `/home/deploy/repos/accounting-staging.git` |
| Work-tree | `/var/www/accounting` | `/var/www/accounting-staging` |
| PM2 processes | `accounting-api`, `accounting-web` | `accounting-staging-api`, `accounting-staging-web` |
| API port | `3001` | `3003` |
| Web port | `3000` | `3004` |
| Database | `accounting_prod` | `accounting_staging` |
| Redis DB | `redis://localhost:6379` (DB 0) | `redis://localhost:6379/1` (DB 1) |
| Git remote (local) | `production` | `staging` |
| URL | `accounting.voipsystem.org` | `stagingaccount.voipsystem.org` |

---

## Table of Contents

1. [Fix Folder Ownership](#1-fix-folder-ownership)
2. [Create Bare Repo on Server](#2-create-bare-repo-on-server)
3. [Create Work-Tree Directory](#3-create-work-tree-directory)
4. [Create the post-receive Hook](#4-create-the-post-receive-hook)
5. [Set Up Environment File](#5-set-up-environment-file)
6. [Create the Staging Database](#6-create-the-staging-database)
7. [Set Up PM2 for Staging Instance](#7-set-up-pm2-for-staging-instance)
8. [Configure Nginx for Staging Domain](#8-configure-nginx-for-staging-domain)
9. [Add Remote on Local Machine](#9-add-remote-on-local-machine)
10. [First Deploy](#10-first-deploy)
11. [Verify Separation](#11-verify-separation)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Fix Folder Ownership

SSH into the server and create the staging directories:

```bash
# Create directories
sudo mkdir -p /home/deploy/repos/accounting-staging.git
sudo mkdir -p /var/www/accounting-staging

# Transfer ownership to deploy user
sudo chown -R deploy:deploy /home/deploy/repos/accounting-staging.git
sudo chown -R deploy:deploy /var/www/accounting-staging
```

Verify:

```bash
ls -la /var/www/
# drwxr-xr-x  deploy  deploy  accounting          ← live instance
# drwxr-xr-x  deploy  deploy  accounting-staging  ← staging instance

ls -la /home/deploy/repos/
# drwxr-xr-x  deploy  deploy  accounting.git          ← live instance
# drwxr-xr-x  deploy  deploy  accounting-staging.git  ← staging instance
```

> **Note:** All subsequent steps are run as the `deploy` user unless stated otherwise.

---

## 2. Create Bare Repo on Server

```bash
git init --bare /home/deploy/repos/accounting-staging.git
```

Confirm it was created correctly:

```bash
ls /home/deploy/repos/accounting-staging.git
# branches  config  description  HEAD  hooks  info  objects  refs
```

---

## 3. Create Work-Tree Directory

```bash
mkdir -p /var/www/accounting-staging
```

---

## 4. Create the post-receive Hook

```bash
nano /home/deploy/repos/accounting-staging.git/hooks/post-receive
```

Paste the following:

```bash
#!/usr/bin/env bash
set -e

GIT_DIR=/home/deploy/repos/accounting-staging.git
WORK_TREE=/var/www/accounting-staging

echo ""
echo "========================================"
echo "  Staging Deployment Started"
echo "========================================"

# Step 1: Checkout latest code to work-tree
echo ""
echo "--- [1/8] Checking out latest code ---"
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f main

cd "$WORK_TREE"

# Step 2: Install dependencies
echo ""
echo "--- [2/8] Installing dependencies ---"
pnpm install --frozen-lockfile

# Step 3: Generate Prisma client
echo ""
echo "--- [3/8] Generating Prisma client ---"
pnpm prisma:generate

# Step 4: Clean and build shared package (dist/ is gitignored, must be rebuilt fresh each deploy)
echo ""
echo "--- [4/8] Building shared package ---"
rm -rf "$WORK_TREE/packages/shared/dist"
rm -f "$WORK_TREE/packages/shared/tsconfig.tsbuildinfo"
pnpm --filter @accounting-saas/shared build

# Step 5: Build api (depends on shared dist/)
echo ""
echo "--- [5/8] Building api ---"
pnpm --filter api build

# Step 6: Build web (depends on shared dist/)
echo ""
echo "--- [6/8] Building web ---"
NEXT_PUBLIC_API_URL="https://stagingaccount.voipsystem.org/api/v1" pnpm --filter web build

# Step 7: Run database migrations (deploy = apply pending migrations, no shadow DB required)
echo ""
echo "--- [7/8] Running database migrations ---"
pnpm prisma:migrate:prod

# Step 8: Restart staging services
echo ""
echo "--- [8/8] Restarting staging services ---"
pm2 restart accounting-staging-api accounting-staging-web

echo ""
echo "========================================"
echo "  Staging Deployment Complete"
echo "========================================"
echo ""
```

Make it executable:

```bash
chmod +x /home/deploy/repos/accounting-staging.git/hooks/post-receive
```

---

## 5. Set Up Environment File

The `.env` file is not tracked in git. Set it up manually once on the server using staging values.

```bash
cp /var/www/accounting-staging/.env.example /var/www/accounting-staging/apps/api/.env
nano /var/www/accounting-staging/apps/api/.env
```

Fill in staging values — note the different database, ports, Redis DB, and URLs from the live instance:

```env
DATABASE_URL="postgresql://accounting_staging_user:YOUR_STRONG_STAGING_PASSWORD@localhost:5432/accounting_staging?schema=public"

# Redis DB 1 — completely separate from live instance (which uses DB 0)
REDIS_URL="redis://localhost:6379/1"

JWT_SECRET="generate-a-different-long-random-string-for-staging"
JWT_REFRESH_SECRET="generate-another-different-long-random-string-for-staging"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

API_PORT=3003
WEB_PORT=3004
NODE_ENV="production"

MFA_APP_NAME="AccountingSaaS"

NEXT_PUBLIC_API_URL="https://stagingaccount.voipsystem.org/api/v1"
WEB_URL="https://stagingaccount.voipsystem.org"
APP_URL="https://stagingaccount.voipsystem.org"

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Accounting SaaS <noreply@voipsystem.org>"

SUPER_ADMIN_EMAIL="admin@voipsystem.org"
SUPER_ADMIN_PASSWORD="StrongStagingPasswordHere!"
```

Generate secure secrets (use different values from the live instance):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **Important:** Staging must use Redis DB 1 (`redis://localhost:6379/1`) and live uses Redis DB 0 (`redis://localhost:6379`). This ensures sessions, caches, and queues never collide between the two instances.

---

## 6. Create the Staging Database

The staging instance needs its own completely isolated database. Run as `deploy` user:

```bash
sudo -u postgres psql <<EOF
CREATE USER accounting_staging_user WITH PASSWORD 'YOUR_STRONG_STAGING_PASSWORD';
CREATE DATABASE accounting_staging OWNER accounting_staging_user;
GRANT ALL PRIVILEGES ON DATABASE accounting_staging TO accounting_staging_user;
EOF
```

Verify both databases exist:

```bash
sudo -u postgres psql -c "\l" | grep accounting
# accounting_prod     ← live instance
# accounting_staging  ← staging instance
```

---

## 7. Set Up PM2 for Staging Instance

Create an ecosystem config for the staging instance:

```bash
nano /var/www/accounting-staging/ecosystem.config.js
```

```js
module.exports = {
  apps: [
    {
      name: 'accounting-staging-api',
      cwd: '/var/www/accounting-staging/apps/api',
      script: 'node',
      args: 'dist/main.js',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
      },
    },
    {
      name: 'accounting-staging-web',
      cwd: '/var/www/accounting-staging/apps/web',
      script: 'node_modules/next/dist/bin/next',
      args: 'start -p 3004',
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
      },
    },
  ],
}
```

Create log directory and start:

```bash
sudo mkdir -p /var/log/accounting-staging
sudo chown deploy:deploy /var/log/accounting-staging

cd /var/www/accounting-staging
pm2 start ecosystem.config.js
pm2 save
```

Confirm all four processes are running:

```bash
pm2 list
# accounting-api           online   ← live instance
# accounting-web           online   ← live instance
# accounting-staging-api   online   ← staging instance
# accounting-staging-web   online   ← staging instance
```

---

## 8. Configure Nginx for Staging Domain

Add a new Nginx server block for the staging domain alongside the existing live block:

```bash
sudo nano /etc/nginx/sites-available/stagingaccount.voipsystem.org.conf
```

```nginx
server {
    listen 80;
    server_name stagingaccount.voipsystem.org;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Block direct access to Swagger docs
    location /api/docs {
        deny all;
        return 403;
    }

    # Proxy API requests to internal staging NestJS (port 3003)
    location /api/ {
        proxy_pass http://127.0.0.1:3003;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        client_max_body_size 10M;
    }

    # Proxy everything else to staging Next.js frontend (port 3004)
    location / {
        proxy_pass http://127.0.0.1:3004;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

Enable the site, test, and reload:

```bash
sudo ln -sf /etc/nginx/sites-available/stagingaccount.voipsystem.org.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Add SSL certificate for the staging domain:

```bash
sudo certbot --nginx -d stagingaccount.voipsystem.org
```

After SSL is issued, update `apps/api/.env` to use `https://` and restart the staging API:

```bash
sed -i 's|http://stagingaccount.voipsystem.org|https://stagingaccount.voipsystem.org|g' /var/www/accounting-staging/apps/api/.env
pm2 restart accounting-staging-api
```

---

## 9. Add Remote on Local Machine

On your **local machine**, add the staging server as a separate git remote:

```bash
git remote add staging deploy@10.10.8.195:/home/deploy/repos/accounting-staging.git
```

Verify all remotes exist:

```bash
git remote -v
# production  deploy@10.10.8.195:/home/deploy/repos/accounting.git (fetch)
# production  deploy@10.10.8.195:/home/deploy/repos/accounting.git (push)
# staging     deploy@10.10.8.195:/home/deploy/repos/accounting-staging.git (fetch)
# staging     deploy@10.10.8.195:/home/deploy/repos/accounting-staging.git (push)
```

---

## 10. First Deploy

**Before the first push**, the staging work-tree is empty — the hook cannot install or build yet. Seed the staging directory manually once, then let the hook take over for all future deploys.

### One-time manual seed (first deploy only)

SSH into the server:

```bash
# Checkout the code manually for the first time
git --git-dir=/home/deploy/repos/accounting-staging.git \
    --work-tree=/var/www/accounting-staging \
    checkout -f main

cd /var/www/accounting-staging

# Copy the .env file you created in Step 5
cp /var/www/accounting-staging/apps/api/.env /var/www/accounting-staging/apps/api/.env

# Install, build, and migrate
pnpm install --frozen-lockfile
pnpm prisma:generate
rm -rf packages/shared/dist packages/shared/tsconfig.tsbuildinfo
pnpm --filter @accounting-saas/shared build
pnpm --filter api build

# Build web with staging URL baked in
cd apps/web
rm -rf .next
NEXT_PUBLIC_API_URL="https://stagingaccount.voipsystem.org/api/v1" npx next build
cd /var/www/accounting-staging

pnpm prisma:migrate:prod

# Start staging processes
pm2 start ecosystem.config.js
pm2 save
```

### Trigger from local machine

Push from your local `main` branch:

```bash
git push staging main
```

You will see the hook output in your terminal:

```
========================================
  Staging Deployment Started
========================================

--- [1/8] Checking out latest code ---
--- [2/8] Installing dependencies ---
--- [3/8] Generating Prisma client ---
--- [4/8] Building shared package ---
--- [5/8] Building api ---
--- [6/8] Building web ---
--- [7/8] Running database migrations ---
--- [8/8] Restarting staging services ---

========================================
  Staging Deployment Complete
========================================
```

### All future deploys

```bash
# Deploy to live only
git push production main

# Deploy to staging only
git push staging main

# Deploy to both simultaneously
git push production main && git push staging main
```

---

## 11. Data Migration — accounting_prod → accounting_staging

After staging is fully deployed and verified, migrate the existing live data into staging so it can be used for testing with real data. The live instance then starts fresh.

### Step 1 — Dump current live database

```bash
PGPASSWORD="YOUR_STRONG_DB_PASSWORD" pg_dump \
  -h localhost \
  -U accounting_user \
  -d accounting_prod \
  --format=custom \
  -f /home/deploy/accounting_prod_backup.dump
```

### Step 2 — Restore into staging database

```bash
PGPASSWORD="YOUR_STRONG_DB_PASSWORD" pg_restore \
  -h localhost \
  -U accounting_user \
  -d accounting_staging \
  --clean --if-exists \
  /home/deploy/accounting_prod_backup.dump
```

### Step 3 — Verify staging has the data

```bash
PGPASSWORD="YOUR_STRONG_DB_PASSWORD" psql \
  -h localhost -U accounting_user -d accounting_staging \
  -c "SELECT COUNT(*) FROM \"User\";"
```

Confirm the count matches what you expect from the live data.

### Step 4 — Restart staging API to reconnect

```bash
pm2 restart accounting-staging-api
```

### Step 5 — Clear live database for fresh start

> **Warning:** This is irreversible. Only do this after verifying staging has the data correctly.

```bash
PGPASSWORD="YOUR_STRONG_DB_PASSWORD" psql \
  -h localhost -U accounting_user -d accounting_prod \
  -c "SELECT COUNT(*) FROM \"User\";"
# Confirm this is the data you are about to clear

# Drop and recreate the live database clean
sudo -u postgres psql <<EOF
DROP DATABASE accounting_prod;
CREATE DATABASE accounting_prod OWNER accounting_user;
GRANT ALL PRIVILEGES ON DATABASE accounting_prod TO accounting_user;
EOF

# Re-run migrations on the fresh live database
cd /var/www/accounting
pnpm prisma:migrate:prod
pnpm prisma:seed

pm2 restart accounting-api
```

---

## 12. Verify Separation

Confirm the two instances are fully independent:

```bash
# Bare repos
ls /home/deploy/repos/
# accounting.git          ← live
# accounting-staging.git  ← staging

# Work-trees
ls /var/www/
# accounting            ← live
# accounting-staging    ← staging

# PM2 processes and ports
pm2 list
# accounting-api           online   (port 3001)   ← live API
# accounting-web           online   (port 3000)   ← live web
# accounting-staging-api   online   (port 3003)   ← staging API
# accounting-staging-web   online   (port 3004)   ← staging web

# Active ports — confirm no overlap
sudo ss -tlnp | grep -E '300[0-4]'

# Databases
sudo -u postgres psql -c "\l" | grep accounting
# accounting_prod     ← live
# accounting_staging  ← staging

# Redis DBs — confirm staging uses DB 1 not DB 0
redis-cli -n 0 KEYS "*" | wc -l   # live keys
redis-cli -n 1 KEYS "*" | wc -l   # staging keys
```

---

## 13. Troubleshooting

### Hook not executing

```bash
ls -la /home/deploy/repos/accounting-staging.git/hooks/post-receive
# -rwxr-xr-x  deploy  deploy  post-receive
```

### Permission denied errors in hook

```bash
sudo chown -R deploy:deploy /var/www/accounting-staging
sudo chown -R deploy:deploy /home/deploy/repos/accounting-staging.git
```

### pm2 restart fails — process not found

The staging PM2 processes must be started at least once (see [First Deploy](#10-first-deploy)) before the hook can restart them:

```bash
cd /var/www/accounting-staging
pm2 start ecosystem.config.js
pm2 save
```

### Port conflict between live and staging

Live uses ports `3000` (web) and `3001` (API). Staging uses `3004` and `3003`. Confirm no overlap:

```bash
sudo ss -tlnp | grep -E '300[0-4]'
```

### Cannot push — repository not found

```bash
# Confirm SSH access works
ssh deploy@10.10.8.195

# Confirm the staging remote path is correct
git remote -v
```

### Build fails on server

```bash
# SSH in and run manually to see full error
cd /var/www/accounting-staging
pnpm install --frozen-lockfile
pnpm build
```

### Wrong API URL baked into the web build

`NEXT_PUBLIC_API_URL` is baked into the Next.js bundle at build time. If the wrong URL was used:

```bash
cd /var/www/accounting-staging/apps/web
rm -rf .next

# Rebuild with the correct staging URL
NEXT_PUBLIC_API_URL="https://stagingaccount.voipsystem.org/api/v1" npx next build
pm2 restart accounting-staging-web
```

Verify the correct URL was baked in:

```bash
grep -r "stagingaccount.voipsystem.org" /var/www/accounting-staging/apps/web/.next/ 2>/dev/null | head -3
# Should return results

grep -r "localhost:3001" /var/www/accounting-staging/apps/web/.next/ 2>/dev/null | head -3
# Should return NO results
```

### Redis session collision check

```bash
# Staging must use DB 1 — verify in the .env
grep REDIS_URL /var/www/accounting-staging/apps/api/.env
# REDIS_URL="redis://localhost:6379/1"

# Live must use DB 0 (default)
grep REDIS_URL /var/www/accounting/apps/api/.env
# REDIS_URL="redis://localhost:6379"
```

### Nginx not routing to staging domain

```bash
sudo nginx -t
sudo systemctl reload nginx

# Check that staging config points to correct ports (3003 for API, 3004 for web)
grep -n "proxy_pass" /etc/nginx/sites-available/stagingaccount.voipsystem.org.conf
```

### Check staging deployment logs

```bash
pm2 logs accounting-staging-api
pm2 logs accounting-staging-web

# Real-time
pm2 logs --lines 100
```

---

## Quick Reference

| Item | Value |
|---|---|
| Domain | `https://stagingaccount.voipsystem.org` |
| Frontend | `http://127.0.0.1:3004` (internal) |
| API | `http://127.0.0.1:3003` (internal) |
| API public path | `https://stagingaccount.voipsystem.org/api/v1` |
| Database | `localhost:5432/accounting_staging` |
| Redis | `localhost:6379` DB 1 |
| App directory | `/var/www/accounting-staging` |
| Bare repo | `/home/deploy/repos/accounting-staging.git` |
| Logs | `/var/log/accounting-staging/` |
| Nginx config | `/etc/nginx/sites-available/stagingaccount.voipsystem.org.conf` |
| PM2 config | `/var/www/accounting-staging/ecosystem.config.js` |
| Git remote | `staging` |
