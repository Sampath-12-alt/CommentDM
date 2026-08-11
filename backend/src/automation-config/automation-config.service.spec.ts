import { Test, TestingModule } from '@nestjs/testing'
import { promises as fs } from 'fs'
import { join } from 'path'
import { AutomationConfigService } from './automation-config.service'
import { AppConfigService } from '../config/config.service'
import { ReelConfigStore } from './automation-config.types'

const tempDir = join(__dirname, '__temp__')
const configFilePath = join(tempDir, 'reels_config.json')

const defaultConfig: ReelConfigStore = {
  reels: {},
  default: {
    trigger_keyword: 'info',
    dm_message: 'Thanks for your interest! Check your DMs.',
    comment_reply: 'Sent you a DM!',
    active: true
  }
}

describe('AutomationConfigService', () => {
  let service: AutomationConfigService

  beforeEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AutomationConfigService,
        {
          provide: AppConfigService,
          useValue: {
            railwayVolumeMountPath: tempDir
          }
        }
      ]
    }).compile()

    service = module.get<AutomationConfigService>(AutomationConfigService)
  })

  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('should create default config file when missing', async () => {
    const config = await service.getAllConfigs()
    expect(config).toEqual(defaultConfig)

    const fileContents = await fs.readFile(configFilePath, 'utf-8')
    expect(JSON.parse(fileContents)).toEqual(defaultConfig)
  })

  it('should return all configs with reels and default', async () => {
    await service.getAllConfigs()
    const config = await service.getAllConfigs()
    expect(config).toHaveProperty('reels')
    expect(config).toHaveProperty('default')
    expect(config.default).toEqual(defaultConfig.default)
  })

  it('should return default config for unknown media id', async () => {
    await service.getAllConfigs()

    const config = await service.getReelConfig('unknown-media-id')
    expect(config).toEqual(defaultConfig.default)
  })

  it('should return reel-specific config when available', async () => {
    await service.getAllConfigs()
    const customConfig = {
      trigger_keyword: 'price',
      dm_message: 'Here is the pricing information.',
      comment_reply: 'Sent you the pricing details!',
      active: true
    }

    await service.updateReelConfig('123', customConfig)
    const config = await service.getReelConfig('123')
    expect(config).toEqual(customConfig)
  })

  it('should preserve other reels when updating one reel', async () => {
    await service.getAllConfigs()
    const config123 = {
      trigger_keyword: 'price',
      dm_message: 'Pricing info',
      comment_reply: 'Sent pricing!',
      active: true
    }
    const config456 = {
      trigger_keyword: 'info',
      dm_message: 'Info',
      comment_reply: 'Sent info!',
      active: false
    }

    await service.updateReelConfig('123', config123)
    await service.updateReelConfig('456', config456)

    const stored = await service.getAllConfigs()
    expect(stored.reels['123']).toEqual(config123)
    expect(stored.reels['456']).toEqual(config456)
  })

  it('should preserve default config when updating a reel', async () => {
    await service.getAllConfigs()
    const customConfig = {
      trigger_keyword: 'price',
      dm_message: 'Pricing info',
      comment_reply: 'Sent pricing!',
      active: true
    }

    await service.updateReelConfig('123', customConfig)
    const stored = await service.getAllConfigs()

    expect(stored.default).toEqual(defaultConfig.default)
  })

  it('should use railway volume mount path when configured', async () => {
    await service.getAllConfigs()
    const fileExists = await fs.stat(configFilePath)
    expect(fileExists.isFile()).toBe(true)
  })
})
