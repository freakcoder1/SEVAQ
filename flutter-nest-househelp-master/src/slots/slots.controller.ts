import { Controller, Get, Param } from '@nestjs/common';
import { SlotsService } from './slots.service';

@Controller('slots')
export class SlotsController {
    constructor(private readonly slotsService: SlotsService) { }

    @Get()
    findAll() {
        return this.slotsService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.slotsService.findOne(id);
    }
}
