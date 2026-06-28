import { validate } from 'class-validator';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';

// Simple mocked Address entity for testing serialization
class MockAddress {
  constructor(data: {
    id: string;
    userId: string;
    societyName: string;
    flatNumber: string;
    towerNumber?: string;
    latitude?: number;
    longitude?: number;
    isDefault?: boolean;
  }) {
    Object.assign(this, data);
  }

  toJson() {
    return {
      id: this.id,
      userId: this.userId,
      societyName: this.societyName,
      towerNumber: this.towerNumber,
      flatNumber: this.flatNumber,
      latitude: this.latitude,
      longitude: this.longitude,
      isDefault: this.isDefault ?? false,
    };
  }
}

describe('Addresses DTO Validation', () => {
  describe('CreateAddressDto', () => {
    it('should pass validation with required fields', async () => {
      const dto = new CreateAddressDto();
      dto.societyName = 'Test Society';
      dto.flatNumber = 'A-101';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should fail validation without required fields', async () => {
      const dto = new CreateAddressDto();

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.find(e => e.property === 'societyName')).toBeDefined();
      expect(errors.find(e => e.property === 'flatNumber')).toBeDefined();
    });

    it('should pass validation with optional fields', async () => {
      const dto = new CreateAddressDto();
      dto.societyName = 'Test Society';
      dto.flatNumber = 'A-101';
      dto.towerNumber = 'Tower B';
      dto.latitude = 28.5355;
      dto.longitude = 77.391;

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('UpdateAddressDto', () => {
    it('should pass validation with optional fields only', async () => {
      const dto = new UpdateAddressDto();
      dto.flatNumber = 'B-202';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('should allow all optional fields', async () => {
      const dto = new UpdateAddressDto();
      dto.societyName = 'Updated Society';
      dto.towerNumber = 'Tower A';
      dto.flatNumber = 'A-101';
      dto.landmark = 'Near Park';
      dto.area = 'Sector 50';
      dto.city = 'Noida';
      dto.state = 'UP';
      dto.pincode = '201301';

      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('Address Model Serialization', () => {
    it('should serialize address for Flutter frontend', () => {
      const address = new MockAddress({
        id: '550e8400-e29b-41d4-a716-446655440000',
        userId: '550e8400-e29b-41d4-a716-446655440001',
        societyName: 'Test Society',
        flatNumber: 'A-101',
        latitude: 28.5355,
        longitude: 77.391,
        isDefault: true,
      });

      const json = address.toJson();

      expect(json.id).toBe('550e8400-e29b-41d4-a716-446655440000');
      expect(json.userId).toBe('550e8400-e29b-41d4-a716-446655440001');
      expect(json.societyName).toBe('Test Society');
      expect(json.flatNumber).toBe('A-101');
      expect(json.latitude).toBe(28.5355);
      expect(json.longitude).toBe(77.391);
      expect(json.isDefault).toBe(true);
    });

    it('should serialize address with null optional fields', () => {
      const address = new MockAddress({
        id: 'test-id',
        userId: 'user-id',
        societyName: 'Geo Test',
        flatNumber: 'G-1',
      });

      const json = address.toJson();

      expect(json.towerNumber).toBeUndefined();
      expect(json.latitude).toBeUndefined();
      expect(json.longitude).toBeUndefined();
    });
  });
});
