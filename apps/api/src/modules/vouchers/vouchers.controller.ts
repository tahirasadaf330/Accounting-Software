import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
  Req,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { FastifyRequest, FastifyReply } from 'fastify';
import { Role } from '@prisma/client';
import * as fs from 'fs';
import { VouchersService } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { CreateVoucherWithAllocationsDto } from './dto/create-voucher-with-allocations.dto';
import { CreateVoucherWithNettingDto } from './dto/create-voucher-with-netting.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherFilterDto } from './dto/voucher-filter.dto';
import { RejectVoucherDto } from './dto/reject-voucher.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('vouchers')
@ApiBearerAuth()
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new voucher (auto-posted)' })
  @ApiResponse({ status: 201, description: 'Voucher created and posted' })
  @ApiResponse({ status: 400, description: 'Validation error (double-entry, accounts, etc.)' })
  async create(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVoucherDto,
  ) {
    return this.vouchersService.create(tenantId, userId, dto);
  }

  @Post('with-allocations')
  @ApiOperation({
    summary:
      'Create a voucher and its payment allocations atomically (auto-posted)',
  })
  @ApiResponse({
    status: 201,
    description: 'Voucher created, posted, and allocations recorded',
  })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createWithAllocations(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVoucherWithAllocationsDto,
  ) {
    return this.vouchersService.createWithAllocations(tenantId, userId, dto);
  }

  @Post('with-netting-allocations')
  @ApiOperation({ summary: 'Create a voucher and settle selected netting cycles atomically' })
  @ApiResponse({ status: 201, description: 'Voucher created and netting cycles settled' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  async createWithNettingAllocations(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Body() dto: CreateVoucherWithNettingDto,
  ) {
    return this.vouchersService.createWithNettingAllocations(tenantId, userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List vouchers with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of vouchers' })
  async findAll(
    @TenantId() tenantId: string,
    @Query() filters: VoucherFilterDto,
  ) {
    return this.vouchersService.findAll(tenantId, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single voucher by ID' })
  @ApiResponse({ status: 200, description: 'Voucher details with line items' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  async findOne(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vouchersService.findOne(tenantId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft voucher' })
  @ApiResponse({ status: 200, description: 'Voucher updated successfully' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 409, description: 'Cannot update non-DRAFT voucher' })
  async update(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateVoucherDto,
  ) {
    return this.vouchersService.update(tenantId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a draft voucher' })
  @ApiResponse({ status: 204, description: 'Voucher deleted successfully' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 409, description: 'Cannot delete non-DRAFT voucher' })
  async delete(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.vouchersService.delete(tenantId, id);
  }

  @Post(':id/submit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit a voucher for approval' })
  @ApiResponse({ status: 200, description: 'Voucher submitted for approval' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async submitForApproval(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.submitForApproval(tenantId, id, userId);
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Approve a voucher (auto-posts after approval)' })
  @ApiResponse({ status: 200, description: 'Voucher approved and posted' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async approve(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.approve(tenantId, id, userId);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Reject a voucher with a reason' })
  @ApiResponse({ status: 200, description: 'Voucher rejected' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 409, description: 'Invalid status transition' })
  async reject(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
    @Body() dto: RejectVoucherDto,
  ) {
    return this.vouchersService.reject(tenantId, id, userId, dto.reason);
  }

  @Post(':id/reverse')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.OWNER, Role.CHIEF_ACCOUNTANT)
  @ApiOperation({ summary: 'Reverse a posted voucher' })
  @ApiResponse({ status: 200, description: 'Reversal voucher created and posted' })
  @ApiResponse({ status: 404, description: 'Voucher not found' })
  @ApiResponse({ status: 409, description: 'Cannot reverse non-POSTED voucher' })
  async reverse(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.vouchersService.reverse(tenantId, id, userId);
  }

  // ─── Attachment Endpoints ─────────────────────────────────────

  @Post(':id/attachments')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload file attachments to a voucher' })
  @ApiResponse({ status: 201, description: 'Files uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or too many attachments' })
  @ApiResponse({ status: 403, description: 'Voucher status does not allow attachments' })
  async uploadAttachments(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const parts = req.parts();
    const attachments = [];

    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) {
          chunks.push(chunk);
        }
        const buffer = Buffer.concat(chunks);

        if (buffer.length === 0) {
          continue;
        }

        const attachment = await this.vouchersService.uploadAttachment(
          tenantId,
          id,
          {
            filename: part.filename,
            mimetype: part.mimetype,
            buffer,
          },
        );
        attachments.push(attachment);
      }
    }

    if (attachments.length === 0) {
      throw new BadRequestException('No files were uploaded');
    }

    return { message: `${attachments.length} file(s) uploaded`, attachments };
  }

  @Get(':id/attachments/:attachmentId/download')
  @ApiOperation({ summary: 'Download a voucher attachment' })
  @ApiResponse({ status: 200, description: 'File stream' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async downloadAttachment(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res() reply: FastifyReply,
  ) {
    const { absolutePath, fileName, mimeType, fileSize } =
      await this.vouchersService.getAttachmentForDownload(
        tenantId,
        id,
        attachmentId,
      );

    const encodedName = encodeURIComponent(fileName);
    reply.header('Content-Type', mimeType);
    reply.header(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedName}`,
    );
    reply.header('Content-Length', fileSize);

    const stream = fs.createReadStream(absolutePath);
    return reply.send(stream);
  }

  @Delete(':id/attachments/:attachmentId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a voucher attachment' })
  @ApiResponse({ status: 204, description: 'Attachment deleted' })
  @ApiResponse({ status: 403, description: 'Voucher status does not allow deletion' })
  @ApiResponse({ status: 404, description: 'Attachment not found' })
  async deleteAttachment(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
  ) {
    await this.vouchersService.deleteAttachment(tenantId, id, attachmentId);
  }

  // ─── Comment Endpoints ────────────────────────────────────────

  @Get(':id/comments')
  @ApiOperation({ summary: 'List comments on a voucher' })
  async listComments(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.vouchersService.listComments(tenantId, id);
  }

  @Post(':id/comments')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Add a comment (with optional attachments) to a voucher' })
  async addComment(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const parts = req.parts();
    const files: { filename: string; mimetype: string; buffer: Buffer }[] = [];
    let body = '';

    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        if (buf.length === 0) continue;
        files.push({ filename: part.filename, mimetype: part.mimetype, buffer: buf });
      } else if (part.type === 'field' && part.fieldname === 'body') {
        body = String(part.value ?? '');
      }
    }

    return this.vouchersService.addComment(tenantId, id, userId, body, files);
  }

  @Get(':id/comments/:commentId/attachments/:attachmentId/download')
  @ApiOperation({ summary: 'Download a comment attachment' })
  async downloadCommentAttachment(
    @TenantId() tenantId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Param('commentId', ParseUUIDPipe) commentId: string,
    @Param('attachmentId', ParseUUIDPipe) attachmentId: string,
    @Res() reply: FastifyReply,
  ) {
    const { absolutePath, fileName, mimeType, fileSize } =
      await this.vouchersService.getCommentAttachmentForDownload(
        tenantId,
        id,
        commentId,
        attachmentId,
      );

    const encodedName = encodeURIComponent(fileName);
    reply.header('Content-Type', mimeType);
    reply.header(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodedName}`,
    );
    reply.header('Content-Length', fileSize);

    const stream = fs.createReadStream(absolutePath);
    return reply.send(stream);
  }

  // ─── Mark Paid Endpoint ───────────────────────────────────────

  @Post(':id/mark-paid')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Mark an invoice as paid by creating a real payment/receipt voucher allocated against it' })
  async markPaid(
    @TenantId() tenantId: string,
    @CurrentUser('id') userId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: FastifyRequest,
  ) {
    const parts = req.parts();
    let file: { filename: string; mimetype: string; buffer: Buffer } | undefined;
    let bankAccountId = '';
    let paymentDate: string | undefined;
    let paymentAmount: string | undefined;

    for await (const part of parts) {
      if (part.type === 'file') {
        const chunks: Buffer[] = [];
        for await (const chunk of part.file) chunks.push(chunk);
        const buf = Buffer.concat(chunks);
        if (buf.length > 0) {
          file = { filename: part.filename, mimetype: part.mimetype, buffer: buf };
        }
      } else if (part.type === 'field') {
        if (part.fieldname === 'bankAccountId') bankAccountId = String(part.value ?? '');
        else if (part.fieldname === 'paymentDate') paymentDate = String(part.value ?? '') || undefined;
        else if (part.fieldname === 'paymentAmount') {
          const v = String(part.value ?? '').trim();
          if (v) paymentAmount = v;
        }
      }
    }

    return this.vouchersService.markPaid(tenantId, id, userId, {
      bankAccountId,
      paymentDate,
      paymentAmount,
      file,
    });
  }
}
