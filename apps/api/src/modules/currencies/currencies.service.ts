import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { SetExchangeRateDto } from './dto/set-exchange-rate.dto';
import { Prisma } from '@prisma/client';
import { toDecimal, convertCurrency } from '../../common/utils/decimal.utils';
import Decimal from 'decimal.js';

@Injectable()
export class CurrenciesService {
  constructor(private prisma: PrismaService) {}

  /**
   * List all currencies (global, not tenant-specific).
   */
  async findAll(search?: string, page?: number, limit?: number) {
    const where: Prisma.CurrencyWhereInput = {};

    if (search) {
      where.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Paginated mode: only when caller explicitly supplied page/limit so the
    // existing array-shaped contract used by dropdowns keeps working.
    if (page !== undefined || limit !== undefined) {
      const safePage = Math.max(1, Number(page ?? 1) || 1);
      const safeLimit = Math.min(100, Math.max(1, Number(limit ?? 25) || 25));
      const skip = (safePage - 1) * safeLimit;

      const [currencies, total] = await this.prisma.$transaction([
        this.prisma.currency.findMany({
          where,
          orderBy: { code: 'asc' },
          skip,
          take: safeLimit,
        }),
        this.prisma.currency.count({ where }),
      ]);

      const totalPages = Math.max(1, Math.ceil(total / safeLimit));

      return {
        data: currencies,
        meta: {
          total,
          page: safePage,
          limit: safeLimit,
          totalPages,
          hasNextPage: safePage < totalPages,
          hasPreviousPage: safePage > 1,
        },
      };
    }

    return this.prisma.currency.findMany({
      where,
      orderBy: { code: 'asc' },
    });
  }

  /**
   * Get a single currency by its ISO code.
   */
  async findOne(code: string) {
    const currency = await this.prisma.currency.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!currency) {
      throw new NotFoundException(`Currency with code "${code}" not found`);
    }

    return currency;
  }

  /**
   * Set (upsert) an exchange rate for a tenant on a given date.
   * If a rate already exists for the same base/target/date combination, it is updated.
   */
  async setExchangeRate(tenantId: string, dto: SetExchangeRateDto) {
    const baseCurrency = dto.baseCurrency.toUpperCase();
    const targetCurrency = dto.targetCurrency.toUpperCase();

    if (baseCurrency === targetCurrency) {
      throw new BadRequestException('Base currency and target currency must be different');
    }

    const rate = toDecimal(dto.rate);
    if (rate.lte(0)) {
      throw new BadRequestException('Exchange rate must be greater than zero');
    }

    const effectiveDate = new Date(dto.effectiveDate);

    return this.prisma.exchangeRate.upsert({
      where: {
        tenantId_baseCurrency_targetCurrency_effectiveDate: {
          tenantId,
          baseCurrency,
          targetCurrency,
          effectiveDate,
        },
      },
      update: {
        rate: new Prisma.Decimal(dto.rate),
      },
      create: {
        tenantId,
        baseCurrency,
        targetCurrency,
        rate: new Prisma.Decimal(dto.rate),
        effectiveDate,
      },
    });
  }

  /**
   * Get exchange rates for a tenant with optional filters:
   *   baseCurrency, targetCurrency, date.
   */
  async getExchangeRates(
    tenantId: string,
    baseCurrency?: string,
    targetCurrency?: string,
    date?: string,
  ) {
    const where: Prisma.ExchangeRateWhereInput = { tenantId };

    if (baseCurrency) {
      where.baseCurrency = baseCurrency.toUpperCase();
    }

    if (targetCurrency) {
      where.targetCurrency = targetCurrency.toUpperCase();
    }

    if (date) {
      where.effectiveDate = new Date(date);
    }

    return this.prisma.exchangeRate.findMany({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
  }

  /**
   * Get the most recent exchange rate for a given currency pair.
   */
  async getLatestRate(tenantId: string, baseCurrency: string, targetCurrency: string) {
    const base = baseCurrency.toUpperCase();
    const target = targetCurrency.toUpperCase();

    if (base === target) {
      throw new BadRequestException('Base currency and target currency must be different');
    }

    const rate = await this.prisma.exchangeRate.findFirst({
      where: {
        tenantId,
        baseCurrency: base,
        targetCurrency: target,
      },
      orderBy: { effectiveDate: 'desc' },
    });

    if (!rate) {
      throw new NotFoundException(
        `No exchange rate found for ${base}/${target}`,
      );
    }

    return rate;
  }

  /**
   * Convert an amount from one currency to another using the exchange rate
   * effective on the given date (or the most recent rate if no date is provided).
   */
  async convert(
    tenantId: string,
    amount: string,
    fromCurrency: string,
    toCurrency: string,
    date?: string,
  ) {
    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (from === to) {
      const decAmount = toDecimal(amount);
      return {
        originalAmount: amount,
        convertedAmount: decAmount.toFixed(8),
        fromCurrency: from,
        toCurrency: to,
        rate: '1.00000000',
        effectiveDate: date || null,
      };
    }

    // Try direct rate first: from -> to
    let exchangeRate = await this.findRateForConversion(tenantId, from, to, date);
    let rateValue: Decimal;

    if (exchangeRate) {
      rateValue = toDecimal(exchangeRate.rate.toString());
    } else {
      // Try inverse rate: to -> from
      const inverseRate = await this.findRateForConversion(tenantId, to, from, date);
      if (!inverseRate) {
        throw new NotFoundException(
          `No exchange rate found for ${from}/${to}${date ? ` on ${date}` : ''}`,
        );
      }
      rateValue = new Decimal(1).div(toDecimal(inverseRate.rate.toString()));
    }

    const converted = convertCurrency(amount, rateValue);

    return {
      originalAmount: amount,
      convertedAmount: converted.toFixed(8),
      fromCurrency: from,
      toCurrency: to,
      rate: rateValue.toFixed(8),
      effectiveDate: exchangeRate?.effectiveDate
        ? exchangeRate.effectiveDate.toISOString().split('T')[0]
        : date || null,
    };
  }

  /**
   * Find the exchange rate for a currency pair, optionally on or before a given date.
   * If a date is provided, finds the most recent rate on or before that date.
   * If no date is provided, finds the most recent rate overall.
   */
  private async findRateForConversion(
    tenantId: string,
    baseCurrency: string,
    targetCurrency: string,
    date?: string,
  ) {
    const where: Prisma.ExchangeRateWhereInput = {
      tenantId,
      baseCurrency,
      targetCurrency,
    };

    if (date) {
      where.effectiveDate = { lte: new Date(date) };
    }

    return this.prisma.exchangeRate.findFirst({
      where,
      orderBy: { effectiveDate: 'desc' },
    });
  }
}
