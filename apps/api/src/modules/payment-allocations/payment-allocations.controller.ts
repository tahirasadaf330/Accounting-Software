import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PaymentAllocationsService } from './payment-allocations.service';
import { AllocatePaymentDto } from './dto/allocate-payment.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('payment-allocations')
@ApiBearerAuth()
@Controller('payment-allocations')
export class PaymentAllocationsController {
  constructor(private readonly service: PaymentAllocationsService) {}

  @Post(':paymentVoucherId')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING, Role.SENIOR_OFFICE_PAYMENTS, Role.SENIOR_ARAP_OFFICER, Role.PAYMENT_OFFICER)
  @ApiOperation({ summary: 'Allocate a payment to invoices' })
  allocate(
    @TenantId() tenantId: string,
    @Param('paymentVoucherId', ParseUUIDPipe) paymentVoucherId: string,
    @Body() dto: AllocatePaymentDto,
  ) {
    return this.service.allocate(tenantId, paymentVoucherId, dto);
  }

  @Get('payment/:paymentVoucherId')
  @ApiOperation({ summary: 'Get allocations for a payment voucher' })
  getAllocationsForPayment(
    @TenantId() tenantId: string,
    @Param('paymentVoucherId', ParseUUIDPipe) paymentVoucherId: string,
  ) {
    return this.service.getAllocationsForPayment(tenantId, paymentVoucherId);
  }

  @Get('unpaid-invoices/:contactId')
  @ApiOperation({ summary: 'Get unpaid invoices for a contact' })
  @ApiQuery({ name: 'paymentType', required: false, description: 'RECEIPT or PAYMENT - filters invoice types' })
  getUnpaidInvoices(
    @TenantId() tenantId: string,
    @Param('contactId', ParseUUIDPipe) contactId: string,
    @Query('paymentType') paymentType?: string,
  ) {
    return this.service.getUnpaidInvoicesForContact(tenantId, contactId, paymentType);
  }

  @Get('netting-report')
  @ApiOperation({ summary: 'Generate netting report' })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'fromDate', required: false })
  @ApiQuery({ name: 'toDate', required: false })
  @ApiQuery({ name: 'showSettled', required: false })
  getNettingReport(
    @TenantId() tenantId: string,
    @Query('contactId') contactId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string,
    @Query('showSettled') showSettled?: string,
  ) {
    return this.service.getNettingReport(
      tenantId,
      contactId,
      fromDate,
      toDate,
      showSettled === 'true',
    );
  }

  @Delete(':allocationId')
  @Roles(Role.OWNER, Role.FINANCE_MANAGER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a payment allocation' })
  async deleteAllocation(
    @TenantId() tenantId: string,
    @Param('allocationId', ParseUUIDPipe) allocationId: string,
  ) {
    await this.service.deleteAllocation(tenantId, allocationId);
  }
}
