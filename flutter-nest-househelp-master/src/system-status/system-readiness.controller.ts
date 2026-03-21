import { Controller, Get, UsePipes, ValidationPipe } from '@nestjs/common';
import { SystemReadinessService } from './system-readiness.service';
import { SystemReadinessDto } from './dto/system-readiness.dto';

@Controller('system/readiness')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class SystemReadinessController {
  constructor(
    private readonly systemReadinessService: SystemReadinessService,
  ) {}

  @Get()
  async getSystemReadiness(): Promise<SystemReadinessDto> {
    return this.systemReadinessService.checkSystemReadiness();
  }
}
