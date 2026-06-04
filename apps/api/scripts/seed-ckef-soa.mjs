/**
 * Seed CKEF Ltd (Mediatel) Statement of Account data.
 *
 * What this creates:
 *   - 15 PURCHASE vouchers  (PUR-YYYYMM-NNNN, Jan 2025 – Apr 2026)
 *   - JournalEntry + JournalEntryLines for every voucher
 *   - No payment vouchers — billing team confirmed: import invoices as-is
 *
 * Currency: EUR  (exchangeRate: 1 — placeholder until billing confirms EUR→USD rate)
 *
 * Prerequisites:
 *   - Tenant slug "hayo"
 *   - Contact "CKEF Ltd (Mediatel)" (VENDOR) with linked GL account
 *   - Account code 5000  (COGS)
 *
 * Idempotent: exits early if voucher with reference "1165/CKEF" already exists.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const d = (iso) => new Date(iso);

// ── Data extracted from Excel ─────────────────────────────────────────────────

const PURCHASE_INVOICES = [
  { ref: '1165/CKEF', periodStart: '2025-01-01', periodEnd: '2025-01-31', amount:  32.88 },
  { ref: '1166/CKEF', periodStart: '2025-02-01', periodEnd: '2025-02-28', amount:  14.48 },
  { ref: '1201/CKEF', periodStart: '2025-03-01', periodEnd: '2025-03-31', amount:   3.76 },
  { ref: '1279/CKEF', periodStart: '2025-04-01', periodEnd: '2025-04-30', amount:  20.22 },
  { ref: '1280/CKEF', periodStart: '2025-05-01', periodEnd: '2025-05-31', amount:  16.58 },
  { ref: '1347/CKEF', periodStart: '2025-06-01', periodEnd: '2025-06-30', amount:   6.12 },
  { ref: '1348/CKEF', periodStart: '2025-07-01', periodEnd: '2025-07-31', amount:   3.40 },
  { ref: '1498/CKEF', periodStart: '2025-09-01', periodEnd: '2025-09-30', amount:   1.50 },
  { ref: '1499/CKEF', periodStart: '2025-10-01', periodEnd: '2025-10-31', amount:   3.78 },
  { ref: '1500/CKEF', periodStart: '2025-11-01', periodEnd: '2025-11-30', amount:   4.04 },
  { ref: '1501/CKEF', periodStart: '2025-12-01', periodEnd: '2025-12-31', amount:  28.38 },
  { ref: '1679/CKEF', periodStart: '2026-01-01', periodEnd: '2026-01-31', amount:  54.62 },
  { ref: '1680/CKEF', periodStart: '2026-02-01', periodEnd: '2026-02-28', amount:  13.92 },
  { ref: '1681/CKEF', periodStart: '2026-03-01', periodEnd: '2026-03-31', amount:  27.14 },
  { ref: '1682/CKEF', periodStart: '2026-04-01', periodEnd: '2026-04-30', amount:  17.50 },
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
    where: { tenantId: tid, name: 'CKEF Ltd (Mediatel)' },
    select: { id: true, name: true, accountId: true },
  });
  if (!contact) {
    console.error('\n❌  Contact "CKEF Ltd (Mediatel)" not found in DB.\n');
    process.exit(1);
  }
  if (!contact.accountId) {
    console.error('\n❌  Contact "CKEF Ltd (Mediatel)" has no linked GL account.\n');
    process.exit(1);
  }
  console.log(`Contact: ${contact.name} (accountId: ${contact.accountId})`);

  const acct5000 = await prisma.account.findFirstOrThrow({ where: { tenantId: tid, code: '5000' } });
  console.log(`Acct 5000: ${acct5000.name}`);

  const apAccountId = contact.accountId;

  // ── Idempotency guard ──────────────────────────────────────────────────────
  const alreadyExists = await prisma.voucher.findFirst({
    where: { tenantId: tid, reference: '1165/CKEF' },
  });
  if (alreadyExists) {
    console.log('\n⚠  Data already seeded (1165/CKEF voucher exists). Nothing to do.');
    return;
  }

  // ── Create 15 PURCHASE vouchers ────────────────────────────────────────────
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

    console.log(`  ✓ ${voucherNumber}  ${inv.ref}  €${inv.amount}  JE: ${jeNumber}`);
  }

  const total = PURCHASE_INVOICES.reduce((s, i) => s + i.amount, 0).toFixed(2);
  console.log('\n✅  CKEF SOA seed complete.');
  console.log(`   Purchase invoices : ${PURCHASE_INVOICES.length}`);
  console.log(`   Journal entries   : ${PURCHASE_INVOICES.length}`);
  console.log(`   Payments          : none (invoices imported as-is)`);
  console.log(`   Total AP          : €${total}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
