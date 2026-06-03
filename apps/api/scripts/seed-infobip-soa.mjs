/**
 * Seed INFOBIP SA (DBA Infobip Africa (Pty) Ltd's) Statement of Account data.
 *
 * What this creates:
 *   - 4 PURCHASE vouchers  (PUR-YYYYMM-NNNN, refs: 152/26 … 969/26)
 *   - 4 PAYMENT vouchers   (PV-YYYYMM-NNNN, each fully paying one invoice)
 *   - 4 PaymentAllocations
 *   - JournalEntry + JournalEntryLines for every voucher
 *
 * What must already exist:
 *   - Tenant with slug "hayo"
 *   - Contact "INFOBIP South Africa" (VENDOR) with a linked GL account
 *   - Account code 5000  (COGS / expense side)
 *   - Account code 1200  (Bank Accounts / payment side)
 *   - EUR currency
 *
 * Idempotent: exits early if voucher with reference "152/26" already exists.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const d = (iso) => new Date(iso);

// ── Data extracted from Excel ─────────────────────────────────────────────────

const PURCHASE_INVOICES = [
  { ref: '152/26', periodStart: '2026-01-01', periodEnd: '2026-01-31', amount: 3762.44 },
  { ref: '425/26', periodStart: '2026-02-01', periodEnd: '2026-02-28', amount: 6047.61 },
  { ref: '702/26', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount: 6698.18 },
  { ref: '969/26', periodStart: '2026-04-01', periodEnd: '2026-04-30', amount: 2482.05 },
];

// All 4 invoices are fully paid — no outstanding balance
const PAYMENT_VOUCHERS = [
  { date: '2026-03-10', amount: 3762.44, invoiceRef: '152/26' },
  { date: '2026-03-19', amount: 6047.61, invoiceRef: '425/26' },
  { date: '2026-05-12', amount: 6698.18, invoiceRef: '702/26' },
  { date: '2026-05-29', amount: 2482.05, invoiceRef: '969/26' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

async function nextVoucherNumber(tid, typePrefix, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `${typePrefix}-${year}${month}-`;
  const last = await prisma.voucher.findFirst({
    where: { tenantId: tid, voucherNumber: { startsWith: prefix } },
    orderBy: { voucherNumber: 'desc' },
    select: { voucherNumber: true },
  });
  const seq = last ? parseInt(last.voucherNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

async function nextJENumber(tid, date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const prefix = `JE-${year}${month}-`;
  const last = await prisma.journalEntry.findFirst({
    where: { tenantId: tid, entryNumber: { startsWith: prefix } },
    orderBy: { entryNumber: 'desc' },
    select: { entryNumber: true },
  });
  const seq = last ? parseInt(last.entryNumber.slice(prefix.length), 10) + 1 : 1;
  return `${prefix}${String(seq).padStart(4, '0')}`;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  // ── Look-ups ────────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug: 'hayo' } });
  const tid = tenant.id;
  console.log(`Tenant : ${tenant.name} (${tid})`);

  const ownerUser = await prisma.user.findFirstOrThrow({
    where: { tenantId: tid, role: 'OWNER' },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Owner  : ${ownerUser.email}`);

  const contact = await prisma.contact.findFirst({
    where: { tenantId: tid, name: 'INFOBIP South Africa' },
    select: { id: true, name: true, accountId: true },
  });
  if (!contact) {
    console.error('\n❌  Contact "INFOBIP South Africa" not found.');
    console.error('   Please create it via the UI: Name=INFOBIP South Africa, Type=VENDOR\n');
    process.exit(1);
  }
  if (!contact.accountId) {
    console.error('\n❌  Contact "INFOBIP South Africa" has no linked GL account. Edit and link one.\n');
    process.exit(1);
  }
  console.log(`Contact: ${contact.name} (accountId: ${contact.accountId})`);

  const acct5000 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '5000' } });
  const acct1200 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '1200' } });
  console.log(`Acct 5000: ${acct5000.name}  |  Acct 1200: ${acct1200.name}`);

  const apAccountId = contact.accountId;

  // ── Idempotency guard ────────────────────────────────────────────────────────
  const alreadyExists = await prisma.voucher.findFirst({
    where: { tenantId: tid, reference: '152/26' },
  });
  if (alreadyExists) {
    console.log('\n⚠  Data already seeded (152/26 voucher exists). Nothing to do.');
    return;
  }

  // ── 1. Create 4 PURCHASE vouchers ───────────────────────────────────────────
  console.log('\n── Purchase invoices ──────────────────────────────────────────────────');
  const invoiceIdByRef = new Map();

  for (const inv of PURCHASE_INVOICES) {
    const date = d(inv.periodEnd);
    const voucherNumber = await nextVoucherNumber(tid, 'PUR', date);
    const narration = 'SMS';

    const voucher = await prisma.voucher.create({
      data: {
        tenantId: tid,
        voucherNumber,
        voucherType: 'PURCHASE',
        status: 'POSTED',
        date,
        periodStart: d(inv.periodStart),
        periodEnd: d(inv.periodEnd),
        reference: inv.ref,
        narration,
        totalAmount: inv.amount,
        currencyCode: 'EUR',
        exchangeRate: 1,
        createdById: ownerUser.id,
        approvedById: ownerUser.id,
        postedAt: date,
        contactId: contact.id,
        lineItems: {
          create: [
            {
              tenantId: tid,
              accountId: acct5000.id,
              debit: inv.amount,  credit: 0,
              baseDebit: inv.amount, baseCredit: 0,
              currencyCode: 'EUR', exchangeRate: 1,
              narration: 'SMS cost',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: apAccountId,
              debit: 0, credit: inv.amount,
              baseDebit: 0, baseCredit: inv.amount,
              currencyCode: 'EUR', exchangeRate: 1,
              narration: 'Trade Payable',
              lineOrder: 1,
            },
          ],
        },
      },
      include: { lineItems: true },
    });

    const jeNumber = await nextJENumber(tid, date);
    await prisma.journalEntry.create({
      data: {
        tenantId: tid,
        voucherId: voucher.id,
        entryNumber: jeNumber,
        entryDate: date,
        narration,
        isReversing: false,
        lines: {
          createMany: {
            data: voucher.lineItems.map((li) => ({
              tenantId: tid,
              accountId: li.accountId,
              debit: li.debit,
              credit: li.credit,
              baseCurrencyDebit: li.baseDebit,
              baseCurrencyCredit: li.baseCredit,
              currencyCode: li.currencyCode,
              exchangeRate: li.exchangeRate,
              narration: li.narration,
              lineOrder: li.lineOrder,
            })),
          },
        },
      },
    });

    invoiceIdByRef.set(inv.ref, voucher.id);
    console.log(`  ✓ ${voucherNumber}  ${inv.ref}  €${inv.amount}  JE: ${jeNumber}`);
  }

  // ── 2. Create 4 PAYMENT vouchers + allocations ───────────────────────────────
  console.log('\n── Payment vouchers ───────────────────────────────────────────────────');

  for (const pmt of PAYMENT_VOUCHERS) {
    const date = d(pmt.date);
    const invoiceId = invoiceIdByRef.get(pmt.invoiceRef);
    if (!invoiceId) {
      console.warn(`  ⚠  Invoice "${pmt.invoiceRef}" not found — skipping`);
      continue;
    }

    const invoiceAmount = PURCHASE_INVOICES.find((inv) => inv.ref === pmt.invoiceRef).amount;
    const voucherNumber = await nextVoucherNumber(tid, 'PV', date);
    const narration = `Payment to INFOBIP South Africa for ${pmt.invoiceRef}`;

    const voucher = await prisma.voucher.create({
      data: {
        tenantId: tid,
        voucherNumber,
        voucherType: 'PAYMENT',
        status: 'POSTED',
        date,
        reference: pmt.invoiceRef,
        narration,
        totalAmount: pmt.amount,
        currencyCode: 'EUR',
        exchangeRate: 1,
        createdById: ownerUser.id,
        approvedById: ownerUser.id,
        postedAt: date,
        contactId: contact.id,
        lineItems: {
          create: [
            {
              tenantId: tid,
              accountId: apAccountId,
              debit: pmt.amount, credit: 0,
              baseDebit: pmt.amount, baseCredit: 0,
              currencyCode: 'EUR', exchangeRate: 1,
              narration: 'AP settlement',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: acct1200.id,
              debit: 0, credit: pmt.amount,
              baseDebit: 0, baseCredit: pmt.amount,
              currencyCode: 'EUR', exchangeRate: 1,
              narration: 'Bank payment',
              lineOrder: 1,
            },
          ],
        },
      },
      include: { lineItems: true },
    });

    const jeNumber = await nextJENumber(tid, date);
    await prisma.journalEntry.create({
      data: {
        tenantId: tid,
        voucherId: voucher.id,
        entryNumber: jeNumber,
        entryDate: date,
        narration,
        isReversing: false,
        lines: {
          createMany: {
            data: voucher.lineItems.map((li) => ({
              tenantId: tid,
              accountId: li.accountId,
              debit: li.debit,
              credit: li.credit,
              baseCurrencyDebit: li.baseDebit,
              baseCurrencyCredit: li.baseCredit,
              currencyCode: li.currencyCode,
              exchangeRate: li.exchangeRate,
              narration: li.narration,
              lineOrder: li.lineOrder,
            })),
          },
        },
      },
    });

    await prisma.paymentAllocation.create({
      data: {
        tenantId: tid,
        paymentVoucherId: voucher.id,
        invoiceVoucherId: invoiceId,
        amount: invoiceAmount,
        paidAt: date,
      },
    });

    console.log(`  ✓ ${voucherNumber}  pays ${pmt.invoiceRef}  €${pmt.amount}  JE: ${jeNumber}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n✅  INFOBIP SOA seed complete.');
  console.log(`   Purchase invoices : ${PURCHASE_INVOICES.length}  (all paid — €0.00 outstanding)`);
  console.log(`   Payment vouchers  : ${PAYMENT_VOUCHERS.length}`);
  console.log(`   Journal entries   : ${PURCHASE_INVOICES.length + PAYMENT_VOUCHERS.length}`);
  console.log(`   Allocations       : ${PAYMENT_VOUCHERS.length}`);
  console.log(`   Outstanding AP    : €0.00`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
