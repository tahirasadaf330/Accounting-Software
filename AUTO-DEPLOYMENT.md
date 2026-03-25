# Auto Deployment — Git Bare Repo + Work-Tree

Zero-downtime push-to-deploy setup using a bare Git repository on the server.
Every `git push production main` automatically checks out code, installs dependencies, builds, migrates, and restarts services.

---

## Concept

```
Local Machine                        Server
─────────────                        ──────
  git push  ──────────────────►  /home/deploy/repos/accounting.git  (bare repo)
                                              │
                                      post-receive hook
                                              │
                                              ▼
                                  /var/www/accounting  (work-tree)
```

- **Bare repo** — receives pushes, stores git history, no source files visible
- **Work-tree** — actual running source files, no `.git` folder
- **post-receive hook** — bridge between the two, runs on every push

---

## Table of Contents

1. [Fix Folder Ownership](#1-fix-folder-ownership)
2. [Create Bare Repo on Server](#2-create-bare-repo-on-server)
3. [Create Work-Tree Directory](#3-create-work-tree-directory)
4. [Create the post-receive Hook](#4-create-the-post-receive-hook)
5. [Set Up Environment File](#5-set-up-environment-file)
6. [Set Up PM2 Under deploy User](#6-set-up-pm2-under-deploy-user)
7. [Add Remote on Local Machine](#7-add-remote-on-local-machine)
8. [Deploy](#8-deploy)
9. [Verify Separation](#9-verify-separation)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Fix Folder Ownership

By default server directories are owned by `root`. The `deploy` user needs ownership of both the bare repo and the work-tree so the hook can write files without `sudo`.

SSH into the server and run:

```bash
# Create directories if they don't exist yet
sudo mkdir -p /home/deploy/repos/accounting.git
sudo mkdir -p /var/www/accounting

# Transfer ownership to deploy user
sudo chown -R deploy:deploy /home/deploy/repos/accounting.git
sudo chown -R deploy:deploy /var/www/accounting
```

Verify:

```bash
ls -la /var/www/
# drwxr-xr-x  deploy  deploy  accounting

ls -la /home/deploy/repos/
# drwxr-xr-x  deploy  deploy  accounting.git
```

> **Note:** All subsequent steps are run as the `deploy` user unless stated otherwise.

---

## 2. Create Bare Repo on Server

A bare repository stores only git internals (no checked-out files). It is the target of your `git push`.

```bash
git init --bare /home/deploy/repos/accounting.git
```

Confirm it was created correctly:

```bash
ls /home/deploy/repos/accounting.git
# branches  config  description  HEAD  hooks  info  objects  refs
```

---

## 3. Create Work-Tree Directory

This is where the actual source files will live after each push.

```bash
mkdir -p /var/www/accounting
```

---

## 4. Create the post-receive Hook

The hook runs automatically on the server after every successful push.

```bash
nano /home/deploy/repos/accounting.git/hooks/post-receive
```

Paste the following:

```bash
#!/usr/bin/env bash
set -e

GIT_DIR=/home/deploy/repos/accounting.git
WORK_TREE=/var/www/accounting

echo ""
echo "========================================"
echo "  Auto Deployment Started"
echo "========================================"

# Step 1: Checkout latest code to work-tree
echo ""
echo "--- [1/5] Checking out latest code ---"
git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f main

cd "$WORK_TREE"

# Step 2: Install dependencies
echo ""
echo "--- [2/6] Installing dependencies ---"
pnpm install --frozen-lockfile

# Step 3: Generate Prisma client
echo ""
echo "--- [3/7] Generating Prisma client ---"
pnpm prisma:generate

# Step 4: Clean and build shared package (dist/ is gitignored, must be rebuilt fresh each deploy)
echo ""
echo "--- [4/7] Building shared package ---"
rm -rf "$WORK_TREE/packages/shared/dist"
pnpm --filter @accounting-saas/shared build

# Step 5: Build api (depends on shared dist/)
echo ""
echo "--- [5/7] Building api ---"
pnpm --filter api build

# Step 6: Build web (depends on shared dist/)
echo ""
echo "--- [6/7] Building web ---"
pnpm --filter web build

# Step 7: Run database migrations
echo ""
echo "--- [7/7] Running database migrations ---"
pnpm prisma:migrate

# Step 8: Restart services
echo ""
echo "--- [8/8] Restarting services ---"
pm2 restart accounting-api accounting-web

echo ""
echo "========================================"
echo "  Deployment Complete"
echo "========================================"
echo ""
```

Make it executable:

```bash
chmod +x /home/deploy/repos/accounting.git/hooks/post-receive
```

---

## 5. Set Up Environment File

The `.env` file is not tracked in git. Set it up manually once on the server.

```bash
cp /var/www/accounting/.env.example /var/www/accounting/apps/api/.env
nano /var/www/accounting/apps/api/.env
```

Fill in production values:

```env
DATABASE_URL="postgresql://deploy:yourpassword@localhost:5432/accounting_prod?schema=public"
REDIS_URL="redis://localhost:6379"

JWT_SECRET="generate-a-long-random-string"
JWT_REFRESH_SECRET="generate-another-long-random-string"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

API_PORT=3001
WEB_PORT=3000
NODE_ENV="production"

MFA_APP_NAME="AccountingSaaS"

NEXT_PUBLIC_API_URL="https://api.yourdomain.com/api/v1"
WEB_URL="https://yourdomain.com"

SUPER_ADMIN_EMAIL="admin@yourdomain.com"
SUPER_ADMIN_PASSWORD="StrongPasswordHere!"
```

Generate secure secrets:

```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

---

## 6. Set Up PM2 Under deploy User

PM2 must run under the `deploy` user so the hook can restart processes without `sudo`.

**If PM2 is currently running under root, migrate it:**

```bash
# As root — stop the root PM2 daemon
sudo pm2 kill
```

**As deploy user — create an ecosystem config:**

```bash
nano /var/www/accounting/ecosystem.config.js
```

```js
module.exports = {
  apps: [
    {
      name: 'accounting-api',
      cwd: '/var/www/accounting/apps/api',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
      },
    },
    {
      name: 'accounting-web',
      cwd: '/var/www/accounting/apps/web',
      script: 'node',
      args: 'node_modules/.bin/next start -p 3000',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
```

Start and register with systemd:

```bash
cd /var/www/accounting
pm2 start ecosystem.config.js
pm2 save

# Register PM2 to start on boot — run the printed command as root
pm2 startup
# It will print something like:
# sudo env PATH=... pm2 startup systemd -u deploy --hp /home/deploy
# Copy and run that command
```

---

## 7. Add Remote on Local Machine

On your **local machine**, add the server as a git remote:

```bash
git remote add production deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting.git
```

Verify:

```bash
git remote -v
# production  deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting.git (fetch)
# production  deploy@YOUR_SERVER_IP:/home/deploy/repos/accounting.git (push)
```

---

## 8. Deploy

**First deploy** — push your local `main` branch to the server:

```bash
git push production main
```

You will see the hook output in your terminal:

```
========================================
  Auto Deployment Started
========================================

--- [1/5] Checking out latest code ---
--- [2/5] Installing dependencies ---
--- [3/5] Building apps ---
--- [4/5] Running database migrations ---
--- [5/5] Restarting services ---

========================================
  Deployment Complete
========================================
```

**All future deploys:**

```bash
git add .
git commit -m "your changes"
git push production main
```

---

## 9. Verify Separation

Confirm the git directory and work-tree are fully separate:

```bash
# Bare repo — only git internals, no source files
ls /home/deploy/repos/accounting.git
# HEAD  branches  config  description  hooks  info  objects  refs

# Work-tree — source files only, no .git folder
ls /var/www/accounting
# apps  packages  package.json  pnpm-workspace.yaml  turbo.json  ...
```

---

## 10. Troubleshooting

### Hook not executing

```bash
# Confirm hook is executable
ls -la /home/deploy/repos/accounting.git/hooks/post-receive
# -rwxr-xr-x  deploy  deploy  post-receive
```

### Permission denied errors in hook

```bash
# Reconfirm ownership
sudo chown -R deploy:deploy /var/www/accounting
sudo chown -R deploy:deploy /home/deploy/repos/accounting.git
```

### pm2 restart fails (permission denied)

The hook runs as `deploy` — make sure PM2 daemon is also owned by `deploy`:

```bash
pm2 list
# If processes show root owner, run: sudo pm2 kill
# Then restart as deploy user: pm2 start ecosystem.config.js
```

### Cannot push — repository not found

```bash
# Confirm SSH access works
ssh deploy@YOUR_SERVER_IP

# Confirm remote path is correct
git remote -v
```

### Build fails on server

```bash
# SSH in and run manually to see full error
cd /var/www/accounting
pnpm build
```

### Check deployment logs

```bash
# PM2 logs
pm2 logs accounting-api
pm2 logs accounting-web

# Real-time
pm2 logs --lines 100
```

---

## Alternative: If Directories Must Stay Root-Owned

If `/var/www` ownership cannot be changed (shared server policy), grant `deploy` passwordless sudo for specific commands only:

```bash
sudo visudo
```

Add:

```
deploy ALL=(ALL) NOPASSWD: /usr/bin/git, /usr/bin/pm2, /usr/local/bin/pm2
```

Then prefix commands in the hook:

```bash
sudo git --git-dir="$GIT_DIR" --work-tree="$WORK_TREE" checkout -f main
sudo pm2 restart accounting-api accounting-web
```

> Changing ownership is always preferred over using `sudo` in hooks.
