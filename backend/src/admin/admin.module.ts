import { Module } from '@nestjs/common'
import { AdminController } from './admin.controller'
import { AdminService } from './admin.service'
import { InstagramModule } from '../instagram/instagram.module'
import { AutomationConfigModule } from '../automation-config/automation-config.module'

@Module({
  imports: [InstagramModule, AutomationConfigModule],
  controllers: [AdminController],
  providers: [AdminService]
})
export class AdminModule {}
