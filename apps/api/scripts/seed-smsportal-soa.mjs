/**
 * Seed SMSPORTAL (PTY) LTD Statement of Account data.
 *
 * What this creates:
 *   - 10 PURCHASE vouchers  (PUR-YYYYMM-NNNN, Dec 2025 – Apr 2026)
 *   - 5  PAYMENT vouchers   (PV-YYYYMM-NNNN, each paying 2 invoices)
 *   - 10 PaymentAllocations (2 per payment)
 *   - JournalEntry + JournalEntryLines for every voucher
 *
 * All 10 invoices are fully paid — outstanding AP: €0.00
 * Currency: EUR  (exchangeRate: 1 — placeholder until billing confirms EUR→USD rate)
 *
 * Prerequisites:
 *   - Tenant slug "hayo"
 *   - Contact "SMSPORTAL (PTY) LTD" (VENDOR) with linked GL account
 *   - Account code 5000  (COGS)
 *   - Account code 1200  (Bank)
 *
 * Idempotent: exits early if voucher with reference "INV_0367912" already exists.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const d = (iso) => new Date(iso);

// ── Data extracted from Excel ─────────────────────────────────────────────────

const PURCHASE_INVOICES = [
  { ref: 'INV_0367912', periodStart: '2025-12-01', periodEnd: '2025-12-31', amount: 4277.61 },
  { ref: 'INV_0367913', periodStart: '2025-12-01', periodEnd: '2025-12-31', amount:  458.48 },
  { ref: 'INV_0371107', periodStart: '2026-01-01', periodEnd: '2026-01-31', amount: 2441.22 },
  { ref: 'INV_0371106', periodStart: '2026-01-01', periodEnd: '2026-01-31', amount: 9082.82 },
  { ref: 'INV_0374181', periodStart: '2026-02-01', periodEnd: '2026-02-28', amount: 2376.63 },
  { ref: 'INV_0374180', periodStart: '2026-02-01', periodEnd: '2026-02-28', amount:  933.01 },
  { ref: 'INV_0377435', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount: 1966.68 },
  { ref: 'INV_0377266', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount: 10525.61 },
  { ref: 'INV_0380529', periodStart: '2026-04-01', periodEnd: '2026-04-30', amount: 2361.54 },
  { ref: 'INV_0380528', periodStart: '2026-04-01', periodEnd: '2026-04-30', amount: 9744.53 },
];

// Each payment covers exactly 2 invoices; amount = sum of both
const PAYMENT_VOUCHERS = [
  { date: '2026-02-02', amount: 4736.09,  invoiceRefs: ['INV_0367912', 'INV_0367913'] },
  { date: '2026-03-10', amount: 11524.04, invoiceRefs: ['INV_0371107', 'INV_0371106'] },
  { date: '2026-04-03', amount: 3309.64,  invoiceRefs: ['INV_0374181', 'INV_0374180'] },
  { date: '2026-05-04', amount: 12492.29, invoiceRefs: ['INV_0377435', 'INV_0377266'] },
  { date: '2026-05-29', amount: 12106.07, invoiceRefs: ['INV_0380529', 'INV_0380528'] },
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
    where: { tenantId: tid, name: 'SMSPORTAL (PTY) LTD' },
    select: { id: true, name: true, accountId: true },
  });
  if (!contact) {
    console.error('\n❌  Contact "SMSPORTAL (PTY) LTD" not found in DB.\n');
    process.exit(1);
  }
  if (!contact.accountId) {
    console.error('\n❌  Contact "SMSPORTAL (PTY) LTD" has no linked GL account.\n');
    process.exit(1);
  }
  console.log(`Contact: ${contact.name} (accountId: ${contact.accountId})`);

  const acct5000 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '5000' } });
  const acct1200 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '1200' } });
  console.log(`Acct 5000: ${acct5000.name}  |  Acct 1200: ${acct1200.name}`);

  const apAccountId = contact.accountId;

  // ── Idempotency guard ────────────────────────────────────────────────────────
  const alreadyExists = await prisma.voucher.findFirst({
    where: { tenantId: tid, reference: 'INV_0367912' },
  });
  if (alreadyExists) {
    console.log('\n⚠  Data already seeded (INV_0367912 voucher exists). Nothing to do.');
    return;
  }

  // ── 1. Create 10 PURCHASE vouchers ──────────────────────────────────────────
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
              debit: inv.amount,   credit: 0,
              baseDebit: inv.amount, baseCredit: 0,
              currencyCode: 'EUR', exchangeRate: 1,
              narration: 'SMS cost',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: apAccountId,
              debit: 0,   credit: inv.amount,
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

  // ── 2. Create 5 PAYMENT vouchers + allocations (2 per payment) ──────────────
  console.log('\n── Payment vouchers ───────────────────────────────────────────────────');

  for (const pmt of PAYMENT_VOUCHERS) {
    const date = d(pmt.date);
    const voucherNumber = await nextVoucherNumber(tid, 'PV', date);
    const narration = `Payment to SMSPORTAL (PTY) LTD for ${pmt.invoiceRefs.join(', ')}`;

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
              debit: pmt.amount,  credit: 0,
              baseDebit: pmt.amount, baseCredit: 0,
              currencyCode: 'EUR', exchangeRate: 1,
              narration: 'AP settlement',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: acct1200.id,
              debit: 0,  credit: pmt.amount,
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

    // One allocation per invoice covered by this payment
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

    console.log(`  ✓ ${voucherNumber}  €${pmt.amount}  pays: ${pmt.invoiceRefs.join(' + ')}  JE: ${jeNumber}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n✅  SMSPORTAL SOA seed complete.');
  console.log(`   Purchase invoices : ${PURCHASE_INVOICES.length}`);
  console.log(`   Payment vouchers  : ${PAYMENT_VOUCHERS.length}  (2 invoices each)`);
  console.log(`   Journal entries   : ${PURCHASE_INVOICES.length + PAYMENT_VOUCHERS.length}`);
  console.log(`   Allocations       : ${PAYMENT_VOUCHERS.length * 2}`);
  console.log(`   Outstanding AP    : €0.00  (all paid)`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
