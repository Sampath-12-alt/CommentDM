import { Module } from '@nestjs/common'
import { HttpModule } from '@nestjs/axios'
import { InstagramService } from './instagram.service'
import { AppConfigModule } from '../config/config.module'

@Module({
  imports: [HttpModule, AppConfigModule],
  providers: [InstagramService],
  exports: [InstagramService]
})
export class InstagramModule {}
