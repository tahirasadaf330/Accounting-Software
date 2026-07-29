import { PrismaClient, VoucherType, VoucherStatus, ContactType } from '@prisma/client';
import { deterministicUuid } from './seed-utils';

const prisma = new PrismaClient();

// Fixed IDs. The contact ID must be a *valid* UUID (correct version/variant
// nibbles) because the create-voucher DTO validates contactId with @IsUUID().
const NAWC_CONTACT_ID = 'a1a2a3a4-b1b2-4c1c-8d1d-e1e2e3e4e501';
const NAWC_ACCOUNT_ID = 'a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e502';

// Old non-UUID IDs from earlier seeder run (kept for migration)
const OLD_CONTACT_ID = 'nawc-sa-contact-seed-id-000001';
const OLD_ACCOUNT_ID = 'nawc-sa-account-seed-id-000001';

// An intermediate seeder used an invalid-UUID contact ID; migrate it too.
const OLD_INVALID_CONTACT_ID = 'a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e501';

// Move a contact (and its voucher references) from an old ID to a new one.
// Idempotent: does nothing if the old ID isn't present.
async function migrateContactId(tenantId: string, oldId: string, newId: string) {
  if (oldId === newId) return;
  const oldContact = await prisma.contact.findUnique({ where: { id: oldId } });
  if (!oldContact) return;

  const newExists = await prisma.contact.findUnique({ where: { id: newId } });
  if (!newExists) {
    const { id: _drop, ...fields } = oldContact as any;
    await prisma.contact.create({ data: { ...fields, id: newId } });
  }
  await prisma.voucher.updateMany({
    where: { tenantId, contactId: oldId },
    data: { contactId: newId },
  });
  await prisma.contact.delete({ where: { id: oldId } });
  console.log(`  ✓ Migrated contact ID ${oldId} → ${newId}`);
}

function parseDate(str: string): Date {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const [day, mon, yr] = str.split('-');
  const year = parseInt(yr) + 2000;
  return new Date(year, months[mon], parseInt(day));
}

async function migrateOldIds(tenantId: string, arAccountId: string, apAccountId: string) {
  const oldAccount = await prisma.account.findUnique({ where: { id: OLD_ACCOUNT_ID } });
  const oldContact = await prisma.contact.findUnique({ where: { id: OLD_CONTACT_ID } });

  if (!oldAccount && !oldContact) return; // nothing to migrate

  console.log('  → Migrating old non-UUID records to proper UUIDs...');

  if (oldAccount) {
    const newAccountExists = await prisma.account.findUnique({ where: { id: NAWC_ACCOUNT_ID } });
    if (!newAccountExists) {
      // Rename old code temporarily to free the unique slot
      await prisma.account.update({
        where: { id: OLD_ACCOUNT_ID },
        data: { code: 'TEMP-NAWC-MIGRATE' },
      });
      // Create new account with proper UUID
      await prisma.account.create({
        data: {
          id: NAWC_ACCOUNT_ID,
          tenantId: oldAccount.tenantId,
          code: oldAccount.code,
          name: oldAccount.name,
          accountType: oldAccount.accountType,
          normalBalance: oldAccount.normalBalance,
          isSystem: oldAccount.isSystem,
          description: oldAccount.description,
          parentId: oldAccount.parentId,
          level: oldAccount.level,
        },
      });
      // Migrate all JournalEntryLine and VoucherLineItem references
      await prisma.journalEntryLine.updateMany({
        where: { tenantId, accountId: OLD_ACCOUNT_ID },
        data: { accountId: NAWC_ACCOUNT_ID },
      });
      await prisma.voucherLineItem.updateMany({
        where: { tenantId, accountId: OLD_ACCOUNT_ID },
        data: { accountId: NAWC_ACCOUNT_ID },
      });
      // Migrate Contact.accountId if it points to old account
      await prisma.contact.updateMany({
        where: { tenantId, accountId: OLD_ACCOUNT_ID },
        data: { accountId: NAWC_ACCOUNT_ID },
      });
      await prisma.account.delete({ where: { id: OLD_ACCOUNT_ID } });
      console.log(`  ✓ Account migrated to UUID: ${NAWC_ACCOUNT_ID}`);
    }
  }

  if (oldContact) {
    const newContactExists = await prisma.contact.findUnique({ where: { id: NAWC_CONTACT_ID } });
    if (!newContactExists) {
      const { id: _oldId, ...contactFields } = oldContact as any;
      await prisma.contact.create({
        data: {
          ...contactFields,
          id: NAWC_CONTACT_ID,
          accountId: NAWC_ACCOUNT_ID,
        },
      });
      // Migrate Voucher.contactId references
      await prisma.voucher.updateMany({
        where: { tenantId, contactId: OLD_CONTACT_ID },
        data: { contactId: NAWC_CONTACT_ID },
      });
      await prisma.contact.delete({ where: { id: OLD_CONTACT_ID } });
      console.log(`  ✓ Contact migrated to UUID: ${NAWC_CONTACT_ID}`);
    }
  }
}

async function main() {
  console.log('Seeding NAWC S.A. data...');

  // 1. Get HAYO tenant
  const tenant = await prisma.tenant.findUnique({ where: { slug: 'hayo' } });
  if (!tenant) throw new Error('Hayo tenant not found — run main seeder first');

  // 2. Get the CEO user as the creator/approver
  const ceoUser = await prisma.user.findUnique({ where: { email: 'ceo@hayo.net' } });
  if (!ceoUser) throw new Error('ceo@hayo.net not found — run main seeder first');

  // 3. Get required accounts
  const revenueAccount  = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '4000' } } });
  const cogsAccount     = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '5000' } } });
  const arAccount       = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '1301' } } });
  const apAccount       = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '2101' } } });
  const arParentAccount = await prisma.account.findUnique({ where: { tenantId_code: { tenantId: tenant.id, code: '1300' } } });

  if (!revenueAccount || !cogsAccount || !arAccount || !apAccount) {
    throw new Error('Required accounts not found — run main seeder first');
  }

  // 4. Migrate old non-UUID records if they exist (one-time migration)
  await migrateOldIds(tenant.id, arAccount.id, apAccount.id);

  // 4b. Migrate the earlier invalid-UUID contact ID to the valid one.
  await migrateContactId(tenant.id, OLD_INVALID_CONTACT_ID, NAWC_CONTACT_ID);

  // 5. Create dedicated trade account for NAWC S.A.
  let nawcTradeAccount = await prisma.account.findUnique({ where: { id: NAWC_ACCOUNT_ID } });

  if (!nawcTradeAccount) {
    // Find next available code ≥ 1303 under the AR parent
    const existingCodes = await prisma.account.findMany({
      where: { tenantId: tenant.id, code: { gte: '1303', lte: '1399' } },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = existingCodes.length > 0
      ? (parseInt(existingCodes[0].code) + 1).toString()
      : '1303';

    nawcTradeAccount = await prisma.account.create({
      data: {
        id: NAWC_ACCOUNT_ID,
        tenantId: tenant.id,
        code: nextCode,
        name: 'Trade - NAWC S.A',
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isSystem: false,
        description: 'Auto-created trade account for contact: NAWC S.A',
        ...(arParentAccount ? { parentId: arParentAccount.id } : {}),
        level: arParentAccount ? 3 : 2,
      },
    });
    console.log(`  ✓ Trade account created: ${nawcTradeAccount.code} — ${nawcTradeAccount.name}`);
  } else {
    console.log(`  ~ Trade account exists: ${nawcTradeAccount.code} — ${nawcTradeAccount.name}`);
  }

  // 6. Create NAWC S.A. contact (bilateral) linked to the trade account
  const nawcContact = await prisma.contact.upsert({
    where: { id: NAWC_CONTACT_ID },
    update: { name: 'NAWC S.A', type: ContactType.BOTH, accountId: nawcTradeAccount.id },
    create: {
      id: NAWC_CONTACT_ID,
      tenantId: tenant.id,
      name: 'NAWC S.A',
      type: ContactType.BOTH,
      currencyCode: 'USD',
      paymentTermDays: 5,
      accountId: nawcTradeAccount.id,
    },
  });
  console.log(`  ✓ Contact: ${nawcContact.name} (${nawcContact.type})`);

  // 7. Fix any existing journal entry lines still pointing to shared AR/AP accounts
  const nawcSalesVoucherIds = [
    'nawc-sales-139947','nawc-sales-140083','nawc-sales-140201','nawc-sales-140233',
    'nawc-sales-140380','nawc-sales-140412','nawc-sales-140622','nawc-sales-140650',
    'nawc-sales-140684','nawc-sales-140833','nawc-sales-140869','nawc-sales-141084',
    'nawc-sales-141115','nawc-sales-141258','nawc-sales-141302','nawc-sales-141515',
    'nawc-sales-141549','nawc-sales-141692','nawc-sales-141736','nawc-sales-141768',
    'nawc-sales-141985','nawc-sales-142004','nawc-sales-142153','nawc-sales-142188',
    'nawc-sales-142400','nawc-sales-142434','nawc-sales-142575','nawc-sales-142628',
    'nawc-sales-142676','nawc-sales-142870','nawc-sales-142904','nawc-sales-143054',
  ];
  const nawcPurchaseVoucherIds = [
    'nawc-purchase-HAYO384','nawc-purchase-HAYO385','nawc-purchase-HAYO386','nawc-purchase-HAYO387',
    'nawc-purchase-HAYO388','nawc-purchase-HAYO389','nawc-purchase-HAYO390','nawc-purchase-HAYO391',
    'nawc-purchase-HAYO392','nawc-purchase-HAYO393','nawc-purchase-HAYO394','nawc-purchase-HAYO395',
    'nawc-purchase-HAYO396','nawc-purchase-HAYO397','nawc-purchase-HAYO398','nawc-purchase-HAYO399',
    'nawc-purchase-HAYO400','nawc-purchase-HAYO401','nawc-purchase-HAYO402','nawc-purchase-HAYO403',
    'nawc-purchase-HAYO404','nawc-purchase-HAYO405','nawc-purchase-HAYO406','nawc-purchase-HAYO407',
    'nawc-purchase-HAYO408','nawc-purchase-HAYO409','nawc-purchase-HAYO410','nawc-purchase-HAYO411',
    'nawc-purchase-HAYO412','nawc-purchase-HAYO413','nawc-purchase-HAYO414',
  ];

  const salesJes = await prisma.journalEntry.findMany({
    where: { tenantId: tenant.id, voucherId: { in: nawcSalesVoucherIds } },
    select: { id: true },
  });
  if (salesJes.length > 0) {
    const r = await prisma.journalEntryLine.updateMany({
      where: { tenantId: tenant.id, journalEntryId: { in: salesJes.map(j => j.id) }, accountId: arAccount.id },
      data: { accountId: nawcTradeAccount.id },
    });
    if (r.count > 0) console.log(`  ✓ Fixed ${r.count} sales journal entry lines`);
  }

  const purchaseJes = await prisma.journalEntry.findMany({
    where: { tenantId: tenant.id, voucherId: { in: nawcPurchaseVoucherIds } },
    select: { id: true },
  });
  if (purchaseJes.length > 0) {
    const r = await prisma.journalEntryLine.updateMany({
      where: { tenantId: tenant.id, journalEntryId: { in: purchaseJes.map(j => j.id) }, accountId: apAccount.id },
      data: { accountId: nawcTradeAccount.id },
    });
    if (r.count > 0) console.log(`  ✓ Fixed ${r.count} purchase journal entry lines`);
  }

  const sl = await prisma.voucherLineItem.updateMany({
    where: { tenantId: tenant.id, voucherId: { in: nawcSalesVoucherIds }, accountId: arAccount.id },
    data: { accountId: nawcTradeAccount.id },
  });
  if (sl.count > 0) console.log(`  ✓ Fixed ${sl.count} sales voucher line items`);

  const pl = await prisma.voucherLineItem.updateMany({
    where: { tenantId: tenant.id, voucherId: { in: nawcPurchaseVoucherIds }, accountId: apAccount.id },
    data: { accountId: nawcTradeAccount.id },
  });
  if (pl.count > 0) console.log(`  ✓ Fixed ${pl.count} purchase voucher line items`);

  // 8. HAYO Sales Invoices (HAYO billed NAWC)
  const salesInvoices = [
    { num: '139947', start: '17-Nov-25', end: '23-Nov-25', amount: 540.56 },
    { num: '140083', start: '24-Nov-25', end: '30-Nov-25', amount: 450.56 },
    { num: '140201', start: '1-Dec-25',  end: '7-Dec-25',  amount: 378.03 },
    { num: '140233', start: '8-Dec-25',  end: '14-Dec-25', amount: 201.15 },
    { num: '140380', start: '15-Dec-25', end: '21-Dec-25', amount: 686.38 },
    { num: '140412', start: '22-Dec-25', end: '28-Dec-25', amount: 1094.52 },
    { num: '140622', start: '29-Dec-25', end: '31-Dec-25', amount: 429.32 },
    { num: '140650', start: '1-Jan-26',  end: '4-Jan-26',  amount: 683.76 },
    { num: '140684', start: '5-Jan-26',  end: '11-Jan-26', amount: 322.29 },
    { num: '140833', start: '12-Jan-26', end: '18-Jan-26', amount: 81.26 },
    { num: '140869', start: '19-Jan-26', end: '25-Jan-26', amount: 49.04 },
    { num: '141084', start: '26-Jan-26', end: '1-Feb-26',  amount: 117.54 },
    { num: '141115', start: '2-Feb-26',  end: '8-Feb-26',  amount: 72.38 },
    { num: '141258', start: '9-Feb-26',  end: '15-Feb-26', amount: 328.99 },
    { num: '141302', start: '16-Feb-26', end: '22-Feb-26', amount: 581.80 },
    { num: '141515', start: '23-Feb-26', end: '1-Mar-26',  amount: 1674.57 },
    { num: '141549', start: '2-Mar-26',  end: '8-Mar-26',  amount: 3935.95 },
    { num: '141692', start: '9-Mar-26',  end: '15-Mar-26', amount: 5099.81 },
    { num: '141736', start: '16-Mar-26', end: '22-Mar-26', amount: 1191.99 },
    { num: '141768', start: '23-Mar-26', end: '29-Mar-26', amount: 1288.11 },
    { num: '141985', start: '30-Mar-26', end: '5-Apr-26',  amount: 940.64 },
    { num: '142004', start: '6-Apr-26',  end: '12-Apr-26', amount: 1676.59 },
    { num: '142153', start: '13-Apr-26', end: '19-Apr-26', amount: 1162.42 },
    { num: '142188', start: '20-Apr-26', end: '26-Apr-26', amount: 520.16 },
    { num: '142400', start: '27-Apr-26', end: '3-May-26',  amount: 452.82 },
    { num: '142434', start: '4-May-26',  end: '10-May-26', amount: 2727.19 },
    { num: '142575', start: '11-May-26', end: '17-May-26', amount: 4389.76 },
    { num: '142628', start: '18-May-26', end: '24-May-26', amount: 4267.45 },
    { num: '142676', start: '25-May-26', end: '31-May-26', amount: 3567.01 },
    { num: '142870', start: '1-Jun-26',  end: '7-Jun-26',  amount: 2821.93 },
    { num: '142904', start: '8-Jun-26',  end: '14-Jun-26', amount: 2167.90 },
    { num: '143054', start: '15-Jun-26', end: '21-Jun-26', amount: 2142.95 },
  ];

  for (const inv of salesInvoices) {
    const voucherDate = parseDate(inv.end);
    const voucherId = deterministicUuid(`nawc-sales-${inv.num}`);

    const existing = await prisma.voucher.findUnique({ where: { id: voucherId } });
    if (existing) {
      console.log(`  ~ Skipped (exists): Sales ${inv.num}`);
      continue;
    }

    await prisma.voucher.create({
      data: {
        id: voucherId,
        tenantId: tenant.id,
        voucherNumber: inv.num,
        voucherType: VoucherType.SALES,
        status: VoucherStatus.POSTED,
        date: voucherDate,
        periodStart: parseDate(inv.start),
        periodEnd: parseDate(inv.end),
        narration: `NAWC S.A — Billing period ${inv.start} to ${inv.end}`,
        totalAmount: inv.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: voucherDate,
        contactId: nawcContact.id,
        lineItems: {
          create: [
            {
              tenantId: tenant.id,
              accountId: nawcTradeAccount.id,
              debit: inv.amount,
              credit: 0,
              baseDebit: inv.amount,
              baseCredit: 0,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: 'Trade Receivable — NAWC S.A',
              lineOrder: 0,
            },
            {
              tenantId: tenant.id,
              accountId: revenueAccount.id,
              debit: 0,
              credit: inv.amount,
              baseDebit: 0,
              baseCredit: inv.amount,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: 'Sales Revenue',
              lineOrder: 1,
            },
          ],
        },
        journalEntry: {
          create: {
            tenantId: tenant.id,
            entryNumber: `JE-NAWC-S-${inv.num}`,
            entryDate: voucherDate,
            narration: `Sales Invoice ${inv.num} — NAWC S.A`,
            lines: {
              create: [
                {
                  tenantId: tenant.id,
                  accountId: nawcTradeAccount.id,
                  debit: inv.amount,
                  credit: 0,
                  baseCurrencyDebit: inv.amount,
                  baseCurrencyCredit: 0,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: 'Trade Receivable — NAWC S.A',
                  lineOrder: 0,
                },
                {
                  tenantId: tenant.id,
                  accountId: revenueAccount.id,
                  debit: 0,
                  credit: inv.amount,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: inv.amount,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: 'Sales Revenue',
                  lineOrder: 1,
                },
              ],
            },
          },
        },
      },
    });
    console.log(`  ✓ Sales Invoice: ${inv.num} — $${inv.amount}`);
  }

  // 9. NAWC Purchase Invoices (NAWC billed HAYO)
  const purchaseInvoices = [
    { num: 'HAYO384', start: '17-Nov-25', end: '23-Nov-25', amount: 8.34 },
    { num: 'HAYO385', start: '24-Nov-25', end: '30-Nov-25', amount: 3.91 },
    { num: 'HAYO386', start: '1-Dec-25',  end: '7-Dec-25',  amount: 5.17 },
    { num: 'HAYO387', start: '8-Dec-25',  end: '14-Dec-25', amount: 5.09 },
    { num: 'HAYO388', start: '15-Dec-25', end: '21-Dec-25', amount: 118.41 },
    { num: 'HAYO389', start: '22-Dec-25', end: '28-Dec-25', amount: 98.47 },
    { num: 'HAYO390', start: '29-Dec-25', end: '4-Jan-26',  amount: 68.87 },
    { num: 'HAYO391', start: '5-Jan-26',  end: '11-Jan-26', amount: 19.47 },
    { num: 'HAYO392', start: '12-Jan-26', end: '18-Jan-26', amount: 45.24 },
    { num: 'HAYO393', start: '19-Jan-26', end: '25-Jan-26', amount: 30.46 },
    { num: 'HAYO394', start: '26-Jan-26', end: '1-Feb-26',  amount: 58.36 },
    { num: 'HAYO395', start: '2-Feb-26',  end: '8-Feb-26',  amount: 109.96 },
    { num: 'HAYO396', start: '9-Feb-26',  end: '15-Feb-26', amount: 122.60 },
    { num: 'HAYO397', start: '16-Feb-26', end: '22-Feb-26', amount: 91.99 },
    { num: 'HAYO398', start: '23-Feb-26', end: '1-Mar-26',  amount: 112.43 },
    { num: 'HAYO399', start: '2-Mar-26',  end: '8-Mar-26',  amount: 196.41 },
    { num: 'HAYO400', start: '9-Mar-26',  end: '15-Mar-26', amount: 163.50 },
    { num: 'HAYO401', start: '16-Mar-26', end: '22-Mar-26', amount: 91.66 },
    { num: 'HAYO402', start: '23-Mar-26', end: '29-Mar-26', amount: 23.55 },
    { num: 'HAYO403', start: '30-Mar-26', end: '5-Apr-26',  amount: 50.32 },
    { num: 'HAYO404', start: '6-Apr-26',  end: '12-Apr-26', amount: 90.23 },
    { num: 'HAYO405', start: '13-Apr-26', end: '19-Apr-26', amount: 90.51 },
    { num: 'HAYO406', start: '20-Apr-26', end: '26-Apr-26', amount: 63.20 },
    { num: 'HAYO407', start: '27-Apr-26', end: '3-May-26',  amount: 78.64 },
    { num: 'HAYO408', start: '4-May-26',  end: '10-May-26', amount: 123.30 },
    { num: 'HAYO409', start: '11-May-26', end: '17-May-26', amount: 135.18 },
    { num: 'HAYO410', start: '18-May-26', end: '24-May-26', amount: 33.17 },
    { num: 'HAYO411', start: '25-May-26', end: '31-May-26', amount: 61.12 },
    { num: 'HAYO412', start: '1-Jun-26',  end: '7-Jun-26',  amount: 66.47 },
    { num: 'HAYO413', start: '8-Jun-26',  end: '14-Jun-26', amount: 224.36 },
    { num: 'HAYO414', start: '15-Jun-26', end: '21-Jun-26', amount: 1207.73 },
  ];

  for (const inv of purchaseInvoices) {
    const voucherDate = parseDate(inv.end);
    const voucherId = deterministicUuid(`nawc-purchase-${inv.num}`);

    const existing = await prisma.voucher.findUnique({ where: { id: voucherId } });
    if (existing) {
      console.log(`  ~ Skipped (exists): Purchase ${inv.num}`);
      continue;
    }

    await prisma.voucher.create({
      data: {
        id: voucherId,
        tenantId: tenant.id,
        voucherNumber: inv.num,
        voucherType: VoucherType.PURCHASE,
        status: VoucherStatus.POSTED,
        date: voucherDate,
        periodStart: parseDate(inv.start),
        periodEnd: parseDate(inv.end),
        narration: `NAWC S.A — Billing period ${inv.start} to ${inv.end}`,
        totalAmount: inv.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: voucherDate,
        contactId: nawcContact.id,
        lineItems: {
          create: [
            {
              tenantId: tenant.id,
              accountId: cogsAccount.id,
              debit: inv.amount,
              credit: 0,
              baseDebit: inv.amount,
              baseCredit: 0,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: 'Cost of Goods Sold',
              lineOrder: 0,
            },
            {
              tenantId: tenant.id,
              accountId: nawcTradeAccount.id,
              debit: 0,
              credit: inv.amount,
              baseDebit: 0,
              baseCredit: inv.amount,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: 'Trade Payable — NAWC S.A',
              lineOrder: 1,
            },
          ],
        },
        journalEntry: {
          create: {
            tenantId: tenant.id,
            entryNumber: `JE-NAWC-P-${inv.num}`,
            entryDate: voucherDate,
            narration: `Purchase Invoice ${inv.num} — NAWC S.A`,
            lines: {
              create: [
                {
                  tenantId: tenant.id,
                  accountId: cogsAccount.id,
                  debit: inv.amount,
                  credit: 0,
                  baseCurrencyDebit: inv.amount,
                  baseCurrencyCredit: 0,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: 'Cost of Goods Sold',
                  lineOrder: 0,
                },
                {
                  tenantId: tenant.id,
                  accountId: nawcTradeAccount.id,
                  debit: 0,
                  credit: inv.amount,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: inv.amount,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: 'Trade Payable — NAWC S.A',
                  lineOrder: 1,
                },
              ],
            },
          },
        },
      },
    });
    console.log(`  ✓ Purchase Invoice: ${inv.num} — $${inv.amount}`);
  }

  console.log('\nNAWC S.A. seed completed!');
  console.log('  Sales invoices  : 32');
  console.log('  Purchase invoices: 31');
}

main()
  .catch((e) => {
    console.error('NAWC seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
