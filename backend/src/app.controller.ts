import { Controller, Get } from '@nestjs/common'

@Controller()
export class AppController {
  @Get()
  getRoot() {
    return { status: 'ok', service: 'Instagram Comment-to-DM Automation' }
  }

  @Get('health')
  getHealth() {
    return { status: 'healthy' }
  }
}
