import { PrismaClient, VoucherType, VoucherStatus } from '@prisma/client';

const prisma = new PrismaClient();

const HOTNET_CONTACT_ID = 'b1b2b3b4-c1c2-41d2-81e2-f1f2f3f4f501';
const HOTNET_ACCOUNT_ID = 'b1b2b3b4-c1c2-d1d2-e1e2-f1f2f3f4f502';

const CONTACT_NAME = 'HOT NET INTERNET SERVICES LTD';

// month is 1-indexed for readability. Build UTC dates so the calendar day is
// preserved regardless of server timezone (avoids off-by-one in the SOA).
function d(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month - 1, day));
}

interface Payment {
  id: string;
  date: Date;
  amount: number;
  invoices: string;
  jeNum: string;
}

// RECEIPT vouchers — HOT NET paid HAYO (customer payments, against HAYO sales invoices)
const receipts: Payment[] = [
  { id: 'hotnet-receipt-01', date: d(2026, 3, 5),  amount: 4813.99,  invoices: '141025', jeNum: 'JE-HOTNET-R-01' },
  { id: 'hotnet-receipt-02', date: d(2026, 3, 17), amount: 8851.24,  invoices: '141459', jeNum: 'JE-HOTNET-R-02' },
  { id: 'hotnet-receipt-03', date: d(2026, 5, 5),  amount: 14375.28, invoices: '141928', jeNum: 'JE-HOTNET-R-03' },
];

// PAYMENT vouchers — HAYO paid HOT NET (against HOT NET purchase invoices)
const payments: Payment[] = [
  { id: 'hotnet-payment-01', date: d(2026, 2, 19), amount: 4838.39,  invoices: '6608-163', jeNum: 'JE-HOTNET-PMT-01' },
  { id: 'hotnet-payment-02', date: d(2026, 5, 29), amount: 5555.27,  invoices: '6830-163', jeNum: 'JE-HOTNET-PMT-02' },
  { id: 'hotnet-payment-03', date: d(2026, 7, 2),  amount: 12340.11, invoices: '6884-163', jeNum: 'JE-HOTNET-PMT-03' },
];

async function main() {
  console.log(`Seeding ${CONTACT_NAME} payments...`);

  const tenant = await prisma.tenant.findUnique({ where: { slug: 'hayo' } });
  if (!tenant) throw new Error('Hayo tenant not found — run main seeder first');

  const ceoUser = await prisma.user.findUnique({ where: { email: 'ceo@hayo.net' } });
  if (!ceoUser) throw new Error('ceo@hayo.net not found — run main seeder first');

  const tradeAccount = await prisma.account.findUnique({ where: { id: HOTNET_ACCOUNT_ID } });
  if (!tradeAccount) throw new Error('HOT NET trade account not found — run seed-hotnet first');

  const contact = await prisma.contact.findUnique({ where: { id: HOTNET_CONTACT_ID } });
  if (!contact) throw new Error('HOT NET contact not found — run seed-hotnet first');

  // Find the main bank/cash account (first ASSET account under code 1210-1219 range)
  let bankAccount = await prisma.account.findFirst({
    where: { tenantId: tenant.id, code: { gte: '1210', lte: '1219' }, accountType: 'ASSET' },
    orderBy: { code: 'asc' },
  });
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

  // ─── RECEIPTS: HOT NET paid HAYO (cash in, reduce receivable) ──────────────
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
        voucherNumber: rec.id.replace('hotnet-', 'HOTNET-').toUpperCase(),
        voucherType: VoucherType.RECEIPT,
        status: VoucherStatus.POSTED,
        date: rec.date,
        narration: `Receipt from ${CONTACT_NAME} — Invoices: ${rec.invoices}`,
        totalAmount: rec.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: rec.date,
        contactId: contact.id,
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
              accountId: tradeAccount.id,
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
            narration: `Receipt from ${CONTACT_NAME} — Invoices: ${rec.invoices}`,
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
                  accountId: tradeAccount.id,
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

  // ─── PAYMENTS: HAYO paid HOT NET (cash out, reduce payable) ────────────────
  for (const pmt of payments) {
    const existing = await prisma.voucher.findUnique({ where: { id: pmt.id } });
    if (existing) {
      console.log(`  ~ Skipped (exists): Payment ${pmt.id}`);
      skipped++;
      continue;
    }

    await prisma.voucher.create({
      data: {
        id: pmt.id,
        tenantId: tenant.id,
        voucherNumber: pmt.id.replace('hotnet-', 'HOTNET-').toUpperCase(),
        voucherType: VoucherType.PAYMENT,
        status: VoucherStatus.POSTED,
        date: pmt.date,
        narration: `Payment to ${CONTACT_NAME} — Invoices: ${pmt.invoices}`,
        totalAmount: pmt.amount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: ceoUser.id,
        approvedById: ceoUser.id,
        postedAt: pmt.date,
        contactId: contact.id,
        lineItems: {
          create: [
            {
              tenantId: tenant.id,
              accountId: tradeAccount.id,
              debit: pmt.amount,
              credit: 0,
              baseDebit: pmt.amount,
              baseCredit: 0,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: `Payment — Invoices: ${pmt.invoices}`,
              lineOrder: 0,
            },
            {
              tenantId: tenant.id,
              accountId: bankAccount.id,
              debit: 0,
              credit: pmt.amount,
              baseDebit: 0,
              baseCredit: pmt.amount,
              currencyCode: 'USD',
              exchangeRate: 1,
              narration: 'Cash paid',
              lineOrder: 1,
            },
          ],
        },
        journalEntry: {
          create: {
            tenantId: tenant.id,
            entryNumber: pmt.jeNum,
            entryDate: pmt.date,
            narration: `Payment to ${CONTACT_NAME} — Invoices: ${pmt.invoices}`,
            lines: {
              create: [
                {
                  tenantId: tenant.id,
                  accountId: tradeAccount.id,
                  debit: pmt.amount,
                  credit: 0,
                  baseCurrencyDebit: pmt.amount,
                  baseCurrencyCredit: 0,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: `Payment — Invoices: ${pmt.invoices}`,
                  lineOrder: 0,
                },
                {
                  tenantId: tenant.id,
                  accountId: bankAccount.id,
                  debit: 0,
                  credit: pmt.amount,
                  baseCurrencyDebit: 0,
                  baseCurrencyCredit: pmt.amount,
                  currencyCode: 'USD',
                  exchangeRate: 1,
                  narration: 'Cash paid',
                  lineOrder: 1,
                },
              ],
            },
          },
        },
      },
    });
    console.log(`  ✓ Payment ${pmt.id}: $${pmt.amount} on ${pmt.date.toISOString().split('T')[0]} (Invoices: ${pmt.invoices})`);
    created++;
  }

  console.log(`\n${CONTACT_NAME} payments completed! Created: ${created}, Skipped: ${skipped}`);
  console.log('  Receipts (from customer): 3 ($28,040.51)');
  console.log('  Payments (to customer)  : 3 ($22,733.77)');
}

main()
  .catch((e) => {
    console.error('HOT NET payments seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
