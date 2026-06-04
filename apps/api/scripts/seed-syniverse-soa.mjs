/**
 * Seed Syniverse Messaging Solutions, LLC Statement of Account data.
 *
 * What this creates:
 *   - 9 PURCHASE vouchers  (PUR-YYYYMM-NNNN, Jul 2025 – Apr 2026)
 *   - 1 PAYMENT voucher    (PV-YYYYMM-NNNN, pays 8 invoices in one shot)
 *   - 8 PaymentAllocations
 *   - JournalEntry + JournalEntryLines for every voucher
 *
 * Outstanding AP: $1,366.65  (invoice 20260592810, Apr 2026 — not in payment)
 * Currency: USD
 *
 * Prerequisites:
 *   - Tenant slug "hayo"
 *   - Contact "Syniverse Messaging Solutions, LLC" (VENDOR) with linked GL account
 *   - Account code 5000  (COGS)
 *   - Account code 1200  (Bank)
 *
 * Idempotent: exits early if voucher with reference "20250892810" already exists.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const d = (iso) => new Date(iso);

// ── Data extracted from Excel ─────────────────────────────────────────────────

const PURCHASE_INVOICES = [
  { ref: '20250892810', periodStart: '2025-07-01', periodEnd: '2025-07-31', amount:    0.23 },
  { ref: '20250992810', periodStart: '2025-08-01', periodEnd: '2025-08-31', amount:    0.31 },
  { ref: '20251192810', periodStart: '2025-10-01', periodEnd: '2025-10-31', amount:    0.10 },
  { ref: '20251292810', periodStart: '2025-11-01', periodEnd: '2025-11-30', amount:    0.07 },
  { ref: '20260192810', periodStart: '2025-12-01', periodEnd: '2025-12-31', amount:  928.36 },
  { ref: '20260292810', periodStart: '2026-01-01', periodEnd: '2026-01-31', amount: 1266.70 },
  { ref: '20260392810', periodStart: '2026-02-01', periodEnd: '2026-02-28', amount:  560.05 },
  { ref: '20260492810', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount:  687.31 },
  { ref: '20260592810', periodStart: '2026-04-01', periodEnd: '2026-04-30', amount: 1366.65 }, // UNPAID
];

// Single payment covering 8 of the 9 invoices (20260592810 is excluded — unpaid)
const PAYMENT_VOUCHERS = [
  {
    date: '2026-05-04',
    amount: 3443.13,
    invoiceRefs: [
      '20250892810',
      '20250992810',
      '20251192810',
      '20251292810',
      '20260192810',
      '20260292810',
      '20260392810',
      '20260492810',
    ],
  },
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
    where: { tenantId: tid, name: 'Syniverse Messaging Solutions, LLC' },
    select: { id: true, name: true, accountId: true },
  });
  if (!contact) {
    console.error('\n❌  Contact "Syniverse Messaging Solutions, LLC" not found in DB.\n');
    process.exit(1);
  }
  if (!contact.accountId) {
    console.error('\n❌  Contact "Syniverse Messaging Solutions, LLC" has no linked GL account.\n');
    process.exit(1);
  }
  console.log(`Contact: ${contact.name} (accountId: ${contact.accountId})`);

  const acct5000 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '5000' } });
  const acct1200 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '1200' } });
  console.log(`Acct 5000: ${acct5000.name}  |  Acct 1200: ${acct1200.name}`);

  const apAccountId = contact.accountId;

  // ── Idempotency guard ────────────────────────────────────────────────────────
  const alreadyExists = await prisma.voucher.findFirst({
    where: { tenantId: tid, reference: '20250892810' },
  });
  if (alreadyExists) {
    console.log('\n⚠  Data already seeded (20250892810 voucher exists). Nothing to do.');
    return;
  }

  // ── 1. Create 9 PURCHASE vouchers ───────────────────────────────────────────
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
        currencyCode: 'USD',
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
              debit: inv.amount,   credit: 0,
              baseDebit: inv.amount, baseCredit: 0,
              currencyCode: 'USD', exchangeRate: 1,
              narration: 'SMS cost',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: apAccountId,
              debit: 0,   credit: inv.amount,
              baseDebit: 0, baseCredit: inv.amount,
              currencyCode: 'USD', exchangeRate: 1,
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
    const tag = inv.ref === '20260592810' ? '  ← UNPAID' : '';
    console.log(`  ✓ ${voucherNumber}  ${inv.ref}  $${inv.amount}${tag}  JE: ${jeNumber}`);
  }

  // ── 2. Create 1 PAYMENT voucher + 8 allocations ─────────────────────────────
  console.log('\n── Payment vouchers ───────────────────────────────────────────────────');

  for (const pmt of PAYMENT_VOUCHERS) {
    const date = d(pmt.date);
    const voucherNumber = await nextVoucherNumber(tid, 'PV', date);
    const narration = `Payment to Syniverse Messaging Solutions, LLC for ${pmt.invoiceRefs.join(', ')}`;

    const voucher = await prisma.voucher.create({
      data: {
        tenantId: tid,
        voucherNumber,
        voucherType: 'PAYMENT',
        status: 'POSTED',
        date,
        reference: pmt.invoiceRefs.join(', '),
        narration,
        totalAmount: pmt.amount,
        currencyCode: 'USD',
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
              debit: pmt.amount,  credit: 0,
              baseDebit: pmt.amount, baseCredit: 0,
              currencyCode: 'USD', exchangeRate: 1,
              narration: 'AP settlement',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: acct1200.id,
              debit: 0,  credit: pmt.amount,
              baseDebit: 0, baseCredit: pmt.amount,
              currencyCode: 'USD', exchangeRate: 1,
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

    for (const ref of pmt.invoiceRefs) {
      const invoiceId = invoiceIdByRef.get(ref);
      const invoiceAmount = PURCHASE_INVOICES.find((inv) => inv.ref === ref).amount;
      await prisma.paymentAllocation.create({
        data: {
          tenantId: tid,
          paymentVoucherId: voucher.id,
          invoiceVoucherId: invoiceId,
          amount: invoiceAmount,
          paidAt: date,
        },
      });
    }

    console.log(`  ✓ ${voucherNumber}  $${pmt.amount}  pays ${pmt.invoiceRefs.length} invoices  JE: ${jeNumber}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n✅  Syniverse SOA seed complete.');
  console.log(`   Purchase invoices : ${PURCHASE_INVOICES.length}  (1 unpaid: 20260592810  $1,366.65)`);
  console.log(`   Payment vouchers  : ${PAYMENT_VOUCHERS.length}  (covers 8 invoices)`);
  console.log(`   Journal entries   : ${PURCHASE_INVOICES.length + PAYMENT_VOUCHERS.length}`);
  console.log(`   Allocations       : 8`);
  console.log(`   Outstanding AP    : $1,366.65`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
