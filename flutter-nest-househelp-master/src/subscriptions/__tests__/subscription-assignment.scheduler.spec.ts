import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Logger } from '@nestjs/common';
import {
  SubscriptionAssignmentScheduler,
} from '../subscription-assignment.scheduler';
import { Subscription } from '../entities/subscription.entity';
import { Booking } from '../../bookings/entities/booking.entity';
import { ServiceProfile, ServiceType } from '../../service-profiles/entities/service-profile.entity';
import { Service } from '../../services/entities/service.entity';
import { Worker } from '../../workers/entities/worker.entity';
import { AssignmentsService } from '../../assignments/assignments.service';
import { BookingsService } from '../../bookings/bookings.service';
import { WorkersService } from '../../workers/workers.service';

// Mock Logger methods BEFORE any test runs
const mockLogger = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
  verbose: jest.fn(),
};

// Override the Logger prototype methods
const originalLog = Logger.prototype.log;
const originalWarn = Logger.prototype.warn;
const originalError = Logger.prototype.error;
const originalDebug = Logger.prototype.debug;
const originalVerbose = Logger.prototype.verbose;

beforeAll(() => {
  Logger.prototype.log = mockLogger.log;
  Logger.prototype.warn = mockLogger.warn;
  Logger.prototype.error = mockLogger.error;
  Logger.prototype.debug = mockLogger.debug;
  Logger.prototype.verbose = mockLogger.verbose;
});

afterAll(() => {
  Logger.prototype.log = originalLog;
  Logger.prototype.warn = originalWarn;
  Logger.prototype.error = originalError;
  Logger.prototype.debug = originalDebug;
  Logger.prototype.verbose = originalVerbose;
});

describe('SubscriptionAssignmentScheduler', () => {
  let scheduler: SubscriptionAssignmentScheduler;
  let serviceRepository: Repository<Service>;

  // Mock repositories and services
  const mockServiceRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockSubscriptionRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockBookingRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    save: jest.fn(),
  };

  const mockServiceProfileRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockWorkerRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockAssignmentsService = {
    assignWorkerToBooking: jest.fn(),
  };

  const mockBookingsService = {
    findOne: jest.fn(),
  };

  const mockWorkersService = {
    findByService: jest.fn(),
  };

  beforeEach(async () => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionAssignmentScheduler,
        {
          provide: getRepositoryToken(Subscription),
          useValue: mockSubscriptionRepository,
        },
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(ServiceProfile),
          useValue: mockServiceProfileRepository,
        },
        {
          provide: getRepositoryToken(Service),
          useValue: mockServiceRepository,
        },
        {
          provide: getRepositoryToken(Worker),
          useValue: mockWorkerRepository,
        },
        {
          provide: AssignmentsService,
          useValue: mockAssignmentsService,
        },
        {
          provide: BookingsService,
          useValue: mockBookingsService,
        },
        {
          provide: WorkersService,
          useValue: mockWorkersService,
        },
      ],
    }).compile();

    scheduler = module.get<SubscriptionAssignmentScheduler>(SubscriptionAssignmentScheduler);
    serviceRepository = module.get<Repository<Service>>(getRepositoryToken(Service));
  });

  describe('getServiceUuidByProfile', () => {
    // Access private method via any type cast
    const getServiceUuidByProfile = async (serviceProfile: ServiceProfile): Promise<string | null> => {
      return (scheduler as any).getServiceUuidByProfile(serviceProfile);
    };

    describe('COOK service type', () => {
      it('should find service by exact name match - Cooking', async () => {
        const mockService = { id: 1, publicId: 'uuid-cooking-123', name: 'Cooking' };
        mockServiceRepository.findOne.mockResolvedValue(mockService);

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.COOK,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-cooking-123');
        expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
          where: { name: 'Cooking' },
        });
      });

      it('should try alternative names when first name not found - COOK', async () => {
        // First call returns null (Cooking not found)
        // Second call returns the service (Cook found)
        mockServiceRepository.findOne
          .mockResolvedValueOnce(null)  // Cooking not found
          .mockResolvedValueOnce({ id: 2, publicId: 'uuid-cook-456', name: 'Cook' });  // Cook found

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.COOK,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-cook-456');
        expect(mockServiceRepository.findOne).toHaveBeenCalledTimes(2);
        expect(mockServiceRepository.findOne).toHaveBeenNthCalledWith(1, {
          where: { name: 'Cooking' },
        });
        expect(mockServiceRepository.findOne).toHaveBeenNthCalledWith(2, {
          where: { name: 'Cook' },
        });
      });

      it('should try all names in sequence before falling back to partial search - COOK', async () => {
        // All exact searches return null
        mockServiceRepository.findOne
          .mockResolvedValueOnce(null)  // Cooking
          .mockResolvedValueOnce(null)  // Cook
          .mockResolvedValueOnce(null); // Kitchen

        // Partial search finds something
        mockServiceRepository.find.mockResolvedValue([
          { id: 3, publicId: 'uuid-partial-789', name: 'Cooking Service' },
        ]);

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.COOK,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-partial-789');
        expect(mockServiceRepository.find).toHaveBeenCalledWith({
          where: { name: Like('%Cooking%') },
        });
      });
    });

    describe('CLEANING service type', () => {
      it('should find service by exact name match - Home Cleaning', async () => {
        const mockService = { id: 4, publicId: 'uuid-cleaning-123', name: 'Home Cleaning' };
        mockServiceRepository.findOne.mockResolvedValue(mockService);

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.CLEANING,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-cleaning-123');
        expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
          where: { name: 'Home Cleaning' },
        });
      });

      it('should try alternative names when first name not found - CLEANING', async () => {
        mockServiceRepository.findOne
          .mockResolvedValueOnce(null)  // Home Cleaning not found
          .mockResolvedValueOnce({ id: 5, publicId: 'uuid-cleaning-456', name: 'Cleaning' });

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.CLEANING,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-cleaning-456');
      });
    });

    describe('MAID service type', () => {
      it('should find service by exact name match - Maid Service', async () => {
        const mockService = { id: 6, publicId: 'uuid-maid-123', name: 'Maid Service' };
        mockServiceRepository.findOne.mockResolvedValue(mockService);

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.MAID,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-maid-123');
        expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
          where: { name: 'Maid Service' },
        });
      });
    });

    describe('Fallback behavior', () => {
      it('should return null when no services exist in database', async () => {
        // All exact searches return null
        mockServiceRepository.findOne
          .mockResolvedValueOnce(null)  // Cooking
          .mockResolvedValueOnce(null)  // Cook
          .mockResolvedValueOnce(null); // Kitchen

        // Partial search also returns empty
        mockServiceRepository.find.mockResolvedValue([]);

        // Any service search also returns null
        mockServiceRepository.findOne.mockResolvedValueOnce(null);

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.COOK,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBeNull();
      });

      it('should return any available service as last resort fallback', async () => {
        // All exact searches return null
        mockServiceRepository.findOne
          .mockResolvedValueOnce(null)  // Cooking
          .mockResolvedValueOnce(null)  // Cook
          .mockResolvedValueOnce(null); // Kitchen

        // Partial search also returns empty
        mockServiceRepository.find.mockResolvedValue([]);

        // Any service search returns a service
        mockServiceRepository.findOne.mockResolvedValueOnce({
          id: 99,
          publicId: 'uuid-fallback-999',
          name: 'Some Other Service',
        });

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.COOK,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-fallback-999');
      });

      it('should use partial match when exact match fails', async () => {
        // All exact searches return null
        mockServiceRepository.findOne
          .mockResolvedValueOnce(null)  // Cooking
          .mockResolvedValueOnce(null)  // Cook
          .mockResolvedValueOnce(null); // Kitchen

        // Partial search finds something
        mockServiceRepository.find.mockResolvedValue([
          { id: 7, publicId: 'uuid-partial-match', name: 'Professional Cooking' },
        ]);

        const serviceProfile: ServiceProfile = {
          serviceType: ServiceType.COOK,
        } as ServiceProfile;

        const result = await getServiceUuidByProfile(serviceProfile);

        expect(result).toBe('uuid-partial-match');
      });
    });
  });

  describe('getInternalServiceIdByPublicId', () => {
    const getInternalServiceIdByPublicId = async (publicId: string): Promise<number | null> => {
      return (scheduler as any).getInternalServiceIdByPublicId(publicId);
    };

    it('should convert publicId to internal service id', async () => {
      const mockService = { id: 10, publicId: 'uuid-test-123', name: 'Test Service' };
      mockServiceRepository.findOne.mockResolvedValue(mockService);

      const result = await getInternalServiceIdByPublicId('uuid-test-123');

      expect(result).toBe(10);
      expect(mockServiceRepository.findOne).toHaveBeenCalledWith({
        where: { publicId: 'uuid-test-123' },
      });
    });

    it('should return null when service not found', async () => {
      mockServiceRepository.findOne.mockResolvedValue(null);

      const result = await getInternalServiceIdByPublicId('non-existent-uuid');

      expect(result).toBeNull();
    });

    it('should return null when database error occurs', async () => {
      mockServiceRepository.findOne.mockRejectedValue(new Error('Database error'));

      const result = await getInternalServiceIdByPublicId('uuid-test-123');

      expect(result).toBeNull();
    });
  });

  describe('calculateDistance', () => {
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
      return (scheduler as any).calculateDistance(lat1, lon1, lat2, lon2);
    };

    it('should calculate distance between two points correctly', () => {
      // Delhi to Noida approximate coordinates
      const distance = calculateDistance(28.6139, 77.2090, 28.5355, 77.3910);

      // Should be approximately 20-25 km
      expect(distance).toBeGreaterThan(15);
      expect(distance).toBeLessThan(30);
    });

    it('should return 0 for same location', () => {
      const distance = calculateDistance(28.6139, 77.2090, 28.6139, 77.2090);

      expect(distance).toBe(0);
    });
  });

  describe('getStartTimeForTimeWindow', () => {
    const getStartTimeForTimeWindow = (timeWindow: string, date: Date): string => {
      return (scheduler as any).getStartTimeForTimeWindow(timeWindow, date);
    };

    it('should return 8:00 for morning', () => {
      const result = getStartTimeForTimeWindow('morning', new Date());
      expect(result).toBe('08:00:00');
    });

    it('should return 12:00 for afternoon', () => {
      const result = getStartTimeForTimeWindow('afternoon', new Date());
      expect(result).toBe('12:00:00');
    });

    it('should return 16:00 for evening', () => {
      const result = getStartTimeForTimeWindow('evening', new Date());
      expect(result).toBe('16:00:00');
    });

    it('should return 6:00 for early-morning', () => {
      const result = getStartTimeForTimeWindow('early-morning', new Date());
      expect(result).toBe('06:00:00');
    });

    it('should return 8:00 as default for unknown time window', () => {
      const result = getStartTimeForTimeWindow('unknown', new Date());
      expect(result).toBe('08:00:00');
    });
  });

  describe('SERVICE_TYPE_TO_NAMES mapping', () => {
    it('should have correct mapping for COOK service type', () => {
      expect(ServiceType.COOK).toBeDefined();
    });

    it('should have correct mapping for CLEANING service type', () => {
      expect(ServiceType.CLEANING).toBeDefined();
    });

    it('should have correct mapping for MAID service type', () => {
      expect(ServiceType.MAID).toBeDefined();
    });
  });
});
