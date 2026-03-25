import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateFiscalYearDto } from './dto/create-fiscal-year.dto';

@Injectable()
export class FiscalYearService {
  constructor(private prisma: PrismaService) {}

  /**
   * Create a fiscal year with 12 auto-generated monthly periods.
   * Validates that the new fiscal year does not overlap with any existing fiscal year
   * for the same tenant.
   */
  async create(tenantId: string, dto: CreateFiscalYearDto) {
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);

    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check for overlapping fiscal years
    const overlapping = await this.prisma.fiscalYear.findFirst({
      where: {
        tenantId,
        OR: [
          {
            startDate: { lte: endDate },
            endDate: { gte: startDate },
          },
        ],
      },
    });

    if (overlapping) {
      throw new ConflictException(
        `Fiscal year overlaps with existing fiscal year "${overlapping.name}" (${overlapping.startDate.toISOString().split('T')[0]} to ${overlapping.endDate.toISOString().split('T')[0]})`,
      );
    }

    // Check for duplicate name
    const existingName = await this.prisma.fiscalYear.findUnique({
      where: {
        tenantId_name: {
          tenantId,
          name: dto.name,
        },
      },
    });

    if (existingName) {
      throw new ConflictException(
        `A fiscal year with the name "${dto.name}" already exists`,
      );
    }

    // Generate 12 monthly periods
    const periods = this.generateMonthlyPeriods(startDate, endDate);

    return this.prisma.fiscalYear.create({
      data: {
        tenantId,
        name: dto.name,
        startDate,
        endDate,
        periods: {
          create: periods.map((period, index) => ({
            tenantId,
            name: period.name,
            startDate: period.startDate,
            endDate: period.endDate,
            periodNumber: index + 1,
          })),
        },
      },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });
  }

  /**
   * List all fiscal years for a tenant, ordered by start date descending.
   */
  async findAll(tenantId: string) {
    return this.prisma.fiscalYear.findMany({
      where: { tenantId },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
      orderBy: { startDate: 'desc' },
    });
  }

  /**
   * Get a single fiscal year by ID with its periods.
   */
  async findOne(tenantId: string, id: string) {
    const fiscalYear = await this.prisma.fiscalYear.findFirst({
      where: { id, tenantId },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });

    if (!fiscalYear) {
      throw new NotFoundException(`Fiscal year not found`);
    }

    return fiscalYear;
  }

  /**
   * Get the fiscal year that contains today's date.
   */
  async getCurrentFiscalYear(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const fiscalYear = await this.prisma.fiscalYear.findFirst({
      where: {
        tenantId,
        startDate: { lte: today },
        endDate: { gte: today },
      },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });

    if (!fiscalYear) {
      throw new NotFoundException('No fiscal year found for the current date');
    }

    return fiscalYear;
  }

  /**
   * Close a fiscal period, preventing further postings to it.
   */
  async closePeriod(tenantId: string, periodId: string) {
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
      include: { fiscalYear: true },
    });

    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }

    if (period.fiscalYear.isClosed) {
      throw new BadRequestException(
        'Cannot modify periods of a closed fiscal year',
      );
    }

    if (period.isClosed) {
      throw new BadRequestException('Fiscal period is already closed');
    }

    // Ensure all prior periods are closed
    const openPriorPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        fiscalYearId: period.fiscalYearId,
        periodNumber: { lt: period.periodNumber },
        isClosed: false,
      },
    });

    if (openPriorPeriod) {
      throw new BadRequestException(
        `Cannot close period ${period.periodNumber}. Period ${openPriorPeriod.periodNumber} ("${openPriorPeriod.name}") must be closed first`,
      );
    }

    return this.prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: { isClosed: true },
    });
  }

  /**
   * Close an entire fiscal year.
   * All periods must be closed before the year can be closed.
   */
  async closeYear(tenantId: string, id: string) {
    const fiscalYear = await this.prisma.fiscalYear.findFirst({
      where: { id, tenantId },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });

    if (!fiscalYear) {
      throw new NotFoundException('Fiscal year not found');
    }

    if (fiscalYear.isClosed) {
      throw new BadRequestException('Fiscal year is already closed');
    }

    const openPeriods = fiscalYear.periods.filter((p) => !p.isClosed);

    if (openPeriods.length > 0) {
      const openPeriodNames = openPeriods.map((p) => p.name).join(', ');
      throw new BadRequestException(
        `All periods must be closed before closing the fiscal year. Open periods: ${openPeriodNames}`,
      );
    }

    return this.prisma.fiscalYear.update({
      where: { id },
      data: { isClosed: true },
      include: {
        periods: {
          orderBy: { periodNumber: 'asc' },
        },
      },
    });
  }

  /**
   * Reopen a closed fiscal period.
   * Only OWNER role should be allowed to perform this (enforced at the controller level).
   */
  async reopenPeriod(tenantId: string, periodId: string) {
    const period = await this.prisma.fiscalPeriod.findFirst({
      where: { id: periodId, tenantId },
      include: { fiscalYear: true },
    });

    if (!period) {
      throw new NotFoundException('Fiscal period not found');
    }

    if (period.fiscalYear.isClosed) {
      throw new BadRequestException(
        'Cannot reopen a period in a closed fiscal year. Reopen the fiscal year first.',
      );
    }

    if (!period.isClosed) {
      throw new BadRequestException('Fiscal period is not closed');
    }

    // Ensure all subsequent periods are still closed or open (no gap)
    // If a later period is closed, we cannot reopen an earlier one without reopening the later ones first
    const closedLaterPeriod = await this.prisma.fiscalPeriod.findFirst({
      where: {
        tenantId,
        fiscalYearId: period.fiscalYearId,
        periodNumber: { gt: period.periodNumber },
        isClosed: true,
      },
      orderBy: { periodNumber: 'asc' },
    });

    if (closedLaterPeriod) {
      throw new BadRequestException(
        `Cannot reopen period ${period.periodNumber}. Period ${closedLaterPeriod.periodNumber} ("${closedLaterPeriod.name}") must be reopened first`,
      );
    }

    return this.prisma.fiscalPeriod.update({
      where: { id: periodId },
      data: { isClosed: false },
    });
  }

  /**
   * Generate 12 monthly periods from startDate to endDate.
   * Each period covers one calendar month within the fiscal year boundaries.
   */
  private generateMonthlyPeriods(
    startDate: Date,
    endDate: Date,
  ): Array<{ name: string; startDate: Date; endDate: Date }> {
    const periods: Array<{ name: string; startDate: Date; endDate: Date }> = [];
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December',
    ];

    let currentDate = new Date(startDate);

    for (let i = 0; i < 12; i++) {
      const periodStart = new Date(currentDate);

      // Calculate period end: last day of this period's month, or the fiscal year end
      let periodEnd: Date;
      if (i === 11) {
        // Last period runs to the fiscal year end date
        periodEnd = new Date(endDate);
      } else {
        // Move to next month, then subtract one day
        const nextMonth = new Date(currentDate);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        periodEnd = new Date(nextMonth);
        periodEnd.setDate(periodEnd.getDate() - 1);

        // Ensure period end does not exceed fiscal year end
        if (periodEnd > endDate) {
          periodEnd = new Date(endDate);
        }
      }

      const monthIndex = periodStart.getMonth();
      const year = periodStart.getFullYear();
      const name = `${monthNames[monthIndex]} ${year}`;

      periods.push({
        name,
        startDate: periodStart,
        endDate: periodEnd,
      });

      // Move to the next period start (day after periodEnd)
      currentDate = new Date(periodEnd);
      currentDate.setDate(currentDate.getDate() + 1);

      // If we have passed the fiscal year end, stop
      if (currentDate > endDate) {
        break;
      }
    }

    return periods;
  }
}
