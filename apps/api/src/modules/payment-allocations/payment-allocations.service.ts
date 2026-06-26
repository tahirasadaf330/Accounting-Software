import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';
import { Prisma, VoucherType, VoucherStatus } from '@prisma/client';
import Decimal from 'decimal.js';
import { computeBillingPeriod } from '../../common/utils/billing-period';

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

    return this.prisma.$transaction((tx) =>
      this.validateAndCreateAllocations(
        tx,
        tenantId,
        {
          id: payment.id,
          contactId: payment.contactId,
          voucherType: payment.voucherType,
          voucherNumber: payment.voucherNumber,
          totalAmount: payment.totalAmount,
        },
        dto.allocations,
      ),
    );
  }

  /**
   * Validate + create payment allocations against an already-persisted payment
   * voucher inside an existing transaction. Reused by `allocate` (post-hoc)
   * and by `VouchersService.createWithAllocations` (inline on voucher create).
   */
  async validateAndCreateAllocations(
    tx: Prisma.TransactionClient,
    tenantId: string,
    payment: {
      id: string;
      contactId: string | null;
      voucherType: VoucherType;
      voucherNumber: string;
      totalAmount: Prisma.Decimal;
    },
    allocations: { invoiceVoucherId: string; amount: number; paidAt: string }[],
  ) {
    if (
      payment.voucherType !== VoucherType.RECEIPT &&
      payment.voucherType !== VoucherType.PAYMENT &&
      payment.voucherType !== VoucherType.JOURNAL
    ) {
      throw new BadRequestException(
        'Only Receipt, Payment, or Journal vouchers can have allocations',
      );
    }

    if (!payment.contactId) {
      throw new BadRequestException(
        'Allocations require a contact on the payment voucher',
      );
    }

    // Load each invoice once, validate same contact + remaining balance, and
    // classify each allocation as receivable-side (SALES) or payable-side
    // (PURCHASE). The voucher-total cap is enforced per side so that a
    // netting journal (BOTH contact) can clear both a receivable and a
    // payable in one voucher without the sides cancelling out the cap.
    let salesAllocated = 0;
    let purchaseAllocated = 0;
    for (const line of allocations) {
      const invoice = await tx.voucher.findFirst({
        where: {
          id: line.invoiceVoucherId,
          tenantId,
          status: VoucherStatus.POSTED,
        },
      });
      if (!invoice) {
        throw new NotFoundException(
          `Invoice voucher ${line.invoiceVoucherId} not found or not posted`,
        );
      }
      if (invoice.contactId !== payment.contactId) {
        throw new BadRequestException(
          'Invoice and payment must belong to the same contact',
        );
      }

      const invoiceAllocations = await tx.paymentAllocation.aggregate({
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

      if (invoice.voucherType === VoucherType.SALES) salesAllocated += line.amount;
      else if (invoice.voucherType === VoucherType.PURCHASE) purchaseAllocated += line.amount;
    }

    const existing = await tx.paymentAllocation.findMany({
      where: { tenantId, paymentVoucherId: payment.id },
      include: { invoiceVoucher: { select: { voucherType: true } } },
    });
    for (const row of existing) {
      const t = row.invoiceVoucher.voucherType;
      if (t === VoucherType.SALES) salesAllocated += row.amount.toNumber();
      else if (t === VoucherType.PURCHASE) purchaseAllocated += row.amount.toNumber();
    }

    const cap = payment.totalAmount.toNumber() + 0.01;
    if (salesAllocated > cap) {
      throw new BadRequestException(
        `Total sales allocation ($${salesAllocated.toFixed(2)}) exceeds voucher amount ($${payment.totalAmount.toFixed(2)})`,
      );
    }
    if (purchaseAllocated > cap) {
      throw new BadRequestException(
        `Total purchase allocation ($${purchaseAllocated.toFixed(2)}) exceeds voucher amount ($${payment.totalAmount.toFixed(2)})`,
      );
    }

    const created: object[] = [];
    for (const a of allocations.filter((x) => x.amount > 0)) {
      const row = await tx.paymentAllocation.create({
        data: {
          tenantId,
          paymentVoucherId: payment.id,
          invoiceVoucherId: a.invoiceVoucherId,
          amount: new Decimal(a.amount.toFixed(4)),
          paidAt: new Date(a.paidAt),
        },
      });
      created.push(row);
    }

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
    // Load contact to get billing config
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, tenantId },
      select: { billingStartDate: true, paymentTermDays: true },
    });

    // RECEIPT â†’ show only SALES invoices, PAYMENT â†’ show only PURCHASE invoices
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

    // Compute billing period for each invoice based on contact's billingStartDate + paymentTermDays
    const billingStart = contact?.billingStartDate ? new Date(contact.billingStartDate) : null;
    const termDays = contact?.paymentTermDays || 30;

    return invoices.map((inv) => {
      const totalPaid = inv.invoiceAllocations.reduce(
        (sum, a) => sum + a.amount.toNumber(),
        0,
      );
      const remaining = inv.totalAmount.toNumber() - totalPaid;
      const status = remaining <= 0 ? 'SETTLED' : totalPaid > 0 ? 'PARTIAL' : 'UNPAID';
      const billingPeriod = computeBillingPeriod(inv.date as Date, billingStart, termDays);

      return {
        id: inv.id,
        voucherNumber: inv.voucherNumber,
        voucherType: inv.voucherType,
        totalAmount: inv.totalAmount.toFixed(4),
        date: (inv.date as Date).toISOString().split('T')[0],
        periodEnd: inv.periodEnd ? (inv.periodEnd as Date).toISOString().split('T')[0] : null,
        billingPeriodKey: billingPeriod?.key || 'ungrouped',
        billingPeriodLabel: billingPeriod?.label || 'No billing period set',
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
        contact: { select: { name: true, paymentTermDays: true } },
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

      // Due date = periodEnd + contact's payment terms (in days)
      let dueDate: string | null = null;
      if (inv.periodEnd) {
        const d = new Date(inv.periodEnd);
        const termDays = inv.contact?.paymentTermDays || 1;
        d.setDate(d.getDate() + termDays);
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

