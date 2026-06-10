import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import * as fs from 'fs/promises';
import * as path from 'path';
import Decimal from 'decimal.js';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { ConfigService } from '@nestjs/config';
import { CreateNettingCycleDto, AddCommentDto, RejectDto } from './dto/netting-cycle.dto';
import { NettingCycleStatus, VoucherType, VoucherStatus, AccountType } from '@prisma/client';
import { VouchersService } from '../vouchers/vouchers.service';

@Injectable()
export class NettingCyclesService {
  private readonly webUrl: string;

  private static readonly UPLOADS_BASE = path.join(process.cwd(), 'uploads');
  private static readonly ALLOWED_PROOF_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ]);

  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
    private config: ConfigService,
    private vouchersService: VouchersService,
  ) {
    this.webUrl = this.config.get<string>('WEB_URL', 'http://localhost:3000');
  }

  async create(tenantId: string, dto: CreateNettingCycleDto) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: dto.contactId, tenantId },
    });
    if (!contact) throw new NotFoundException('Contact not found');

    const startDate = dto.startDate ? new Date(dto.startDate) : new Date('1900-01-01');
    const endDate = new Date(dto.endDate);
    const dueDate = new Date(endDate);
    const termDays = contact.paymentTermDays || 1;
    dueDate.setDate(dueDate.getDate() + termDays);

    // Duplicate prevention
    const existing = await this.prisma.nettingCycle.findUnique({
      where: {
        tenantId_contactId_startDate_endDate: {
          tenantId,
          contactId: dto.contactId,
          startDate,
          endDate,
        },
      },
    });
    if (existing) {
      throw new BadRequestException(
        'A netting record already exists for this customer in the selected time period.',
      );
    }

    if (!dto.invoiceIds || dto.invoiceIds.length === 0) {
      throw new BadRequestException('Please select at least one invoice.');
    }

    const cycle = await this.prisma.nettingCycle.create({
      data: {
        tenantId,
        contactId: dto.contactId,
        startDate,
        endDate,
        dueDate,
        status: NettingCycleStatus.OPEN,
        invoices: {
          createMany: {
            data: dto.invoiceIds.map((voucherId) => ({ voucherId })),
          },
        },
      },
      include: this.cycleIncludes(),
    });

    return this.formatCycle(cycle, tenantId);
  }

  async findAll(tenantId: string, contactId?: string, status?: string) {
    const where: any = { tenantId };
    if (contactId) where.contactId = contactId;
    if (status && Object.values(NettingCycleStatus).includes(status as NettingCycleStatus)) {
      where.status = status;
    }

    const cycles = await this.prisma.nettingCycle.findMany({
      where,
      include: this.cycleIncludes(),
      orderBy: { startDate: 'desc' },
    });

    const results = [];
    for (const cycle of cycles) {
      results.push(await this.formatCycle(cycle, tenantId));
    }
    return results;
  }

  async getApprovedCyclesForSettlement(tenantId: string, contactId: string) {
    const cycles = await this.prisma.nettingCycle.findMany({
      where: {
        tenantId,
        contactId,
        status: { in: [NettingCycleStatus.APPROVED, NettingCycleStatus.PARTIAL] },
      },
      include: { invoices: { select: { voucherId: true } } },
      orderBy: { startDate: 'asc' },
    });

    const results = [];
    for (const cycle of cycles) {
      const linkedIds = cycle.invoices.map((i) => i.voucherId);
      const invoices = await this.prisma.voucher.findMany({
        where: {
          id: { in: linkedIds.length > 0 ? linkedIds : ['none'] },
          tenantId,
          status: VoucherStatus.POSTED,
        },
        select: {
          id: true,
          voucherType: true,
          totalAmount: true,
          invoiceAllocations: { select: { amount: true } },
        },
      });

      let salesTotal = 0;
      let purchaseTotal = 0;
      let salesCount = 0;
      let purchaseCount = 0;
      for (const inv of invoices) {
        const paid = inv.invoiceAllocations.reduce((s, a) => s + a.amount.toNumber(), 0);
        const remaining = inv.totalAmount.toNumber() - paid;
        if (remaining > 0.01) {
          if (inv.voucherType === 'SALES') { salesTotal += remaining; salesCount++; }
          else { purchaseTotal += remaining; purchaseCount++; }
        }
      }

      const netRaw = salesTotal - purchaseTotal;
      results.push({
        id: cycle.id,
        startDate: (cycle.startDate as Date).toISOString().split('T')[0],
        endDate: (cycle.endDate as Date).toISOString().split('T')[0],
        status: cycle.status,
        salesCount,
        purchaseCount,
        salesTotal: salesTotal.toFixed(4),
        purchaseTotal: purchaseTotal.toFixed(4),
        netTotal: Math.abs(netRaw).toFixed(4),
        netNature: Math.abs(netRaw) < 0.01 ? 'Settled' : netRaw > 0 ? 'Receivable' : 'Payable',
      });
    }
    return results;
  }

  async findOne(tenantId: string, id: string) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id, tenantId },
      include: this.cycleIncludes(),
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');
    return this.formatCycle(cycle, tenantId);
  }

  async sendToAM(tenantId: string, id: string) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');
    if (cycle.status !== NettingCycleStatus.OPEN) {
      throw new BadRequestException('Can only send OPEN cycles to AM');
    }

    // Generate unique review token (expires in 7 days)
    const reviewToken = randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    const updated = await this.prisma.nettingCycle.update({
      where: { id },
      data: {
        status: NettingCycleStatus.PENDING_AM,
        reviewToken,
        tokenExpiresAt,
      },
      include: this.cycleIncludes(),
    });

    // Send emails to assigned AMs
    const contact = await this.prisma.contact.findFirst({
      where: { id: cycle.contactId, tenantId },
      include: {
        accountManagers: {
          include: { accountManager: true },
        },
      },
    });

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { name: true },
    });

    // Send emails in background (don't block the response)
    if (contact?.accountManagers) {
      for (const cam of contact.accountManagers) {
        const am = cam.accountManager;
        if (am.isActive && am.email) {
          this.mailService.sendNettingCycleReview({
            email: am.email,
            name: am.name,
            contactName: contact.name,
            cycleId: reviewToken,
            startDate: (cycle.startDate as Date).toISOString().split('T')[0],
            endDate: (cycle.endDate as Date).toISOString().split('T')[0],
            companyName: tenant?.name || 'Accounting System',
          }).catch(() => {}); // silently fail — email is best-effort
        }
      }
    }

    return this.formatCycle(updated, tenantId);
  }

  async amApprove(tenantId: string, id: string, userId: string) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');
    if (cycle.status !== NettingCycleStatus.PENDING_AM) {
      throw new BadRequestException('Cycle is not pending AM approval');
    }

    // Generate new token for CEO review
    const ceoToken = randomUUID();
    const tokenExpiresAt = new Date();
    tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

    const updated = await this.prisma.nettingCycle.update({
      where: { id },
      data: {
        status: NettingCycleStatus.PENDING_CEO,
        amApprovedById: userId,
        amApprovedAt: new Date(),
        reviewToken: ceoToken,
        tokenExpiresAt,
      },
      include: this.cycleIncludes(),
    });

    // Notify creator
    await this.createNotification(tenantId, updated, 'AM approved netting cycle');

    // Send email to CEO
    const ceoEmail = this.config.get<string>('CEO_EMAIL');
    if (ceoEmail) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: cycle.contactId, tenantId },
        select: { name: true },
      });
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      });
      this.mailService.sendNettingCycleReview({
        email: ceoEmail,
        name: this.config.get<string>('CEO_NAME') || 'CEO',
        contactName: contact?.name || '',
        cycleId: ceoToken,
        startDate: (cycle.startDate as Date).toISOString().split('T')[0],
        endDate: (cycle.endDate as Date).toISOString().split('T')[0],
        companyName: tenant?.name || 'Accounting System',
      }).catch(() => {});
    }

    return this.formatCycle(updated, tenantId);
  }

  async ceoApprove(tenantId: string, id: string, userId: string) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');
    if (cycle.status !== NettingCycleStatus.PENDING_CEO) {
      throw new BadRequestException('Cycle is not pending CEO approval');
    }

    const updated = await this.prisma.nettingCycle.update({
      where: { id },
      data: {
        status: NettingCycleStatus.APPROVED,
        ceoApprovedById: userId,
        ceoApprovedAt: new Date(),
      },
      include: this.cycleIncludes(),
    });

    await this.createNotification(tenantId, updated, 'CEO approved netting cycle');

    return this.formatCycle(updated, tenantId);
  }

  async reject(tenantId: string, id: string, userId: string, dto: RejectDto) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');
    if (cycle.status !== NettingCycleStatus.PENDING_AM && cycle.status !== NettingCycleStatus.PENDING_CEO) {
      throw new BadRequestException('Cycle is not pending approval');
    }

    const rejectedStatus = cycle.status === NettingCycleStatus.PENDING_AM
      ? NettingCycleStatus.AM_REJECTED
      : NettingCycleStatus.CEO_REJECTED;

    const updated = await this.prisma.nettingCycle.update({
      where: { id },
      data: {
        status: rejectedStatus,
        rejectedById: userId,
        rejectedAt: new Date(),
        rejectionReason: dto.reason || null,
      },
      include: this.cycleIncludes(),
    });

    await this.createNotification(tenantId, updated, `Netting cycle rejected${dto.reason ? ': ' + dto.reason : ''}`);

    return this.formatCycle(updated, tenantId);
  }

  async addComment(tenantId: string, cycleId: string, userId: string, dto: AddCommentDto) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id: cycleId, tenantId },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');

    const comment = await this.prisma.nettingCycleComment.create({
      data: {
        tenantId,
        cycleId,
        userId,
        message: dto.message,
      },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    // In-app notification to all relevant users
    await this.createCommentNotification(tenantId, cycle, userId, dto.message);

    return {
      id: comment.id,
      message: comment.message,
      user: `${comment.user.firstName} ${comment.user.lastName}`,
      userId: comment.user.id,
      createdAt: comment.createdAt.toISOString(),
    };
  }

  async delete(tenantId: string, id: string) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id, tenantId },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');

    // Cascade delete comments and invoice links, then delete cycle
    await this.prisma.$transaction([
      this.prisma.nettingCycleComment.deleteMany({ where: { cycleId: id } }),
      this.prisma.nettingCycleInvoice.deleteMany({ where: { cycleId: id } }),
      this.prisma.nettingCycle.delete({ where: { id } }),
    ]);
  }

  async settleCycle(
    tenantId: string,
    cycleId: string,
    userId: string,
    opts: {
      cashAmount?: string;
      bankAccountId?: string;
      paymentDate?: string;
      file?: { filename: string; mimetype: string; buffer: Buffer };
    },
  ) {
    const cycle = await this.prisma.nettingCycle.findFirst({
      where: { id: cycleId, tenantId },
      include: {
        contact: {
          select: { id: true, accountId: true, name: true, currencyCode: true },
        },
        invoices: {
          include: {
            voucher: {
              select: {
                id: true,
                voucherNumber: true,
                voucherType: true,
                status: true,
                date: true,
                totalAmount: true,
                currencyCode: true,
                invoiceAllocations: { select: { amount: true } },
              },
            },
          },
        },
      },
    });
    if (!cycle) throw new NotFoundException('Netting cycle not found');

    // Settlement is allowed from any non-terminal status (Open, Pending AM,
    // Pending CEO, Approved, Partial). Rejected or already-settled cycles
    // cannot be settled.
    const SETTLEABLE_STATUSES: NettingCycleStatus[] = [
      NettingCycleStatus.OPEN,
      NettingCycleStatus.PENDING_AM,
      NettingCycleStatus.PENDING_CEO,
      NettingCycleStatus.APPROVED,
      NettingCycleStatus.PARTIAL,
    ];
    if (!SETTLEABLE_STATUSES.includes(cycle.status)) {
      throw new BadRequestException(
        'This netting cycle cannot be settled (already settled or rejected)',
      );
    }
    if (!cycle.contact?.accountId) {
      throw new BadRequestException(
        'Cycle contact must have a linked trade account',
      );
    }

    type SidedInvoice = {
      id: string;
      voucherNumber: string;
      remaining: Decimal;
      date: Date;
    };
    const arInvoices: SidedInvoice[] = [];
    const apInvoices: SidedInvoice[] = [];

    for (const link of cycle.invoices) {
      const v = link.voucher;
      if (!v || v.status !== VoucherStatus.POSTED) continue;
      const paid = v.invoiceAllocations.reduce(
        (s, a) => s.plus(new Decimal(a.amount.toString())),
        new Decimal(0),
      );
      const remaining = new Decimal(v.totalAmount.toString()).minus(paid);
      if (remaining.lessThanOrEqualTo(0)) continue;
      const entry: SidedInvoice = {
        id: v.id,
        voucherNumber: v.voucherNumber,
        remaining,
        date: v.date instanceof Date ? v.date : new Date(v.date),
      };
      if (v.voucherType === VoucherType.SALES) arInvoices.push(entry);
      else if (v.voucherType === VoucherType.PURCHASE) apInvoices.push(entry);
    }

    arInvoices.sort((a, b) => a.date.getTime() - b.date.getTime());
    apInvoices.sort((a, b) => a.date.getTime() - b.date.getTime());

    const arTotal = arInvoices.reduce(
      (s, x) => s.plus(x.remaining),
      new Decimal(0),
    );
    const apTotal = apInvoices.reduce(
      (s, x) => s.plus(x.remaining),
      new Decimal(0),
    );

    if (arTotal.lessThanOrEqualTo(0) && apTotal.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        'Cycle has no outstanding invoices to settle',
      );
    }

    const offset = Decimal.min(arTotal, apTotal);
    const net = arTotal.minus(apTotal);
    const netAbs = net.abs();
    const isReceivable = net.greaterThan(0);

    let cash = new Decimal(0);
    if (opts.cashAmount !== undefined && opts.cashAmount !== '') {
      try {
        cash = new Decimal(opts.cashAmount);
      } catch {
        throw new BadRequestException('cashAmount must be a number');
      }
      if (!cash.isFinite() || cash.lessThan(0)) {
        throw new BadRequestException('cashAmount must be zero or greater');
      }
      if (cash.greaterThan(netAbs)) {
        throw new BadRequestException(
          `cashAmount (${cash.toFixed(4)}) exceeds net (${netAbs.toFixed(4)})`,
        );
      }
      cash = cash.toDecimalPlaces(4, Decimal.ROUND_HALF_EVEN);
    }

    if (offset.lessThanOrEqualTo(0) && cash.lessThanOrEqualTo(0)) {
      throw new BadRequestException(
        'Nothing to settle. Either both sides are zero, or provide a cash amount.',
      );
    }

    let bankAccountId = opts.bankAccountId;
    if (cash.greaterThan(0)) {
      if (!bankAccountId) {
        const defaultBank = await this.prisma.bankAccount.findFirst({
          where: { tenantId, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { accountId: true },
        });
        if (defaultBank) {
          bankAccountId = defaultBank.accountId;
        } else {
          const fallbackAsset = await this.prisma.account.findFirst({
            where: { tenantId, accountType: AccountType.ASSET, isActive: true },
            orderBy: { code: 'asc' },
            select: { id: true },
          });
          if (!fallbackAsset) {
            throw new BadRequestException(
              'No bank/cash account found for this tenant. Configure one before settling.',
            );
          }
          bankAccountId = fallbackAsset.id;
        }
      } else {
        const bank = await this.prisma.account.findFirst({
          where: { id: bankAccountId, tenantId, isActive: true },
          select: { id: true },
        });
        if (!bank) throw new NotFoundException('Bank account not found');
      }
    }

    const paymentDate = opts.paymentDate
      ? new Date(opts.paymentDate)
      : new Date();
    const paymentDateStr = paymentDate.toISOString().split('T')[0];

    type Alloc = { invoiceVoucherId: string; amount: number; paidAt: string };
    const allocations: Alloc[] = [];

    const distribute = (
      invoices: SidedInvoice[],
      amount: Decimal,
    ): void => {
      let left = amount;
      for (const inv of invoices) {
        if (left.lessThanOrEqualTo(0)) break;
        const take = Decimal.min(left, inv.remaining);
        if (take.greaterThan(0)) {
          allocations.push({
            invoiceVoucherId: inv.id,
            amount: take.toDecimalPlaces(4).toNumber(),
            paidAt: paymentDateStr,
          });
          inv.remaining = inv.remaining.minus(take);
          left = left.minus(take);
        }
      }
    };

    if (offset.greaterThan(0)) {
      distribute(arInvoices, offset);
      distribute(apInvoices, offset);
    }

    if (cash.greaterThan(0)) {
      if (isReceivable) distribute(arInvoices, cash);
      else distribute(apInvoices, cash);
    }

    const tradeAccountId = cycle.contact.accountId;
    const offsetStr = offset.toFixed(4);
    const cashStr = cash.toFixed(4);

    const lineItems: any[] = [];
    if (offset.greaterThan(0)) {
      lineItems.push({
        accountId: tradeAccountId,
        debit: offsetStr,
        credit: '0',
        narration: 'Netting offset (AP cleared)',
      });
      lineItems.push({
        accountId: tradeAccountId,
        debit: '0',
        credit: offsetStr,
        narration: 'Netting offset (AR cleared)',
      });
    }
    if (cash.greaterThan(0) && bankAccountId) {
      if (isReceivable) {
        lineItems.push({
          accountId: bankAccountId,
          debit: cashStr,
          credit: '0',
          narration: 'Bank receipt for net AR',
        });
        lineItems.push({
          accountId: tradeAccountId,
          debit: '0',
          credit: cashStr,
          narration: 'Receipt of net AR',
        });
      } else {
        lineItems.push({
          accountId: tradeAccountId,
          debit: cashStr,
          credit: '0',
          narration: 'Payment of net AP',
        });
        lineItems.push({
          accountId: bankAccountId,
          debit: '0',
          credit: cashStr,
          narration: 'Bank payment for net AP',
        });
      }
    }

    const voucherCurrency =
      cycle.contact.currencyCode ??
      cycle.invoices[0]?.voucher?.currencyCode ??
      'USD';

    const result = await this.vouchersService.createWithAllocations(
      tenantId,
      userId,
      {
        voucher: {
          voucherType: VoucherType.JOURNAL,
          date: paymentDateStr,
          narration: `Netting settlement for cycle ${cycle.id
            .slice(0, 8)
            .toUpperCase()}`,
          contactId: cycle.contactId,
          currencyCode: voucherCurrency,
          lineItems,
        },
        allocations,
      } as any,
    );

    if (!result) {
      throw new Error('Failed to create settlement voucher');
    }

    if (opts.file) {
      if (
        !NettingCyclesService.ALLOWED_PROOF_MIME_TYPES.has(opts.file.mimetype)
      ) {
        throw new BadRequestException(
          `File type "${opts.file.mimetype}" is not allowed`,
        );
      }
      const ext = path.extname(opts.file.filename) || '';
      const storedName = `${randomUUID()}${ext}`;
      const relativeDir = path.join(tenantId, 'vouchers', result.id);
      const absoluteDir = path.join(
        NettingCyclesService.UPLOADS_BASE,
        relativeDir,
      );
      const relativePath = path.join(relativeDir, storedName);
      const absolutePath = path.join(absoluteDir, storedName);
      await fs.mkdir(absoluteDir, { recursive: true });
      await fs.writeFile(absolutePath, opts.file.buffer);
      await this.prisma.voucherAttachment.create({
        data: {
          voucherId: result.id,
          tenantId,
          fileName: opts.file.filename,
          filePath: relativePath,
          fileSize: opts.file.buffer.length,
          mimeType: opts.file.mimetype,
          category: 'payment_proof',
        },
      });
    }

    const arRemainingAfter = arTotal
      .minus(offset)
      .minus(isReceivable ? cash : new Decimal(0));
    const apRemainingAfter = apTotal
      .minus(offset)
      .minus(isReceivable ? new Decimal(0) : cash);
    const fullySettled =
      arRemainingAfter.abs().lessThanOrEqualTo(0.0001) &&
      apRemainingAfter.abs().lessThanOrEqualTo(0.0001);

    let newStatus: NettingCycleStatus = cycle.status;
    if (fullySettled) {
      newStatus = NettingCycleStatus.SETTLED;
    } else {
      // Any non-terminal cycle becomes PARTIAL once settlement has been applied.
      newStatus = NettingCycleStatus.PARTIAL;
    }
    if (newStatus !== cycle.status) {
      await this.prisma.nettingCycle.update({
        where: { id: cycle.id },
        data: { status: newStatus },
      });
    }

    return {
      voucherId: result.id,
      voucherNumber: result.voucherNumber,
      offsetAmount: offsetStr,
      cashAmount: cashStr,
      totalAmount: offset.plus(cash).toFixed(4),
      cycleStatus: newStatus,
      arRemaining: arRemainingAfter.toFixed(4),
      apRemaining: apRemainingAfter.toFixed(4),
    };
  }

  // --- Public token-based methods (no auth required) ---

  async getByToken(token: string) {
    const cycle = await this.prisma.nettingCycle.findUnique({
      where: { reviewToken: token },
      include: this.cycleIncludes(),
    });
    if (!cycle) throw new NotFoundException('Invalid or expired review link');
    if (cycle.tokenExpiresAt && new Date() > cycle.tokenExpiresAt) {
      throw new ForbiddenException('This review link has expired');
    }

    // Get tenant name for display
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: cycle.tenantId },
      select: { name: true },
    });

    const formatted = await this.formatCycle(cycle, cycle.tenantId);
    return { ...formatted, companyName: tenant?.name || 'Company' };
  }

  async approveByToken(token: string) {
    const cycle = await this.prisma.nettingCycle.findUnique({
      where: { reviewToken: token },
    });
    if (!cycle) throw new NotFoundException('Invalid or expired review link');
    if (cycle.tokenExpiresAt && new Date() > cycle.tokenExpiresAt) {
      throw new ForbiddenException('This review link has expired');
    }

    if (cycle.status === NettingCycleStatus.PENDING_AM) {
      // AM approving → move to PENDING_CEO and send to CEO
      const ceoToken = randomUUID();
      const tokenExpiresAt = new Date();
      tokenExpiresAt.setDate(tokenExpiresAt.getDate() + 7);

      const updated = await this.prisma.nettingCycle.update({
        where: { id: cycle.id },
        data: {
          status: NettingCycleStatus.PENDING_CEO,
          amApprovedAt: new Date(),
          reviewToken: ceoToken,
          tokenExpiresAt,
        },
        include: this.cycleIncludes(),
      });

      await this.createNotification(cycle.tenantId, updated, 'AM approved netting cycle (via review link)');

      // Send to CEO
      const ceoEmail = this.config.get<string>('CEO_EMAIL');
      if (ceoEmail) {
        const contact = await this.prisma.contact.findFirst({
          where: { id: cycle.contactId, tenantId: cycle.tenantId },
          select: { name: true },
        });
        const tenant = await this.prisma.tenant.findUnique({
          where: { id: cycle.tenantId },
          select: { name: true },
        });
        this.mailService.sendNettingCycleReview({
          email: ceoEmail,
          name: this.config.get<string>('CEO_NAME') || 'CEO',
          contactName: contact?.name || '',
          cycleId: ceoToken,
          startDate: (cycle.startDate as Date).toISOString().split('T')[0],
          endDate: (cycle.endDate as Date).toISOString().split('T')[0],
          companyName: tenant?.name || 'Accounting System',
        }).catch(() => {});
      }

      return this.formatCycle(updated, cycle.tenantId);

    } else if (cycle.status === NettingCycleStatus.PENDING_CEO) {
      // CEO approving → mark as APPROVED
      const updated = await this.prisma.nettingCycle.update({
        where: { id: cycle.id },
        data: {
          status: NettingCycleStatus.APPROVED,
          ceoApprovedAt: new Date(),
        },
        include: this.cycleIncludes(),
      });

      await this.createNotification(cycle.tenantId, updated, 'CEO approved netting cycle (via review link)');
      return this.formatCycle(updated, cycle.tenantId);

    } else {
      throw new BadRequestException(`Cannot approve — cycle is ${cycle.status}`);
    }
  }

  async rejectByToken(token: string, reason?: string) {
    const cycle = await this.prisma.nettingCycle.findUnique({
      where: { reviewToken: token },
    });
    if (!cycle) throw new NotFoundException('Invalid or expired review link');
    if (cycle.tokenExpiresAt && new Date() > cycle.tokenExpiresAt) {
      throw new ForbiddenException('This review link has expired');
    }
    if (cycle.status !== NettingCycleStatus.PENDING_AM && cycle.status !== NettingCycleStatus.PENDING_CEO) {
      throw new BadRequestException(`Cannot reject — cycle is ${cycle.status}`);
    }

    const rejectedStatus = cycle.status === NettingCycleStatus.PENDING_AM
      ? NettingCycleStatus.AM_REJECTED
      : NettingCycleStatus.CEO_REJECTED;

    const updated = await this.prisma.nettingCycle.update({
      where: { id: cycle.id },
      data: {
        status: rejectedStatus,
        rejectedAt: new Date(),
        rejectionReason: reason || null,
      },
      include: this.cycleIncludes(),
    });

    await this.createNotification(cycle.tenantId, updated, `Netting cycle rejected via review link${reason ? ': ' + reason : ''}`);
    return this.formatCycle(updated, cycle.tenantId);
  }

  async addCommentByToken(token: string, message: string) {
    const cycle = await this.prisma.nettingCycle.findUnique({
      where: { reviewToken: token },
    });
    if (!cycle) throw new NotFoundException('Invalid or expired review link');
    if (cycle.tokenExpiresAt && new Date() > cycle.tokenExpiresAt) {
      throw new ForbiddenException('This review link has expired');
    }

    const comment = await this.prisma.nettingCycleComment.create({
      data: {
        tenantId: cycle.tenantId,
        cycleId: cycle.id,
        userId: cycle.amApprovedById || (await this.getFirstTenantUser(cycle.tenantId)),
        message,
      },
    });

    await this.createCommentNotification(cycle.tenantId, cycle, '', message);

    return { id: comment.id, message: comment.message, user: 'Account Manager', createdAt: comment.createdAt.toISOString() };
  }

  private async getFirstTenantUser(tenantId: string): Promise<string> {
    const user = await this.prisma.user.findFirst({ where: { tenantId, status: 'ACTIVE' }, select: { id: true } });
    return user?.id || '';
  }

  async getUnpaidInvoicesForRange(tenantId: string, contactId: string, startDate: string | undefined, endDate: string) {
    const rangeEnd = new Date(endDate);
    const periodStartFilter = startDate ? { gte: new Date(startDate) } : undefined;

    const invoices = await this.prisma.voucher.findMany({
      where: {
        tenantId,
        contactId,
        status: VoucherStatus.POSTED,
        voucherType: { in: [VoucherType.SALES, VoucherType.PURCHASE] },
        ...(periodStartFilter ? { periodStart: periodStartFilter } : {}),
        periodEnd: { lte: rangeEnd },
      },
      select: {
        id: true,
        voucherNumber: true,
        voucherType: true,
        totalAmount: true,
        date: true,
        periodStart: true,
        periodEnd: true,
        invoiceAllocations: { select: { amount: true } },
      },
      orderBy: { periodStart: 'asc' },
    });

    return invoices
      .map((inv) => {
        const paid = inv.invoiceAllocations.reduce((s, a) => s + a.amount.toNumber(), 0);
        const remaining = inv.totalAmount.toNumber() - paid;
        return {
          id: inv.id,
          voucherNumber: inv.voucherNumber,
          voucherType: inv.voucherType,
          totalAmount: inv.totalAmount.toFixed(4),
          date: (inv.date as Date).toISOString().split('T')[0],
          periodStart: inv.periodStart ? (inv.periodStart as Date).toISOString().split('T')[0] : null,
          periodEnd: inv.periodEnd ? (inv.periodEnd as Date).toISOString().split('T')[0] : null,
          totalPaid: paid.toFixed(4),
          remaining: remaining.toFixed(4),
          status: remaining <= 0.01 ? 'SETTLED' : paid > 0 ? 'PARTIAL' : 'UNPAID',
        };
      })
      .filter((inv) => inv.status !== 'SETTLED');
  }

  // --- Private helpers ---

  private cycleIncludes() {
    return {
      contact: { select: { id: true, name: true, type: true, paymentTermDays: true } },
      amApprovedBy: { select: { id: true, firstName: true, lastName: true } },
      ceoApprovedBy: { select: { id: true, firstName: true, lastName: true } },
      rejectedBy: { select: { id: true, firstName: true, lastName: true } },
      comments: {
        include: { user: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'asc' as const },
      },
      invoices: {
        select: { voucherId: true },
      },
    };
  }

  private async formatCycle(cycle: any, tenantId: string) {
    // Get linked invoices for this cycle
    const linkedIds = (cycle.invoices || []).map((i: any) => i.voucherId);
    const invoices = await this.prisma.voucher.findMany({
      where: {
        id: { in: linkedIds.length > 0 ? linkedIds : ['none'] },
        tenantId,
        status: VoucherStatus.POSTED,
      },
      select: {
        id: true,
        voucherNumber: true,
        voucherType: true,
        totalAmount: true,
        date: true,
        invoiceAllocations: { select: { amount: true, paidAt: true }, orderBy: { paidAt: 'desc' } },
      },
      orderBy: { date: 'asc' },
    });

    // Get carry forward: unpaid invoices dated before this cycle that are NOT
    // already attached to it. Without the notIn filter, an attached invoice
    // dated before the cycle would be counted twice — once in the cycle's
    // invoices section and again as carry-forward — inflating the net total.
    const carryForwardInvoices = await this.prisma.voucher.findMany({
      where: {
        tenantId,
        contactId: cycle.contactId,
        status: VoucherStatus.POSTED,
        voucherType: { in: [VoucherType.SALES, VoucherType.PURCHASE] },
        date: { lt: cycle.startDate },
        ...(linkedIds.length > 0 ? { id: { notIn: linkedIds } } : {}),
      },
      select: {
        id: true,
        voucherNumber: true,
        voucherType: true,
        totalAmount: true,
        date: true,
        invoiceAllocations: { select: { amount: true } },
      },
    });

    let carryForwardAmount = 0;
    const carryForwardItems: any[] = [];
    for (const inv of carryForwardInvoices) {
      const paid = inv.invoiceAllocations.reduce((s, a) => s + a.amount.toNumber(), 0);
      const remaining = inv.totalAmount.toNumber() - paid;
      if (remaining > 0.01) {
        const sign = inv.voucherType === 'SALES' ? 1 : -1;
        carryForwardAmount += remaining * sign;
        carryForwardItems.push({
          voucherNumber: inv.voucherNumber,
          voucherType: inv.voucherType,
          remaining: remaining.toFixed(4),
        });
      }
    }

    const rows = invoices.map((inv) => {
      const paid = inv.invoiceAllocations.reduce((s, a) => s + a.amount.toNumber(), 0);
      const remaining = inv.totalAmount.toNumber() - paid;
      const status = remaining <= 0.01 ? 'SETTLED' : paid > 0 ? 'PARTIAL' : 'UNPAID';
      const lastPaidAt = inv.invoiceAllocations.length > 0 ? inv.invoiceAllocations[0].paidAt.toISOString() : null;

      return {
        id: inv.id,
        voucherNumber: inv.voucherNumber,
        voucherType: inv.voucherType,
        totalAmount: inv.totalAmount.toFixed(4),
        totalPaid: paid.toFixed(4),
        remaining: remaining.toFixed(4),
        status,
        lastPaidAt,
        date: (inv.date as Date).toISOString().split('T')[0],
      };
    });

    const cycleReceivable = rows.filter((r) => r.voucherType === 'SALES').reduce((s, r) => s + parseFloat(r.remaining), 0);
    const cyclePayable = rows.filter((r) => r.voucherType === 'PURCHASE').reduce((s, r) => s + parseFloat(r.remaining), 0);
    const cycleNet = cycleReceivable - cyclePayable;
    const netTotal = cycleNet + carryForwardAmount;

    return {
      id: cycle.id,
      contactId: cycle.contactId,
      contactName: cycle.contact.name,
      contactType: cycle.contact.type,
      paymentTermDays: cycle.contact.paymentTermDays,
      startDate: (cycle.startDate as Date).toISOString().split('T')[0],
      endDate: (cycle.endDate as Date).toISOString().split('T')[0],
      dueDate: (cycle.dueDate as Date).toISOString().split('T')[0],
      status: cycle.status,
      invoices: rows,
      carryForward: {
        amount: Math.abs(carryForwardAmount).toFixed(4),
        nature: carryForwardAmount >= 0 ? 'Receivable' : 'Payable',
        items: carryForwardItems,
      },
      netTotal: Math.abs(netTotal).toFixed(4),
      netNature: Math.abs(netTotal) < 0.01 ? 'Settled' : netTotal > 0 ? 'Receivable' : 'Payable',
      amApprovedBy: cycle.amApprovedBy ? `${cycle.amApprovedBy.firstName} ${cycle.amApprovedBy.lastName}` : null,
      amApprovedAt: cycle.amApprovedAt?.toISOString() || null,
      ceoApprovedBy: cycle.ceoApprovedBy ? `${cycle.ceoApprovedBy.firstName} ${cycle.ceoApprovedBy.lastName}` : null,
      ceoApprovedAt: cycle.ceoApprovedAt?.toISOString() || null,
      rejectedBy: cycle.rejectedBy ? `${cycle.rejectedBy.firstName} ${cycle.rejectedBy.lastName}` : null,
      rejectedAt: cycle.rejectedAt?.toISOString() || null,
      rejectionReason: cycle.rejectionReason,
      comments: (cycle.comments || []).map((c: any) => ({
        id: c.id,
        message: c.message,
        user: `${c.user.firstName} ${c.user.lastName}`,
        userId: c.user.id,
        createdAt: c.createdAt.toISOString(),
      })),
    };
  }

  private async createNotification(tenantId: string, cycle: any, message: string) {
    // Get all users for this tenant to notify
    const users = await this.prisma.user.findMany({
      where: { tenantId, status: 'ACTIVE' },
      select: { id: true },
    });

    for (const user of users) {
      await this.prisma.notification.create({
        data: {
          tenantId,
          userId: user.id,
          type: 'VOUCHER_APPROVED',
          title: `Netting Cycle: ${cycle.contact?.name || 'Contact'}`,
          message,
          referenceId: cycle.id,
          referenceType: 'NETTING_CYCLE',
        },
      });
    }
  }

  private async createCommentNotification(tenantId: string, cycle: any, commentUserId: string, message: string) {
    const users = await this.prisma.user.findMany({
      where: { tenantId, status: 'ACTIVE', id: { not: commentUserId } },
      select: { id: true },
    });

    for (const user of users) {
      await this.prisma.notification.create({
        data: {
          tenantId,
          userId: user.id,
          type: 'VOUCHER_APPROVED',
          title: 'New comment on netting cycle',
          message: message.slice(0, 200),
          referenceId: cycle.id,
          referenceType: 'NETTING_CYCLE',
        },
      });
    }
  }
}
