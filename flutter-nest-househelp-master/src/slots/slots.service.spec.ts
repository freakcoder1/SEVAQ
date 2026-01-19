import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SlotsService } from './slots.service';
import { Slot } from './entities/slot.entity';
import { Worker } from '../workers/entities/worker.entity';

describe('SlotsService', () => {
  let service: SlotsService;
  let slotRepository: Repository<Slot>;
  let workerRepository: Repository<Worker>;

  // Mock data
  const mockWorker: Worker = {
    id: 'worker-1',
    user: null,
    name: 'John Doe',
    phone: '1234567890',
    email: 'john@example.com',
    rating: 4.5,
    reviewCount: 10,
    yearsOfExperience: 5,
    isActive: true,
    isAvailable: true,
    latitude: 28.6139,
    longitude: 77.2090,
    currentLat: 28.6139,
    currentLng: 77.2090,
    services: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const createMockSlot = (id: string, workerId: string, startTime: Date, endTime: Date, isBooked = false): Slot => ({
    id,
    worker: { ...mockWorker, id: workerId },
    startTime,
    endTime,
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
    workerRepository = module.get<Repository<Worker>>(getRepositoryToken(Worker));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAvailableSlot', () => {
    it('should find an available slot with exact match', async () => {
      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T14:00:00.000Z');
      const availableSlot = createMockSlot('slot-1', 'worker-1', startTime, endTime, false);

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(availableSlot);

      const result = await service.findAvailableSlot('worker-1', startTime, endTime);

      expect(result).toEqual(availableSlot);
      expect(slotRepository.findOne).toHaveBeenCalledWith({
        where: {
          worker: { id: 'worker-1' },
          startTime,
          endTime,
          isBooked: false,
        },
      });
    });

    it('should return null when no available slot found', async () => {
      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T14:00:00.000Z');

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(null);

      const result = await service.findAvailableSlot('worker-1', startTime, endTime);

      expect(result).toBeNull();
    });
  });

  describe('findAvailableSlotFlexible', () => {
    it('should find exact match first', async () => {
      const startTime = new Date('2024-01-15T10:00:00.000Z');
      const endTime = new Date('2024-01-15T14:00:00.000Z');
      const exactMatch = createMockSlot('slot-1', 'worker-1', startTime, endTime, false);

      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(exactMatch);

      const result = await service.findAvailableSlotFlexible('worker-1', startTime, endTime);

      expect(result).toEqual(exactMatch);
      expect(service.findAvailableSlot).toHaveBeenCalledWith('worker-1', startTime, endTime);
    });

    it('should find flexible match within 30-minute window', async () => {
      const requestedStart = new Date('2024-01-15T10:00:00.000Z');
      const requestedEnd = new Date('2024-01-15T14:00:00.000Z');
      const flexibleStart = new Date('2024-01-15T09:45:00.000Z'); // 15 minutes earlier
      const flexibleEnd = new Date('2024-01-15T13:45:00.000Z'); // 15 minutes earlier
      const flexibleSlot = createMockSlot('slot-2', 'worker-1', flexibleStart, flexibleEnd, false);

      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(null);
      jest.spyOn(slotRepository, 'find').mockResolvedValue([flexibleSlot]);

      const result = await service.findAvailableSlotFlexible('worker-1', requestedStart, requestedEnd);

      expect(result).toEqual(flexibleSlot);
      expect(slotRepository.find).toHaveBeenCalledWith({
        where: {
          worker: { id: 'worker-1' },
          startTime: expect.objectContaining({
            start: expect.any(Date),
            end: expect.any(Date),
          }),
          isBooked: false,
        },
        order: {
          startTime: 'ASC'
        }
      });
    });

    it('should find same-day slot when no flexible match', async () => {
      const requestedStart = new Date('2024-01-15T10:00:00.000Z');
      const requestedEnd = new Date('2024-01-15T14:00:00.000Z');
      const sameDayStart = new Date('2024-01-15T16:00:00.000Z');
      const sameDayEnd = new Date('2024-01-15T20:00:00.000Z');
      const sameDaySlot = createMockSlot('slot-3', 'worker-1', sameDayStart, sameDayEnd, false);

      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(null);
      jest.spyOn(slotRepository, 'find')
        .mockResolvedValueOnce([]) // No flexible slots
        .mockResolvedValueOnce([sameDaySlot]); // Same-day slots

      const result = await service.findAvailableSlotFlexible('worker-1', requestedStart, requestedEnd);

      expect(result).toEqual(sameDaySlot);
    });

    it('should return null when no slots available', async () => {
      const requestedStart = new Date('2024-01-15T10:00:00.000Z');
      const requestedEnd = new Date('2024-01-15T14:00:00.000Z');

      jest.spyOn(service, 'findAvailableSlot').mockResolvedValue(null);
      jest.spyOn(slotRepository, 'find')
        .mockResolvedValueOnce([]) // No flexible slots
        .mockResolvedValueOnce([]); // No same-day slots

      const result = await service.findAvailableSlotFlexible('worker-1', requestedStart, requestedEnd);

      expect(result).toBeNull();
    });
  });

  describe('createSlotsForWorker', () => {
    it('should create slots successfully', async () => {
      const workerId = 'worker-1';
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
      const createdSlots = timeSlots.map((slot, index) =>
        createMockSlot(`slot-${index + 1}`, workerId, slot.startTime, slot.endTime, false)
      );

      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(slotRepository, 'find').mockResolvedValue([]);
      jest.spyOn(slotRepository, 'save').mockResolvedValue(createdSlots);

      const result = await service.createSlotsForWorker(workerId, date, timeSlots);

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
        ])
      );
    });

    it('should return existing slots if already created', async () => {
      const workerId = 'worker-1';
      const date = new Date('2024-01-15');
      const timeSlots = [
        {
          startTime: new Date('2024-01-15T08:00:00.000Z'),
          endTime: new Date('2024-01-15T12:00:00.000Z'),
        },
      ];
      const existingSlots = [createMockSlot('slot-1', workerId, timeSlots[0].startTime, timeSlots[0].endTime, false)];

      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(slotRepository, 'find').mockResolvedValue(existingSlots);

      const result = await service.createSlotsForWorker(workerId, date, timeSlots);

      expect(result).toEqual(existingSlots);
      expect(slotRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error if worker not found', async () => {
      const workerId = 'worker-999';
      const date = new Date('2024-01-15');
      const timeSlots = [
        {
          startTime: new Date('2024-01-15T08:00:00.000Z'),
          endTime: new Date('2024-01-15T12:00:00.000Z'),
        },
      ];

      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(null);

      await expect(service.createSlotsForWorker(workerId, date, timeSlots)).rejects.toThrow('Worker with ID worker-999 not found');
    });
  });

  describe('bookSlot', () => {
    it('should book slot successfully', async () => {
      const slotId = 'slot-1';
      const slot = createMockSlot(slotId, 'worker-1', new Date(), new Date(), false);

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(slot);
      jest.spyOn(slotRepository, 'update').mockResolvedValue(undefined);

      const result = await service.bookSlot(slotId);

      expect(result).toBe(true);
      expect(slotRepository.update).toHaveBeenCalledWith(slotId, { isBooked: true });
    });

    it('should return false if slot not found', async () => {
      const slotId = 'slot-999';

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(null);

      const result = await service.bookSlot(slotId);

      expect(result).toBe(false);
    });

    it('should return false if slot already booked', async () => {
      const slotId = 'slot-1';
      const slot = createMockSlot(slotId, 'worker-1', new Date(), new Date(), true);

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(slot);

      const result = await service.bookSlot(slotId);

      expect(result).toBe(false);
      expect(slotRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('unbookSlot', () => {
    it('should unbook slot successfully', async () => {
      const slotId = 'slot-1';
      const slot = createMockSlot(slotId, 'worker-1', new Date(), new Date(), true);

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(slot);
      jest.spyOn(slotRepository, 'update').mockResolvedValue(undefined);

      const result = await service.unbookSlot(slotId);

      expect(result).toBe(true);
      expect(slotRepository.update).toHaveBeenCalledWith(slotId, { isBooked: false });
    });

    it('should return false if slot not found', async () => {
      const slotId = 'slot-999';

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(null);

      const result = await service.unbookSlot(slotId);

      expect(result).toBe(false);
    });

    it('should return false if slot not booked', async () => {
      const slotId = 'slot-1';
      const slot = createMockSlot(slotId, 'worker-1', new Date(), new Date(), false);

      jest.spyOn(slotRepository, 'findOne').mockResolvedValue(slot);

      const result = await service.unbookSlot(slotId);

      expect(result).toBe(false);
      expect(slotRepository.update).not.toHaveBeenCalled();
    });
  });

  describe('getWorkerSlotStats', () => {
    it('should return correct slot statistics', async () => {
      const workerId = 'worker-1';
      const totalSlots = 10;
      const availableSlots = 7;

      jest.spyOn(slotRepository, 'count')
        .mockResolvedValueOnce(totalSlots) // Total slots
        .mockResolvedValueOnce(availableSlots); // Available slots

      const result = await service.getWorkerSlotStats(workerId);

      expect(result).toEqual({
        totalSlots,
        availableSlots,
        bookedSlots: totalSlots - availableSlots,
        bookingRate: ((totalSlots - availableSlots) / totalSlots) * 100,
      });
    });

    it('should handle zero slots correctly', async () => {
      const workerId = 'worker-1';

      jest.spyOn(slotRepository, 'count')
        .mockResolvedValueOnce(0) // Total slots
        .mockResolvedValueOnce(0); // Available slots

      const result = await service.getWorkerSlotStats(workerId);

      expect(result).toEqual({
        totalSlots: 0,
        availableSlots: 0,
        bookedSlots: 0,
        bookingRate: 0,
      });
    });
  });

  describe('getAvailableSlotsForWorker', () => {
    it('should return available slots within date range', async () => {
      const workerId = 'worker-1';
      const startDate = new Date('2024-01-15');
      const endDate = new Date('2024-01-16');
      const availableSlots = [
        createMockSlot('slot-1', workerId, new Date('2024-01-15T08:00:00.000Z'), new Date('2024-01-15T12:00:00.000Z'), false),
        createMockSlot('slot-2', workerId, new Date('2024-01-15T12:00:00.000Z'), new Date('2024-01-15T16:00:00.000Z'), false),
      ];

      jest.spyOn(slotRepository, 'find').mockResolvedValue(availableSlots);

      const result = await service.getAvailableSlotsForWorker(workerId, startDate, endDate);

      expect(result).toEqual(availableSlots);
      expect(slotRepository.find).toHaveBeenCalledWith({
        where: {
          worker: { id: workerId },
          startTime: expect.objectContaining({
            start: startDate,
            end: endDate,
          }),
          isBooked: false,
        },
        order: {
          startTime: 'ASC'
        }
      });
    });
  });

  describe('createSlotsForMultipleWorkers', () => {
    it('should create slots for multiple workers', async () => {
      const workerSlots = [
        {
          workerId: 'worker-1',
          date: new Date('2024-01-15'),
          timeSlots: [
            {
              startTime: new Date('2024-01-15T08:00:00.000Z'),
              endTime: new Date('2024-01-15T12:00:00.000Z'),
            },
          ],
        },
        {
          workerId: 'worker-2',
          date: new Date('2024-01-15'),
          timeSlots: [
            {
              startTime: new Date('2024-01-15T12:00:00.000Z'),
              endTime: new Date('2024-01-15T16:00:00.000Z'),
            },
          ],
        },
      ];

      jest.spyOn(workerRepository, 'findOne').mockResolvedValue(mockWorker);
      jest.spyOn(slotRepository, 'find').mockResolvedValue([]);
      jest.spyOn(slotRepository, 'save').mockResolvedValue([]);

      await service.createSlotsForMultipleWorkers(workerSlots);

      expect(slotRepository.save).toHaveBeenCalledTimes(2);
    });
  });
});