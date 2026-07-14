import { PrismaClient, VoucherType, VoucherStatus, ContactType } from '@prisma/client';

const prisma = new PrismaClient();

// Fixed IDs. The contact ID must be a *valid* UUID (correct version/variant
// nibbles) because the create-voucher DTO validates contactId with @IsUUID().
const HOTNET_CONTACT_ID = 'b1b2b3b4-c1c2-41d2-81e2-f1f2f3f4f501';
const HOTNET_ACCOUNT_ID = 'b1b2b3b4-c1c2-d1d2-e1e2-f1f2f3f4f502';

// Earlier seed used an invalid-UUID contact ID; migrate it to the valid one.
const HOTNET_OLD_CONTACT_ID = 'b1b2b3b4-c1c2-d1d2-e1e2-f1f2f3f4f501';

const CONTACT_NAME = 'HOT NET INTERNET SERVICES LTD';

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

// month is 1-indexed for readability. Build UTC dates so the calendar day is
// preserved regardless of server timezone (avoids off-by-one in the SOA).
function d(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

interface Invoice {
  num: string;
  start: Date;
  end: Date;
  amount: number;
}

async function main() {
  console.log(`Seeding ${CONTACT_NAME} data...`);

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

  // Migrate any prior invalid-UUID contact ID to the valid one (one-time).
  await migrateContactId(tenant.id, HOTNET_OLD_CONTACT_ID, HOTNET_CONTACT_ID);

  // 4. Create dedicated trade account for HOT NET
  let tradeAccount = await prisma.account.findUnique({ where: { id: HOTNET_ACCOUNT_ID } });

  if (!tradeAccount) {
    // Find next available code ≥ 1303 under the AR parent
    const existingCodes = await prisma.account.findMany({
      where: { tenantId: tenant.id, code: { gte: '1303', lte: '1399' } },
      select: { code: true },
      orderBy: { code: 'desc' },
    });
    const nextCode = existingCodes.length > 0
      ? (parseInt(existingCodes[0].code) + 1).toString()
      : '1303';

    tradeAccount = await prisma.account.create({
      data: {
        id: HOTNET_ACCOUNT_ID,
        tenantId: tenant.id,
        code: nextCode,
        name: `Trade - ${CONTACT_NAME}`,
        accountType: 'ASSET',
        normalBalance: 'DEBIT',
        isSystem: false,
        description: `Auto-created trade account for contact: ${CONTACT_NAME}`,
        ...(arParentAccount ? { parentId: arParentAccount.id } : {}),
        level: arParentAccount ? 3 : 2,
      },
    });
    console.log(`  ✓ Trade account created: ${tradeAccount.code} — ${tradeAccount.name}`);
  } else {
    console.log(`  ~ Trade account exists: ${tradeAccount.code} — ${tradeAccount.name}`);
  }

  // 5. Create HOT NET contact (bilateral) linked to the trade account
  // paymentTermDays = 30: HOT NET bills monthly on "end of the following month"
  // (EOM) terms. The SOA due-date logic treats a term of 30 as EOM, so the last
  // invoice (30-Jun) is due 31-Jul — matching the source statement.
  const contact = await prisma.contact.upsert({
    where: { id: HOTNET_CONTACT_ID },
    update: { name: CONTACT_NAME, type: ContactType.BOTH, accountId: tradeAccount.id, paymentTermDays: 30 },
    create: {
      id: HOTNET_CONTACT_ID,
      tenantId: tenant.id,
      name: CONTACT_NAME,
      type: ContactType.BOTH,
      currencyCode: 'USD',
      paymentTermDays: 30,
      accountId: tradeAccount.id,
    },
  });
  console.log(`  ✓ Contact: ${contact.name} (${contact.type})`);

  // 6. HAYO Sales Invoices (HAYO billed HOT NET) — monthly
  const salesInvoices: Invoice[] = [
    { num: '140570', start: d(2025, 12, 1), end: d(2025, 12, 31), amount: 18488.73 },
    { num: '141025', start: d(2026, 1, 1),  end: d(2026, 1, 31),  amount: 56271.59 },
    { num: '141459', start: d(2026, 2, 1),  end: d(2026, 2, 28),  amount: 62486.42 },
    { num: '141928', start: d(2026, 3, 1),  end: d(2026, 3, 31),  amount: 31388.54 },
    { num: '142366', start: d(2026, 4, 1),  end: d(2026, 4, 30),  amount: 24005.06 },
    { num: '142850', start: d(2026, 5, 1),  end: d(2026, 5, 31),  amount: 39935.28 },
    { num: '143283', start: d(2026, 6, 1),  end: d(2026, 6, 30),  amount: 25055.52 },
  ];

  for (const inv of salesInvoices) {
    const voucherId = `hotnet-sales-${inv.num}`;
    const voucherDate = inv.end;

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
        periodStart: inv.start,
        periodEnd: inv.end,
        narration: `${CONTACT_NAME} — Billing period ${inv.start.toISOString().split('T')[0]} to ${inv.end.toISOString().split('T')[0]}`,
        totalAmount: inv.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: voucherDate,
        contactId: contact.id,
        lineItems: {
          create: [
            {
              tenantId: tenant.id,
              accountId: tradeAccount.id,
              debit: inv.amount,
              credit: 0,
              baseDebit: inv.amount,
              baseCredit: 0,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: `Trade Receivable — ${CONTACT_NAME}`,
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
            entryNumber: `JE-HOTNET-S-${inv.num}`,
            entryDate: voucherDate,
            narration: `Sales Invoice ${inv.num} — ${CONTACT_NAME}`,
            lines: {
              create: [
                {
                  tenantId: tenant.id,
                  accountId: tradeAccount.id,
                  debit: inv.amount,
                  credit: 0,
                  baseCurrencyDebit: inv.amount,
                  baseCurrencyCredit: 0,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: `Trade Receivable — ${CONTACT_NAME}`,
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

  // 7. HOT NET Purchase Invoices (HOT NET billed HAYO) — monthly
  const purchaseInvoices: Invoice[] = [
    { num: '6608-163', start: d(2025, 12, 1), end: d(2025, 12, 31), amount: 23327.12 },
    { num: '6663-163', start: d(2026, 1, 1),  end: d(2026, 1, 31),  amount: 51457.60 },
    { num: '6717-163', start: d(2026, 2, 1),  end: d(2026, 2, 28),  amount: 53635.18 },
    { num: '6773-163', start: d(2026, 3, 1),  end: d(2026, 3, 31),  amount: 17013.26 },
    { num: '6830-163', start: d(2026, 4, 1),  end: d(2026, 4, 30),  amount: 29560.33 },
    { num: '6884-163', start: d(2026, 5, 1),  end: d(2026, 5, 31),  amount: 52275.39 },
    { num: '6932-163', start: d(2026, 6, 1),  end: d(2026, 6, 30),  amount: 32510.61 },
  ];

  for (const inv of purchaseInvoices) {
    const voucherId = `hotnet-purchase-${inv.num}`;
    const voucherDate = inv.end;

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
        periodStart: inv.start,
        periodEnd: inv.end,
        narration: `${CONTACT_NAME} — Billing period ${inv.start.toISOString().split('T')[0]} to ${inv.end.toISOString().split('T')[0]}`,
        totalAmount: inv.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: voucherDate,
        contactId: contact.id,
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
              accountId: tradeAccount.id,
              debit: 0,
              credit: inv.amount,
              baseDebit: 0,
              baseCredit: inv.amount,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: `Trade Payable — ${CONTACT_NAME}`,
              lineOrder: 1,
            },
          ],
        },
        journalEntry: {
          create: {
            tenantId: tenant.id,
            entryNumber: `JE-HOTNET-P-${inv.num}`,
            entryDate: voucherDate,
            narration: `Purchase Invoice ${inv.num} — ${CONTACT_NAME}`,
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
                  accountId: tradeAccount.id,
                  debit: 0,
                  credit: inv.amount,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: inv.amount,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: `Trade Payable — ${CONTACT_NAME}`,
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

  console.log(`\n${CONTACT_NAME} seed completed!`);
  console.log('  Sales invoices   : 7 ($257,631.14)');
  console.log('  Purchase invoices: 7 ($259,779.49)');
}

main()
  .catch((e) => {
    console.error('HOT NET seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
