import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  UsePipes,
  ValidationPipe,
  Query,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { AdminCreateServiceDto } from './dto/admin-create-service.dto';
import { AdminUpdateServiceDto } from './dto/admin-update-service.dto';
import { AdminGuard } from '../auth/admin.guard';
import {
  PaginationDto,
  createPaginatedResponse,
} from '../common/dto/pagination.dto';

@Controller('services')
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createServiceDto: AdminCreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  async findAll(@Query() paginationDto: PaginationDto) {
    const page = paginationDto.page ?? 1;
    const limit = paginationDto.limit ?? 20;
    const { sortBy, sortOrder } = paginationDto;
    const skip = (page - 1) * limit;

    const [data, total] = await this.servicesService.findAllPaginated(
      skip,
      limit,
      sortBy,
      sortOrder,
    );

    return createPaginatedResponse(data, total, page, limit);
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
  update(
    @Param('id') id: string,
    @Body() updateServiceDto: AdminUpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
