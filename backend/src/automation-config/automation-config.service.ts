import { Injectable } from '@nestjs/common'
import { promises as fs } from 'fs'
import { join } from 'path'
import { AppConfigService } from '../config/config.service'
import { ReelConfig, ReelConfigStore } from './automation-config.types'

const DEFAULT_CONFIG: ReelConfigStore = {
  reels: {},
  default: {
    trigger_keyword: 'info',
    dm_message: 'Thanks for your interest! Check your DMs.',
    comment_reply: 'Sent you a DM!',
    active: true
  }
}

@Injectable()
export class AutomationConfigService {
  constructor(private readonly configService: AppConfigService) {}

  private get configFilePath(): string {
    const basePath = this.configService.railwayVolumeMountPath || '.'
    return join(basePath, 'reels_config.json')
  }

  async getAllConfigs(): Promise<ReelConfigStore> {
    try {
      const path = this.configFilePath
      const file = await fs.readFile(path, 'utf-8')
      return JSON.parse(file) as ReelConfigStore
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        await this.initializeConfigFile()
        return DEFAULT_CONFIG
      }
      throw error
    }
  }

  async getReelConfig(mediaId: string): Promise<ReelConfig> {
    const config = await this.getAllConfigs()
    return config.reels[mediaId] || config.default
  }

  async updateReelConfig(mediaId: string, newConfig: ReelConfig): Promise<ReelConfig> {
    const config = await this.getAllConfigs()
    config.reels[mediaId] = newConfig
    await this.saveConfig(config)
    return newConfig
  }

  private async initializeConfigFile(): Promise<void> {
    const path = this.configFilePath
    await fs.mkdir(join(path, '..'), { recursive: true })
    await this.saveConfig(DEFAULT_CONFIG)
  }

  private async saveConfig(config: ReelConfigStore): Promise<void> {
    const path = this.configFilePath
    const content = JSON.stringify(config, null, 2)
    await fs.writeFile(path, content, 'utf-8')
  }
}
