import { Controller, Get, Post, Query, Body, BadRequestException } from '@nestjs/common'
import { WebhookService } from './webhook.service'
import { WebhookPayload } from './webhook.types'

@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Get()
  verify(
    @Query('hub.mode') hubMode: string,
    @Query('hub.verify_token') hubVerifyToken: string,
    @Query('hub.challenge') hubChallenge: string
  ) {
    try {
      return this.webhookService.verifyWebhook(hubMode, hubVerifyToken, hubChallenge)
    } catch (error) {
      throw new BadRequestException('Verification failed')
    }
  }

  @Post()
  async handle(@Body() payload: WebhookPayload) {
    return this.webhookService.handleWebhook(payload)
  }
}
