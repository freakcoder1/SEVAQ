import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AdminCreateUserDto } from './dto/admin-create-user.dto';
import { AdminUpdateUserDto } from './dto/admin-update-user.dto';
import { AdminGuard } from '../auth/admin.guard';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) { }

  @Post()
  @UseGuards(AdminGuard)
  create(@Body() createUserDto: AdminCreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @UseGuards(AdminGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @UseGuards(AdminGuard)
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  update(@Param('id') id: string, @Body() updateUserDto: AdminUpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
