import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'
import { AppConfigService } from './config/config.service'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  app.enableCors()

  const configService = app.get(AppConfigService)
  const statuses = {
    VERIFY_TOKEN: configService.verifyToken ? 'configured' : 'not configured',
    INSTAGRAM_ACCESS_TOKEN: configService.instagramAccessToken ? 'configured' : 'not configured',
    IG_BUSINESS_ACCOUNT_ID: configService.igBusinessAccountId ? 'configured' : 'not configured',
    RAILWAY_VOLUME_MOUNT_PATH: configService.railwayVolumeMountPath ? 'configured' : 'not configured'
  }
  console.log('Configuration statuses:', statuses)

  await app.listen(process.env.PORT || 8000)
}

bootstrap()
