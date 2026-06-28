import { Injectable } from '@nestjs/common';
import { CLEANING_PRICES, COOKING_PRICES } from './constants/pricing.constants';

@Injectable()
export class PricingService {
  calculateCleaningPrice(bhkType: number): number {
    const price = CLEANING_PRICES[bhkType];
    if (price === undefined) {
      throw new Error('Invalid BHK type. Must be 1, 2, or 3.');
    }
    return price;
  }

  calculateCookingPrice(persons: number, mealPlan: string): number {
    if (!Number.isInteger(persons) || persons < 1 || persons > 6) {
      throw new Error(
        'Invalid person count. Must be an integer between 1 and 6.',
      );
    }
    if (!COOKING_PRICES[persons] || !COOKING_PRICES[persons][mealPlan]) {
      throw new Error(
        'Invalid meal plan. Must be one of: BF, LUNCH, DINNER, BF_LUNCH, LUNCH_DINNER, FULL_DAY.',
      );
    }
    return COOKING_PRICES[persons][mealPlan];
  }
}
