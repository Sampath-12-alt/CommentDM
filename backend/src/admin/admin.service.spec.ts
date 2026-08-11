import { Test, TestingModule } from '@nestjs/testing'
import { AdminService } from './admin.service'
import { InstagramService } from '../instagram/instagram.service'
import { AutomationConfigService } from '../automation-config/automation-config.service'

describe('AdminService', () => {
  let service: AdminService
  let instagramService: InstagramService
  let automationConfigService: AutomationConfigService

  const mockMediaItems = [
    {
      id: '1',
      thumbnail_url: 'thumb',
      permalink: 'link',
      caption: 'some caption'
    }
  ]

  const defaultConfig = {
    trigger_keyword: 'info',
    dm_message: 'Thanks for your interest! Check your DMs.',
    comment_reply: 'Sent you a DM!',
    active: true
  }

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminService,
        {
          provide: InstagramService,
          useValue: {
            getAccountMedia: jest.fn().mockResolvedValue(mockMediaItems),
            sendDm: jest.fn().mockResolvedValue({ success: true }),
            replyToComment: jest.fn().mockResolvedValue({ success: true })
          }
        },
        {
          provide: AutomationConfigService,
          useValue: {
            getReelConfig: jest.fn().mockResolvedValue(defaultConfig),
            updateReelConfig: jest.fn().mockResolvedValue(defaultConfig),
            getAllConfigs: jest.fn().mockResolvedValue({ reels: {}, default: defaultConfig })
          }
        }
      ]
    }).compile()

    service = module.get<AdminService>(AdminService)
    instagramService = module.get<InstagramService>(InstagramService)
    automationConfigService = module.get<AutomationConfigService>(AutomationConfigService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  it('should fetch reels with config and counts', async () => {
    const result = await service.fetchReels()

    expect(result.total).toBe(1)
    expect(result.reels[0]).toMatchObject({
      id: '1',
      thumbnail_url: 'thumb',
      permalink: 'link',
      caption: 'some caption',
      config: defaultConfig
    })
    expect(automationConfigService.getReelConfig).toHaveBeenCalledWith('1')
  })

  it('should get a reel config by media id', async () => {
    const result = await service.getReel('1')
    expect(result).toEqual({ media_id: '1', config: defaultConfig })
  })

  it('should update a reel config', async () => {
    const updatedConfig = { ...defaultConfig, trigger_keyword: 'price' }
    jest.spyOn(automationConfigService, 'updateReelConfig').mockResolvedValue(updatedConfig)

    const result = await service.updateReel('1', updatedConfig)
    expect(result).toEqual({ status: 'updated', media_id: '1' })
    expect(automationConfigService.updateReelConfig).toHaveBeenCalledWith('1', updatedConfig)
  })

  it('should report stats correctly', async () => {
    jest.spyOn(automationConfigService, 'getAllConfigs').mockResolvedValue({ reels: { '1': defaultConfig }, default: defaultConfig })
    const result = await service.getStats()

    expect(result).toEqual({ total_reels: 1, configured: 1, using_default: 0 })
  })

  it('should send a test DM', async () => {
    const result = await service.sendTestDm({ comment_id: 'cid', message: 'hello' })
    expect(result).toEqual({ status: 'success', result: { success: true } })
    expect(instagramService.sendDm).toHaveBeenCalledWith('cid', 'hello')
  })

  it('should reply to a test comment', async () => {
    const result = await service.replyTestComment({ comment_id: 'cid', message: 'hello' })
    expect(result).toEqual({ status: 'success', result: { success: true } })
    expect(instagramService.replyToComment).toHaveBeenCalledWith('cid', 'hello')
  })
})
