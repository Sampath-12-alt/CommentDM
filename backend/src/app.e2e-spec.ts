import { Test, TestingModule } from '@nestjs/testing'
import { INestApplication, ValidationPipe } from '@nestjs/common'
import * as request from 'supertest'
import { join } from 'path'
import { promises as fs } from 'fs'
import { AppModule } from './app.module'
import { AppConfigService } from './config/config.service'
import { InstagramService } from './instagram/instagram.service'

const tempDir = join(__dirname, '__temp__')
const configFilePath = join(tempDir, 'reels_config.json')

describe('Node.js MVP End-to-End', () => {
  let app: INestApplication
  let instagramService: InstagramService
  let appConfigService: AppConfigService

  const verifyToken = 'correct-token'
  const defaultConfig = {
    trigger_keyword: 'info',
    dm_message: 'Here is the information.',
    comment_reply: 'Sent you a DM!',
    active: true
  }

  const mockInstagramService = {
    getAccountMedia: jest.fn(),
    sendDm: jest.fn().mockResolvedValue({ success: true }),
    replyToComment: jest.fn().mockResolvedValue({ success: true })
  }

  beforeAll(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    await fs.mkdir(tempDir, { recursive: true })
    await fs.writeFile(
      configFilePath,
      JSON.stringify({ reels: {}, default: defaultConfig }, null, 2),
      'utf-8'
    )

    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(AppConfigService)
      .useValue({
        verifyToken,
        instagramAccessToken: 'test-token',
        igBusinessAccountId: 'business-account',
        railwayVolumeMountPath: tempDir
      })
      .overrideProvider(InstagramService)
      .useValue(mockInstagramService)
      .compile()

    app = moduleFixture.createNestApplication()
    await app.init()

    instagramService = moduleFixture.get<InstagramService>(InstagramService)
    appConfigService = moduleFixture.get<AppConfigService>(AppConfigService)
  })

  afterAll(async () => {
    await app.close()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should expose root and health endpoints', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect(res => {
      expect(res.body).toEqual({ status: 'ok', service: 'Instagram Comment-to-DM Automation' })
    })

    await request(app.getHttpServer()).get('/health').expect(200).expect(res => {
      expect(res.body).toEqual({ status: 'healthy' })
    })
  })

  it('should verify webhook challenge with correct token and reject incorrect token', async () => {
    await request(app.getHttpServer())
      .get('/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': verifyToken, 'hub.challenge': '12345' })
      .expect(200)
      .expect('12345')

    await request(app.getHttpServer())
      .get('/webhook')
      .query({ 'hub.mode': 'subscribe', 'hub.verify_token': 'wrong', 'hub.challenge': '12345' })
      .expect(400)
  })

  it('should process Instagram comment webhook and send DM + reply on keyword match', async () => {
    const payload = {
      object: 'instagram',
      entry: [
        {
          id: 'business-account',
          changes: [
            {
              field: 'comments',
              value: {
                id: 'test-comment',
                text: 'Can I get INFO?',
                media: { id: 'test-media' },
                from: { id: 'customer' }
              }
            }
          ]
        }
      ]
    }

    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })

    expect(instagramService.sendDm).toHaveBeenCalledTimes(1)
    expect(instagramService.sendDm).toHaveBeenCalledWith('test-comment', 'Here is the information.')
    expect(instagramService.replyToComment).toHaveBeenCalledTimes(1)
    expect(instagramService.replyToComment).toHaveBeenCalledWith('test-comment', 'Sent you a DM!')
  })

  it('should ignore webhook when object is not instagram', async () => {
    const payload = { object: 'facebook', entry: [{ id: 'business-account', changes: [{ field: 'comments', value: { id: 'test-comment', text: 'info', media: { id: 'test-media' }, from: { id: 'customer' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ignored' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should ignore webhook when field is not comments', async () => {
    const payload = { object: 'instagram', entry: [{ id: 'business-account', changes: [{ field: 'likes', value: { id: 'test-comment', text: 'info', media: { id: 'test-media' }, from: { id: 'customer' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should ignore webhook when comment is from the bot', async () => {
    const payload = { object: 'instagram', entry: [{ id: 'business-account', changes: [{ field: 'comments', value: { id: 'test-comment', text: 'info', media: { id: 'test-media' }, from: { id: 'business-account' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should ignore webhook when default config is inactive', async () => {
    await fs.writeFile(
      configFilePath,
      JSON.stringify({ reels: {}, default: { ...defaultConfig, active: false } }, null, 2),
      'utf-8'
    )

    const payload = { object: 'instagram', entry: [{ id: 'business-account', changes: [{ field: 'comments', value: { id: 'test-comment', text: 'info', media: { id: 'test-media' }, from: { id: 'customer' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()

    await fs.writeFile(configFilePath, JSON.stringify({ reels: {}, default: defaultConfig }, null, 2), 'utf-8')
  })

  it('should ignore webhook when keyword does not match', async () => {
    const payload = { object: 'instagram', entry: [{ id: 'business-account', changes: [{ field: 'comments', value: { id: 'test-comment', text: 'hello', media: { id: 'test-media' }, from: { id: 'customer' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).not.toHaveBeenCalled()
  })

  it('should allow public reply when dm_message is empty', async () => {
    await fs.writeFile(
      configFilePath,
      JSON.stringify({ reels: {}, default: { ...defaultConfig, dm_message: '' } }, null, 2),
      'utf-8'
    )

    const payload = { object: 'instagram', entry: [{ id: 'business-account', changes: [{ field: 'comments', value: { id: 'test-comment', text: 'info', media: { id: 'test-media' }, from: { id: 'customer' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })
    expect(instagramService.sendDm).not.toHaveBeenCalled()
    expect(instagramService.replyToComment).toHaveBeenCalledTimes(1)

    await fs.writeFile(configFilePath, JSON.stringify({ reels: {}, default: defaultConfig }, null, 2), 'utf-8')
  })

  it('should allow dm when comment_reply is empty', async () => {
    await fs.writeFile(
      configFilePath,
      JSON.stringify({ reels: {}, default: { ...defaultConfig, comment_reply: '' } }, null, 2),
      'utf-8'
    )

    const payload = { object: 'instagram', entry: [{ id: 'business-account', changes: [{ field: 'comments', value: { id: 'test-comment', text: 'info', media: { id: 'test-media' }, from: { id: 'customer' } } }] }] }
    await request(app.getHttpServer()).post('/webhook').send(payload).expect(201).expect({ status: 'ok' })
    expect(instagramService.sendDm).toHaveBeenCalledTimes(1)
    expect(instagramService.replyToComment).not.toHaveBeenCalled()

    await fs.writeFile(configFilePath, JSON.stringify({ reels: {}, default: defaultConfig }, null, 2), 'utf-8')
  })

  it('should return default config for unknown reel and preserve default behavior', async () => {
    await request(app.getHttpServer()).get('/api/reels/unknown-media').expect(200).expect(res => {
      expect(res.body).toEqual({ media_id: 'unknown-media', config: defaultConfig })
    })
  })

  it('should support admin reel fetch, update, and persisted config', async () => {
    mockInstagramService.getAccountMedia.mockResolvedValue([
      { id: 'test-media', thumbnail_url: 'thumb', permalink: 'link', caption: 'caption' }
    ])

    const getReelsRes = await request(app.getHttpServer()).get('/api/reels').expect(200)
    expect(getReelsRes.body.total).toBe(1)
    expect(getReelsRes.body.reels[0].id).toBe('test-media')

    await request(app.getHttpServer())
      .put('/api/reels/test-media')
      .send({
        trigger_keyword: 'price',
        dm_message: 'Pricing details are in your DM.',
        comment_reply: 'Sent pricing details!',
        active: true
      })
      .expect(200)
      .expect({ status: 'updated', media_id: 'test-media' })

    const getReelRes = await request(app.getHttpServer()).get('/api/reels/test-media').expect(200)
    expect(getReelRes.body).toEqual({
      media_id: 'test-media',
      config: {
        trigger_keyword: 'price',
        dm_message: 'Pricing details are in your DM.',
        comment_reply: 'Sent pricing details!',
        active: true
      }
    })

    const fileContents = await fs.readFile(configFilePath, 'utf-8')
    expect(JSON.parse(fileContents).reels['test-media']).toEqual({
      trigger_keyword: 'price',
      dm_message: 'Pricing details are in your DM.',
      comment_reply: 'Sent pricing details!',
      active: true
    })
  })

  it('should return correct stats counts for configured and default reels', async () => {
    mockInstagramService.getAccountMedia.mockResolvedValue([
      { id: 'a', thumbnail_url: 'thumb-a', permalink: 'link-a', caption: 'caption-a' },
      { id: 'b', thumbnail_url: 'thumb-b', permalink: 'link-b', caption: 'caption-b' },
      { id: 'c', thumbnail_url: 'thumb-c', permalink: 'link-c', caption: 'caption-c' }
    ])

    await fs.writeFile(
      configFilePath,
      JSON.stringify({ reels: { a: defaultConfig }, default: defaultConfig }, null, 2),
      'utf-8'
    )

    await request(app.getHttpServer()).get('/api/stats').expect(200).expect(res => {
      expect(res.body).toEqual({ total_reels: 3, configured: 1, using_default: 2 })
    })
  })

  it('should send test DM and reply test comment using InstagramService', async () => {
    await request(app.getHttpServer())
      .post('/api/test/send-dm')
      .send({ comment_id: 'test-comment', message: 'test message' })
      .expect(201)
      .expect(res => {
        expect(res.body).toEqual({ status: 'success', result: { success: true } })
      })

    expect(instagramService.sendDm).toHaveBeenCalledWith('test-comment', 'test message')

    await request(app.getHttpServer())
      .post('/api/test/reply-comment')
      .send({ comment_id: 'test-comment', message: 'test reply' })
      .expect(201)
      .expect(res => {
        expect(res.body).toEqual({ status: 'success', result: { success: true } })
      })

    expect(instagramService.replyToComment).toHaveBeenCalledWith('test-comment', 'test reply')
  })
})
