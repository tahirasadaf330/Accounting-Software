import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { NettingCyclesService } from './netting-cycles.service';
import { Public } from '../../common/decorators/public.decorator';

@ApiTags('netting-review')
@Controller('netting-review')
export class NettingReviewController {
  constructor(private readonly service: NettingCyclesService) {}

  @Get(':token')
  @Public()
  @ApiOperation({ summary: 'Get netting cycle by review token (no auth)' })
  getByToken(@Param('token') token: string) {
    return this.service.getByToken(token);
  }

  @Post(':token/approve')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AM approves via review token (no auth)' })
  approve(@Param('token') token: string) {
    return this.service.approveByToken(token);
  }

  @Post(':token/reject')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'AM rejects via review token (no auth)' })
  reject(@Param('token') token: string, @Body() body: { reason?: string }) {
    return this.service.rejectByToken(token, body.reason);
  }

  @Post(':token/comments')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add comment via review token (no auth)' })
  addComment(@Param('token') token: string, @Body() body: { message: string }) {
    return this.service.addCommentByToken(token, body.message);
  }
}
