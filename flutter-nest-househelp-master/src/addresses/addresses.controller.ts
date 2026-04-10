import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AddressesService } from './addresses.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from '../users/users.service';

interface AuthenticatedRequest {
  user: {
    publicId?: string;
    userId?: string;
    id?: number;
    email?: string;
  };
}

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressesController {
  constructor(
    private readonly addressesService: AddressesService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  async create(@Req() req: AuthenticatedRequest, @Body() createAddressDto: CreateAddressDto) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    
    return this.addressesService.create(publicId, createAddressDto);
  }

  @Get()
  async findAll(@Req() req: AuthenticatedRequest) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.addressesService.findAllByUser(publicId);
  }

  @Get('default')
  async findDefault(@Req() req: AuthenticatedRequest) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.addressesService.findDefault(publicId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.addressesService.findOne(id, publicId);
  }

  @Patch(':id')
  async update(@Req() req: AuthenticatedRequest, @Param('id') id: string, @Body() updateAddressDto: UpdateAddressDto) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.addressesService.update(id, publicId, updateAddressDto);
  }

  @Patch(':id/set-default')
  async setAsDefault(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.addressesService.setAsDefault(id, publicId);
  }

  @Delete(':id')
  async remove(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    const publicId = req.user.publicId || req.user.userId;
    if (!publicId) {
      throw new BadRequestException('User ID not found in request');
    }
    return this.addressesService.remove(id, publicId);
  }
}
