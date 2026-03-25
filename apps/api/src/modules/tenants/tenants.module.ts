import { Module } from '@nestjs/common';
import { TenantsService } from './tenants.service';
import { TenantsController } from './tenants.controller';
import { TenantProfileController } from './tenant-profile.controller';
import { TenantSetupController } from './tenant-setup.controller';

@Module({
  controllers: [TenantsController, TenantProfileController, TenantSetupController],
  providers: [TenantsService],
  exports: [TenantsService],
})
export class TenantsModule {}
