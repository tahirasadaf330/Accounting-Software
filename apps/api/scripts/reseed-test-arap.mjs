/**
 * Cleans all AR/AP test data and re-seeds it with vouchers spread across
 * different aging buckets so the new day-range filter cards can be tested.
 *
 * Contacts are kept unchanged (Ibasis Tech BOTH, XYZ Imports VENDOR, RetailMart CUSTOMER).
 * Netting cycles, payment vouchers, and TEST- vouchers are deleted and recreated.
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ── helpers ──────────────────────────────────────────────────────────────────
const d = (iso) => new Date(iso);

// ── main ─────────────────────────────────────────────────────────────────────
async function main() {
  // ── look-ups ──────────────────────────────────────────────────────────────
  const tenant = await prisma.tenant.findFirstOrThrow({ where: { slug: 'hayo' } });
  const tid = tenant.id;

  const adminUser = await prisma.user.findFirstOrThrow({ where: { tenantId: tid }, orderBy: { createdAt: 'asc' } });
  const uid = adminUser.id;

  const ibasis   = await prisma.contact.findFirstOrThrow({ where: { tenantId: tid, name: 'Ibasis Tech' } });
  const xyz      = await prisma.contact.findFirstOrThrow({ where: { tenantId: tid, name: 'XYZ Imports Ltd' } });
  const retail   = await prisma.contact.findFirstOrThrow({ where: { tenantId: tid, name: 'RetailMart Inc' } });

  console.log(`Tenant: ${tenant.name}  (${tid})`);
  console.log(`Ibasis: ${ibasis.id} | XYZ: ${xyz.id} | RetailMart: ${retail.id}`);

  // ── step 1: delete all payment allocations for Hayo tenant ────────────────
  const testVoucherNos = ['TEST-AR-001','TEST-AR-002','TEST-AR-003','TEST-AR-004','TEST-AR-005',
                          'TEST-PO-001','TEST-PO-002','TEST-PO-003','TEST-PO-004','TEST-PO-005','TEST-PMT-001'];
  const existingTestVouchers = await prisma.voucher.findMany({ where: { tenantId: tid, voucherNumber: { in: testVoucherNos } }, select: { id: true } });
  const testIds = existingTestVouchers.map(v => v.id);

  // also find any RV-/PV- vouchers that were created via Mark Paid on test invoices
  const rvPvAllocations = await prisma.paymentAllocation.findMany({ where: { invoiceVoucherId: { in: testIds } }, select: { paymentVoucherId: true } });
  const rvPvIds = [...new Set(rvPvAllocations.map(a => a.paymentVoucherId))].filter(id => !testIds.includes(id));

  // delete allocations
  if (testIds.length > 0) {
    const del = await prisma.paymentAllocation.deleteMany({ where: { OR: [{ invoiceVoucherId: { in: testIds } }, { paymentVoucherId: { in: testIds } }, { paymentVoucherId: { in: rvPvIds } }] } });
    console.log(`Deleted ${del.count} payment allocations`);
  }

  // ── step 2: delete netting cycles for Hayo ────────────────────────────────
  await prisma.nettingCycleInvoice.deleteMany({ where: { cycle: { tenantId: tid } } });
  const nc = await prisma.nettingCycle.deleteMany({ where: { tenantId: tid } });
  console.log(`Deleted ${nc.count} netting cycles`);

  // ── step 3: delete journal entries for RV/PV vouchers ─────────────────────
  if (rvPvIds.length > 0) {
    const jes = await prisma.journalEntry.findMany({ where: { voucherId: { in: rvPvIds } }, select: { id: true } });
    const jeIds = jes.map(j => j.id);
    if (jeIds.length > 0) {
      await prisma.journalEntryLine.deleteMany({ where: { journalEntryId: { in: jeIds } } });
      await prisma.journalEntry.deleteMany({ where: { id: { in: jeIds } } });
    }
    const rv = await prisma.voucher.deleteMany({ where: { id: { in: rvPvIds } } });
    console.log(`Deleted ${rv.count} RV/PV payment vouchers`);
  }

  // ── step 4: delete TEST- vouchers ─────────────────────────────────────────
  if (testIds.length > 0) {
    const tv = await prisma.voucher.deleteMany({ where: { id: { in: testIds } } });
    console.log(`Deleted ${tv.count} TEST vouchers`);
  }

  // ── step 5: re-create TEST vouchers with strategic due dates ──────────────
  // As-of date for AR/AP report: 2026-05-08
  // Aging buckets covered by each voucher:
  //   RetailMart TEST-AR-004:  due 2026-05-01 →  7 days overdue  → 1-7
  //   RetailMart TEST-AR-005:  due 2026-04-23 → 15 days overdue  → 8-15
  //   XYZ        TEST-PO-005:  due 2026-04-08 → 30 days overdue  → 16-30
  //   XYZ        TEST-PO-004:  due 2026-03-23 → 46 days overdue  → 31-60
  //   XYZ        TEST-PO-003:  due 2026-03-01 → 68 days overdue  → 61-90  (partial $1500 paid)
  //   Ibasis APPROVED cycle:   dueDate 2026-01-15 → 113 days      → 91+
  //   Ibasis PENDING_AM cycle: dueDate 2026-03-30 → 39 days       → 31-60 (pending badge)

  // As-of date 2026-05-08. dueDate = voucherDate + contact.paymentTermDays.
  //   Ibasis: 30 days  |  XYZ: 45 days  |  RetailMart: 30 days
  //
  // Target aging (overdue days):
  //   Ibasis APPROVED cycle dueDate 2026-01-15 → 113 days → 91+
  //   Ibasis PENDING cycle  dueDate 2026-03-30 → 39 days  → 31-60
  //   RetailMart AR-004: dueDate 2026-05-01 → 7 days  → 1-7  (date = 2026-04-01)
  //   RetailMart AR-005: dueDate 2026-04-23 → 15 days → 8-15 (date = 2026-03-24)
  //   XYZ PO-005:        dueDate 2026-04-08 → 30 days → 16-30(date = 2026-02-22)
  //   XYZ PO-004:        dueDate 2026-03-23 → 46 days → 31-60(date = 2026-02-06)
  //   XYZ PO-003:        dueDate 2026-03-01 → 68 days → 61-90(date = 2026-01-15, $1500 paid)
  const vouchers = [
    // Ibasis Tech (BOTH) — goes into netting cycles; aging driven by cycle.dueDate
    { voucherNumber: 'TEST-AR-001', voucherType: 'SALES',    totalAmount: 2000, contactId: ibasis.id, date: d('2025-12-15'), narration: 'Test sales invoice — Ibasis Tech' },
    { voucherNumber: 'TEST-AR-002', voucherType: 'SALES',    totalAmount: 1500, contactId: ibasis.id, date: d('2025-12-20'), narration: 'Test sales invoice — Ibasis Tech' },
    { voucherNumber: 'TEST-PO-001', voucherType: 'PURCHASE', totalAmount:  800, contactId: ibasis.id, date: d('2025-12-18'), narration: 'Test purchase invoice — Ibasis Tech' },
    { voucherNumber: 'TEST-AR-003', voucherType: 'SALES',    totalAmount:  900, contactId: ibasis.id, date: d('2026-01-10'), narration: 'Test sales invoice — Ibasis Tech (pending netting)' },
    { voucherNumber: 'TEST-PO-002', voucherType: 'PURCHASE', totalAmount: 1100, contactId: ibasis.id, date: d('2026-01-15'), narration: 'Test purchase invoice — Ibasis Tech (pending netting)' },
    // XYZ Imports Ltd (VENDOR) — standalone payables (45-day terms)
    { voucherNumber: 'TEST-PO-003', voucherType: 'PURCHASE', totalAmount: 4500, contactId: xyz.id,    date: d('2026-01-15'), narration: 'Test purchase invoice — XYZ Imports (61-90 days overdue)' },
    { voucherNumber: 'TEST-PO-004', voucherType: 'PURCHASE', totalAmount: 2200, contactId: xyz.id,    date: d('2026-02-06'), narration: 'Test purchase invoice — XYZ Imports (31-60 days overdue)' },
    { voucherNumber: 'TEST-PO-005', voucherType: 'PURCHASE', totalAmount:  750, contactId: xyz.id,    date: d('2026-02-22'), narration: 'Test purchase invoice — XYZ Imports (16-30 days overdue)' },
    // RetailMart Inc (CUSTOMER) — standalone receivables (30-day terms)
    { voucherNumber: 'TEST-AR-004', voucherType: 'SALES',    totalAmount: 6000, contactId: retail.id, date: d('2026-04-01'), narration: 'Test sales invoice — RetailMart (1-7 days overdue)' },
    { voucherNumber: 'TEST-AR-005', voucherType: 'SALES',    totalAmount: 3500, contactId: retail.id, date: d('2026-03-24'), narration: 'Test sales invoice — RetailMart (8-15 days overdue)' },
  ];

  const created = {};
  for (const v of vouchers) {
    const rec = await prisma.voucher.create({
      data: {
        tenantId: tid,
        voucherNumber: v.voucherNumber,
        voucherType: v.voucherType,
        status: 'POSTED',
        date: v.date,
        narration: v.narration,
        totalAmount: v.totalAmount,
        currencyCode: 'USD',
        exchangeRate: 1,
        createdById: uid,
        contactId: v.contactId,
      },
    });
    created[v.voucherNumber] = rec.id;
    console.log(`  Created ${v.voucherNumber} (${rec.id})`);
  }

  // ── step 6: partial payment on TEST-PO-003 ($1500 of $4500) ───────────────
  const pmt = await prisma.voucher.create({
    data: {
      tenantId: tid,
      voucherNumber: 'TEST-PMT-001',
      voucherType: 'PAYMENT',
      status: 'POSTED',
      date: d('2026-03-05'),
      narration: 'Partial payment to XYZ Imports',
      totalAmount: 1500,
      currencyCode: 'USD',
      exchangeRate: 1,
      createdById: uid,
      contactId: xyz.id,
    },
  });
  await prisma.paymentAllocation.create({
    data: {
      tenantId: tid,
      paymentVoucherId: pmt.id,
      invoiceVoucherId: created['TEST-PO-003'],
      amount: 1500,
    },
  });
  console.log(`  Created TEST-PMT-001 + allocation ($1500 against TEST-PO-003)`);

  // ── step 7: netting cycles ─────────────────────────────────────────────────
  // Cycle 1: APPROVED — covers TEST-AR-001, TEST-AR-002, TEST-PO-001
  //   Net receivable = 2000 + 1500 − 800 = 2700  →  shows in AR as 91+ overdue
  const cycle1 = await prisma.nettingCycle.create({
    data: {
      tenantId: tid,
      contactId: ibasis.id,
      status: 'APPROVED',
      startDate: d('2025-12-01'),
      endDate: d('2026-01-31'),
      dueDate: d('2026-01-15'),
      invoices: {
        create: [
          { voucherId: created['TEST-AR-001'] },
          { voucherId: created['TEST-AR-002'] },
          { voucherId: created['TEST-PO-001'] },
        ],
      },
    },
  });
  console.log(`  Created netting cycle APPROVED (${cycle1.id})`);

  // Cycle 2: PENDING_AM — covers TEST-AR-003, TEST-PO-002
  //   Gross SALES outstanding = 900  →  shows in AR with "Pending AM Approval" badge, 31-60 overdue
  const cycle2 = await prisma.nettingCycle.create({
    data: {
      tenantId: tid,
      contactId: ibasis.id,
      status: 'PENDING_AM',
      startDate: d('2026-01-01'),
      endDate: d('2026-03-30'),
      dueDate: d('2026-03-30'),
      invoices: {
        create: [
          { voucherId: created['TEST-AR-003'] },
          { voucherId: created['TEST-PO-002'] },
        ],
      },
    },
  });
  console.log(`  Created netting cycle PENDING_AM (${cycle2.id})`);

  console.log('\n✓ Reseed complete. Summary:');
  console.log('  AR Report  (netting-adjusted): Ibasis $2700 (91+), Ibasis $900 pending (31-60), RetailMart $6000 (1-7), RetailMart $3500 (8-15)');
  console.log('  AP Report  (netting-adjusted): XYZ $3000 (61-90), XYZ $2200 (31-60), XYZ $750 (16-30)');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
