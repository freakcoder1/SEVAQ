import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CitiesService } from './cities.service';
import { City } from './entities/city.entity';
import { AdminGuard } from '../auth/admin.guard';

@Controller('cities')
export class CitiesController {
  constructor(private readonly citiesService: CitiesService) {}

  @Get()
  async findAll(): Promise<City[]> {
    return this.citiesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<City | null> {
    return this.citiesService.findOne(id);
  }

  @Get('slug/:slug')
  async findBySlug(@Param('slug') slug: string): Promise<City | null> {
    return this.citiesService.findBySlug(slug);
  }

  @Get('location/:lat/:lng')
  async getCityFromLocation(
    @Param('lat') lat: number,
    @Param('lng') lng: number,
  ): Promise<City | null> {
    return this.citiesService.getCityFromLocation(lat, lng);
  }

  @Get(':id/stats')
  async getCityStats(@Param('id') id: string): Promise<any> {
    return this.citiesService.getCityStats(id);
  }

  @UseGuards(AdminGuard)
  @Post()
  async create(@Body() cityData: Partial<City>): Promise<City> {
    return this.citiesService.create(cityData);
  }

  @UseGuards(AdminGuard)
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() cityData: Partial<City>,
  ): Promise<City | null> {
    return this.citiesService.update(id, cityData);
  }

  @UseGuards(AdminGuard)
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<void> {
    return this.citiesService.delete(id);
  }
}
