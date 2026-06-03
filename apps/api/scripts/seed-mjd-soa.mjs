/**
 * Seed MJD Electronic Trading Statement of Account data.
 *
 * What this creates:
 *   - 10 PURCHASE vouchers  (PUR-YYYYMM-NNNN, HAY-2025-12-16 … HAY-2026-05-01)
 *   - 9  PAYMENT vouchers   (PV-YYYYMM-NNNN, each paying one invoice in full)
 *   - 9  PaymentAllocations
 *   - JournalEntry + JournalEntryLines for every voucher (same as the import UI does)
 *
 * What must already exist (created via UI or prior seed):
 *   - Tenant with slug "hayo"
 *   - Contact "MJD Electronic Trading" (type VENDOR) with a linked GL account (accountId set)
 *   - Account code 5000  (COGS / expense side of purchase invoices)
 *   - Account code 1200  (Bank Accounts / credit side of payments)
 *   - At least one OWNER user in the Hayo tenant
 *
 * Idempotent: if a voucher with reference "HAY-2025-12-16" already exists for
 * this tenant, the script exits early without creating duplicates.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const d = (iso) => new Date(iso);

// ── Data extracted from Excel ─────────────────────────────────────────────────

const PURCHASE_INVOICES = [
  { ref: 'HAY-2025-12-16', periodStart: '2025-12-01', periodEnd: '2025-12-15', amount: 18325.0000 },
  { ref: 'HAY-2026-01-01', periodStart: '2025-12-16', periodEnd: '2025-12-31', amount: 20811.1100 },
  { ref: 'HAY-2026-01-16', periodStart: '2026-01-01', periodEnd: '2026-01-15', amount: 20950.2200 },
  { ref: 'HAY-2026-02-01', periodStart: '2026-01-16', periodEnd: '2026-01-31', amount: 20517.7800 },
  { ref: 'HAY-2026-02-16', periodStart: '2026-02-01', periodEnd: '2026-02-15', amount: 17882.7400 },
  { ref: 'HAY-2026-03-01', periodStart: '2026-02-16', periodEnd: '2026-02-28', amount: 18962.0600 },
  { ref: 'HAY-2026-03-16', periodStart: '2026-03-01', periodEnd: '2026-03-15', amount: 18787.4000 },
  { ref: 'HAY-2026-04-01', periodStart: '2026-03-16', periodEnd: '2026-03-31', amount: 21169.5900 },
  { ref: 'HAY-2026-04-16', periodStart: '2026-04-01', periodEnd: '2026-04-15', amount: 20957.3600 },
  { ref: 'HAY-2026-05-01', periodStart: '2026-04-16', periodEnd: '2026-04-30', amount: 14689.5000 }, // unpaid
];

// Payment for HAY-2026-04-16: Excel shows $20,957.56 (invoice is $20,957.36 — $0.20 over).
// Allocation uses invoice amount so the invoice is fully closed; $0.20 stays unallocated on the payment.
const PAYMENT_VOUCHERS = [
  { date: '2026-01-06', amount: 18325.0000, invoiceRef: 'HAY-2025-12-16' },
  { date: '2026-01-19', amount: 20811.1100, invoiceRef: 'HAY-2026-01-01' },
  { date: '2026-02-02', amount: 20950.2200, invoiceRef: 'HAY-2026-01-16' },
  { date: '2026-02-19', amount: 20517.7800, invoiceRef: 'HAY-2026-02-01' },
  { date: '2026-03-06', amount: 17882.7400, invoiceRef: 'HAY-2026-02-16' },
  { date: '2026-03-16', amount: 18962.0600, invoiceRef: 'HAY-2026-03-01' },
  { date: '2026-04-03', amount: 18787.4000, invoiceRef: 'HAY-2026-03-16' },
  { date: '2026-04-19', amount: 21169.5900, invoiceRef: 'HAY-2026-04-01' },
  { date: '2026-05-04', amount: 20957.5600, invoiceRef: 'HAY-2026-04-16' }, // $0.20 over invoice
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

  // Contact must already exist (created via UI)
  const contact = await prisma.contact.findFirst({
    where: { tenantId: tid, name: 'MJD Electronic Trading' },
    select: { id: true, name: true, accountId: true },
  });
  if (!contact) {
    console.error('\n❌  Contact "MJD Electronic Trading" not found.');
    console.error('   Please create it via the UI first:');
    console.error('   → Name: MJD Electronic Trading');
    console.error('   → Type: VENDOR');
    console.error('   → Ensure a GL / trade-payable account is linked.\n');
    process.exit(1);
  }
  if (!contact.accountId) {
    console.error('\n❌  Contact "MJD Electronic Trading" has no linked GL account.');
    console.error('   Edit the contact in the UI and link a trade-payable account.\n');
    process.exit(1);
  }
  console.log(`Contact: ${contact.name} (accountId: ${contact.accountId})`);

  const acct5000 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '5000' } });
  const acct1200 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '1200' } });
  console.log(`Acct 5000: ${acct5000.name}  |  Acct 1200: ${acct1200.name}`);

  const apAccountId = contact.accountId; // trade-payable GL for MJD

  // ── Idempotency guard ────────────────────────────────────────────────────────
  const alreadyExists = await prisma.voucher.findFirst({
    where: { tenantId: tid, reference: 'HAY-2025-12-16' },
  });
  if (alreadyExists) {
    console.log('\n⚠  Data already seeded (HAY-2025-12-16 voucher exists). Nothing to do.');
    return;
  }

  // ── 1. Create 10 PURCHASE vouchers ──────────────────────────────────────────
  console.log('\n── Purchase invoices ──────────────────────────────────────────────────');
  const invoiceIdByRef = new Map();

  for (const inv of PURCHASE_INVOICES) {
    const date = d(inv.periodEnd);
    const voucherNumber = await nextVoucherNumber(tid, 'PUR', date);
    const narration = 'Voice';

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
              debit: inv.amount,  credit: 0,
              baseDebit: inv.amount, baseCredit: 0,
              currencyCode: 'USD', exchangeRate: 1,
              narration: 'Voice cost',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: apAccountId,
              debit: 0, credit: inv.amount,
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

    // Journal entry (same as vouchersService.createJournalEntryForVoucher)
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
    console.log(`  ✓ ${voucherNumber}  ${inv.ref}  $${inv.amount}  JE: ${jeNumber}`);
  }

  // ── 2. Create 9 PAYMENT vouchers + allocations ───────────────────────────────
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
    const narration = `Payment to MJD Electronic Trading for ${pmt.invoiceRef}`;

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
              debit: pmt.amount, credit: 0,
              baseDebit: pmt.amount, baseCredit: 0,
              currencyCode: 'USD', exchangeRate: 1,
              narration: 'AP settlement',
              lineOrder: 0,
            },
            {
              tenantId: tid,
              accountId: acct1200.id,
              debit: 0, credit: pmt.amount,
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

    // Journal entry
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

    // Allocation: use invoice amount to fully close the invoice
    await prisma.paymentAllocation.create({
      data: {
        tenantId: tid,
        paymentVoucherId: voucher.id,
        invoiceVoucherId: invoiceId,
        amount: invoiceAmount,
        paidAt: date,
      },
    });

    const note = pmt.amount !== invoiceAmount ? ` (invoice $${invoiceAmount}, $${(pmt.amount - invoiceAmount).toFixed(2)} unallocated)` : '';
    console.log(`  ✓ ${voucherNumber}  pays ${pmt.invoiceRef}  $${pmt.amount}${note}  JE: ${jeNumber}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  console.log('\n✅  MJD SOA seed complete.');
  console.log(`   Purchase invoices : ${PURCHASE_INVOICES.length}  (1 unpaid: HAY-2026-05-01  $14,689.50)`);
  console.log(`   Payment vouchers  : ${PAYMENT_VOUCHERS.length}`);
  console.log(`   Journal entries   : ${PURCHASE_INVOICES.length + PAYMENT_VOUCHERS.length}`);
  console.log(`   Allocations       : ${PAYMENT_VOUCHERS.length}`);
  console.log(`   Outstanding AP    : $14,689.50`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
