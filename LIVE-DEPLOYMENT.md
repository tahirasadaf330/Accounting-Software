# Live Deployment Guide — accounting.voipsystem.org

Step-by-step guide to deploy the Accounting SaaS platform on a Linux server with Nginx. The API is **not exposed publicly** — Nginx reverse-proxies `/api/` to the internal API process.

---

## Architecture

```
Internet
   |
   v
Nginx (port 80/443)  ──  accounting.voipsystem.org
   |
   ├── /            -->  Next.js  (127.0.0.1:3000)
   ├── /api/        -->  NestJS   (127.0.0.1:3001)  <-- internal only
   └── /api/docs/   -->  Swagger  (127.0.0.1:3001)  <-- blocked publicly

PostgreSQL (127.0.0.1:5432)  <-- internal only
Redis      (127.0.0.1:6379)  <-- internal only
```

---

## 1. Server Requirements

- Ubuntu 22.04+ (or Debian 12+)
- Node.js 20 LTS
- pnpm 9+
- PostgreSQL 16
- Redis 7
- Nginx
- PM2 (process manager)
- At least 2 GB RAM, 20 GB disk

---

## 2. DNS Setup

Add an A record pointing to your server IP:

```
Type: A
Name: accounting
Value: <YOUR_SERVER_IP>
TTL: 300
```

Verify: `ping accounting.voipsystem.org`

---

## 3. Server Initial Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install essential tools
sudo apt install -y curl git build-essential
```

---

## 4. Install Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm@9

# Install PM2
npm install -g pm2
```

Verify:
```bash
node -v   # v20.x.x
pnpm -v   # 9.x.x
pm2 -v
```

---

## 5. Install PostgreSQL 16

```bash
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable
sudo systemctl enable postgresql
sudo systemctl start postgresql

# Create database and user
sudo -u postgres psql <<EOF
CREATE USER accounting_user WITH PASSWORD 'YOUR_STRONG_DB_PASSWORD';
CREATE DATABASE accounting_prod OWNER accounting_user;
GRANT ALL PRIVILEGES ON DATABASE accounting_prod TO accounting_user;
EOF
```

PostgreSQL only listens on localhost by default — no changes needed.

---

## 6. Install Redis 7

```bash
sudo apt install -y redis-server

# Ensure Redis binds to localhost only
sudo sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf
sudo systemctl restart redis
sudo systemctl enable redis
```

Verify: `redis-cli ping` should return `PONG`

---

## 7. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
```

---

## 8. Clone and Install the Application

```bash
# Create app directory
sudo mkdir -p /var/www/accounting
sudo chown $USER:$USER /var/www/accounting

# Clone repository
git clone <YOUR_REPO_URL> /var/www/accounting
cd /var/www/accounting

# Install dependencies
pnpm install
```

---

## 9. Environment Configuration

### Root `.env`

```bash
cat > /var/www/accounting/.env << 'EOF'
# Database
DATABASE_URL="postgresql://accounting_user:YOUR_STRONG_DB_PASSWORD@localhost:5432/accounting_prod?schema=public"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT (generate strong random secrets)
JWT_SECRET="GENERATE_WITH: openssl rand -base64 48"
JWT_REFRESH_SECRET="GENERATE_WITH: openssl rand -base64 48"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# App
API_PORT=3001
WEB_PORT=3000
NODE_ENV="production"

# MFA
MFA_APP_NAME="AccountingSaaS"

# Frontend URL passed to Next.js at build time (use https after SSL setup)
NEXT_PUBLIC_API_URL="https://accounting.voipsystem.org/api/v1"

# CORS — allow the frontend origin
WEB_URL="https://accounting.voipsystem.org"

# App URL (used in emails etc.)
APP_URL="https://accounting.voipsystem.org"

# SMTP (Email) — configure with your provider
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="Accounting SaaS <noreply@voipsystem.org>"

# Super Admin
SUPER_ADMIN_EMAIL="admin@voipsystem.org"
SUPER_ADMIN_PASSWORD="CHANGE_THIS_STRONG_PASSWORD"
EOF
```

> **IMPORTANT:** Each variable must be on its own line. Do not put comments and values on the same line — it will break parsing.

### API `.env`

```bash
cp /var/www/accounting/.env /var/www/accounting/apps/api/.env
```

**Generate real JWT secrets:**

```bash
echo "JWT_SECRET=$(openssl rand -base64 48)"
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 48)"
```

Replace the placeholder values in both `.env` files.

---

## 10. Database Migration and Seeding

```bash
cd /var/www/accounting

# Generate Prisma client
pnpm prisma:generate

# Run migrations
pnpm prisma:migrate

# Seed initial data (super admin + demo data)
pnpm prisma:seed
```

---

## 11. Build the Application

> **CRITICAL:** `NEXT_PUBLIC_API_URL` is baked into the Next.js JavaScript bundle at build time. If you change it, you must delete `.next/` and rebuild.

```bash
cd /var/www/accounting

# Build shared package and API
pnpm --filter @accounting-saas/shared build
pnpm --filter api build

# Build web with explicit env var to ensure it's picked up
cd /var/www/accounting/apps/web
rm -rf .next
NEXT_PUBLIC_API_URL="https://accounting.voipsystem.org/api/v1" npx next build
```

Verify the correct URL was baked in:

```bash
grep -r "localhost:3001" /var/www/accounting/apps/web/.next/ 2>/dev/null | head -3
# Should return NO results

grep -r "accounting.voipsystem.org" /var/www/accounting/apps/web/.next/ 2>/dev/null | head -3
# Should return results
```

---

## 12. Lock Down the API — Listen on Localhost Only

Edit `apps/api/src/main.ts` and change the listen address from `0.0.0.0` to `127.0.0.1`:

```typescript
// Change this:
await app.listen(port, '0.0.0.0');

// To this:
await app.listen(port, '127.0.0.1');
```

Then rebuild the API:

```bash
cd /var/www/accounting
pnpm --filter api build
```

This ensures the API **cannot** be accessed directly from the internet, even if the firewall is misconfigured.

---

## 13. Nginx Configuration

Create the site config:

```bash
sudo tee /etc/nginx/sites-available/accounting.voipsystem.org.conf << 'NGINX'
server {
    listen 80;
    server_name accounting.voipsystem.org;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Block direct access to Swagger docs from public
    location /api/docs {
        deny all;
        return 403;
    }

    # Proxy API requests to internal NestJS (not exposed publicly on port 3001)
    location /api/ {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        # Upload limits (match API's 10MB multipart limit)
        client_max_body_size 10M;
    }

    # Proxy everything else to Next.js frontend
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
NGINX
```

Enable the site:

```bash
# Enable site
sudo ln -sf /etc/nginx/sites-available/accounting.voipsystem.org.conf /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm -f /etc/nginx/sites-enabled/default

# Test config
sudo nginx -t

# Reload
sudo systemctl reload nginx
```

---

## 14. SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx

sudo certbot --nginx -d accounting.voipsystem.org
```

Certbot will automatically modify the Nginx config to add SSL and redirect HTTP to HTTPS.

After SSL is set up, **rebuild the web app** if you initially built with `http://`:

```bash
cd /var/www/accounting/apps/web
rm -rf .next
NEXT_PUBLIC_API_URL="https://accounting.voipsystem.org/api/v1" npx next build
pm2 restart accounting-web
```

Also update `.env` and `apps/api/.env` to use `https://` for `WEB_URL` and `APP_URL`:

```bash
sed -i 's|http://accounting.voipsystem.org|https://accounting.voipsystem.org|g' /var/www/accounting/.env
sed -i 's|http://accounting.voipsystem.org|https://accounting.voipsystem.org|g' /var/www/accounting/apps/api/.env
pm2 restart accounting-api
```

---

## 15. Start with PM2

Create the PM2 ecosystem file:

```bash
cat > /var/www/accounting/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'accounting-api',
      cwd: '/var/www/accounting/apps/api',
      script: 'dist/src/main.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/accounting/api-error.log',
      out_file: '/var/log/accounting/api-out.log',
    },
    {
      name: 'accounting-web',
      cwd: '/var/www/accounting/apps/web',
      script: 'npx',
      args: 'next start --port 3000',
      instances: 1,
      env: {
        NODE_ENV: 'production',
      },
      error_file: '/var/log/accounting/web-error.log',
      out_file: '/var/log/accounting/web-out.log',
    },
  ],
};
EOF
```

Create log directory and start:

```bash
sudo mkdir -p /var/log/accounting
sudo chown $USER:$USER /var/log/accounting

# Start both apps
pm2 start ecosystem.config.js

# Save PM2 process list and set up startup on boot
pm2 save
pm2 startup
# Run the command it outputs (with sudo)
```

### PM2 Commands

```bash
pm2 status                    # Check running processes
pm2 logs                      # View all logs
pm2 logs accounting-api       # View API logs only
pm2 restart all               # Restart everything
pm2 restart accounting-api    # Restart API only
pm2 restart accounting-web    # Restart web only
```

---

## 16. Firewall Setup

Only allow HTTP, HTTPS, and SSH. Block direct access to app ports:

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Verify — ports 3000, 3001, 5432, 6379 should NOT be listed
sudo ufw status
```

---

## 17. Verify Deployment

```bash
# Check services are running
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis

# Test from the server
curl -s http://127.0.0.1:3001/api/v1 | head      # API responds internally
curl -s https://accounting.voipsystem.org          # Frontend loads via Nginx
curl -s https://accounting.voipsystem.org/api/v1   # API proxied through Nginx

# Confirm API port is NOT reachable externally
# From your local machine:
curl http://accounting.voipsystem.org:3001         # Should timeout/refuse
```

---

## 18. Updating the Application

```bash
cd /var/www/accounting

# Pull latest code
git pull origin main

# Install any new dependencies
pnpm install

# Generate Prisma client (if schema changed)
pnpm prisma:generate

# Run new migrations (if any)
pnpm prisma:migrate

# Rebuild API
pnpm --filter api build

# Rebuild web (always pass the env var explicitly)
cd apps/web
rm -rf .next
NEXT_PUBLIC_API_URL="https://accounting.voipsystem.org/api/v1" npx next build

# Restart
pm2 restart all
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Failed to fetch` on login | Check `NEXT_PUBLIC_API_URL` was set at build time. Run `grep -r "localhost:3001" apps/web/.next/` — if results appear, rebuild with the env var. |
| `blocked:mixed-content` | Page is `https` but API URL is `http`. Rebuild web with `https` URL. |
| `nest build` hangs | Run `pnpm prisma:generate` first. The build needs the Prisma client. |
| `Script not found: dist/main.js` | The NestJS build outputs to `dist/src/main.js`, not `dist/main.js`. |
| PM2 web app errors silently | pnpm hoists `next` — use `script: 'npx'` with `args: 'next start --port 3000'` in PM2 config. |
| CORS preflight pending | Ensure `WEB_URL` in `apps/api/.env` matches the frontend origin exactly (including `https`). |

---

## Quick Reference

| Item             | Value                                          |
|------------------|-------------------------------------------------|
| Domain           | `https://accounting.voipsystem.org`             |
| Frontend         | `http://127.0.0.1:3000` (internal)              |
| API              | `http://127.0.0.1:3001` (internal)              |
| API public path  | `https://accounting.voipsystem.org/api/v1`      |
| Database         | `localhost:5432/accounting_prod`                 |
| Redis            | `localhost:6379`                                 |
| App directory    | `/var/www/accounting`                            |
| Logs             | `/var/log/accounting/`                           |
| Nginx config     | `/etc/nginx/sites-available/accounting.voipsystem.org.conf` |
| PM2 config       | `/var/www/accounting/ecosystem.config.js`        |
