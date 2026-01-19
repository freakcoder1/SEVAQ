import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdminCreateServiceDto } from './dto/admin-create-service.dto';
import { AdminUpdateServiceDto } from './dto/admin-update-service.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('services')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) { }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createServiceDto: AdminCreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  findAll() {
    return this.servicesService.findAll();
  }

  @Get('categories/availability')
  async getCategoryAvailability() {
    return this.servicesService.getCategoryAvailability();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateServiceDto: AdminUpdateServiceDto) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
