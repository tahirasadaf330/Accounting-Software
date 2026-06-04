/**
 * Seed Roke Telkom Limited Statement of Account data.
 *
 * What this creates:
 *   - 14 PURCHASE vouchers  (PUR-YYYYMM-NNNN, Sep 2024 – Mar 2026)
 *   - JournalEntry + JournalEntryLines for every voucher
 *   - No payment vouchers — billing team confirmed: import invoices as-is
 *
 * Currency: USD
 *
 * Prerequisites:
 *   - Tenant slug "hayo"
 *   - Contact "Roke Telkom Limited" (VENDOR) with linked GL account
 *   - Account code 5000  (COGS)
 *
 * Idempotent: exits early if voucher with reference "IAB45068" already exists.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const d = (iso) => new Date(iso);

// ── Data extracted from Excel ─────────────────────────────────────────────────

const PURCHASE_INVOICES = [
  { ref: 'IAB45068', periodStart: '2024-09-01', periodEnd: '2024-09-30', amount:  7.00 },
  { ref: 'IAB45373', periodStart: '2024-10-01', periodEnd: '2024-10-31', amount:  2.94 },
  { ref: 'IAB45762', periodStart: '2024-11-01', periodEnd: '2024-11-30', amount:  7.00 },
  { ref: 'IAB46120', periodStart: '2024-12-01', periodEnd: '2024-12-31', amount:  7.00 },
  { ref: 'IAB46489', periodStart: '2025-01-01', periodEnd: '2025-01-31', amount:  7.00 },
  { ref: 'IAB46842', periodStart: '2025-02-01', periodEnd: '2025-02-28', amount:  7.00 },
  { ref: 'IAB47179', periodStart: '2025-03-01', periodEnd: '2025-03-31', amount:  7.00 },
  { ref: 'IAB47532', periodStart: '2025-04-01', periodEnd: '2025-04-30', amount:  7.00 },
  { ref: 'IAB47894', periodStart: '2025-05-01', periodEnd: '2025-05-31', amount:  7.00 },
  { ref: 'IAB48239', periodStart: '2025-06-01', periodEnd: '2025-06-30', amount:  7.00 },
  { ref: 'IAB48577', periodStart: '2025-07-01', periodEnd: '2025-08-01', amount:  7.00 },
  { ref: 'IAB50201', periodStart: '2025-12-01', periodEnd: '2026-01-01', amount:  7.00 },
  { ref: 'IAB50527', periodStart: '2026-01-01', periodEnd: '2026-02-01', amount:  7.00 },
  { ref: 'IAB50869', periodStart: '2026-02-01', periodEnd: '2026-03-01', amount:  7.00 },
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
  const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug: 'hayo' } });
  const tid = tenant.id;
  console.log(`Tenant : ${tenant.name} (${tid})`);

  const ownerUser = await prisma.user.findFirstOrThrow({
    where: { tenantId: tid, role: 'OWNER' },
    orderBy: { createdAt: 'asc' },
  });
  console.log(`Owner  : ${ownerUser.email}`);

  const contact = await prisma.contact.findFirst({
    where: { tenantId: tid, name: 'Roke Telkom Limited' },
    select: { id: true, name: true, accountId: true },
  });
  if (!contact) {
    console.error('\n❌  Contact "Roke Telkom Limited" not found in DB.\n');
    process.exit(1);
  }
  if (!contact.accountId) {
    console.error('\n❌  Contact "Roke Telkom Limited" has no linked GL account.\n');
    process.exit(1);
  }
  console.log(`Contact: ${contact.name} (accountId: ${contact.accountId})`);

  const acct5000 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '5000' } });
  console.log(`Acct 5000: ${acct5000.name}`);

  const apAccountId = contact.accountId;

  // ── Idempotency guard ──────────────────────────────────────────────────────
  const alreadyExists = await prisma.voucher.findFirst({
    where: { tenantId: tid, reference: 'IAB45068' },
  });
  if (alreadyExists) {
    console.log('\n⚠  Data already seeded (IAB45068 voucher exists). Nothing to do.');
    return;
  }

  // ── Create 14 PURCHASE vouchers ────────────────────────────────────────────
  console.log('\n── Purchase invoices ──────────────────────────────────────────────────');

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

    console.log(`  ✓ ${voucherNumber}  ${inv.ref}  $${inv.amount}  JE: ${jeNumber}`);
  }

  const total = PURCHASE_INVOICES.reduce((s, i) => s + i.amount, 0).toFixed(2);
  console.log('\n✅  Roke Telkom SOA seed complete.');
  console.log(`   Purchase invoices : ${PURCHASE_INVOICES.length}`);
  console.log(`   Journal entries   : ${PURCHASE_INVOICES.length}`);
  console.log(`   Payments          : none (invoices imported as-is)`);
  console.log(`   Total AP          : $${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
