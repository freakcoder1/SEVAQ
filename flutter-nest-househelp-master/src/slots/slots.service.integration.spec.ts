import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlotsService } from './slots.service';
import { Slot } from './entities/slot.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Service } from '../services/entities/service.entity';

describe('SlotsService Integration Tests', () => {
  let service: SlotsService;
  let slotRepository: Repository<Slot>;
  let workerRepository: Repository<Worker>;

  // Test data for integration scenarios
  const createTestWorker = (
    id: string,
    name: string,
    lat: number,
    lng: number,
  ): Worker => ({
    id,
    user: null,
    name,
    phone: '1234567890',
    email: `${name.toLowerCase()}@example.com`,
    rating: 4.5,
    reviewCount: 10,
    yearsOfExperience: 5,
    isActive: true,
    isAvailable: true,
    latitude: lat,
    longitude: lng,
    currentLat: lat,
    currentLng: lng,
    services: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const createTestSlot = (
    id: string,
    workerId: string,
    date: string,
    startTime: string,
    endTime: string,
    isBooked = false,
  ): Slot => ({
    id,
    worker: createTestWorker(workerId, `Worker ${workerId}`, 28.6139, 77.209),
    startTime: new Date(`${date}T${startTime}:00.000Z`),
    endTime: new Date(`${date}T${endTime}:00.000Z`),
    isBooked,
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SlotsService,
        {
          provide: getRepositoryToken(Slot),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
            count: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Worker),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<SlotsService>(SlotsService);
    slotRepository = module.get<Repository<Slot>>(getRepositoryToken(Slot));
    workerRepository = module.get<Repository<Worker>>(
      getRepositoryToken(Worker),
    );
  });

  describe('Integration: Flexible Slot Matching with Assignment Flow', () => {
    it('should handle complete assignment flow with flexible slot matching', async () => {
      // Setup: Create test data
      const workerId = 'worker-assignment-test';
      const requestedDate = '2024-01-15';
      const requestedStart = '10:00:00';
      const requestedEnd = '14:00:00';

      const userLocation = { lat: 28.6139, lng: 77.209 };
      const workerLocation = { lat: 28.6139, lng: 77.209 };

      // Scenario 1: No exact match, but flexible match available
      const flexibleSlot = createTestSlot(
        'slot-flexible',
        workerId,
        requestedDate,
        '09:45:00', // 15 minutes earlier
        '13:45:00', // 15 minutes earlier
      );

      // Mock the exact match to return null (no exact match)
      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(null);

      // Mock flexible search to return the flexible slot
      jest
        .spyOn(slotRepository, 'find')
        .mockResolvedValueOnce([flexibleSlot]) // Flexible window search
        .mockResolvedValueOnce([]); // Same-day search (not needed)

      // Execute: Find flexible slot
      const result = await service.findAvailableSlotFlexible(
        workerId,
        new Date(`${requestedDate}T${requestedStart}:00.000Z`),
        new Date(`${requestedDate}T${requestedEnd}:00.000Z`),
      );

      // Verify: Flexible slot should be found
      expect(result).toEqual(flexibleSlot);
      expect(result.startTime).toEqual(flexibleSlot.startTime);
      expect(result.endTime).toEqual(flexibleSlot.endTime);
    });

    it('should handle slot booking and unbooking workflow', async () => {
      const slotId = 'slot-booking-test';
      const workerId = 'worker-booking-test';
      const slot = createTestSlot(
        slotId,
        workerId,
        '2024-01-15',
        '08:00:00',
        '12:00:00',
        false,
      );

      // Mock slot retrieval
      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(slot);
      jest.spyOn(slotRepository, 'update').mockResolvedValue(undefined);

      // Test booking
      const bookResult = await service.bookSlot(slotId);
      expect(bookResult).toBe(true);

      // Verify booking update was called
      expect(slotRepository.update).toHaveBeenCalledWith(slotId, {
        isBooked: true,
      });

      // Test unbooking
      const unbookResult = await service.unbookSlot(slotId);
      expect(unbookResult).toBe(true);

      // Verify unbooking update was called
      expect(slotRepository.update).toHaveBeenCalledWith(slotId, {
        isBooked: false,
      });
    });

    it('should handle slot creation with validation', async () => {
      const workerId = 'worker-creation-test';
      const date = new Date('2024-01-15');
      const timeSlots = [
        {
          startTime: new Date('2024-01-15T08:00:00.000Z'),
          endTime: new Date('2024-01-15T12:00:00.000Z'),
        },
        {
          startTime: new Date('2024-01-15T12:00:00.000Z'),
          endTime: new Date('2024-01-15T16:00:00.000Z'),
        },
      ];

      const mockWorker = createTestWorker(
        workerId,
        'Test Worker',
        28.6139,
        77.209,
      );
      const createdSlots = timeSlots.map((slot, index) =>
        createTestSlot(
          `slot-${index + 1}`,
          workerId,
          '2024-01-15',
          slot.startTime.toISOString().split('T')[1].split('.')[0],
          slot.endTime.toISOString().split('T')[1].split('.')[0],
          false,
        ),
      );

      // Mock worker validation
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);

      // Mock existing slots check (none exist)
      jest.spyOn(slotRepository, 'find').mockResolvedValue([]);

      // Mock slot creation
      jest.spyOn(slotRepository, 'save').mockResolvedValue(createdSlots);

      // Execute: Create slots
      const result = await service.createSlotsForWorker(
        workerId,
        date,
        timeSlots,
      );

      // Verify: Slots should be created
      expect(result).toEqual(createdSlots);
      expect(slotRepository.save).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            worker: mockWorker,
            startTime: timeSlots[0].startTime,
            endTime: timeSlots[0].endTime,
            isBooked: false,
          }),
          expect.objectContaining({
            worker: mockWorker,
            startTime: timeSlots[1].startTime,
            endTime: timeSlots[1].endTime,
            isBooked: false,
          }),
        ]),
      );
    });

    it('should handle error scenarios gracefully', async () => {
      const workerId = 'worker-error-test';
      const slotId = 'slot-error-test';

      // Test: Worker not found
      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(null);

      await expect(
        service.createSlotsForWorker(workerId, new Date(), []),
      ).rejects.toThrow('Worker with ID worker-error-test not found');

      // Test: Slot not found for booking
      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(null);

      const bookResult = await service.bookSlot(slotId);
      expect(bookResult).toBe(false);

      // Test: Slot already booked
      const bookedSlot = createTestSlot(
        slotId,
        workerId,
        '2024-01-15',
        '08:00:00',
        '12:00:00',
        true,
      );
      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(bookedSlot);

      const bookResult2 = await service.bookSlot(slotId);
      expect(bookResult2).toBe(false);
    });
  });

  describe('Integration: Slot Statistics and Analytics', () => {
    it('should calculate worker slot statistics correctly', async () => {
      const workerId = 'worker-stats-test';
      const totalSlots = 20;
      const availableSlots = 15;

      // Mock count queries
      jest
        .spyOn(slotRepository, 'count')
        .mockResolvedValueOnce(totalSlots) // Total slots
        .mockResolvedValueOnce(availableSlots); // Available slots

      const stats = await service.getWorkerSlotStats(workerId);

      expect(stats).toEqual({
        totalSlots,
        availableSlots,
        bookedSlots: totalSlots - availableSlots,
        bookingRate: ((totalSlots - availableSlots) / totalSlots) * 100,
      });

      // Verify booking rate calculation
      expect(stats.bookingRate).toBe(25); // (5/20) * 100 = 25%
    });

    it('should handle edge cases in statistics calculation', async () => {
      const workerId = 'worker-edge-test';

      // Edge case: Zero slots
      jest
        .spyOn(slotRepository, 'count')
        .mockResolvedValueOnce(0) // Total slots
        .mockResolvedValueOnce(0); // Available slots

      const stats = await service.getWorkerSlotStats(workerId);

      expect(stats).toEqual({
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
        bookingRate: 0,
      });
    });
  });

  describe('Integration: Multi-Worker Slot Management', () => {
    it('should handle bulk slot creation for multiple workers', async () => {
      const workerSlots = [
        {
          workerId: 'worker-bulk-1',
          date: new Date('2024-01-15'),
          timeSlots: [
            {
              startTime: new Date('2024-01-15T08:00:00.000Z'),
              endTime: new Date('2024-01-15T12:00:00.000Z'),
            },
          ],
        },
        {
          workerId: 'worker-bulk-2',
          date: new Date('2024-01-15'),
          timeSlots: [
            {
              startTime: new Date('2024-01-15T12:00:00.000Z'),
              endTime: new Date('2024-01-15T16:00:00.000Z'),
            },
          ],
        },
      ];

      const mockWorkers = [
        createTestWorker('worker-bulk-1', 'Worker 1', 28.6139, 77.209),
        createTestWorker('worker-bulk-2', 'Worker 2', 28.6139, 77.209),
      ];

      // Mock worker validation
      jest
        .spyOn(workerRepository, 'findOne')
        .mockResolvedValueOnce(mockWorkers[0])
        .mockResolvedValueOnce(mockWorkers[1]);

      // Mock existing slots check (none exist)
      jest.spyOn(slotRepository, 'find').mockResolvedValue([]);

      // Mock slot creation
      jest.spyOn(slotRepository, 'save').mockResolvedValue([]);

      // Execute: Create slots for multiple workers
      await service.createSlotsForMultipleWorkers(workerSlots);

      // Verify: Save should be called twice (once per worker)
      expect(slotRepository.save).toHaveBeenCalledTimes(2);
    });
  });

  describe('Integration: Time Window Edge Cases', () => {
    it('should handle same-day slot fallback correctly', async () => {
      const workerId = 'worker-sameday-test';
      const requestedStart = new Date('2024-01-15T10:00:00.000Z');
      const requestedEnd = new Date('2024-01-15T14:00:00.000Z');

      // Create a same-day slot that's later in the day
      const sameDaySlot = createTestSlot(
        'slot-sameday',
        workerId,
        '2024-01-15',
        '16:00:00', // 4 PM
        '20:00:00', // 8 PM
      );

      // Mock exact match: null
      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(null);

      // Mock flexible search: no matches
      jest
        .spyOn(slotRepository, 'find')
        .mockResolvedValueOnce([]) // No flexible slots in 30-min window
        .mockResolvedValueOnce([sameDaySlot]); // Same-day slots available

      const result = await service.findAvailableSlotFlexible(
        workerId,
        requestedStart,
        requestedEnd,
      );

      expect(result).toEqual(sameDaySlot);
      expect(result.startTime).toEqual(sameDaySlot.startTime);
    });

    it('should handle no availability scenario', async () => {
      const workerId = 'worker-unavailable-test';
      const requestedStart = new Date('2024-01-15T10:00:00.000Z');
      const requestedEnd = new Date('2024-01-15T14:00:00.000Z');

      // Mock all searches returning empty results
      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(null);
      jest
        .spyOn(slotRepository, 'find')
        .mockResolvedValueOnce([]) // No flexible slots
        .mockResolvedValueOnce([]); // No same-day slots

      const result = await service.findAvailableSlotFlexible(
        workerId,
        requestedStart,
        requestedEnd,
      );

      expect(result).toBeNull();
    });
  });
});
