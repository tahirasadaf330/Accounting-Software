import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CurrenciesService } from './currencies.service';
import { SetExchangeRateDto } from './dto/set-exchange-rate.dto';
import { ConvertCurrencyDto } from './dto/convert-currency.dto';
import { ExchangeRateFilterDto } from './dto/exchange-rate-filter.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@accounting-saas/shared';

@ApiTags('currencies')
@ApiBearerAuth()
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly currenciesService: CurrenciesService) {}

  @Get()
  @ApiOperation({ summary: 'List all currencies' })
  async findAll() {
    return this.currenciesService.findAll();
  }

  @Get('exchange-rates/latest')
  @ApiOperation({ summary: 'Get the latest exchange rate between two currencies' })
  @ApiQuery({ name: 'baseCurrency', required: true, example: 'USD' })
  @ApiQuery({ name: 'targetCurrency', required: true, example: 'EUR' })
  async getLatestRate(
    @TenantId() tenantId: string,
    @Query('baseCurrency') baseCurrency: string,
    @Query('targetCurrency') targetCurrency: string,
  ) {
    return this.currenciesService.getLatestRate(tenantId, baseCurrency, targetCurrency);
  }

  @Get('exchange-rates')
  @ApiOperation({ summary: 'List exchange rates with optional filters' })
  async getExchangeRates(
    @TenantId() tenantId: string,
    @Query() filter: ExchangeRateFilterDto,
  ) {
    return this.currenciesService.getExchangeRates(
      tenantId,
      filter.baseCurrency,
      filter.targetCurrency,
      filter.date,
    );
  }

  @Post('exchange-rates')
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Set an exchange rate for a specific date' })
  async setExchangeRate(
    @TenantId() tenantId: string,
    @Body() dto: SetExchangeRateDto,
  ) {
    return this.currenciesService.setExchangeRate(tenantId, dto);
  }

  @Post('convert')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Convert an amount from one currency to another' })
  async convert(
    @TenantId() tenantId: string,
    @Body() dto: ConvertCurrencyDto,
  ) {
    return this.currenciesService.convert(
      tenantId,
      dto.amount,
      dto.fromCurrency,
      dto.toCurrency,
      dto.date,
    );
  }

  @Get(':code')
  @ApiOperation({ summary: 'Get a currency by its ISO code' })
  @ApiParam({ name: 'code', example: 'USD' })
  async findOne(@Param('code') code: string) {
    return this.currenciesService.findOne(code);
  }
}
