import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VoucherType, VoucherStatus, NettingCycleStatus, ContactType } from '@prisma/client';
import { ARAPReportQueryDto } from './dto/ar-ap-report-query.dto';
import { AgingBucket } from '@accounting-saas/shared';
import Decimal from 'decimal.js';

function getAgingBucket(daysOverdue: number): AgingBucket {
  if (daysOverdue <= 0) return 'current';
  if (daysOverdue <= 30) return '1-30';
  if (daysOverdue <= 60) return '31-60';
  if (daysOverdue <= 90) return '61-90';
  return '91+';
}

function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

function toDateStr(d: Date | null | undefined): string | null {
  if (!d) return null;
  const dt = d instanceof Date ? d : new Date(d);
  return dt.toISOString().split('T')[0];
}

function daysBetween(from: Date, to: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((to.getTime() - from.getTime()) / msPerDay);
}

// Statuses that require netting-aware treatment in reports.
// AM_REJECTED and CEO_REJECTED are intentionally omitted — those invoices revert to normal rows.
const ACTIVE_NETTING_STATUSES = [
  NettingCycleStatus.OPEN,
  NettingCycleStatus.PENDING_AM,
  NettingCycleStatus.PENDING_CEO,
  NettingCycleStatus.APPROVED,
  NettingCycleStatus.PARTIAL,
  NettingCycleStatus.SETTLED,
];

// Statuses that generate a synthetic collapsible row (constituent invoices are excluded from regular rows).
// SETTLED is excluded — invoices drop off naturally once fully paid.
const SYNTHETIC_ROW_STATUSES = new Set<NettingCycleStatus>([
  NettingCycleStatus.OPEN,
  NettingCycleStatus.PENDING_AM,
  NettingCycleStatus.PENDING_CEO,
  NettingCycleStatus.APPROVED,
  NettingCycleStatus.PARTIAL,
]);

@Injectable()
export class APReportService {
  constructor(private prisma: PrismaService) {}

  async generate(tenantId: string, filters: ARAPReportQueryDto) {
    const asOfDate = filters.asOfDate ? new Date(filters.asOfDate) : new Date();
    const showOutstandingOnly = filters.showOutstandingOnly !== false;
    const includeNettingAdjustments = filters.includeNettingAdjustments !== false;

    const where: any = {
      tenantId,
      voucherType: VoucherType.PURCHASE,
      status: VoucherStatus.POSTED,
      date: { lte: asOfDate },
    };

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    if (includeNettingAdjustments) {
      // BOTH-type contacts only show invoices linked to a cycle that generates
      // a synthetic settlement row, so every visible BOTH invoice nests at
      // Level 3 of the hierarchy. Rejected and SETTLED cycles are excluded by
      // virtue of being absent from SYNTHETIC_ROW_STATUSES.
      where.OR = [
        { contact: { type: { not: ContactType.BOTH } } },
        {
          contact: { type: ContactType.BOTH },
          nettingCycleInvoices: {
            some: {
              cycle: { status: { in: Array.from(SYNTHETIC_ROW_STATUSES) } },
            },
          },
        },
      ];
    }

    const vouchers = await this.prisma.voucher.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, paymentTermDays: true, bankAccountNumber: true, type: true } },
        invoiceAllocations: {
          where: { paidAt: { lte: asOfDate } },
          select: { amount: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { date: 'asc' },
    });

    // voucherId → { cycleId, cycleStatus } for flagging rows
    const voucherCycleMap = new Map<string, { cycleId: string; cycleStatus: string }>();
    // vouchers in any non-rejected active cycle are excluded from regular rows and replaced by synthetic rows
    const excludedVoucherIds = new Set<string>();
    // vouchers that are carry-forward contributors to an approved/partial cycle
    const carryForwardExcludedIds = new Set<string>();
    // cycles that generate a synthetic collapsible row
    const syntheticRowCycles: any[] = [];

    if (includeNettingAdjustments) {
      const nettingWhere: any = {
        tenantId,
        status: { in: ACTIVE_NETTING_STATUSES },
      };
      if (filters.contactId) nettingWhere.contactId = filters.contactId;

      const nettingCycles = await this.prisma.nettingCycle.findMany({
        where: nettingWhere,
        include: {
          contact: { select: { id: true, name: true, type: true, paymentTermDays: true } },
          invoices: {
            include: {
              voucher: {
                select: {
                  id: true,
                  voucherNumber: true,
                  voucherType: true,
                  currencyCode: true,
                  totalAmount: true,
                  date: true,
                  status: true,
                  reference: true,
                  narration: true,
                  _count: { select: { comments: true } },
                  invoiceAllocations: {
                    where: { paidAt: { lte: asOfDate } },
                    select: { amount: true },
                  },
                },
              },
            },
          },
        },
      });

      for (const cycle of nettingCycles) {
        const hasSyntheticRow = SYNTHETIC_ROW_STATUSES.has(cycle.status as NettingCycleStatus);

        for (const inv of cycle.invoices) {
          voucherCycleMap.set(inv.voucherId, { cycleId: cycle.id, cycleStatus: cycle.status });
          if (hasSyntheticRow) {
            excludedVoucherIds.add(inv.voucherId);
          }
        }

        if (hasSyntheticRow) {
          syntheticRowCycles.push(cycle);
        }
      }

    }

    // --- Process regular voucher rows ---
    let totalInvoiced = new Decimal(0);
    let totalPaid = new Decimal(0);
    let grossOutstanding = new Decimal(0);
    let totalOutstanding = new Decimal(0);
    const aging = {
      current: new Decimal(0),
      days1to30: new Decimal(0),
      days31to60: new Decimal(0),
      days61to90: new Decimal(0),
      days91plus: new Decimal(0),
    };

    const allRows: any[] = [];

    for (const v of vouchers) {
      const invoiceAmount = new Decimal(v.totalAmount.toString());
      const paidAmount = v.invoiceAllocations.reduce(
        (sum, a) => sum.plus(new Decimal(a.amount.toString())),
        new Decimal(0),
      );
      const outstanding = invoiceAmount.minus(paidAmount).toDecimalPlaces(4);

      totalInvoiced = totalInvoiced.plus(invoiceAmount);
      totalPaid = totalPaid.plus(paidAmount);
      grossOutstanding = grossOutstanding.plus(outstanding);

      // Vouchers in any active cycle or contributing carry-forward are excluded —
      // their outstanding is represented by the synthetic row for the cycle.
      if (excludedVoucherIds.has(v.id) || carryForwardExcludedIds.has(v.id)) {
        continue;
      }

      totalOutstanding = totalOutstanding.plus(outstanding);

      const voucherDate = v.date instanceof Date ? v.date : new Date(v.date);
      const termDays = v.contact?.paymentTermDays ?? 0;
      const dueDate = termDays > 0 ? addDays(voucherDate, termDays) : voucherDate;
      const daysOverdue = daysBetween(dueDate, asOfDate);
      const bucket = getAgingBucket(daysOverdue);

      if (outstanding.greaterThan(0)) {
        if (bucket === 'current') aging.current = aging.current.plus(outstanding);
        else if (bucket === '1-30') aging.days1to30 = aging.days1to30.plus(outstanding);
        else if (bucket === '31-60') aging.days31to60 = aging.days31to60.plus(outstanding);
        else if (bucket === '61-90') aging.days61to90 = aging.days61to90.plus(outstanding);
        else aging.days91plus = aging.days91plus.plus(outstanding);
      }

      const bankAcct = v.contact?.bankAccountNumber ?? null;
      const cycleInfo = voucherCycleMap.get(v.id) ?? null;

      allRows.push({
        voucherId: v.id,
        voucherNumber: v.voucherNumber,
        contactId: v.contactId ?? '',
        contactName: v.contact?.name ?? '—',
        contactType: v.contact?.type ?? null,
        voucherType: VoucherType.PURCHASE,
        currencyCode: v.currencyCode,
        bankAccountLast4: bankAcct && bankAcct.length >= 4 ? bankAcct.slice(-4) : null,
        date: toDateStr(v.date as unknown as Date)!,
        dueDate: toDateStr(dueDate),
        totalAmount: invoiceAmount.toFixed(4),
        paidAmount: paidAmount.toFixed(4),
        outstandingAmount: outstanding.toFixed(4),
        daysOverdue,
        agingBucket: bucket,
        status: v.status,
        markedPaid: outstanding.lessThanOrEqualTo(0),
        reference: v.reference ?? null,
        narration: v.narration,
        commentCount: v._count.comments,
        nettingCycleId: cycleInfo?.cycleId ?? null,
        nettingCycleStatus: cycleInfo?.cycleStatus ?? null,
        isNettingSettlement: false,
        isInApprovedCycle: false,
      });
    }

    // --- Synthetic collapsible rows for all non-rejected active netting cycles ---
    if (includeNettingAdjustments) {
      for (const cycle of syntheticRowCycles) {
        const isApprovedOrPartial =
          cycle.status === NettingCycleStatus.APPROVED ||
          cycle.status === NettingCycleStatus.PARTIAL;

        let displayAmount: Decimal;

        if (isApprovedOrPartial) {
          let cycleReceivable = new Decimal(0);
          let cyclePayable = new Decimal(0);

          for (const inv of cycle.invoices) {
            const v = inv.voucher;
            if (!v) continue;
            const paid = v.invoiceAllocations.reduce(
              (s: Decimal, a: any) => s.plus(new Decimal(a.amount.toString())),
              new Decimal(0),
            );
            const remaining = new Decimal(v.totalAmount.toString()).minus(paid);
            if (remaining.greaterThan(0)) {
              if (v.voucherType === VoucherType.SALES) {
                cycleReceivable = cycleReceivable.plus(remaining);
              } else {
                cyclePayable = cyclePayable.plus(remaining);
              }
            }
          }

          const cycleNet = cycleReceivable.minus(cyclePayable);
          const netTotal = cycleNet;
          const absNet = netTotal.abs().toDecimalPlaces(4);
          const isSettled = absNet.lessThanOrEqualTo(0.0001);
          const isPayable = netTotal.lessThan(-0.0001);

          if (!isPayable && !isSettled) continue;
          if (isSettled && showOutstandingOnly) continue;
          displayAmount = absNet;
        } else {
          // Pending/Open: show net (cycle AP − cycle AR). Same math as approved cycles;
          // the badge on the row tells the user the netting isn't approved yet.
          let cycleReceivable = new Decimal(0);
          let cyclePayable = new Decimal(0);
          for (const inv of cycle.invoices) {
            const v = inv.voucher;
            if (!v) continue;
            const paid = v.invoiceAllocations.reduce(
              (s: Decimal, a: any) => s.plus(new Decimal(a.amount.toString())),
              new Decimal(0),
            );
            const remaining = new Decimal(v.totalAmount.toString()).minus(paid);
            if (remaining.greaterThan(0)) {
              if (v.voucherType === VoucherType.SALES) {
                cycleReceivable = cycleReceivable.plus(remaining);
              } else {
                cyclePayable = cyclePayable.plus(remaining);
              }
            }
          }
          const cycleNet = cycleReceivable.minus(cyclePayable);
          const absNet = cycleNet.abs().toDecimalPlaces(4);
          const isSettled = absNet.lessThanOrEqualTo(0.0001);
          const isPayable = cycleNet.lessThan(-0.0001);
          if (!isPayable && !isSettled) continue;
          if (isSettled && showOutstandingOnly) continue;
          displayAmount = absNet;
        }

        const rawDueDate = isApprovedOrPartial
          ? (cycle.dueDate ?? cycle.endDate ?? cycle.startDate)
          : (cycle.endDate ?? cycle.dueDate ?? cycle.startDate);
        const cycleDueDate = rawDueDate instanceof Date ? rawDueDate : new Date(rawDueDate ?? new Date());
        const daysOverdue = daysBetween(cycleDueDate, asOfDate);
        const bucket = getAgingBucket(daysOverdue);

        totalOutstanding = totalOutstanding.plus(displayAmount);

        if (displayAmount.greaterThan(0)) {
          if (bucket === 'current') aging.current = aging.current.plus(displayAmount);
          else if (bucket === '1-30') aging.days1to30 = aging.days1to30.plus(displayAmount);
          else if (bucket === '31-60') aging.days31to60 = aging.days31to60.plus(displayAmount);
          else if (bucket === '61-90') aging.days61to90 = aging.days61to90.plus(displayAmount);
          else aging.days91plus = aging.days91plus.plus(displayAmount);
        }

        const constituentRows = cycle.invoices
          .map((inv: any) => {
            const cv = inv.voucher;
            if (!cv) return null;
            const cvPaid = cv.invoiceAllocations.reduce(
              (s: Decimal, a: any) => s.plus(new Decimal(a.amount.toString())),
              new Decimal(0),
            );
            const cvAmt = new Decimal(cv.totalAmount.toString());
            const cvOutstanding = cvAmt.minus(cvPaid).toDecimalPlaces(4);
            const cvDate = cv.date instanceof Date ? cv.date : new Date(cv.date);
            const cvTermDays = cycle.contact?.paymentTermDays ?? 0;
            const cvDueDate = cvTermDays > 0 ? addDays(cvDate, cvTermDays) : cvDate;
            const cvDaysOverdue = daysBetween(cvDueDate, asOfDate);
            return {
              voucherId: inv.voucherId,
              voucherNumber: cv.voucherNumber,
              contactId: cycle.contactId,
              contactName: cycle.contact?.name ?? '—',
              contactType: cycle.contact?.type ?? null,
              voucherType: cv.voucherType,
              currencyCode: cv.currencyCode,
              date: toDateStr(cv.date as unknown as Date)!,
              dueDate: toDateStr(cvDueDate),
              totalAmount: cvAmt.toFixed(4),
              paidAmount: cvPaid.toFixed(4),
              outstandingAmount: cvOutstanding.toFixed(4),
              daysOverdue: cvDaysOverdue,
              agingBucket: getAgingBucket(cvDaysOverdue),
              status: cv.status,
              reference: cv.reference ?? null,
              narration: cv.narration,
              commentCount: cv._count?.comments ?? 0,
              markedPaid: cvOutstanding.lessThanOrEqualTo(0),
              nettingCycleId: cycle.id,
              nettingCycleStatus: cycle.status,
              isNettingSettlement: false,
              isInApprovedCycle: isApprovedOrPartial,
            };
          })
          .filter(Boolean);

        allRows.push({
          voucherId: `netting-${cycle.id}`,
          voucherNumber: `NETTING-${cycle.id.slice(0, 8).toUpperCase()}`,
          contactId: cycle.contactId,
          contactName: cycle.contact?.name ?? '—',
          contactType: cycle.contact?.type ?? null,
          voucherType: null,
          date: toDateStr(cycle.startDate)!,
          dueDate: toDateStr(cycleDueDate),
          totalAmount: displayAmount.toFixed(4),
          paidAmount: '0.0000',
          outstandingAmount: displayAmount.toFixed(4),
          daysOverdue,
          agingBucket: bucket,
          status: cycle.status,
          reference: null,
          narration: `Netting ${isApprovedOrPartial ? 'settlement' : 'cycle'} (${toDateStr(cycle.startDate)} – ${toDateStr(cycle.endDate)})`,
          commentCount: 0,
          nettingCycleId: cycle.id,
          nettingCycleStatus: cycle.status,
          isNettingSettlement: true,
          isInApprovedCycle: false,
          constituentRows,
        });
      }
    }

    const nettingAdjustment = grossOutstanding.minus(totalOutstanding).abs();

    const rows = showOutstandingOnly
      ? allRows.filter((r) => new Decimal(r.outstandingAmount).greaterThan(0))
      : allRows;

    return {
      reportType: 'AP' as const,
      asOfDate: toDateStr(asOfDate)!,
      currency: 'USD',
      rows,
      summary: {
        totalInvoiced: totalInvoiced.toFixed(4),
        totalPaid: totalPaid.toFixed(4),
        totalOutstanding: totalOutstanding.toFixed(4),
        grossOutstanding: grossOutstanding.toFixed(4),
        nettingAdjustment: nettingAdjustment.toFixed(4),
        aging: {
          current: aging.current.toFixed(4),
          days1to30: aging.days1to30.toFixed(4),
          days31to60: aging.days31to60.toFixed(4),
          days61to90: aging.days61to90.toFixed(4),
          days91plus: aging.days91plus.toFixed(4),
        },
      },
      generatedAt: new Date().toISOString(),
      filters: {
        asOfDate: toDateStr(asOfDate),
        contactId: filters.contactId ?? null,
        showOutstandingOnly,
        includeNettingAdjustments,
      },
    };
  }
}
