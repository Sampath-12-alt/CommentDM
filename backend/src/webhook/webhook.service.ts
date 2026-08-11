import { Injectable, Logger } from '@nestjs/common'
import { AppConfigService } from '../config/config.service'
import { AutomationConfigService } from '../automation-config/automation-config.service'
import { InstagramService } from '../instagram/instagram.service'
import { WebhookPayload } from './webhook.types'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)

  constructor(
    private readonly configService: AppConfigService,
    private readonly automationConfigService: AutomationConfigService,
    private readonly instagramService: InstagramService
  ) {}

  verifyWebhook(hubMode: string, hubVerifyToken: string, hubChallenge: string): number {
    if (hubMode === 'subscribe' && hubVerifyToken === this.configService.verifyToken) {
      return parseInt(hubChallenge, 10)
    }
    throw new Error('Verification failed')
  }

  async handleWebhook(payload: WebhookPayload): Promise<{ status: string }> {
    this.logger.log('Received Instagram webhook')

    if (payload.object !== 'instagram') {
      this.logger.log('Ignored non-Instagram object')
      return { status: 'ignored' }
    }

    for (const entry of payload.entry || []) {
      for (const change of entry.changes || []) {
        if (change.field !== 'comments') {
          this.logger.log(`Ignored change field: ${change.field}`)
          continue
        }

        const value = change.value || {}
        const commentId = value.id
        const commentText = (value.text || '').trim().toLowerCase()
        const mediaId = value.media?.id
        const commenterId = value.from?.id

        this.logger.log(`Processing comment event for media ${mediaId}`)

        if (commenterId && commenterId === entry.id) {
          this.logger.log('Skipping bot comment')
          continue
        }

        if (!commentId || !mediaId) {
          this.logger.log('Skipping event due to missing comment_id or media_id')
          continue
        }

        const config = await this.automationConfigService.getReelConfig(mediaId)
        this.logger.log(`Loaded config for media ${mediaId}`)

        if (!config.active) {
          this.logger.log('Skipping inactive reel')
          continue
        }

        const trigger = (config.trigger_keyword || '').toLowerCase()
        this.logger.log(`Trigger keyword: '${trigger}'`)

        if (trigger && commentText.includes(trigger)) {
          this.logger.log('Keyword matched')

          if (config.dm_message) {
            this.logger.log('Sending DM')
            await this.instagramService.sendDm(commentId, config.dm_message)
          }

          if (config.comment_reply) {
            this.logger.log('Replying to comment')
            await this.instagramService.replyToComment(commentId, config.comment_reply)
          }
        } else {
          this.logger.log(`Trigger not matched for comment: ${commentText}`)
        }
      }
    }

    return { status: 'ok' }
  }
}
