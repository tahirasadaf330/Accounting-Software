import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  Req,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { FastifyRequest } from 'fastify';
import { Role } from '@prisma/client';
import { NettingCyclesService } from './netting-cycles.service';
import { CreateNettingCycleDto, AddCommentDto, RejectDto } from './dto/netting-cycle.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('netting-cycles')
@ApiBearerAuth()
@Controller('netting-cycles')
export class NettingCyclesController {
  constructor(private readonly service: NettingCyclesService) {}

  @Post()
  @Roles(Role.OWNER, Role.ASSISTANT_MANAGER_BILLING)
  @ApiOperation({ summary: 'Create a netting cycle' })
  create(@TenantId() tenantId: string, @Body() dto: CreateNettingCycleDto) {
    return this.service.create(tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List netting cycles' })
  @ApiQuery({ name: 'contactId', required: false })
  @ApiQuery({ name: 'status', required: false })
  findAll(
    @TenantId() tenantId: string,
    @Query('contactId') contactId?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(tenantId, contactId, status);
  }

  @Get('approved-for-settlement')
  @ApiOperation({ summary: 'Get approved/partial netting cycles for settlement by contact' })
  @ApiQuery({ name: 'contactId', required: true })
  getApprovedForSettlement(
    @TenantId() tenantId: string,
    @Query('contactId') contactId: string,
  ) {
    return this.service.getApprovedCyclesForSettlement(tenantId, contactId);
  }

  @Get('unpaid-invoices')
  @ApiOperation({ summary: 'Get unpaid invoices for a contact in date range' })
  @ApiQuery({ name: 'contactId', required: true })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: true })
  getUnpaidInvoices(
    @TenantId() tenantId: string,
    @Query('contactId') contactId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.service.getUnpaidInvoicesForRange(tenantId, contactId, startDate, endDate);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a netting cycle by ID' })
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(tenantId, id);
  }

  @Post(':id/send-to-am')
  @Roles(Role.OWNER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send cycle to AM for approval' })
  sendToAM(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.sendToAM(tenantId, id);
  }

  @Post(':id/am-approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AM approves the cycle' })
  amApprove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.amApprove(tenantId, id, userId);
  }

  @Post(':id/ceo-approve')
  @Roles(Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'CEO approves the cycle' })
  ceoApprove(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.service.ceoApprove(tenantId, id, userId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject the cycle (AM or CEO)' })
  reject(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RejectDto,
  ) {
    return this.service.reject(tenantId, id, userId, dto);
  }

  @Post(':id/comments')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a comment to a cycle' })
  addComment(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: AddCommentDto,
  ) {
    return this.service.addComment(tenantId, id, userId, dto);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.ASSISTANT_MANAGER_BILLING)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a netting cycle' })
  async delete(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.service.delete(tenantId, id);
  }

  @Post(':id/settle')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Settle an APPROVED or PARTIAL netting cycle: offsets AR/AP and pays the net cash difference in one journal voucher',
  })
  async settle(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const parts = req.parts();
    let file:
      | { filename: string; mimetype: string; buffer: Buffer }
      | undefined;
    let bankAccountId: string | undefined;
    let paymentDate: string | undefined;
    let cashAmount: string | undefined;

    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        if (buf.length > 0) {
          file = {
            filename: part.filename,
            mimetype: part.mimetype,
            buffer: buf,
          };
        }
      } else if (part.type === 'field') {
        if (part.fieldname === 'bankAccountId') {
          const v = String(part.value ?? '').trim();
          if (v) bankAccountId = v;
        } else if (part.fieldname === 'paymentDate') {
          const v = String(part.value ?? '').trim();
          if (v) paymentDate = v;
        } else if (part.fieldname === 'cashAmount') {
          const v = String(part.value ?? '').trim();
          if (v) cashAmount = v;
        }
      }
    }

    return this.service.settleCycle(tenantId, id, userId, {
      cashAmount,
      bankAccountId,
      paymentDate,
      file,
    });
  }
}
