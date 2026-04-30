# Live Auto Deployment — Git Bare Repo + Work-Tree

Zero-downtime push-to-deploy setup for the **live instance**, running alongside the test deployment on the same server.
Every `git push live main` automatically checks out code, installs dependencies, builds, migrates, and restarts services.

---

## Concept

```
Local Machine                        Server
─────────────                        ──────
  git push  ──────────────────►  /home/deploy/repos/accounting-live.git  (bare repo)
                                              │
                                      post-receive hook
                                              │
                                              ▼
                                  /var/www/accounting-live  (work-tree)
```

Both instances run independently on the same server:

| | Test | Live |
|---|---|---|
| Bare repo | `/home/deploy/repos/accounting.git` | `/home/deploy/repos/accounting-live.git` |
| Work-tree | `/var/www/accounting` | `/var/www/accounting-live` |
| PM2 processes | `accounting-api`, `accounting-web` | `accounting-live-api`, `accounting-live-web` |
| API port | `3001` | `3003` |
| Web port | `3000` | `3002` |
| Database | `accounting_prod` | `accounting_live` |
| Git remote (local) | `production` | `live` |
| URL | `accounting.voipsystem.org` | `YOUR_LIVE_DOMAIN` |

---

## Table of Contents

1. [Fix Folder Ownership](#1-fix-folder-ownership)
2. [Create Bare Repo on Server](#2-create-bare-repo-on-server)
3. [Create Work-Tree Directory](#3-create-work-tree-directory)
4. [Create the post-receive Hook](#4-create-the-post-receive-hook)
5. [Set Up Environment File](#5-set-up-environment-file)
6. [Create the Live Database](#6-create-the-live-database)
7. [Set Up PM2 for Live Instance](#7-set-up-pm2-for-live-instance)
8. [Configure Nginx for Live Domain](#8-configure-nginx-for-live-domain)
9. [Add Remote on Local Machine](#9-add-remote-on-local-machine)
10. [First Deploy](#10-first-deploy)
11. [Verify Separation](#11-verify-separation)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. Fix Folder Ownership

SSH into the server and create the live directories:

```bash
# Create directories
sudo mkdir -p /home/deploy/repos/accounting-live.git
sudo mkdir -p /var/www/accounting-live

# Transfer ownership to deploy user
sudo chown -R deploy:deploy /home/deploy/repos/accounting-live.git
sudo chown -R deploy:deploy /var/www/accounting-live
```

Verify:

```bash
ls -la /var/www/
# drwxr-xr-x  deploy  deploy  accounting        ← test instance
# drwxr-xr-x  deploy  deploy  accounting-live   ← live instance

ls -la /home/deploy/repos/
# drwxr-xr-x  deploy  deploy  accounting.git        ← test instance
# drwxr-xr-x  deploy  deploy  accounting-live.git   ← live instance
```

> **Note:** All subsequent steps are run as the `deploy` user unless stated otherwise.

---

## 2. Create Bare Repo on Server

```bash
git init --bare /home/deploy/repos/accounting-live.git
```

Confirm it was created correctly:

```bash
ls /home/deploy/repos/accounting-live.git
# branches  config  description  HEAD  hooks  info  objects  refs
```

---

## 3. Create Work-Tree Directory

```bash
mkdir -p /var/www/accounting-live
```

---

## 4. Create the post-receive Hook

```bash
nano /home/deploy/repos/accounting-live.git/hooks/post-receive
```

Paste the following:

```bash
#!/usr/bin/env bash
set -e

GIT_DIR=/home/deploy/repos/accounting-live.git
WORK_TREE=/var/www/accounting-live

echo ""
echo "========================================"
echo "  Live Deployment Started"
echo "========================================"

# Step 1: Checkout latest code to work-tree
echo ""
echo "--- [1/8] Checking out latest code ---"
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f main

# Ensure deploy user owns everything (guards against any root-created files)
sudo chown -R deploy:deploy "$WORK_TREE"

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
pnpm --filter web build

# Step 7: Run database migrations (deploy = apply pending migrations, no shadow DB required)
echo ""
echo "--- [7/8] Running database migrations ---"
pnpm prisma:migrate:prod

# Step 8: Restart live services
echo ""
echo "--- [8/8] Restarting live services ---"
pm2 restart accounting-live-api accounting-live-web

echo ""
echo "========================================"
echo "  Live Deployment Complete"
echo "========================================"
echo ""
```

Make it executable:

```bash
chmod +x /home/deploy/repos/accounting-live.git/hooks/post-receive
```

---

## 5. Set Up Environment File

The `.env` file is not tracked in git. Set it up manually once on the server using live values.

```bash
cp /var/www/accounting-live/.env.example /var/www/accounting-live/apps/api/.env
nano /var/www/accounting-live/apps/api/.env
```

Fill in live values — note the different database, ports, and URLs from the test instance:

```env
DATABASE_URL="postgresql://accounting_user:YOUR_STRONG_DB_PASSWORD@localhost:5432/accounting_live?schema=public"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="generate-a-different-long-random-string-for-live"
JWT_REFRESH_SECRET="generate-another-different-long-random-string-for-live"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

API_PORT=3003
WEB_PORT=3002
NODE_ENV="production"

MFA_APP_NAME="AccountingSaaS"

NEXT_PUBLIC_API_URL="https://YOUR_LIVE_DOMAIN/api/v1"
WEB_URL="https://YOUR_LIVE_DOMAIN"
APP_URL="https://YOUR_LIVE_DOMAIN"

SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Accounting SaaS <noreply@YOUR_LIVE_DOMAIN>"

SUPER_ADMIN_EMAIL="admin@YOUR_LIVE_DOMAIN"
SUPER_ADMIN_PASSWORD="StrongLivePasswordHere!"
```

Generate secure secrets (use different values from the test instance):

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

> **Important:** The live instance must use a completely separate database (`accounting_live`) and separate JWT secrets from the test instance.

---

## 6. Create the Live Database

The live instance needs its own database. Run as `deploy` user:

```bash
sudo -u postgres psql <<EOF
CREATE DATABASE accounting_live OWNER accounting_user;
GRANT ALL PRIVILEGES ON DATABASE accounting_live TO accounting_user;
EOF
```

Verify:

```bash
sudo -u postgres psql -c "\l" | grep accounting
# accounting_prod   ← test instance
# accounting_live   ← live instance
```

---

## 7. Set Up PM2 for Live Instance

Create an ecosystem config for the live instance:

```bash
nano /var/www/accounting-live/ecosystem.config.js
```

```js
module.exports = {
  apps: [
    {
      name: 'accounting-live-api',
      cwd: '/var/www/accounting-live/apps/api',
      script: 'node',
      args: 'dist/src/main.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/accounting-live/api-error.log',
      out_file: '/var/log/accounting-live/api-out.log',
    },
    {
      name: 'accounting-live-web',
      cwd: '/var/www/accounting-live/apps/web',
      script: 'npx',
      args: 'next start --port 3002',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/accounting-live/web-error.log',
      out_file: '/var/log/accounting-live/web-out.log',
    },
  ],
}
```

Create log directory and start:

```bash
sudo mkdir -p /var/log/accounting-live
sudo chown deploy:deploy /var/log/accounting-live

cd /var/www/accounting-live
pm2 start ecosystem.config.js
pm2 save
```

Confirm all four processes are running:

```bash
pm2 list
# accounting-api         online   ← test instance
# accounting-web         online   ← test instance
# accounting-live-api    online   ← live instance
# accounting-live-web    online   ← live instance
```

---

## 8. Configure Nginx for Live Domain

Add a new Nginx server block for the live domain alongside the existing test block:

```bash
sudo nano /etc/nginx/sites-available/YOUR_LIVE_DOMAIN.conf
```

```nginx
server {
    listen 80;
    server_name YOUR_LIVE_DOMAIN;

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

    # Proxy API requests to internal live NestJS (port 3003)
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

    # Proxy everything else to live Next.js frontend (port 3002)
    location / {
        proxy_pass http://127.0.0.1:3002;
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
sudo ln -sf /etc/nginx/sites-available/YOUR_LIVE_DOMAIN.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

Add SSL certificate for the live domain:

```bash
sudo certbot --nginx -d YOUR_LIVE_DOMAIN
```

After SSL is issued, update `apps/api/.env` to use `https://` and restart the live API:

```bash
sed -i 's|http://YOUR_LIVE_DOMAIN|https://YOUR_LIVE_DOMAIN|g' /var/www/accounting-live/apps/api/.env
pm2 restart accounting-live-api
```

---

## 9. Add Remote on Local Machine

On your **local machine**, add the live server as a separate git remote:

```bash
git remote add live deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting-live.git
```

Verify both remotes exist:

```bash
git remote -v
# production  deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting.git (fetch)
# production  deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting.git (push)
# live        deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting-live.git (fetch)
# live        deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting-live.git (push)
```

---

## 10. First Deploy

**Before the first push**, the live work-tree is empty — the hook cannot install or build yet. Seed the live directory manually once, then let the hook take over for all future deploys.

### One-time manual seed (first deploy only)

SSH into the server:

```bash
# Checkout the code manually for the first time
git --git-dir=/home/deploy/repos/accounting-live.git \
    --work-tree=/var/www/accounting-live \
    checkout -f main

cd /var/www/accounting-live

# Install, build, and migrate
pnpm install --frozen-lockfile
pnpm prisma:generate
rm -rf packages/shared/dist packages/shared/tsconfig.tsbuildinfo
pnpm --filter @accounting-saas/shared build
pnpm --filter api build
pnpm --filter web build
pnpm prisma:migrate:prod

# Start live processes
pm2 start ecosystem.config.js
pm2 save
```

### Trigger from local machine

Push from your local `main` branch:

```bash
git push live main
```

You will see the hook output in your terminal:

```
========================================
  Live Deployment Started
========================================

--- [1/8] Checking out latest code ---
--- [2/8] Installing dependencies ---
--- [3/8] Generating Prisma client ---
--- [4/8] Building shared package ---
--- [5/8] Building api ---
--- [6/8] Building web ---
--- [7/8] Running database migrations ---
--- [8/8] Restarting live services ---

========================================
  Live Deployment Complete
========================================
```

### All future deploys

```bash
# Deploy to test only
git push production main

# Deploy to live only
git push live main

# Deploy to both simultaneously
git push production main && git push live main
```

---

## 11. Verify Separation

Confirm the two instances are fully independent:

```bash
# Bare repos
ls /home/deploy/repos/
# accounting.git        ← test
# accounting-live.git   ← live

# Work-trees
ls /var/www/
# accounting            ← test
# accounting-live       ← live

# PM2 processes and ports
pm2 list
# accounting-api         online   (port 3001)   ← test API
# accounting-web         online   (port 3000)   ← test web
# accounting-live-api    online   (port 3003)   ← live API
# accounting-live-web    online   (port 3002)   ← live web

# Active ports
sudo ss -tlnp | grep -E '300[0-3]'

# Databases
sudo -u postgres psql -c "\l" | grep accounting
# accounting_prod   ← test
# accounting_live   ← live
```

---

## 12. Troubleshooting

### Hook not executing

```bash
ls -la /home/deploy/repos/accounting-live.git/hooks/post-receive
# -rwxr-xr-x  deploy  deploy  post-receive
```

### Permission denied errors in hook

```bash
sudo chown -R deploy:deploy /var/www/accounting-live
sudo chown -R deploy:deploy /home/deploy/repos/accounting-live.git
```

### pm2 restart fails — process not found

The live PM2 processes must be started at least once (see [First Deploy](#10-first-deploy)) before the hook can restart them:

```bash
cd /var/www/accounting-live
pm2 start ecosystem.config.js
pm2 save
```

### Port conflict between test and live

Live uses ports `3002` (web) and `3003` (API). Test uses `3000` and `3001`. Confirm no overlap:

```bash
sudo ss -tlnp | grep -E '300[0-3]'
```

### Cannot push — repository not found

```bash
# Confirm SSH access works
ssh deploy@YOUR_SERVER_IP

# Confirm the live remote path is correct
git remote -v
```

### Build fails on server

```bash
# SSH in and run manually to see full error
cd /var/www/accounting-live
pnpm install --frozen-lockfile
pnpm build
```

### Wrong API URL baked into the web build

`NEXT_PUBLIC_API_URL` is baked into the Next.js bundle at build time. If the wrong URL was used:

```bash
cd /var/www/accounting-live/apps/web
rm -rf .next

# Rebuild with the correct live URL
NEXT_PUBLIC_API_URL="https://YOUR_LIVE_DOMAIN/api/v1" npx next build
pm2 restart accounting-live-web
```

Verify the correct URL was baked in:

```bash
grep -r "YOUR_LIVE_DOMAIN" /var/www/accounting-live/apps/web/.next/ 2>/dev/null | head -3
# Should return results

grep -r "localhost:3001" /var/www/accounting-live/apps/web/.next/ 2>/dev/null | head -3
# Should return NO results
```

### Check live deployment logs

```bash
pm2 logs accounting-live-api
pm2 logs accounting-live-web

# Real-time
pm2 logs --lines 100
```

### Nginx not routing to live URL

```bash
sudo nginx -t
sudo systemctl reload nginx

# Check that live config points to correct ports (3003 for API, 3002 for web)
grep -n "proxy_pass" /etc/nginx/sites-available/YOUR_LIVE_DOMAIN.conf
```

---

## Quick Reference

| Item | Value |
|---|---|
| Domain | `https://YOUR_LIVE_DOMAIN` |
| Frontend | `http://127.0.0.1:3002` (internal) |
| API | `http://127.0.0.1:3003` (internal) |
| API public path | `https://YOUR_LIVE_DOMAIN/api/v1` |
| Database | `localhost:5432/accounting_live` |
| App directory | `/var/www/accounting-live` |
| Bare repo | `/home/deploy/repos/accounting-live.git` |
| Logs | `/var/log/accounting-live/` |
| Nginx config | `/etc/nginx/sites-available/YOUR_LIVE_DOMAIN.conf` |
| PM2 config | `/var/www/accounting-live/ecosystem.config.js` |
| Git remote | `live` |
