import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VoucherType, VoucherStatus } from '@prisma/client';
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

@Injectable()
export class APReportService {
  constructor(private prisma: PrismaService) {}

  async generate(tenantId: string, filters: ARAPReportQueryDto) {
    const asOfDate = filters.asOfDate ? new Date(filters.asOfDate) : new Date();
    const showOutstandingOnly = filters.showOutstandingOnly !== false;

    const where: any = {
      tenantId,
      voucherType: VoucherType.PURCHASE,
      status: VoucherStatus.POSTED,
      date: { lte: asOfDate },
    };

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    const vouchers = await this.prisma.voucher.findMany({
      where,
      include: {
        contact: { select: { id: true, name: true, paymentTermDays: true, bankAccountNumber: true } },
        invoiceAllocations: {
          where: { paidAt: { lte: asOfDate } },
          select: { amount: true },
        },
        _count: { select: { comments: true } },
      },
      orderBy: { date: 'asc' },
    });

    let totalInvoiced = new Decimal(0);
    let totalPaid = new Decimal(0);
    let totalOutstanding = new Decimal(0);
    const aging = {
      current: new Decimal(0),
      days1to30: new Decimal(0),
      days31to60: new Decimal(0),
      days61to90: new Decimal(0),
      days91plus: new Decimal(0),
    };

    const allRows = vouchers.map((v) => {
      const invoiceAmount = new Decimal(v.totalAmount.toString());
      const paidAmount = v.invoiceAllocations.reduce(
        (sum, a) => sum.plus(new Decimal(a.amount.toString())),
        new Decimal(0),
      );
      const outstanding = invoiceAmount.minus(paidAmount).toDecimalPlaces(4);

      const voucherDate = v.date instanceof Date ? v.date : new Date(v.date);
      const termDays = v.contact?.paymentTermDays ?? 0;
      const dueDate = termDays > 0 ? addDays(voucherDate, termDays) : voucherDate;
      const daysOverdue = daysBetween(dueDate, asOfDate);
      const bucket = getAgingBucket(daysOverdue);

      totalInvoiced = totalInvoiced.plus(invoiceAmount);
      totalPaid = totalPaid.plus(paidAmount);
      totalOutstanding = totalOutstanding.plus(outstanding);

      if (outstanding.greaterThan(0)) {
        if (bucket === 'current') aging.current = aging.current.plus(outstanding);
        else if (bucket === '1-30') aging.days1to30 = aging.days1to30.plus(outstanding);
        else if (bucket === '31-60') aging.days31to60 = aging.days31to60.plus(outstanding);
        else if (bucket === '61-90') aging.days61to90 = aging.days61to90.plus(outstanding);
        else aging.days91plus = aging.days91plus.plus(outstanding);
      }

      const bankAcct = v.contact?.bankAccountNumber ?? null;
      return {
        voucherId: v.id,
        voucherNumber: v.voucherNumber,
        contactId: v.contactId ?? '',
        contactName: v.contact?.name ?? '—',
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
      };
    });

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
      },
    };
  }
}
