import { Injectable } from '@nestjs/common'
import { HttpService } from '@nestjs/axios'
import { firstValueFrom } from 'rxjs'
import { AppConfigService } from '../config/config.service'
import { InstagramMediaItem, InstagramMediaResponse } from './instagram.types'

const GRAPH_API_URL = 'https://graph.instagram.com'

@Injectable()
export class InstagramService {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: AppConfigService
  ) {}

  private get accessToken(): string {
    return this.configService.instagramAccessToken
  }

  async getAccountMedia(): Promise<InstagramMediaItem[]> {
    const url = `${GRAPH_API_URL}/me/media`
    const params = {
      access_token: this.accessToken,
      fields: 'id,media_type,media_url,thumbnail_url,permalink,caption',
      limit: 100
    }

    try {
      const response = await firstValueFrom(this.httpService.get<InstagramMediaResponse>(url, { params }))
      return response.data?.data || []
    } catch (error) {
      console.error('Instagram API Error:', error)
      return []
    }
  }

  async sendDm(commentId: string, message: string): Promise<any> {
    const url = `${GRAPH_API_URL}/me/messages`
    const params = {
      access_token: this.accessToken
    }
    const payload = {
      recipient: { comment_id: commentId },
      message: { text: message }
    }

    const response = await firstValueFrom(this.httpService.post(url, payload, { params }))
    return response.data
  }

  async replyToComment(commentId: string, message: string): Promise<any> {
    const url = `${GRAPH_API_URL}/${commentId}/replies`
    const params = {
      access_token: this.accessToken
    }
    const payload = { message }

    const response = await firstValueFrom(this.httpService.post(url, payload, { params }))
    return response.data
  }
}
