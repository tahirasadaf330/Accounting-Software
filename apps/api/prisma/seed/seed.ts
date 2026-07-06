import { PrismaClient, Role, TenantStatus, UserStatus, AccountType, NormalBalance } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Seed currencies
  const currencies = [
    { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2 },
    { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2 },
    { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2 },
    { code: 'CAD', name: 'Canadian Dollar', symbol: 'CA$', decimalPlaces: 2 },
    { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2 },
    { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0 },
    { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2 },
    { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2 },
    { code: 'INR', name: 'Indian Rupee', symbol: '₹', decimalPlaces: 2 },
    { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨', decimalPlaces: 2 },
    { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ', decimalPlaces: 2 },
    { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼', decimalPlaces: 2 },
    { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$', decimalPlaces: 2 },
    { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM', decimalPlaces: 2 },
    { code: 'BRL', name: 'Brazilian Real', symbol: 'R$', decimalPlaces: 2 },
  ];

  for (const currency of currencies) {
    await prisma.currency.upsert({
      where: { code: currency.code },
      update: {},
      create: currency,
    });
  }
  console.log(`  ✓ Seeded ${currencies.length} currencies`);

  // 2. Create platform owner user (no tenant)
  const superAdminEmail = process.env.SUPER_ADMIN_EMAIL || 'admin@accounting-saas.local';
  const superAdminPassword = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe123!';
  const hashedPassword = await argon2.hash(superAdminPassword);

  const superAdmin = await prisma.user.upsert({
    where: { email: superAdminEmail },
    update: {},
    create: {
      email: superAdminEmail,
      passwordHash: hashedPassword,
      firstName: 'Platform',
      lastName: 'Owner',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
    },
  });
  console.log(`  ✓ Platform Owner created: ${superAdmin.email}`);

  // 3. Create Hayo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'hayo' },
    update: {},
    create: {
      name: 'Hayo',
      slug: 'hayo',
      baseCurrency: 'USD',
      fiscalYearStartMonth: 1,
      timezone: 'America/New_York',
      locale: 'en-US',
      status: TenantStatus.ACTIVE,
    },
  });
  console.log(`  ✓ Tenant created: ${demoTenant.name}`);

  // 4. Create Hayo tenant users
  const defaultPassword = await argon2.hash('Hayo@12345');

  const hayoUsers = [
    { email: 'ceo@hayo.net', firstName: 'Feraz', lastName: 'Ahmad', role: Role.OWNER },
    { email: 'tahira.sadaf@kingrevolution.com', firstName: 'Tahira', lastName: 'Sadaf', role: Role.OWNER },
    { email: 'misbah.asghar@hayo.net', firstName: 'Misbah', lastName: 'Asghar', role: Role.FINANCE_MANAGER },
    { email: 'arsalan.ali@hayo.net', firstName: 'Arsalan', lastName: 'Ali', role: Role.ASSISTANT_MANAGER_BILLING },
    { email: 'faisal.hussain@hayo.net', firstName: 'Muhammad', lastName: 'Faisal', role: Role.SENIOR_OFFICE_PAYMENTS },
    { email: 'ahmad.hassan@hayo.net', firstName: 'Ahmad', lastName: 'Hassan', role: Role.SENIOR_ARAP_OFFICER },
    { email: 'imran.abbas@kingrevolution.com', firstName: 'Imran', lastName: 'Abbas', role: Role.PAYMENT_OFFICER },
  ];

  for (const u of hayoUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
        tenantId: demoTenant.id,
      },
      create: {
        email: u.email,
        passwordHash: defaultPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
        status: UserStatus.ACTIVE,
        tenantId: demoTenant.id,
      },
    });
    console.log(`  ✓ User upserted: ${user.email} (${user.role})`);
  }

  // Tahira Sadaf (Owner) — custom password
  const tahiraPassword = await argon2.hash('sadaf330@');
  const tahiraUser = await prisma.user.upsert({
    where: { email: 'tahira.sadaf@kingrevolution.com' },
    update: {
      role: Role.OWNER,
      firstName: 'Tahira',
      lastName: 'Sadaf',
      tenantId: demoTenant.id,
      passwordHash: tahiraPassword,
    },
    create: {
      email: 'tahira.sadaf@kingrevolution.com',
      passwordHash: tahiraPassword,
      firstName: 'Tahira',
      lastName: 'Sadaf',
      role: Role.OWNER,
      status: UserStatus.ACTIVE,
      tenantId: demoTenant.id,
    },
  });
  console.log(`  ✓ User upserted: ${tahiraUser.email} (${tahiraUser.role})`);

  // 7. Seed Chart of Accounts for demo tenant
  const accounts = [
    // Level 1: Categories
    { code: '1000', name: 'Assets', type: AccountType.ASSET, level: 1, normal: NormalBalance.DEBIT, isSystem: true },
    { code: '2000', name: 'Liabilities', type: AccountType.LIABILITY, level: 1, normal: NormalBalance.CREDIT, isSystem: true },
    { code: '3000', name: 'Equity', type: AccountType.EQUITY, level: 1, normal: NormalBalance.CREDIT, isSystem: true },
    { code: '4000', name: 'Revenue', type: AccountType.REVENUE, level: 1, normal: NormalBalance.CREDIT, isSystem: true },
    { code: '5000', name: 'Cost of Goods Sold', type: AccountType.COGS, level: 1, normal: NormalBalance.DEBIT, isSystem: true },
    { code: '6000', name: 'Expenses', type: AccountType.EXPENSE, level: 1, normal: NormalBalance.DEBIT, isSystem: true },

    // Level 2: Groups (Assets)
    { code: '1100', name: 'Current Assets', type: AccountType.ASSET, level: 2, normal: NormalBalance.DEBIT, parent: '1000' },
    { code: '1200', name: 'Bank Accounts', type: AccountType.ASSET, level: 2, normal: NormalBalance.DEBIT, parent: '1000' },
    { code: '1300', name: 'Accounts Receivable', type: AccountType.ASSET, level: 2, normal: NormalBalance.DEBIT, parent: '1000' },
    { code: '1400', name: 'Inventory', type: AccountType.ASSET, level: 2, normal: NormalBalance.DEBIT, parent: '1000' },
    { code: '1500', name: 'Fixed Assets', type: AccountType.ASSET, level: 2, normal: NormalBalance.DEBIT, parent: '1000' },

    // Level 2: Groups (Liabilities)
    { code: '2100', name: 'Current Liabilities', type: AccountType.LIABILITY, level: 2, normal: NormalBalance.CREDIT, parent: '2000' },
    { code: '2200', name: 'Long-Term Liabilities', type: AccountType.LIABILITY, level: 2, normal: NormalBalance.CREDIT, parent: '2000' },

    // Level 2: Groups (Equity)
    { code: '3100', name: "Owner's Equity", type: AccountType.EQUITY, level: 2, normal: NormalBalance.CREDIT, parent: '3000' },
    { code: '3200', name: 'Retained Earnings', type: AccountType.EQUITY, level: 2, normal: NormalBalance.CREDIT, parent: '3000' },

    // Level 2: Groups (Revenue)
    { code: '4100', name: 'Operating Revenue', type: AccountType.REVENUE, level: 2, normal: NormalBalance.CREDIT, parent: '4000' },
    { code: '4200', name: 'Other Income', type: AccountType.REVENUE, level: 2, normal: NormalBalance.CREDIT, parent: '4000' },

    // Level 2: Groups (COGS)
    { code: '5100', name: 'Direct Costs', type: AccountType.COGS, level: 2, normal: NormalBalance.DEBIT, parent: '5000' },

    // Level 2: Groups (Expenses)
    { code: '6100', name: 'Operating Expenses', type: AccountType.EXPENSE, level: 2, normal: NormalBalance.DEBIT, parent: '6000' },
    { code: '6200', name: 'Administrative Expenses', type: AccountType.EXPENSE, level: 2, normal: NormalBalance.DEBIT, parent: '6000' },
    { code: '6300', name: 'Financial Expenses', type: AccountType.EXPENSE, level: 2, normal: NormalBalance.DEBIT, parent: '6000' },

    // Level 3: Sub-groups (Current Assets)
    { code: '1110', name: 'Cash and Cash Equivalents', type: AccountType.ASSET, level: 3, normal: NormalBalance.DEBIT, parent: '1100' },
    { code: '1120', name: 'Short-Term Investments', type: AccountType.ASSET, level: 3, normal: NormalBalance.DEBIT, parent: '1100' },

    // Level 3: Sub-groups (Bank Accounts)
    { code: '1210', name: 'Checking Accounts', type: AccountType.ASSET, level: 3, normal: NormalBalance.DEBIT, parent: '1200' },
    { code: '1220', name: 'Savings Accounts', type: AccountType.ASSET, level: 3, normal: NormalBalance.DEBIT, parent: '1200' },

    // Level 4: Detail Accounts
    { code: '1111', name: 'Petty Cash', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1110' },
    { code: '1112', name: 'Cash on Hand', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1110' },
    { code: '1211', name: 'Main Checking Account', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1210' },
    { code: '1212', name: 'Payroll Checking Account', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1210' },
    { code: '1221', name: 'Business Savings Account', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1220' },
    { code: '1301', name: 'Trade Receivables', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1300' },
    { code: '1302', name: 'Allowance for Doubtful Accounts', type: AccountType.ASSET, level: 4, normal: NormalBalance.CREDIT, parent: '1300' },
    { code: '1401', name: 'Raw Materials', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1400' },
    { code: '1402', name: 'Finished Goods', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1400' },
    { code: '1501', name: 'Furniture & Equipment', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1500' },
    { code: '1502', name: 'Vehicles', type: AccountType.ASSET, level: 4, normal: NormalBalance.DEBIT, parent: '1500' },
    { code: '1503', name: 'Accumulated Depreciation', type: AccountType.ASSET, level: 4, normal: NormalBalance.CREDIT, parent: '1500' },

    // Detail Accounts (Liabilities)
    { code: '2101', name: 'Accounts Payable', type: AccountType.LIABILITY, level: 4, normal: NormalBalance.CREDIT, parent: '2100' },
    { code: '2102', name: 'Accrued Expenses', type: AccountType.LIABILITY, level: 4, normal: NormalBalance.CREDIT, parent: '2100' },
    { code: '2103', name: 'Sales Tax Payable', type: AccountType.LIABILITY, level: 4, normal: NormalBalance.CREDIT, parent: '2100' },
    { code: '2104', name: 'Wages Payable', type: AccountType.LIABILITY, level: 4, normal: NormalBalance.CREDIT, parent: '2100' },
    { code: '2201', name: 'Bank Loan', type: AccountType.LIABILITY, level: 4, normal: NormalBalance.CREDIT, parent: '2200' },
    { code: '2202', name: 'Mortgage Payable', type: AccountType.LIABILITY, level: 4, normal: NormalBalance.CREDIT, parent: '2200' },

    // Detail Accounts (Equity)
    { code: '3101', name: 'Capital Account', type: AccountType.EQUITY, level: 4, normal: NormalBalance.CREDIT, parent: '3100' },
    { code: '3102', name: 'Drawings', type: AccountType.EQUITY, level: 4, normal: NormalBalance.DEBIT, parent: '3100' },
    { code: '3201', name: 'Retained Earnings - Current Year', type: AccountType.EQUITY, level: 4, normal: NormalBalance.CREDIT, parent: '3200' },
    { code: '3202', name: 'Retained Earnings - Prior Years', type: AccountType.EQUITY, level: 4, normal: NormalBalance.CREDIT, parent: '3200' },

    // Detail Accounts (Revenue)
    { code: '4101', name: 'Sales Revenue', type: AccountType.REVENUE, level: 4, normal: NormalBalance.CREDIT, parent: '4100' },
    { code: '4102', name: 'Service Revenue', type: AccountType.REVENUE, level: 4, normal: NormalBalance.CREDIT, parent: '4100' },
    { code: '4103', name: 'Sales Returns & Allowances', type: AccountType.REVENUE, level: 4, normal: NormalBalance.DEBIT, parent: '4100' },
    { code: '4201', name: 'Interest Income', type: AccountType.REVENUE, level: 4, normal: NormalBalance.CREDIT, parent: '4200' },
    { code: '4202', name: 'Foreign Exchange Gain', type: AccountType.REVENUE, level: 4, normal: NormalBalance.CREDIT, parent: '4200' },

    // Detail Accounts (COGS)
    { code: '5101', name: 'Cost of Materials', type: AccountType.COGS, level: 4, normal: NormalBalance.DEBIT, parent: '5100' },
    { code: '5102', name: 'Direct Labour', type: AccountType.COGS, level: 4, normal: NormalBalance.DEBIT, parent: '5100' },
    { code: '5103', name: 'Manufacturing Overhead', type: AccountType.COGS, level: 4, normal: NormalBalance.DEBIT, parent: '5100' },

    // Detail Accounts (Expenses)
    { code: '6101', name: 'Salaries & Wages', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6100' },
    { code: '6102', name: 'Rent Expense', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6100' },
    { code: '6103', name: 'Utilities Expense', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6100' },
    { code: '6104', name: 'Insurance Expense', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6100' },
    { code: '6105', name: 'Marketing & Advertising', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6100' },
    { code: '6201', name: 'Office Supplies', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6200' },
    { code: '6202', name: 'Depreciation Expense', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6200' },
    { code: '6203', name: 'Professional Fees', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6200' },
    { code: '6301', name: 'Bank Charges', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6300' },
    { code: '6302', name: 'Interest Expense', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6300' },
    { code: '6303', name: 'Foreign Exchange Loss', type: AccountType.EXPENSE, level: 4, normal: NormalBalance.DEBIT, parent: '6300' },
  ];

  // Create accounts in order (parents first)
  const accountIdMap = new Map<string, string>();
  for (const acct of accounts) {
    const parentId = acct.parent ? accountIdMap.get(acct.parent) : null;
    const created = await prisma.account.upsert({
      where: { tenantId_code: { tenantId: demoTenant.id, code: acct.code } },
      update: {},
      create: {
        tenantId: demoTenant.id,
        code: acct.code,
        name: acct.name,
        accountType: acct.type,
        level: acct.level,
        normalBalance: acct.normal,
        isSystem: acct.isSystem || false,
        parentId: parentId || undefined,
      },
    });
    accountIdMap.set(acct.code, created.id);
  }
  console.log(`  ✓ Seeded ${accounts.length} chart of accounts entries`);

  // 8. Create fiscal year for demo tenant
  const currentYear = new Date().getFullYear();
  const fiscalYear = await prisma.fiscalYear.upsert({
    where: { tenantId_name: { tenantId: demoTenant.id, name: `FY ${currentYear}` } },
    update: {},
    create: {
      tenantId: demoTenant.id,
      name: `FY ${currentYear}`,
      startDate: new Date(`${currentYear}-01-01`),
      endDate: new Date(`${currentYear}-12-31`),
    },
  });

  // Create 12 fiscal periods
  for (let month = 1; month <= 12; month++) {
    const startDate = new Date(`${currentYear}-${String(month).padStart(2, '0')}-01`);
    const endDate = new Date(currentYear, month, 0); // Last day of month
    await prisma.fiscalPeriod.upsert({
      where: {
        tenantId_fiscalYearId_periodNumber: {
          tenantId: demoTenant.id,
          fiscalYearId: fiscalYear.id,
          periodNumber: month,
        },
      },
      update: {},
      create: {
        tenantId: demoTenant.id,
        fiscalYearId: fiscalYear.id,
        name: startDate.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
        startDate,
        endDate,
        periodNumber: month,
      },
    });
  }
  console.log(`  ✓ Seeded fiscal year FY ${currentYear} with 12 periods`);

  // 9. Seed Account Template (General Business)
  const generalTemplate = accounts.map((a) => ({
    code: a.code,
    name: a.name,
    accountType: a.type,
    level: a.level,
    normalBalance: a.normal,
    parentCode: a.parent || null,
    isSystem: a.isSystem || false,
  }));

  await prisma.accountTemplate.upsert({
    where: { industry: 'General Business' },
    update: { accounts: generalTemplate, description: 'A versatile chart of accounts suitable for most small to medium businesses with standard accounting needs.' },
    create: {
      industry: 'General Business',
      name: 'General Business Chart of Accounts',
      description: 'A versatile chart of accounts suitable for most small to medium businesses with standard accounting needs.',
      accounts: generalTemplate,
    },
  });
  console.log('  ✓ Seeded General Business account template');

  // 10. Seed additional Account Templates

  // Retail & E-Commerce
  const retailAccounts = [
    { code: '1000', name: 'Assets', accountType: 'ASSET', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '2000', name: 'Liabilities', accountType: 'LIABILITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '3000', name: 'Equity', accountType: 'EQUITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '4000', name: 'Revenue', accountType: 'REVENUE', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '5000', name: 'Cost of Goods Sold', accountType: 'COGS', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '6000', name: 'Expenses', accountType: 'EXPENSE', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '1100', name: 'Current Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1200', name: 'Bank Accounts', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1300', name: 'Accounts Receivable', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1400', name: 'Inventory', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1500', name: 'Fixed Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '2100', name: 'Current Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '2200', name: 'Long-Term Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '3100', name: "Owner's Equity", accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '4100', name: 'Product Sales', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4200', name: 'Online Sales', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4300', name: 'Other Income', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '5100', name: 'Product Costs', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5200', name: 'Shipping & Fulfillment Costs', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '6100', name: 'Operating Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6200', name: 'Marketing & Advertising', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6300', name: 'Platform & Technology', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6400', name: 'Administrative Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '1110', name: 'Cash and Cash Equivalents', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1210', name: 'Main Checking Account', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1301', name: 'Trade Receivables', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1401', name: 'Merchandise Inventory', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1400' },
    { code: '1402', name: 'Packaging Supplies', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1400' },
    { code: '1501', name: 'Store Equipment & Fixtures', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1502', name: 'Accumulated Depreciation', accountType: 'ASSET', level: 3, normalBalance: 'CREDIT', parentCode: '1500' },
    { code: '2101', name: 'Accounts Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2102', name: 'Sales Tax Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2103', name: 'Credit Card Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2201', name: 'Business Loan', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2200' },
    { code: '3101', name: 'Capital Account', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3201', name: 'Retained Earnings - Current Year', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '4101', name: 'In-Store Sales', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4102', name: 'Sales Returns & Allowances', accountType: 'REVENUE', level: 3, normalBalance: 'DEBIT', parentCode: '4100' },
    { code: '4201', name: 'E-Commerce Sales', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4202', name: 'Marketplace Sales', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '5101', name: 'Cost of Merchandise', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5102', name: 'Inventory Shrinkage', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5201', name: 'Shipping Costs', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5202', name: 'Packaging Costs', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '6101', name: 'Rent Expense', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6102', name: 'Utilities Expense', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6103', name: 'Salaries & Wages', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6201', name: 'Online Advertising', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6202', name: 'Promotions & Discounts', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6301', name: 'E-Commerce Platform Fees', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6300' },
    { code: '6302', name: 'Payment Processing Fees', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6300' },
    { code: '6401', name: 'Office Supplies', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6400' },
    { code: '6402', name: 'Insurance Expense', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6400' },
  ];

  await prisma.accountTemplate.upsert({
    where: { industry: 'Retail & E-Commerce' },
    update: { accounts: retailAccounts, description: 'Designed for retail stores and online sellers with inventory tracking, shipping costs, and multi-channel sales.' },
    create: {
      industry: 'Retail & E-Commerce',
      name: 'Retail & E-Commerce Chart of Accounts',
      description: 'Designed for retail stores and online sellers with inventory tracking, shipping costs, and multi-channel sales.',
      accounts: retailAccounts,
    },
  });
  console.log('  ✓ Seeded Retail & E-Commerce account template');

  // Professional Services
  const servicesAccounts = [
    { code: '1000', name: 'Assets', accountType: 'ASSET', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '2000', name: 'Liabilities', accountType: 'LIABILITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '3000', name: 'Equity', accountType: 'EQUITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '4000', name: 'Revenue', accountType: 'REVENUE', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '5000', name: 'Cost of Services', accountType: 'COGS', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '6000', name: 'Expenses', accountType: 'EXPENSE', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '1100', name: 'Current Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1200', name: 'Bank Accounts', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1300', name: 'Accounts Receivable', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1500', name: 'Fixed Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '2100', name: 'Current Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '3100', name: "Partner's Equity", accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '4100', name: 'Professional Fees', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4200', name: 'Consulting Revenue', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4300', name: 'Other Income', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '5100', name: 'Direct Labour', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5200', name: 'Subcontractor Costs', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '6100', name: 'Personnel Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6200', name: 'Office Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6300', name: 'Professional Development', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6400', name: 'Marketing & Business Dev', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6500', name: 'Financial Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '1110', name: 'Cash on Hand', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1210', name: 'Main Checking Account', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1301', name: 'Client Receivables', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1302', name: 'Unbilled Revenue', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1501', name: 'Office Equipment', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1502', name: 'Accumulated Depreciation', accountType: 'ASSET', level: 3, normalBalance: 'CREDIT', parentCode: '1500' },
    { code: '2101', name: 'Accounts Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2102', name: 'Deferred Revenue', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2103', name: 'Payroll Liabilities', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '3101', name: 'Capital Account', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3201', name: 'Retained Earnings - Current Year', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '4101', name: 'Legal Fees', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4102', name: 'Accounting Fees', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4201', name: 'Advisory Services', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '5101', name: 'Staff Billable Time', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5201', name: 'Outsourced Services', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '6101', name: 'Salaries & Wages', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6102', name: 'Employee Benefits', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6201', name: 'Office Rent', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6202', name: 'Office Supplies', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6301', name: 'Training & Certifications', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6300' },
    { code: '6401', name: 'Client Entertainment', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6400' },
    { code: '6501', name: 'Bank Charges', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6500' },
  ];

  await prisma.accountTemplate.upsert({
    where: { industry: 'Professional Services' },
    update: { accounts: servicesAccounts, description: 'Tailored for law firms, consultancies, agencies, and other service-based businesses with billable hours.' },
    create: {
      industry: 'Professional Services',
      name: 'Professional Services Chart of Accounts',
      description: 'Tailored for law firms, consultancies, agencies, and other service-based businesses with billable hours.',
      accounts: servicesAccounts,
    },
  });
  console.log('  ✓ Seeded Professional Services account template');

  // Manufacturing
  const manufacturingAccounts = [
    { code: '1000', name: 'Assets', accountType: 'ASSET', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '2000', name: 'Liabilities', accountType: 'LIABILITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '3000', name: 'Equity', accountType: 'EQUITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '4000', name: 'Revenue', accountType: 'REVENUE', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '5000', name: 'Cost of Goods Manufactured', accountType: 'COGS', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '6000', name: 'Expenses', accountType: 'EXPENSE', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '1100', name: 'Current Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1200', name: 'Bank Accounts', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1300', name: 'Accounts Receivable', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1400', name: 'Inventory', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1500', name: 'Property, Plant & Equipment', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '2100', name: 'Current Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '2200', name: 'Long-Term Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '3100', name: "Owner's Equity", accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '4100', name: 'Product Sales', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4200', name: 'Other Income', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '5100', name: 'Raw Materials', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5200', name: 'Direct Labour', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5300', name: 'Manufacturing Overhead', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '6100', name: 'Selling Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6200', name: 'Administrative Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '1110', name: 'Cash and Cash Equivalents', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1210', name: 'Main Checking Account', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1301', name: 'Trade Receivables', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1401', name: 'Raw Materials Inventory', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1400' },
    { code: '1402', name: 'Work in Progress', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1400' },
    { code: '1403', name: 'Finished Goods Inventory', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1400' },
    { code: '1501', name: 'Machinery & Equipment', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1502', name: 'Factory Building', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1503', name: 'Accumulated Depreciation', accountType: 'ASSET', level: 3, normalBalance: 'CREDIT', parentCode: '1500' },
    { code: '2101', name: 'Accounts Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2102', name: 'Wages Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2201', name: 'Equipment Loan', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2200' },
    { code: '3101', name: 'Capital Account', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3201', name: 'Retained Earnings - Current Year', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '4101', name: 'Finished Goods Sales', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4102', name: 'Scrap Sales', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '5101', name: 'Raw Material Purchases', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5201', name: 'Factory Wages', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5301', name: 'Factory Utilities', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5300' },
    { code: '5302', name: 'Depreciation - Factory Equipment', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5300' },
    { code: '5303', name: 'Factory Supplies', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5300' },
    { code: '6101', name: 'Sales Salaries', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6102', name: 'Shipping & Distribution', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6201', name: 'Admin Salaries', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6202', name: 'Office Rent', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6203', name: 'Insurance Expense', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
  ];

  await prisma.accountTemplate.upsert({
    where: { industry: 'Manufacturing' },
    update: { accounts: manufacturingAccounts, description: 'Built for manufacturing businesses with raw materials, WIP inventory, factory overhead, and production cost tracking.' },
    create: {
      industry: 'Manufacturing',
      name: 'Manufacturing Chart of Accounts',
      description: 'Built for manufacturing businesses with raw materials, WIP inventory, factory overhead, and production cost tracking.',
      accounts: manufacturingAccounts,
    },
  });
  console.log('  ✓ Seeded Manufacturing account template');

  // Non-Profit Organization
  const nonprofitAccounts = [
    { code: '1000', name: 'Assets', accountType: 'ASSET', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '2000', name: 'Liabilities', accountType: 'LIABILITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '3000', name: 'Net Assets', accountType: 'EQUITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '4000', name: 'Revenue & Support', accountType: 'REVENUE', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '5000', name: 'Program Expenses', accountType: 'COGS', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '6000', name: 'Operating Expenses', accountType: 'EXPENSE', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '1100', name: 'Current Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1200', name: 'Bank Accounts', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1300', name: 'Pledges & Grants Receivable', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1500', name: 'Fixed Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '2100', name: 'Current Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '3100', name: 'Without Donor Restrictions', accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '3200', name: 'With Donor Restrictions', accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '4100', name: 'Donations & Contributions', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4200', name: 'Grants', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4300', name: 'Fundraising Revenue', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4400', name: 'Program Service Revenue', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4500', name: 'Other Income', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '5100', name: 'Program A Expenses', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5200', name: 'Program B Expenses', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '6100', name: 'Management & General', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6200', name: 'Fundraising Expenses', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '1110', name: 'Cash and Cash Equivalents', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1210', name: 'Main Checking Account', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1211', name: 'Restricted Funds Account', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1301', name: 'Pledges Receivable', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1302', name: 'Grants Receivable', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1501', name: 'Office Equipment', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1502', name: 'Accumulated Depreciation', accountType: 'ASSET', level: 3, normalBalance: 'CREDIT', parentCode: '1500' },
    { code: '2101', name: 'Accounts Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2102', name: 'Deferred Revenue', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2103', name: 'Payroll Liabilities', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '3101', name: 'Unrestricted Net Assets', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3201', name: 'Temporarily Restricted', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '3202', name: 'Permanently Restricted', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '4101', name: 'Individual Donations', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4102', name: 'Corporate Donations', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4201', name: 'Government Grants', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4202', name: 'Foundation Grants', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4301', name: 'Event Revenue', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4300' },
    { code: '5101', name: 'Program A - Salaries', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5102', name: 'Program A - Supplies', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5201', name: 'Program B - Salaries', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5202', name: 'Program B - Supplies', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '6101', name: 'Admin Salaries', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6102', name: 'Office Rent', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6103', name: 'Insurance', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6201', name: 'Event Costs', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6202', name: 'Donor Communications', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
  ];

  await prisma.accountTemplate.upsert({
    where: { industry: 'Non-Profit Organization' },
    update: { accounts: nonprofitAccounts, description: 'Structured for non-profits with donor restrictions, grant tracking, program-based expense reporting, and fund accounting.' },
    create: {
      industry: 'Non-Profit Organization',
      name: 'Non-Profit Organization Chart of Accounts',
      description: 'Structured for non-profits with donor restrictions, grant tracking, program-based expense reporting, and fund accounting.',
      accounts: nonprofitAccounts,
    },
  });
  console.log('  ✓ Seeded Non-Profit Organization account template');

  // Technology / SaaS
  const techAccounts = [
    { code: '1000', name: 'Assets', accountType: 'ASSET', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '2000', name: 'Liabilities', accountType: 'LIABILITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '3000', name: 'Equity', accountType: 'EQUITY', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '4000', name: 'Revenue', accountType: 'REVENUE', level: 1, normalBalance: 'CREDIT', parentCode: null, isSystem: true },
    { code: '5000', name: 'Cost of Revenue', accountType: 'COGS', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '6000', name: 'Operating Expenses', accountType: 'EXPENSE', level: 1, normalBalance: 'DEBIT', parentCode: null, isSystem: true },
    { code: '1100', name: 'Current Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1200', name: 'Bank Accounts', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1300', name: 'Accounts Receivable', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '1500', name: 'Intangible & Fixed Assets', accountType: 'ASSET', level: 2, normalBalance: 'DEBIT', parentCode: '1000' },
    { code: '2100', name: 'Current Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '2200', name: 'Long-Term Liabilities', accountType: 'LIABILITY', level: 2, normalBalance: 'CREDIT', parentCode: '2000' },
    { code: '3100', name: "Stockholders' Equity", accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '3200', name: 'Retained Earnings', accountType: 'EQUITY', level: 2, normalBalance: 'CREDIT', parentCode: '3000' },
    { code: '4100', name: 'Subscription Revenue', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4200', name: 'Professional Services Revenue', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '4300', name: 'Other Income', accountType: 'REVENUE', level: 2, normalBalance: 'CREDIT', parentCode: '4000' },
    { code: '5100', name: 'Hosting & Infrastructure', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5200', name: 'Customer Support', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '5300', name: 'Third-Party Services', accountType: 'COGS', level: 2, normalBalance: 'DEBIT', parentCode: '5000' },
    { code: '6100', name: 'Research & Development', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6200', name: 'Sales & Marketing', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '6300', name: 'General & Administrative', accountType: 'EXPENSE', level: 2, normalBalance: 'DEBIT', parentCode: '6000' },
    { code: '1110', name: 'Cash and Cash Equivalents', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1100' },
    { code: '1210', name: 'Main Checking Account', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1200' },
    { code: '1301', name: 'Subscription Receivables', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1300' },
    { code: '1501', name: 'Capitalized Software Dev', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1502', name: 'Computer Equipment', accountType: 'ASSET', level: 3, normalBalance: 'DEBIT', parentCode: '1500' },
    { code: '1503', name: 'Accumulated Amortization', accountType: 'ASSET', level: 3, normalBalance: 'CREDIT', parentCode: '1500' },
    { code: '2101', name: 'Accounts Payable', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2102', name: 'Deferred Revenue', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2103', name: 'Payroll Liabilities', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2100' },
    { code: '2201', name: 'Convertible Notes', accountType: 'LIABILITY', level: 3, normalBalance: 'CREDIT', parentCode: '2200' },
    { code: '3101', name: 'Common Stock', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3102', name: 'Additional Paid-In Capital', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3100' },
    { code: '3201', name: 'Retained Earnings - Current Year', accountType: 'EQUITY', level: 3, normalBalance: 'CREDIT', parentCode: '3200' },
    { code: '4101', name: 'Monthly Subscriptions', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4102', name: 'Annual Subscriptions', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4100' },
    { code: '4201', name: 'Implementation Services', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '4202', name: 'Training Revenue', accountType: 'REVENUE', level: 3, normalBalance: 'CREDIT', parentCode: '4200' },
    { code: '5101', name: 'Cloud Hosting (AWS/GCP/Azure)', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5102', name: 'CDN & Bandwidth', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5100' },
    { code: '5201', name: 'Support Staff Salaries', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5200' },
    { code: '5301', name: 'Payment Processing Fees', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5300' },
    { code: '5302', name: 'API & Integration Costs', accountType: 'COGS', level: 3, normalBalance: 'DEBIT', parentCode: '5300' },
    { code: '6101', name: 'Engineering Salaries', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6102', name: 'Software & Tools', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6100' },
    { code: '6201', name: 'Marketing Salaries', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6202', name: 'Advertising & Campaigns', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6200' },
    { code: '6301', name: 'Admin Salaries', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6300' },
    { code: '6302', name: 'Office & Rent', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6300' },
    { code: '6303', name: 'Legal & Compliance', accountType: 'EXPENSE', level: 3, normalBalance: 'DEBIT', parentCode: '6300' },
  ];

  await prisma.accountTemplate.upsert({
    where: { industry: 'Technology / SaaS' },
    update: { accounts: techAccounts, description: 'Optimized for tech startups and SaaS companies with subscription revenue, cloud costs, R&D tracking, and deferred revenue.' },
    create: {
      industry: 'Technology / SaaS',
      name: 'Technology / SaaS Chart of Accounts',
      description: 'Optimized for tech startups and SaaS companies with subscription revenue, cloud costs, R&D tracking, and deferred revenue.',
      accounts: techAccounts,
    },
  });
  console.log('  ✓ Seeded Technology / SaaS account template');

  console.log('\nSeed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
