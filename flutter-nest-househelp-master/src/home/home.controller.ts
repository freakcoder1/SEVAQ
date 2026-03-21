import { Controller, Get, Query } from '@nestjs/common';
import { HomeService } from './home.service';
import { HomeScreenRequestDto } from './dto/home-screen.dto';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('screen')
  async getHomeScreenData(
    @Query('lat') lat: number,
    @Query('lng') lng: number,
    @Query('radius') radius?: number,
  ) {
    const requestDto: HomeScreenRequestDto = {
      lat,
      lng,
      radius,
    };

    return this.homeService.getHomeScreenData(requestDto);
  }
}
