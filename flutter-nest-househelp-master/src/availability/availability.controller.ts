import { Controller, Post, Body } from '@nestjs/common';
import {
  AvailabilityService,
  AvailabilityCheckRequest,
  AvailabilityCheckResult,
} from './availability.service';

@Controller('availability')
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post('check')
  async checkAvailability(
    @Body() request: AvailabilityCheckRequest,
  ): Promise<AvailabilityCheckResult> {
    return this.availabilityService.checkAvailability(request);
  }
}
