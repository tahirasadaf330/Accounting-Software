import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import { ApiBearerAuth, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FastifyReply, FastifyRequest } from 'fastify';
import * as fs from 'fs';
import { Role } from '@prisma/client';
import { TenantsService } from './tenants.service';
import { UpdateTenantProfileDto } from './dto/update-tenant-profile.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('tenant-profile')
@ApiBearerAuth()
@Controller('tenant/profile')
export class TenantProfileController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Get()
  @ApiOperation({ summary: 'Get current tenant company profile' })
  async getProfile(@TenantId() tenantId: string) {
    return this.tenantsService.getProfile(tenantId);
  }

  @Patch()
  @ApiOperation({ summary: 'Update tenant company profile (Owner only)' })
  async updateProfile(
    @TenantId() tenantId: string,
    @CurrentUser('role') role: string,
    @Body() dto: UpdateTenantProfileDto,
  ) {
    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only the organization owner can update the company profile');
    }
    return this.tenantsService.updateProfile(tenantId, dto);
  }

  @Post('logo')
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload tenant logo (Owner only)' })
  async uploadLogo(
    @TenantId() tenantId: string,
    @CurrentUser('role') role: string,
    @Req() req: FastifyRequest,
  ) {
    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only the organization owner can change the logo');
    }

    const parts = req.parts();
    for await (const part of parts) {
      if (part.type !== 'file') continue;
      const chunks: Buffer[] = [];
      for await (const chunk of part.file) chunks.push(chunk);
      const buffer = Buffer.concat(chunks);
      const result = await this.tenantsService.uploadLogo(tenantId, {
        filename: part.filename,
        mimetype: part.mimetype,
        buffer,
      });
      return { message: 'Logo uploaded', logo: result };
    }
    throw new BadRequestException('No file was uploaded');
  }

  @Get('logo')
  @ApiOperation({ summary: 'Stream the tenant logo' })
  async getLogo(@TenantId() tenantId: string, @Res() reply: FastifyReply) {
    const { absolutePath, mimeType } = await this.tenantsService.getLogoForDownload(tenantId);
    reply.header('Content-Type', mimeType);
    reply.header('Cache-Control', 'private, max-age=300');
    return reply.send(fs.createReadStream(absolutePath));
  }

  @Delete('logo')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove the tenant logo (Owner only)' })
  async deleteLogo(
    @TenantId() tenantId: string,
    @CurrentUser('role') role: string,
  ) {
    if (role !== Role.OWNER) {
      throw new ForbiddenException('Only the organization owner can change the logo');
    }
    await this.tenantsService.deleteLogo(tenantId);
  }
}
