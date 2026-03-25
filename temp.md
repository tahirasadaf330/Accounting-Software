                                                                                                                       
  NEXT_PUBLIC_API_URL="https://accounting.voipsystem.org/api/v1"
  WEB_URL="https://accounting.voipsystem.org"
  APP_URL="https://accounting.voipsystem.org"

  Then rebuild and restart:

  cd /var/www/accounting/apps/web
  export NEXT_PUBLIC_API_URL="https://accounting.voipsystem.org/api/v1"
  npx next build
  pm2 restart all



         Role       │            Email            │   Password    │
  ├──────────────────┼─────────────────────────────┼───────────────┤
  │ Super Admin      │ admin@accounting-saas.local │ ChangeMe123!  │
  ├──────────────────┼─────────────────────────────┼───────────────┤
  │ Owner            │ owner@demo-company.com      │ DemoOwner123! │
  ├──────────────────┼─────────────────────────────┼───────────────┤
  │ Chief Accountant │ chief@demo-company.com      │ DemoChief123! │
  ├──────────────────┼─────────────────────────────┼───────────────┤
  │ Accountant       │ accountant@demo-company.com │ DemoAcct123!  