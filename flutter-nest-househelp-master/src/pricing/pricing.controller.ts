import { Controller, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { PricingService } from '../subscriptions/pricing.service';

@Controller('pricing')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Get('cleaning/:bhkType')
  calculateCleaningPrice(@Param('bhkType') bhkType: string): { price: number } {
    const bhk = parseInt(bhkType, 10);
    try {
      const price = this.pricingService.calculateCleaningPrice(bhk);
      return { price };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }

  @Get('cooking/:persons/:mealPlan')
  calculateCookingPrice(
    @Param('persons') persons: string,
    @Param('mealPlan') mealPlan: string,
  ): { price: number } {
    const personCount = parseInt(persons, 10);
    try {
      const price = this.pricingService.calculateCookingPrice(personCount, mealPlan);
      return { price };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new HttpException(errorMessage, HttpStatus.BAD_REQUEST);
    }
  }
}