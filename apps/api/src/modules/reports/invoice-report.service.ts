import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { VoucherType } from '@prisma/client';
import { InvoiceReportQueryDto } from './dto/invoice-report-query.dto';

const ROW_CAP = 5000;

@Injectable()
export class InvoiceReportService {
  constructor(private prisma: PrismaService) {}

  async generate(tenantId: string, filters: InvoiceReportQueryDto) {
    const types: VoucherType[] = filters.type
      ? [filters.type as unknown as VoucherType]
      : [VoucherType.SALES, VoucherType.PURCHASE];

    const where: any = {
      tenantId,
      voucherType: { in: types },
    };

    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }

    if (filters.periodStart) {
      where.periodStart = { gte: new Date(filters.periodStart) };
    }

    if (filters.periodEnd) {
      where.periodEnd = { lte: new Date(filters.periodEnd) };
    }

    if (filters.contactId) {
      where.contactId = filters.contactId;
    }

    const vouchers = await this.prisma.voucher.findMany({
      where,
      include: {
        contact: { select: { name: true } },
      },
      orderBy: { date: 'asc' },
      take: ROW_CAP,
    });

    let totalSales = 0;
    let totalSalesCount = 0;
    let totalPurchases = 0;
    let totalPurchasesCount = 0;

    const rows = vouchers.map((v) => {
      const amount = Number(v.totalAmount);
      if (v.voucherType === VoucherType.SALES) {
        totalSales += amount;
        totalSalesCount++;
      } else if (v.voucherType === VoucherType.PURCHASE) {
        totalPurchases += amount;
        totalPurchasesCount++;
      }

      const toDateStr = (d: Date | null | undefined) =>
        d ? (d instanceof Date ? d.toISOString().split('T')[0] : String(d).split('T')[0]) : null;

      return {
        voucherNumber: v.voucherNumber,
        date: toDateStr(v.date as unknown as Date),
        voucherType: v.voucherType,
        contactName: v.contact?.name ?? null,
        reference: v.reference ?? null,
        narration: v.narration,
        periodStart: toDateStr(v.periodStart as unknown as Date | null),
        periodEnd: toDateStr(v.periodEnd as unknown as Date | null),
        totalAmount: v.totalAmount.toFixed(4),
        status: v.status,
      };
    });

    return {
      rows,
      summary: {
        totalSales: totalSales.toFixed(4),
        totalSalesCount,
        totalPurchases: totalPurchases.toFixed(4),
        totalPurchasesCount,
        netBalance: (totalSales - totalPurchases).toFixed(4),
      },
      generatedAt: new Date().toISOString(),
      filters: {
        dateFrom: filters.dateFrom ?? null,
        dateTo: filters.dateTo ?? null,
        periodStart: filters.periodStart ?? null,
        periodEnd: filters.periodEnd ?? null,
        type: filters.type ?? null,
        contactId: filters.contactId ?? null,
      },
    };
  }
}
