import { Module } from '@nestjs/common';
import { ExternalDbService } from './external-db.service';
import { ExternalDbController } from './external-db.controller';

@Module({
  controllers: [ExternalDbController],
  providers: [ExternalDbService],
  exports: [ExternalDbService],
})
export class ExternalDbModule {}
