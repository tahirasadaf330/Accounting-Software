import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';
import { Prisma, VoucherType, VoucherStatus } from '@prisma/client';

@Injectable()
export class PaymentAllocationsService {
  constructor(private prisma: PrismaService) {}

  async allocate(tenantId: string, paymentVoucherId: string, dto: AllocatePaymentDto) {
    const payment = await this.prisma.voucher.findFirst({
      where: { id: paymentVoucherId, tenantId, status: VoucherStatus.POSTED },
    });

    if (!payment) {
      throw new NotFoundException('Payment voucher not found or not posted');
    }

    // Validate it's a payment type (RECEIPT or PAYMENT)
    if (payment.voucherType !== VoucherType.RECEIPT && payment.voucherType !== VoucherType.PAYMENT) {
      throw new BadRequestException('Voucher is not a payment/receipt type');
    }

    // Get existing allocations for this payment
    const existingAllocations = await this.prisma.paymentAllocation.findMany({
      where: { tenantId, paymentVoucherId },
    });
    const existingTotal = existingAllocations.reduce(
      (sum, a) => sum.plus(a.amount),
      new Prisma.Decimal(0),
    );

    // Calculate new allocation total
    const newTotal = dto.allocations.reduce(
      (sum, a) => sum + a.amount,
      0,
    );

    // Check total doesn't exceed payment amount
    const totalAllocated = existingTotal.toNumber() + newTotal;
    if (totalAllocated > payment.totalAmount.toNumber()) {
      throw new BadRequestException(
        `Total allocation ($${totalAllocated.toFixed(2)}) exceeds payment amount ($${payment.totalAmount.toFixed(2)})`,
      );
    }

    // Validate each invoice exists and belongs to same contact
    for (const line of dto.allocations) {
      const invoice = await this.prisma.voucher.findFirst({
        where: { id: line.invoiceVoucherId, tenantId, status: VoucherStatus.POSTED },
      });
      if (!invoice) {
        throw new NotFoundException(`Invoice voucher ${line.invoiceVoucherId} not found or not posted`);
      }
      if (invoice.contactId !== payment.contactId) {
        throw new BadRequestException('Invoice and payment must belong to the same contact');
      }

      // Check allocation doesn't exceed invoice remaining
      const invoiceAllocations = await this.prisma.paymentAllocation.aggregate({
        where: { tenantId, invoiceVoucherId: line.invoiceVoucherId },
        _sum: { amount: true },
      });
      const alreadyPaid = invoiceAllocations._sum.amount?.toNumber() || 0;
      const remaining = invoice.totalAmount.toNumber() - alreadyPaid;

      if (line.amount > remaining + 0.001) {
        throw new BadRequestException(
          `Allocation of $${line.amount.toFixed(2)} exceeds remaining $${remaining.toFixed(2)} for invoice ${invoice.voucherNumber}`,
        );
      }
    }

    // Create allocations
    const created = await this.prisma.$transaction(
      dto.allocations
        .filter((a) => a.amount > 0)
        .map((a) =>
          this.prisma.paymentAllocation.create({
            data: {
              tenantId,
              paymentVoucherId,
              invoiceVoucherId: a.invoiceVoucherId,
              amount: new Prisma.Decimal(a.amount.toFixed(4)),
              paidAt: new Date(a.paidAt),
            },
          }),
        ),
    );

    return created;
  }

  async getAllocationsForPayment(tenantId: string, paymentVoucherId: string) {
    return this.prisma.paymentAllocation.findMany({
      where: { tenantId, paymentVoucherId },
      include: {
        invoiceVoucher: {
          select: { id: true, voucherNumber: true, totalAmount: true, voucherType: true, date: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getUnpaidInvoicesForContact(tenantId: string, contactId: string, paymentType?: string) {
    // RECEIPT → show only SALES invoices, PAYMENT → show only PURCHASE invoices
    let invoiceTypes: VoucherType[];
    if (paymentType === 'RECEIPT') {
      invoiceTypes = [VoucherType.SALES];
    } else if (paymentType === 'PAYMENT') {
      invoiceTypes = [VoucherType.PURCHASE];
    } else {
      invoiceTypes = [VoucherType.SALES, VoucherType.PURCHASE];
    }

    const invoices = await this.prisma.voucher.findMany({
      where: {
        tenantId,
        contactId,
        status: VoucherStatus.POSTED,
        voucherType: { in: invoiceTypes },
      },
      select: {
        id: true,
        voucherNumber: true,
        voucherType: true,
        totalAmount: true,
        date: true,
        periodEnd: true,
        invoiceAllocations: {
          select: { amount: true },
        },
      },
      orderBy: { date: 'asc' },
    });

    return invoices.map((inv) => {
      const totalPaid = inv.invoiceAllocations.reduce(
        (sum, a) => sum + a.amount.toNumber(),
        0,
      );
      const remaining = inv.totalAmount.toNumber() - totalPaid;
      const status = remaining <= 0 ? 'SETTLED' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';

      return {
        id: inv.id,
        voucherNumber: inv.voucherNumber,
        voucherType: inv.voucherType,
        totalAmount: inv.totalAmount.toFixed(4),
        date: (inv.date as Date).toISOString().split('T')[0],
        periodEnd: inv.periodEnd ? (inv.periodEnd as Date).toISOString().split('T')[0] : null,
        totalPaid: totalPaid.toFixed(4),
        remaining: remaining.toFixed(4),
        status,
      };
    });
  }

  async deleteAllocation(tenantId: string, allocationId: string) {
    const allocation = await this.prisma.paymentAllocation.findFirst({
      where: { id: allocationId, tenantId },
    });
    if (!allocation) {
      throw new NotFoundException('Allocation not found');
    }
    await this.prisma.paymentAllocation.delete({ where: { id: allocationId } });
  }

  // Netting report
  async getNettingReport(
    tenantId: string,
    contactId?: string,
    fromDate?: string,
    toDate?: string,
    showSettled?: boolean,
  ) {
    const where: any = {
      tenantId,
      status: VoucherStatus.POSTED,
      voucherType: { in: [VoucherType.SALES, VoucherType.PURCHASE] },
    };

    if (contactId) where.contactId = contactId;
    if (fromDate || toDate) {
      where.date = {};
      if (fromDate) where.date.gte = new Date(fromDate);
      if (toDate) where.date.lte = new Date(toDate);
    }

    const invoices = await this.prisma.voucher.findMany({
      where,
      select: {
        id: true,
        voucherNumber: true,
        voucherType: true,
        totalAmount: true,
        date: true,
        periodEnd: true,
        contactId: true,
        contact: { select: { name: true } },
        invoiceAllocations: {
          select: { amount: true, paidAt: true },
          orderBy: { paidAt: 'desc' },
        },
      },
      orderBy: { date: 'asc' },
    });

    const rows = invoices.map((inv) => {
      const totalPaid = inv.invoiceAllocations.reduce(
        (sum, a) => sum + a.amount.toNumber(),
        0,
      );
      const remaining = inv.totalAmount.toNumber() - totalPaid;
      const status = remaining <= 0.001 ? 'SETTLED' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
      const lastPaidAt = inv.invoiceAllocations.length > 0
        ? inv.invoiceAllocations[0].paidAt.toISOString()
        : null;

      // Due date = periodEnd + 1 day
      let dueDate: string | null = null;
      if (inv.periodEnd) {
        const d = new Date(inv.periodEnd);
        d.setDate(d.getDate() + 1);
        dueDate = d.toISOString().split('T')[0];
      }

      return {
        id: inv.id,
        voucherNumber: inv.voucherNumber,
        voucherType: inv.voucherType,
        contactName: inv.contact?.name || '',
        date: (inv.date as Date).toISOString().split('T')[0],
        totalAmount: inv.totalAmount.toFixed(4),
        totalPaid: totalPaid.toFixed(4),
        remaining: remaining.toFixed(4),
        status,
        lastPaidAt,
        dueDate,
      };
    });

    // Filter out settled if not requested
    const filtered = showSettled ? rows : rows.filter((r) => r.status !== 'SETTLED');

    // Split into receivable and payable
    const receivable = filtered.filter((r) => r.voucherType === 'SALES');
    const payable = filtered.filter((r) => r.voucherType === 'PURCHASE');

    const totalReceivableAmount = receivable.reduce((s, r) => s + parseFloat(r.totalAmount), 0);
    const totalReceivablePaid = receivable.reduce((s, r) => s + parseFloat(r.totalPaid), 0);
    const totalReceivableRemaining = receivable.reduce((s, r) => s + parseFloat(r.remaining), 0);

    const totalPayableAmount = payable.reduce((s, r) => s + parseFloat(r.totalAmount), 0);
    const totalPayablePaid = payable.reduce((s, r) => s + parseFloat(r.totalPaid), 0);
    const totalPayableRemaining = payable.reduce((s, r) => s + parseFloat(r.remaining), 0);

    const netPosition = totalReceivableRemaining - totalPayableRemaining;

    return {
      receivable: {
        rows: receivable,
        totalAmount: totalReceivableAmount.toFixed(4),
        totalPaid: totalReceivablePaid.toFixed(4),
        totalRemaining: totalReceivableRemaining.toFixed(4),
      },
      payable: {
        rows: payable,
        totalAmount: totalPayableAmount.toFixed(4),
        totalPaid: totalPayablePaid.toFixed(4),
        totalRemaining: totalPayableRemaining.toFixed(4),
      },
      netPosition: Math.abs(netPosition).toFixed(4),
      netNature: netPosition >= 0 ? 'Receivable' : 'Payable',
    };
  }
}
