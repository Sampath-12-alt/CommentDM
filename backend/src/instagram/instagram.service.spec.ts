import { Test, TestingModule } from '@nestjs/testing'
import { HttpModule, HttpService } from '@nestjs/axios'
import { of } from 'rxjs'
import { AxiosResponse } from 'axios'
import { InstagramService } from './instagram.service'
import { AppConfigService } from '../config/config.service'
import { InstagramMediaItem, InstagramMediaResponse } from './instagram.types'

describe('InstagramService', () => {
  let service: InstagramService
  let httpService: HttpService
  let configService: AppConfigService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [HttpModule],
      providers: [
        InstagramService,
        {
          provide: AppConfigService,
          useValue: {
            instagramAccessToken: 'test-token'
          }
        }
      ]
    }).compile()

    service = module.get<InstagramService>(InstagramService)
    httpService = module.get<HttpService>(HttpService)
    configService = module.get<AppConfigService>(AppConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should use configured Instagram access token', () => {
    expect(configService.instagramAccessToken).toBe('test-token')
  })

  it('should construct getAccountMedia request correctly', async () => {
    const mediaItems: InstagramMediaItem[] = [
      { id: '1', media_type: 'VIDEO', media_url: 'url', thumbnail_url: 'thumb', permalink: 'link', caption: 'caption' }
    ]

    const axiosResponse: AxiosResponse<InstagramMediaResponse> = {
      data: { data: mediaItems },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any
    }

    jest.spyOn(httpService, 'get').mockReturnValue(of(axiosResponse))

    const result = await service.getAccountMedia()

    expect(result).toEqual(mediaItems)
    expect(httpService.get).toHaveBeenCalledWith(
      'https://graph.instagram.com/me/media',
      expect.objectContaining({
        params: {
          access_token: 'test-token',
          fields: 'id,media_type,media_url,thumbnail_url,permalink,caption',
          limit: 100
        }
      })
    )
  })

  it('should construct sendDm request correctly', async () => {
    const axiosResponse: AxiosResponse<any> = {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any
    }

    jest.spyOn(httpService, 'post').mockReturnValue(of(axiosResponse))

    const result = await service.sendDm('test-comment-id', 'test message')

    expect(result).toEqual({ success: true })
    expect(httpService.post).toHaveBeenCalledWith(
      'https://graph.instagram.com/me/messages',
      {
        recipient: { comment_id: 'test-comment-id' },
        message: { text: 'test message' }
      },
      expect.objectContaining({ params: { access_token: 'test-token' } })
    )
  })

  it('should construct replyToComment request correctly', async () => {
    const axiosResponse: AxiosResponse<any> = {
      data: { success: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as any
    }

    jest.spyOn(httpService, 'post').mockReturnValue(of(axiosResponse))

    const result = await service.replyToComment('test-comment-id', 'test message')

    expect(result).toEqual({ success: true })
    expect(httpService.post).toHaveBeenCalledWith(
      'https://graph.instagram.com/test-comment-id/replies',
      { message: 'test message' },
      expect.objectContaining({ params: { access_token: 'test-token' } })
    )
  })
})
