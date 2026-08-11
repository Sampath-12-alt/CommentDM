import { Injectable } from '@nestjs/common'
import { InstagramService } from '../instagram/instagram.service'
import { AutomationConfigService } from '../automation-config/automation-config.service'
import { ReelConfigUpdate, ReelItem, TestMessageRequest } from './admin.types'

@Injectable()
export class AdminService {
  constructor(
    private readonly instagramService: InstagramService,
    private readonly automationConfigService: AutomationConfigService
  ) {}

  async fetchReels(): Promise<{ reels: ReelItem[]; total: number }> {
    const mediaItems = await this.instagramService.getAccountMedia()
    const reels = [] as ReelItem[]

    for (const item of mediaItems) {
      const mediaId = item.id
      const config = await this.automationConfigService.getReelConfig(mediaId)

      reels.push({
        id: mediaId,
        thumbnail_url: item.thumbnail_url || item.media_url,
        permalink: item.permalink,
        caption: item.caption ? item.caption.slice(0, 100) : '',
        config
      })
    }

    return { reels, total: reels.length }
  }

  async getReel(mediaId: string) {
    const config = await this.automationConfigService.getReelConfig(mediaId)
    return { media_id: mediaId, config }
  }

  async updateReel(mediaId: string, config: ReelConfigUpdate) {
    await this.automationConfigService.updateReelConfig(mediaId, config)
    return { status: 'updated', media_id: mediaId }
  }

  async getStats() {
    const mediaItems = await this.instagramService.getAccountMedia()
    const configs = await this.automationConfigService.getAllConfigs()

    let configured = 0
    for (const item of mediaItems) {
      if (configs.reels[item.id]) {
        configured += 1
      }
    }

    const total = mediaItems.length
    const using_default = total - configured

    return {
      total_reels: total,
      configured,
      using_default
    }
  }

  async sendTestDm(request: TestMessageRequest) {
    const result = await this.instagramService.sendDm(request.comment_id, request.message)
    return { status: 'success', result }
  }

  async replyTestComment(request: TestMessageRequest) {
    const result = await this.instagramService.replyToComment(request.comment_id, request.message)
    return { status: 'success', result }
  }
}
