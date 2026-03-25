import { Controller, Get, Param, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JournalEntriesService } from './journal-entries.service';
import { JournalEntryFilterDto } from './dto/journal-entry-filter.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';

@ApiTags('journal-entries')
@ApiBearerAuth()
@Controller('journal-entries')
export class JournalEntriesController {
  constructor(private readonly journalEntriesService: JournalEntriesService) {}

  @Get()
  @ApiOperation({ summary: 'List journal entries with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Paginated list of journal entries' })
  findAll(@TenantId() tenantId: string, @Query() filters: JournalEntryFilterDto) {
    return this.journalEntriesService.findAll(tenantId, {
      ...filters,
      isReversing: filters.isReversing !== undefined ? filters.isReversing === 'true' : undefined,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single journal entry by ID' })
  @ApiResponse({ status: 200, description: 'Journal entry details with lines' })
  @ApiResponse({ status: 404, description: 'Journal entry not found' })
  findOne(@TenantId() tenantId: string, @Param('id', ParseUUIDPipe) id: string) {
    return this.journalEntriesService.findOne(tenantId, id);
  }
}
