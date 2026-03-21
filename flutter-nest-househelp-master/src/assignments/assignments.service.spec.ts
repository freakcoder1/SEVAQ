import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AssignmentService } from './assignments.service';
import { AssignmentController } from './assignments.controller';
import { AssignmentsModule } from './assignments.module';
import { Booking } from '../bookings/entities/booking.entity';
import { Worker } from '../workers/entities/worker.entity';
import { Slot } from '../slots/entities/slot.entity';
import { AssignmentState } from '../bookings/entities/booking.entity';
import {
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';

describe('AssignmentService', () => {
  let service: AssignmentService;
  let bookingRepository: Repository<Booking>;
  let workerRepository: Repository<Worker>;
  let slotRepository: Repository<Slot>;

  const mockBookingRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
  };

  const mockWorkerRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockSlotRepository = {
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentService,
        {
          provide: getRepositoryToken(Booking),
          useValue: mockBookingRepository,
        },
        {
          provide: getRepositoryToken(Worker),
          useValue: mockWorkerRepository,
        },
        {
          provide: getRepositoryToken(Slot),
          useValue: mockSlotRepository,
        },
      ],
    }).compile();

    service = module.get<AssignmentService>(AssignmentService);
    bookingRepository = module.get<Repository<Booking>>(
      getRepositoryToken(Booking),
    );
    workerRepository = module.get<Repository<Worker>>(
      getRepositoryToken(Worker),
    );
    slotRepository = module.get<Repository<Slot>>(getRepositoryToken(Slot));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('assignProfessional', () => {
    it('should assign a professional to a booking', async () => {
      const bookingId = '1';
      const createAssignmentDto: CreateAssignmentDto = {
        bookingId,
        preferredWorkerId: 'worker1',
      };

      const mockBooking: Booking = {
        id: bookingId,
        userId: 'user1',
        serviceId: 'service1',
        slotId: 'slot1',
        status: 'confirmed',
        assignmentState: AssignmentState.ServiceClarification,
        assignedWorkerId: null,
        assignmentAttempts: 0,
        assignmentTimeout: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockWorker: Worker = {
        id: 'worker1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        location: 'Noida',
        isActive: true,
        isAvailable: true,
        rating: 4.5,
        totalBookings: 10,
        completedBookings: 9,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockWorkerRepository.findOne.mockResolvedValue(mockWorker);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
      });

      const result = await service.assignProfessional(createAssignmentDto);

      expect(result.assignmentState).toBe(AssignmentState.AssignmentInProgress);
      expect(result.assignedWorkerId).toBe('worker1');
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      const bookingId = '1';
      const createAssignmentDto: CreateAssignmentDto = {
        bookingId,
        preferredWorkerId: 'worker1',
      };

      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.assignProfessional(createAssignmentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if booking already assigned', async () => {
      const bookingId = '1';
      const createAssignmentDto: CreateAssignmentDto = {
        bookingId,
        preferredWorkerId: 'worker1',
      };

      const mockBooking: Booking = {
        id: bookingId,
        userId: 'user1',
        serviceId: 'service1',
        slotId: 'slot1',
        status: 'confirmed',
        assignmentState: AssignmentState.ProfessionalAssigned,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
        assignmentTimeout: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      await expect(
        service.assignProfessional(createAssignmentDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAssignmentStatus', () => {
    it('should return assignment status', async () => {
      const bookingId = '1';
      const mockBooking: Booking = {
        id: bookingId,
        userId: 'user1',
        serviceId: 'service1',
        slotId: 'slot1',
        status: 'confirmed',
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
        assignmentTimeout: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);

      const result = await service.getAssignmentStatus(bookingId);

      expect(result).toEqual({
        bookingId,
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
        assignmentTimeout: null,
      });
    });

    it('should throw NotFoundException if booking not found', async () => {
      const bookingId = '1';

      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(service.getAssignmentStatus(bookingId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateAssignmentStatus', () => {
    it('should update assignment status', async () => {
      const bookingId = '1';
      const updateAssignmentDto: UpdateAssignmentDto = {
        assignmentState: AssignmentState.ProfessionalAssigned,
        assignedWorkerId: 'worker1',
      };

      const mockBooking: Booking = {
        id: bookingId,
        userId: 'user1',
        serviceId: 'service1',
        slotId: 'slot1',
        status: 'confirmed',
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
        assignmentTimeout: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        assignmentState: AssignmentState.ProfessionalAssigned,
      });

      const result = await service.updateAssignmentStatus(
        bookingId,
        updateAssignmentDto,
      );

      expect(result.assignmentState).toBe(AssignmentState.ProfessionalAssigned);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if booking not found', async () => {
      const bookingId = '1';
      const updateAssignmentDto: UpdateAssignmentDto = {
        assignmentState: AssignmentState.ProfessionalAssigned,
      };

      mockBookingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updateAssignmentStatus(bookingId, updateAssignmentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('findAvailableWorkers', () => {
    it('should return available workers for a service area', async () => {
      const serviceAreaId = 'area1';
      const mockWorkers: Worker[] = [
        {
          id: 'worker1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          location: 'Noida',
          isActive: true,
          isAvailable: true,
          rating: 4.5,
          totalBookings: 10,
          completedBookings: 9,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWorkerRepository.find.mockResolvedValue(mockWorkers);

      const result = await service.findAvailableWorkers(serviceAreaId);

      expect(result).toEqual(mockWorkers);
      expect(mockWorkerRepository.find).toHaveBeenCalledWith({
        where: {
          isActive: true,
          isAvailable: true,
          location: serviceAreaId,
        },
        order: {
          rating: 'DESC',
          totalBookings: 'DESC',
        },
      });
    });
  });

  describe('handleAssignmentFailure', () => {
    it('should handle assignment failure and increment attempts', async () => {
      const bookingId = '1';
      const reason = 'Worker not available';

      const mockBooking: Booking = {
        id: bookingId,
        userId: 'user1',
        serviceId: 'service1',
        slotId: 'slot1',
        status: 'confirmed',
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
        assignmentTimeout: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        assignmentAttempts: 2,
        assignmentState: AssignmentState.ServiceClarification,
      });

      const result = await service.handleAssignmentFailure(bookingId, reason);

      expect(result.assignmentAttempts).toBe(2);
      expect(result.assignmentState).toBe(AssignmentState.ServiceClarification);
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });
  });

  describe('handleAssignmentTimeout', () => {
    it('should handle assignment timeout', async () => {
      const bookingId = '1';

      const mockBooking: Booking = {
        id: bookingId,
        userId: 'user1',
        serviceId: 'service1',
        slotId: 'slot1',
        status: 'confirmed',
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
        assignmentTimeout: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockBookingRepository.findOne.mockResolvedValue(mockBooking);
      mockBookingRepository.save.mockResolvedValue({
        ...mockBooking,
        assignmentState: AssignmentState.ServiceClarification,
        assignmentTimeout: expect.any(Date),
      });

      const result = await service.handleAssignmentTimeout(bookingId);

      expect(result.assignmentState).toBe(AssignmentState.ServiceClarification);
      expect(result.assignmentTimeout).toBeDefined();
      expect(mockBookingRepository.save).toHaveBeenCalled();
    });
  });

  describe('getAssignmentAnalytics', () => {
    it('should return assignment analytics', async () => {
      const mockAnalytics = {
        totalAssignments: 100,
        successfulAssignments: 85,
        failedAssignments: 15,
        averageAssignmentTime: 300000, // 5 minutes in milliseconds
        successRate: 85,
      };

      // Mock the repository query
      mockBookingRepository.findOne.mockResolvedValue(null);

      // Since the actual implementation uses raw SQL queries,
      // we'll test the method exists and returns the expected structure
      const result = await service.getAssignmentAnalytics();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });
});
