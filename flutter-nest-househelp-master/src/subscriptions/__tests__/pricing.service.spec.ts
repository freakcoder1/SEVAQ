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

  describe('calculateCleaningPrice', () => {
    it('should return 1999 for BHK type 1', () => {
      expect(service.calculateCleaningPrice(1)).toBe(1999);
    });

    it('should return 2999 for BHK type 2', () => {
      expect(service.calculateCleaningPrice(2)).toBe(2999);
    });

    it('should return 3999 for BHK type 3', () => {
      expect(service.calculateCleaningPrice(3)).toBe(3999);
    });

    it('should throw error for BHK type 0', () => {
      expect(() => service.calculateCleaningPrice(0)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
    });

    it('should throw error for BHK type 4', () => {
      expect(() => service.calculateCleaningPrice(4)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
    });

    it('should throw error for negative BHK type', () => {
      expect(() => service.calculateCleaningPrice(-1)).toThrow('Invalid BHK type. Must be 1, 2, or 3.');
    });
  });

  describe('calculateCookingPrice', () => {
    describe('BHK type 1', () => {
      it('should return correct prices for all meal plans', () => {
        expect(service.calculateCookingPrice(1, 'BF')).toBe(1299);
        expect(service.calculateCookingPrice(1, 'LUNCH')).toBe(1599);
        expect(service.calculateCookingPrice(1, 'DINNER')).toBe(1599);
        expect(service.calculateCookingPrice(1, 'BF_LUNCH')).toBe(2599);
        expect(service.calculateCookingPrice(1, 'LUNCH_DINNER')).toBe(2899);
        expect(service.calculateCookingPrice(1, 'FULL_DAY')).toBe(4499);
      });
    });

    describe('BHK type 2', () => {
      it('should return correct prices for all meal plans', () => {
        expect(service.calculateCookingPrice(2, 'BF')).toBe(1999);
        expect(service.calculateCookingPrice(2, 'LUNCH')).toBe(2499);
        expect(service.calculateCookingPrice(2, 'DINNER')).toBe(2499);
        expect(service.calculateCookingPrice(2, 'BF_LUNCH')).toBe(3999);
        expect(service.calculateCookingPrice(2, 'LUNCH_DINNER')).toBe(4499);
        expect(service.calculateCookingPrice(2, 'FULL_DAY')).toBe(6999);
      });
    });

    describe('BHK type 3', () => {
      it('should return correct prices for all meal plans', () => {
        expect(service.calculateCookingPrice(3, 'BF')).toBe(2599);
        expect(service.calculateCookingPrice(3, 'LUNCH')).toBe(3299);
        expect(service.calculateCookingPrice(3, 'DINNER')).toBe(3299);
        expect(service.calculateCookingPrice(3, 'BF_LUNCH')).toBe(5299);
        expect(service.calculateCookingPrice(3, 'LUNCH_DINNER')).toBe(5999);
        expect(service.calculateCookingPrice(3, 'FULL_DAY')).toBe(9299);
      });
    });

    describe('BHK type 4', () => {
      it('should return correct prices for all meal plans', () => {
        expect(service.calculateCookingPrice(4, 'BF')).toBe(3199);
        expect(service.calculateCookingPrice(4, 'LUNCH')).toBe(3999);
        expect(service.calculateCookingPrice(4, 'DINNER')).toBe(3999);
        expect(service.calculateCookingPrice(4, 'BF_LUNCH')).toBe(6499);
        expect(service.calculateCookingPrice(4, 'LUNCH_DINNER')).toBe(7299);
        expect(service.calculateCookingPrice(4, 'FULL_DAY')).toBe(11499);
      });
    });

    describe('BHK type 5', () => {
      it('should return correct prices for all meal plans', () => {
        expect(service.calculateCookingPrice(5, 'BF')).toBe(3699);
        expect(service.calculateCookingPrice(5, 'LUNCH')).toBe(4699);
        expect(service.calculateCookingPrice(5, 'DINNER')).toBe(4699);
        expect(service.calculateCookingPrice(5, 'BF_LUNCH')).toBe(7499);
        expect(service.calculateCookingPrice(5, 'LUNCH_DINNER')).toBe(8499);
        expect(service.calculateCookingPrice(5, 'FULL_DAY')).toBe(13499);
      });
    });

    describe('BHK type 6', () => {
      it('should return correct prices for all meal plans', () => {
        expect(service.calculateCookingPrice(6, 'BF')).toBe(4199);
        expect(service.calculateCookingPrice(6, 'LUNCH')).toBe(5299);
        expect(service.calculateCookingPrice(6, 'DINNER')).toBe(5299);
        expect(service.calculateCookingPrice(6, 'BF_LUNCH')).toBe(8499);
        expect(service.calculateCookingPrice(6, 'LUNCH_DINNER')).toBe(9599);
        expect(service.calculateCookingPrice(6, 'FULL_DAY')).toBe(15299);
      });
    });

    describe('edge cases', () => {
      it('should throw error for person count 0', () => {
        expect(() => service.calculateCookingPrice(0, 'BF')).toThrow('Invalid person count. Must be an integer between 1 and 6.');
      });

      it('should throw error for person count 7', () => {
        expect(() => service.calculateCookingPrice(7, 'BF')).toThrow('Invalid person count. Must be an integer between 1 and 6.');
      });

      it('should throw error for negative person count', () => {
        expect(() => service.calculateCookingPrice(-1, 'BF')).toThrow('Invalid person count. Must be an integer between 1 and 6.');
      });

      it('should throw error for non-integer person count', () => {
        expect(() => service.calculateCookingPrice(1.5, 'BF')).toThrow('Invalid person count. Must be an integer between 1 and 6.');
      });

      it('should throw error for invalid meal plan', () => {
        expect(() => service.calculateCookingPrice(1, 'INVALID')).toThrow('Invalid meal plan. Must be one of: BF, LUNCH, DINNER, BF_LUNCH, LUNCH_DINNER, FULL_DAY.');
      });
    });
  });
});