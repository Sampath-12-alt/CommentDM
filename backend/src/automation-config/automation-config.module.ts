import { Module } from '@nestjs/common'
import { AutomationConfigService } from './automation-config.service'
import { AppConfigModule } from '../config/config.module'

@Module({
  imports: [AppConfigModule],
  providers: [AutomationConfigService],
  exports: [AutomationConfigService]
})
export class AutomationConfigModule {}
