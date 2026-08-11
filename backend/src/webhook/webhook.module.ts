import { Module } from '@nestjs/common'
import { WebhookController } from './webhook.controller'
import { WebhookService } from './webhook.service'
import { AppConfigModule } from '../config/config.module'
import { AutomationConfigModule } from '../automation-config/automation-config.module'
import { InstagramModule } from '../instagram/instagram.module'

@Module({
  imports: [AppConfigModule, AutomationConfigModule, InstagramModule],
  controllers: [WebhookController],
  providers: [WebhookService]
})
export class WebhookModule {}
