import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService) {}

  get verifyToken(): string {
    return this.configService.get<string>('verifyToken', '')
  }

  get instagramAccessToken(): string {
    return this.configService.get<string>('instagramAccessToken', '')
  }

  get igBusinessAccountId(): string {
    return this.configService.get<string>('igBusinessAccountId', '')
  }

  get railwayVolumeMountPath(): string {
    return this.configService.get<string>('railwayVolumeMountPath', '')
  }
}
