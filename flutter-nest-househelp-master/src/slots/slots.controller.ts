import { Controller, Get, Param, Query } from '@nestjs/common';
import { SlotsService } from './slots.service';
import { DailySlotGenerationScheduler } from './daily-slot-generation.scheduler';

@Controller('slots')
export class SlotsController {
  constructor(
    private readonly slotsService: SlotsService,
    private readonly slotGenerationScheduler: DailySlotGenerationScheduler,
  ) {}

  @Get()
  findAll() {
    return this.slotsService.findAll();
  }

  @Get('available')
  async findAvailable(@Query('date') date?: string) {
    if (date) {
      return this.slotsService.findAvailableByDate(new Date(date));
    }
    return this.slotsService.findAvailable();
  }

  @Get('admin/generate-slots/:daysAhead')
  async generateSlots(@Param('daysAhead') daysAhead: number) {
    const days = daysAhead ? parseInt(daysAhead.toString(), 10) : 7;
    await this.slotGenerationScheduler.triggerSlotGeneration(days);
    return { message: `Slot generation triggered for ${days} days` };
  }

  @Get(':id')
  findOne(@Param('id') id: number) {
    return this.slotsService.findOne(id);
  }
}
