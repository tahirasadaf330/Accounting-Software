import { PrismaClient, VoucherType, VoucherStatus } from '@prisma/client';

const prisma = new PrismaClient();

const NAWC_CONTACT_ID = 'a1a2a3a4-b1b2-4c1c-8d1d-e1e2e3e4e501';
const NAWC_ACCOUNT_ID = 'a1a2a3a4-b1b2-c1c2-d1d2-e1e2e3e4e502';

// 11 receipt vouchers — NAWC paid HAYO (customer payments)
const receipts = [
  {
    id: 'nawc-receipt-01',
    date: new Date(2026, 0, 6),   // 6-Jan-26
    amount: 3111.81,
    invoices: '139947, 140083, 140201, 140233, 140380, 140412',
    jeNum: 'JE-NAWC-R-01',
  },
  {
    id: 'nawc-receipt-02',
    date: new Date(2026, 2, 10),  // 10-Mar-26
    amount: 3681.57,
    invoices: '140622, 140650, 140684, 140833, 140869, 141084, 141115, 141258, 141302, 141515',
    jeNum: 'JE-NAWC-R-02',
  },
  {
    id: 'nawc-receipt-03',
    date: new Date(2026, 2, 18),  // 18-Mar-26
    amount: 3739.54,
    invoices: '141549',
    jeNum: 'JE-NAWC-R-03',
  },
  {
    id: 'nawc-receipt-04',
    date: new Date(2026, 2, 24),  // 24-Mar-26
    amount: 4936.31,
    invoices: '141692',
    jeNum: 'JE-NAWC-R-04',
  },
  {
    id: 'nawc-receipt-05',
    date: new Date(2026, 3, 7),   // 7-Apr-26
    amount: 2364.89,
    invoices: '141736, 141768',
    jeNum: 'JE-NAWC-R-05',
  },
  {
    id: 'nawc-receipt-06',
    date: new Date(2026, 3, 22),  // 22-Apr-26
    amount: 2476.68,
    invoices: '141985, 142004',
    jeNum: 'JE-NAWC-R-06',
  },
  {
    id: 'nawc-receipt-07',
    date: new Date(2026, 4, 19),  // 19-May-26
    amount: 4506.94,
    invoices: '142153, 142188, 142400, 142434',
    jeNum: 'JE-NAWC-R-07',
  },
  {
    id: 'nawc-receipt-08',
    date: new Date(2026, 4, 27),  // 27-May-26
    amount: 4254.58,
    invoices: '142575',
    jeNum: 'JE-NAWC-R-08',
  },
  {
    id: 'nawc-receipt-09',
    date: new Date(2026, 5, 3),   // 3-Jun-26
    amount: 4234.28,
    invoices: '142628',
    jeNum: 'JE-NAWC-R-09',
  },
  {
    id: 'nawc-receipt-10',
    date: new Date(2026, 5, 9),   // 9-Jun-26
    amount: 3505.89,
    invoices: '142676',
    jeNum: 'JE-NAWC-R-10',
  },
  {
    id: 'nawc-receipt-11',
    date: new Date(2026, 5, 16),  // 16-Jun-26
    amount: 2755.46,
    invoices: '142870',
    jeNum: 'JE-NAWC-R-11',
  },
];

async function main() {
  console.log('Seeding NAWC S.A. payment receipts...');

  const tenant = await prisma.tenant.findUnique({ where: { slug: 'hayo' } });
  if (!tenant) throw new Error('Hayo tenant not found — run main seeder first');

  const ceoUser = await prisma.user.findUnique({ where: { email: 'ceo@hayo.net' } });
  if (!ceoUser) throw new Error('ceo@hayo.net not found — run main seeder first');

  const nawcAccount = await prisma.account.findUnique({ where: { id: NAWC_ACCOUNT_ID } });
  if (!nawcAccount) throw new Error('NAWC trade account not found — run seed-nawc first');

  const nawcContact = await prisma.contact.findUnique({ where: { id: NAWC_CONTACT_ID } });
  if (!nawcContact) throw new Error('NAWC contact not found — run seed-nawc first');

  // Find the main bank/cash account (first ASSET account under code 1210-1219 range)
  let bankAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: { gte: '1210', lte: '1219' }, accountType: 'ASSET' },
    orderBy: { code: 'asc' },
  });
  // Fallback: any account under 1200-1299
  if (!bankAccount) {
    bankAccount = await prisma.account.findFirst({
      where: { tenantId: tenant.id, code: { gte: '1200', lte: '1299' }, accountType: 'ASSET' },
      orderBy: { code: 'asc' },
    });
  }
  if (!bankAccount) throw new Error('No bank account found (1200-1299 range) — check chart of accounts');
  console.log(`  Using bank account: ${bankAccount.code} — ${bankAccount.name}`);

  let created = 0;
  let skipped = 0;

  for (const rec of receipts) {
    const existing = await prisma.voucher.findUnique({ where: { id: rec.id } });
    if (existing) {
      console.log(`  ~ Skipped (exists): Receipt ${rec.id}`);
      skipped++;
      continue;
    }

    await prisma.voucher.create({
      data: {
        id: rec.id,
        tenantId: tenant.id,
        voucherNumber: rec.id.replace('nawc-', 'NAWC-').toUpperCase(),
        voucherType: VoucherType.RECEIPT,
        status: VoucherStatus.POSTED,
        date: rec.date,
        narration: `Receipt from NAWC S.A — Invoices: ${rec.invoices}`,
        totalAmount: rec.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: rec.date,
        contactId: nawcContact.id,
        lineItems: {
          create: [
            {
              tenantId: tenant.id,
              accountId: bankAccount.id,
              debit: rec.amount,
              credit: 0,
              baseDebit: rec.amount,
              baseCredit: 0,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: 'Cash received',
              lineOrder: 0,
            },
            {
              tenantId: tenant.id,
              accountId: nawcAccount.id,
              debit: 0,
              credit: rec.amount,
              baseDebit: 0,
              baseCredit: rec.amount,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: `Receipt — Invoices: ${rec.invoices}`,
              lineOrder: 1,
            },
          ],
        },
        journalEntry: {
          create: {
            tenantId: tenant.id,
            entryNumber: rec.jeNum,
            entryDate: rec.date,
            narration: `Receipt from NAWC S.A — Invoices: ${rec.invoices}`,
            lines: {
              create: [
                {
                  tenantId: tenant.id,
                  accountId: bankAccount.id,
                  debit: rec.amount,
                  credit: 0,
                  baseCurrencyDebit: rec.amount,
                  baseCurrencyCredit: 0,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: 'Cash received',
                  lineOrder: 0,
                },
                {
                  tenantId: tenant.id,
                  accountId: nawcAccount.id,
                  debit: 0,
                  credit: rec.amount,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: rec.amount,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: `Receipt — Invoices: ${rec.invoices}`,
                  lineOrder: 1,
                },
              ],
            },
          },
        },
      },
    });
    console.log(`  ✓ Receipt ${rec.id}: $${rec.amount} on ${rec.date.toISOString().split('T')[0]} (Invoices: ${rec.invoices})`);
    created++;
  }

  console.log(`\nNAWC receipts completed! Created: ${created}, Skipped: ${skipped}`);
  console.log(`  Total received: $39,567.95`);
  console.log(`  Remaining balance: $2,878.76 (past due)`);
}

main()
  .catch((e) => {
    console.error('NAWC payments seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
