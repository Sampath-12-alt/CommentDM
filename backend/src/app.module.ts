import { Module } from '@nestjs/common'
import { AppController } from './app.controller'
import { AppConfigModule } from './config/config.module'
import { InstagramModule } from './instagram/instagram.module'
import { AutomationConfigModule } from './automation-config/automation-config.module'
import { WebhookModule } from './webhook/webhook.module'
import { AdminModule } from './admin/admin.module'

@Module({
  imports: [AppConfigModule, InstagramModule, AutomationConfigModule, WebhookModule, AdminModule],
  controllers: [AppController],
  providers: []
})
export class AppModule {}
