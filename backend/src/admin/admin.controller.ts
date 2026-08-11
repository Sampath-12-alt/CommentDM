import { Controller, Get, Put, Body, Param, Post } from '@nestjs/common'
import { AdminService } from './admin.service'
import { ReelConfigUpdate, TestMessageRequest } from './admin.types'

@Controller('api')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('reels')
  async fetchReels() {
    return this.adminService.fetchReels()
  }

  @Get('reels/:media_id')
  async getReel(@Param('media_id') mediaId: string) {
    return this.adminService.getReel(mediaId)
  }

  @Put('reels/:media_id')
  async updateReel(@Param('media_id') mediaId: string, @Body() config: ReelConfigUpdate) {
    return this.adminService.updateReel(mediaId, config)
  }

  @Get('stats')
  async getStats() {
    return this.adminService.getStats()
  }

  @Post('test/send-dm')
  async sendTestDm(@Body() body: TestMessageRequest) {
    return this.adminService.sendTestDm(body)
  }

  @Post('test/reply-comment')
  async replyTestComment(@Body() body: TestMessageRequest) {
    return this.adminService.replyTestComment(body)
  }
}
