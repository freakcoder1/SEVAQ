# Pricing Module Implementation Plan

## Goal
Implement `calculateCleaningPrice` and `calculateCookingPrice` functions with configurable lookup tables.

## Implementation Structure

### 1. Create Pricing Constants (`src/subscriptions/constants/pricing.constants.ts`)

```typescript
// Cleaning pricing by BHK
export const CLEANING_PRICES: Record<number, number> = {
  1: 1999,
  2: 2999,
  3: 3999,
};

// Cooking pricing by persons and meal plan
export const COOKING_PRICES: Record<number, Record<string, number>> = {
  1: { BF: 1299, LUNCH: 1599, DINNER: 1599, BF_LUNCH: 2599, LUNCH_DINNER: 2899, FULL_DAY: 4499 },
  2: { BF: 1999, LUNCH: 2499, DINNER: 2499, BF_LUNCH: 3999, LUNCH_DINNER: 4499, FULL_DAY: 6999 },
  3: { BF: 2599, LUNCH: 3299, DINNER: 3299, BF_LUNCH: 5299, LUNCH_DINNER: 5999, FULL_DAY: 9299 },
  4: { BF: 3199, LUNCH: 3999, DINNER: 3999, BF_LUNCH: 6499, LUNCH_DINNER: 7299, FULL_DAY: 11499 },
  5: { BF: 3699, LUNCH: 4699, DINNER: 4699, BF_LUNCH: 7499, LUNCH_DINNER: 8499, FULL_DAY: 13499 },
  6: { BF: 4199, LUNCH: 5299, DINNER: 5299, BF_LUNCH: 8499, LUNCH_DINNER: 9599, FULL_DAY: 15299 },
};
```

### 2. Create Pricing Service (`src/subscriptions/pricing.service.ts`)

```typescript
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
      throw new Error('Invalid person count. Must be an integer between 1 and 6.');
    }
    if (!COOKING_PRICES[persons] || !COOKING_PRICES[persons][mealPlan]) {
      throw new Error('Invalid meal plan. Must be one of: BF, LUNCH, DINNER, BF_LUNCH, LUNCH_DINNER, FULL_DAY.');
    }
    return COOKING_PRICES[persons][mealPlan];
  }
}
```

### 3. Create Unit Tests (`src/subscriptions/__tests__/pricing.service.spec.ts`)

Cover all valid combinations and edge cases.

### 4. Register in Module

Add `PricingService` to `SubscriptionsModule` providers and exports.

## Integration Points

- `SubscriptionsService` already uses `monthlyPriceSnapshot` from `ServiceProfile`
- Pricing service can be used for validation and frontend-facing API endpoints
- Aligns with existing `ServiceProfile.monthlyPrice` values

## Validation

All prices will be verified against the specification table before implementation.