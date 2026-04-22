import { Injectable } from '@nestjs/common';
import {
  CLEANING_PRICES,
  COOKING_FULL_DAY_PRICES,
  COOKING_MEAL_PRICES,
  VALID_MEAL_PLANS,
  MealPlan,
} from '../common/constants/pricing.constants';

@Injectable()
export class PricingService {
  /**
   * Calculate monthly cleaning subscription price based on apartment size
   * @param bhkType Apartment BHK type (1, 2, or 3)
   * @returns Monthly price in INR
   * @throws Error if BHK type is invalid
   */
  calculateCleaningPrice(bhkType: number): number {
    if (!CLEANING_PRICES.hasOwnProperty(bhkType)) {
      throw new Error('Invalid BHK type. Must be 1, 2, or 3.');
    }

    return CLEANING_PRICES[bhkType];
  }

  /**
   * Calculate monthly cooking subscription price
   * @param persons Number of persons (1 to 6 inclusive)
   * @param mealPlan Selected meal plan
   * @returns Monthly price in INR
   * @throws Error if persons or mealPlan are invalid
   */
  calculateCookingPrice(persons: number, mealPlan: string): number {
    // Validate persons count
    if (!Number.isInteger(persons) || persons < 1 || persons > 6) {
      throw new Error('Invalid number of persons. Must be an integer between 1 and 6.');
    }

    // Validate meal plan
    if (!VALID_MEAL_PLANS.includes(mealPlan as MealPlan)) {
      throw new Error(
        `Invalid meal plan. Must be one of: ${VALID_MEAL_PLANS.join(', ')}`
      );
    }

    // Handle full day plan
    if (mealPlan === 'FULL_DAY') {
      return COOKING_FULL_DAY_PRICES[persons];
    }

    // Handle individual meal plans
    return COOKING_MEAL_PRICES[persons][mealPlan];
  }
}
