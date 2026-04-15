import { Module } from '@nestjs/common';
import { AccountManagersController } from './account-managers.controller';
import { AccountManagersService } from './account-managers.service';

@Module({
  controllers: [AccountManagersController],
  providers: [AccountManagersService],
  exports: [AccountManagersService],
})
export class AccountManagersModule {}
