import { Test, TestingModule } from '@nestjs/testing';
import { PricingService } from '../pricing.service';

describe('PricingService', () => {
  let service: PricingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PricingService],
    }).compile();

    service = module.get<PricingService>(PricingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateCleaningPrice', () => {
    it('should return correct price for 1 BHK', () => {
      expect(service.calculateCleaningPrice(1)).toBe(1999);
    });

    it('should return correct price for 2 BHK', () => {
      expect(service.calculateCleaningPrice(2)).toBe(2999);
    });

    it('should return correct price for 3 BHK', () => {
      expect(service.calculateCleaningPrice(3)).toBe(3999);
    });

    it('should throw error for invalid BHK types', () => {
      expect(() => service.calculateCleaningPrice(0)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
      expect(() => service.calculateCleaningPrice(4)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
      expect(() => service.calculateCleaningPrice(2.5)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
      expect(() => service.calculateCleaningPrice(-1)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
    });
  });

  describe('calculateCookingPrice', () => {
    describe('Full Day Plan', () => {
      it('should return correct full day prices for all person counts', () => {
        expect(service.calculateCookingPrice(1, 'FULL_DAY')).toBe(4499);
        expect(service.calculateCookingPrice(2, 'FULL_DAY')).toBe(6999);
        expect(service.calculateCookingPrice(3, 'FULL_DAY')).toBe(9299);
        expect(service.calculateCookingPrice(4, 'FULL_DAY')).toBe(11499);
        expect(service.calculateCookingPrice(5, 'FULL_DAY')).toBe(13499);
        expect(service.calculateCookingPrice(6, 'FULL_DAY')).toBe(15299);
      });
    });

    describe('Meal Combos - 1 Person', () => {
      it('should return correct prices for 1 person', () => {
        expect(service.calculateCookingPrice(1, 'BF')).toBe(1299);
        expect(service.calculateCookingPrice(1, 'LUNCH')).toBe(1599);
        expect(service.calculateCookingPrice(1, 'DINNER')).toBe(1599);
        expect(service.calculateCookingPrice(1, 'BF_LUNCH')).toBe(2599);
        expect(service.calculateCookingPrice(1, 'LUNCH_DINNER')).toBe(2899);
      });
    });

    describe('Meal Combos - 2 Persons', () => {
      it('should return correct prices for 2 persons', () => {
        expect(service.calculateCookingPrice(2, 'BF')).toBe(1999);
        expect(service.calculateCookingPrice(2, 'LUNCH')).toBe(2499);
        expect(service.calculateCookingPrice(2, 'DINNER')).toBe(2499);
        expect(service.calculateCookingPrice(2, 'BF_LUNCH')).toBe(3999);
        expect(service.calculateCookingPrice(2, 'LUNCH_DINNER')).toBe(4499);
      });
    });

    describe('Meal Combos - 3 Persons', () => {
      it('should return correct prices for 3 persons', () => {
        expect(service.calculateCookingPrice(3, 'BF')).toBe(2599);
        expect(service.calculateCookingPrice(3, 'LUNCH')).toBe(3299);
        expect(service.calculateCookingPrice(3, 'DINNER')).toBe(3299);
        expect(service.calculateCookingPrice(3, 'BF_LUNCH')).toBe(5299);
        expect(service.calculateCookingPrice(3, 'LUNCH_DINNER')).toBe(5999);
      });
    });

    describe('Meal Combos - 4 Persons', () => {
      it('should return correct prices for 4 persons', () => {
        expect(service.calculateCookingPrice(4, 'BF')).toBe(3199);
        expect(service.calculateCookingPrice(4, 'LUNCH')).toBe(3999);
        expect(service.calculateCookingPrice(4, 'DINNER')).toBe(3999);
        expect(service.calculateCookingPrice(4, 'BF_LUNCH')).toBe(6499);
        expect(service.calculateCookingPrice(4, 'LUNCH_DINNER')).toBe(7299);
      });
    });

    describe('Meal Combos - 5 Persons', () => {
      it('should return correct prices for 5 persons', () => {
        expect(service.calculateCookingPrice(5, 'BF')).toBe(3699);
        expect(service.calculateCookingPrice(5, 'LUNCH')).toBe(4699);
        expect(service.calculateCookingPrice(5, 'DINNER')).toBe(4699);
        expect(service.calculateCookingPrice(5, 'BF_LUNCH')).toBe(7499);
        expect(service.calculateCookingPrice(5, 'LUNCH_DINNER')).toBe(8499);
      });
    });

    describe('Meal Combos - 6 Persons', () => {
      it('should return correct prices for 6 persons', () => {
        expect(service.calculateCookingPrice(6, 'BF')).toBe(4199);
        expect(service.calculateCookingPrice(6, 'LUNCH')).toBe(5299);
        expect(service.calculateCookingPrice(6, 'DINNER')).toBe(5299);
        expect(service.calculateCookingPrice(6, 'BF_LUNCH')).toBe(8499);
        expect(service.calculateCookingPrice(6, 'LUNCH_DINNER')).toBe(9599);
      });
    });

    describe('Validation', () => {
      it('should throw error for invalid person count', () => {
        expect(() => service.calculateCookingPrice(0, 'FULL_DAY')).toThrow('Invalid number of persons. Must be an integer between 1 and 6.');
        expect(() => service.calculateCookingPrice(7, 'FULL_DAY')).toThrow('Invalid number of persons. Must be an integer between 1 and 6.');
        expect(() => service.calculateCookingPrice(2.5, 'FULL_DAY')).toThrow('Invalid number of persons. Must be an integer between 1 and 6.');
        expect(() => service.calculateCookingPrice(-1, 'FULL_DAY')).toThrow('Invalid number of persons. Must be an integer between 1 and 6.');
      });

      it('should throw error for invalid meal plan', () => {
        const expectedMessage = 'Invalid meal plan. Must be one of: BF, LUNCH, DINNER, BF_LUNCH, LUNCH_DINNER, FULL_DAY';
        expect(() => service.calculateCookingPrice(2, 'INVALID')).toThrow(expectedMessage);
        expect(() => service.calculateCookingPrice(3, 'breakfast')).toThrow(expectedMessage);
        expect(() => service.calculateCookingPrice(4, '')).toThrow(expectedMessage);
        expect(() => service.calculateCookingPrice(5, null as any)).toThrow(expectedMessage);
      });
    });
  });
});
