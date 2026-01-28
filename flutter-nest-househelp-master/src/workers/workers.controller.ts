import { Controller, Get, Param, Query, Post, Body } from '@nestjs/common';
import { WorkersService } from './workers.service';
import { CreateWorkerDto } from './dto/create-worker.dto';

@Controller('workers')
export class WorkersController {
    constructor(private readonly workersService: WorkersService) { }

    @Get()
    findAll(@Query('lat') lat?: number, @Query('long') long?: number, @Query('radius') radius?: number) {
        if (lat && long && radius) {
            return this.workersService.search(lat, long, radius);
        }
        return this.workersService.findAll();
    }

    @Post()
    create(@Body() createWorkerDto: CreateWorkerDto) {
        return this.workersService.create(
            createWorkerDto.userId,
            createWorkerDto.bio,
            createWorkerDto.serviceIds,
            createWorkerDto.latitude,
            createWorkerDto.longitude
        );
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.workersService.findOne(id);
    }

    @Get('service/:serviceId')
    async findByService(@Param('serviceId') serviceId: string) {
        return this.workersService.findByService(serviceId);
    }
}
