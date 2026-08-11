import { Test, TestingModule } from '@nestjs/testing'
import { WebhookService } from './webhook.service'
import { AppConfigService } from '../config/config.service'
import { AutomationConfigService } from '../automation-config/automation-config.service'
import { InstagramService } from '../instagram/instagram.service'
import { WebhookPayload } from './webhook.types'

describe('WebhookService', () => {
  let service: WebhookService
  let automationConfigService: AutomationConfigService
  let instagramService: InstagramService

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebhookService,
        {
          provide: AppConfigService,
          useValue: { verifyToken: 'test-verify-token' }
        },
        {
          provide: AutomationConfigService,
          useValue: {
            getReelConfig: jest.fn()
          }
        },
        {
          provide: InstagramService,
          useValue: {
            sendDm: jest.fn(),
            replyToComment: jest.fn()
          }
        }
      ]
    }).compile()

    service = module.get<WebhookService>(WebhookService)
    automationConfigService = module.get<AutomationConfigService>(AutomationConfigService)
    instagramService = module.get<InstagramService>(InstagramService)
  })

  it('should ignore non-Instagram object', async () => {
    const payload: WebhookPayload = { object: 'page' }
    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ignored' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should ignore non-comment field', async () => {
    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'mentions', value: { id: 'c1', text: 'hello', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should skip bot comments', async () => {
    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'bot-id',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'test', media: { id: 'm1' }, from: { id: 'bot-id' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should skip missing comment id', async () => {
    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { text: 'test', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should skip missing media id', async () => {
    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'test', from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should skip inactive reel', async () => {
    jest.spyOn(automationConfigService, 'getReelConfig').mockResolvedValue({
      trigger_keyword: 'info',
      dm_message: 'DM',
      comment_reply: 'Reply',
      active: false
    })

    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'info', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should skip when keyword does not match', async () => {
    jest.spyOn(automationConfigService, 'getReelConfig').mockResolvedValue({
      trigger_keyword: 'info',
      dm_message: 'DM',
      comment_reply: 'Reply',
      active: true
    })

    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'hello', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should call sendDm and replyToComment when keyword matches', async () => {
    jest.spyOn(automationConfigService, 'getReelConfig').mockResolvedValue({
      trigger_keyword: 'info',
      dm_message: 'DM',
      comment_reply: 'Reply',
      active: true
    })

    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'I NEED INFO PLEASE', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).toHaveBeenCalledWith('c1', 'DM')
    expect(instagramService.replyToComment).toHaveBeenCalledWith('c1', 'Reply')
  })

  it('should not call sendDm when dm_message empty', async () => {
    jest.spyOn(automationConfigService, 'getReelConfig').mockResolvedValue({
      trigger_keyword: 'info',
      dm_message: '',
      comment_reply: 'Reply',
      active: true
    })

    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'INFO', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).toHaveBeenCalledWith('c1', 'Reply')
  })

  it('should not call replyToComment when comment_reply empty', async () => {
    jest.spyOn(automationConfigService, 'getReelConfig').mockResolvedValue({
      trigger_keyword: 'info',
      dm_message: 'DM',
      comment_reply: '',
      active: true
    })

    const payload: WebhookPayload = {
      object: 'instagram',
      entry: [
        {
          id: 'entry-1',
          changes: [
            { field: 'comments', value: { id: 'c1', text: 'INFO', media: { id: 'm1' }, from: { id: 'u1' } } }
          ]
        }
      ]
    }

    const result = await service.handleWebhook(payload)
    expect(result).toEqual({ status: 'ok' })
    expect(instagramService.sendDm).toHaveBeenCalledWith('c1', 'DM')
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })
})
