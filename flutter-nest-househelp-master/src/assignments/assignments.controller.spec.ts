import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsController } from './assignments.controller';
import { AssignmentService } from './assignments.service';
import { CreateAssignmentDto } from './dto/create-assignment.dto';
import { UpdateAssignmentDto } from './dto/update-assignment.dto';
import { AssignmentState } from '../bookings/entities/booking.entity';
import { NotFoundException, ConflictException } from '@nestjs/common';

describe('AssignmentsController', () => {
  let controller: AssignmentsController;
  let service: AssignmentService;

  const mockAssignmentService = {
    assignProfessional: jest.fn(),
    getAssignmentStatus: jest.fn(),
    updateAssignmentStatus: jest.fn(),
    findAvailableWorkers: jest.fn(),
    handleAssignmentFailure: jest.fn(),
    handleAssignmentTimeout: jest.fn(),
    getAssignmentAnalytics: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssignmentsController],
      providers: [
        {
          provide: AssignmentService,
          useValue: mockAssignmentService,
        },
      ],
    }).compile();

    controller = module.get<AssignmentsController>(AssignmentsController);
    service = module.get<AssignmentService>(AssignmentService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('assignProfessional', () => {
    it('should assign a professional successfully', async () => {
      const createAssignmentDto: CreateAssignmentDto = {
        bookingId: '1',
        preferredWorkerId: 'worker1',
      };

      const mockResult = {
        id: '1',
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
      };

      mockAssignmentService.assignProfessional.mockResolvedValue(mockResult);

      const result = await controller.assignProfessional(createAssignmentDto);

      expect(result).toEqual(mockResult);
      expect(mockAssignmentService.assignProfessional).toHaveBeenCalledWith(
        createAssignmentDto,
      );
    });

    it('should throw NotFoundException when booking not found', async () => {
      const createAssignmentDto: CreateAssignmentDto = {
        bookingId: '1',
        preferredWorkerId: 'worker1',
      };

      mockAssignmentService.assignProfessional.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      await expect(
        controller.assignProfessional(createAssignmentDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException when booking already assigned', async () => {
      const createAssignmentDto: CreateAssignmentDto = {
        bookingId: '1',
        preferredWorkerId: 'worker1',
      };

      mockAssignmentService.assignProfessional.mockRejectedValue(
        new ConflictException('Booking already assigned'),
      );

      await expect(
        controller.assignProfessional(createAssignmentDto),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('getAssignmentStatus', () => {
    it('should return assignment status', async () => {
      const bookingId = '1';
      const mockResult = {
        bookingId: '1',
        assignmentState: AssignmentState.AssignmentInProgress,
        assignedWorkerId: 'worker1',
        assignmentAttempts: 1,
      };

      mockAssignmentService.getAssignmentStatus.mockResolvedValue(mockResult);

      const result = await controller.getAssignmentStatus(bookingId);

      expect(result).toEqual(mockResult);
      expect(mockAssignmentService.getAssignmentStatus).toHaveBeenCalledWith(
        bookingId,
      );
    });

    it('should throw NotFoundException when booking not found', async () => {
      const bookingId = '1';

      mockAssignmentService.getAssignmentStatus.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      await expect(controller.getAssignmentStatus(bookingId)).rejects.toThrow(
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

      const mockResult = {
        id: '1',
        assignmentState: AssignmentState.ProfessionalAssigned,
        assignedWorkerId: 'worker1',
      };

      mockAssignmentService.updateAssignmentStatus.mockResolvedValue(
        mockResult,
      );

      const result = await controller.updateAssignmentStatus(
        bookingId,
        updateAssignmentDto,
      );

      expect(result).toEqual(mockResult);
      expect(mockAssignmentService.updateAssignmentStatus).toHaveBeenCalledWith(
        bookingId,
        updateAssignmentDto,
      );
    });

    it('should throw NotFoundException when booking not found', async () => {
      const bookingId = '1';
      const updateAssignmentDto: UpdateAssignmentDto = {
        assignmentState: AssignmentState.ProfessionalAssigned,
      };

      mockAssignmentService.updateAssignmentStatus.mockRejectedValue(
        new NotFoundException('Booking not found'),
      );

      await expect(
        controller.updateAssignmentStatus(bookingId, updateAssignmentDto),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('getAvailableWorkers', () => {
    it('should return available workers', async () => {
      const serviceAreaId = 'area1';
      const mockWorkers = [
        {
          id: 'worker1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '1234567890',
          location: 'Noida',
          isActive: true,
          isAvailable: true,
          rating: 4.5,
        },
      ];

      mockAssignmentService.findAvailableWorkers.mockResolvedValue(mockWorkers);

      const result = await controller.getAvailableWorkers(serviceAreaId);

      expect(result).toEqual(mockWorkers);
      expect(mockAssignmentService.findAvailableWorkers).toHaveBeenCalledWith(
        serviceAreaId,
      );
    });
  });

  describe('handleAssignmentFailure', () => {
    it('should handle assignment failure', async () => {
      const bookingId = '1';
      const reason = 'Worker not available';
      const mockResult = {
        id: '1',
        assignmentState: AssignmentState.ServiceClarification,
        assignmentAttempts: 2,
      };

      mockAssignmentService.handleAssignmentFailure.mockResolvedValue(
        mockResult,
      );

      const result = await controller.handleAssignmentFailure(
        bookingId,
        reason,
      );

      expect(result).toEqual(mockResult);
      expect(
        mockAssignmentService.handleAssignmentFailure,
      ).toHaveBeenCalledWith(bookingId, reason);
    });
  });

  describe('handleAssignmentTimeout', () => {
    it('should handle assignment timeout', async () => {
      const bookingId = '1';
      const mockResult = {
        id: '1',
        assignmentState: AssignmentState.ServiceClarification,
        assignmentTimeout: new Date(),
      };

      mockAssignmentService.handleAssignmentTimeout.mockResolvedValue(
        mockResult,
      );

      const result = await controller.handleAssignmentTimeout(bookingId);

      expect(result).toEqual(mockResult);
      expect(
        mockAssignmentService.handleAssignmentTimeout,
      ).toHaveBeenCalledWith(bookingId);
    });
  });

  describe('getAssignmentAnalytics', () => {
    it('should return assignment analytics', async () => {
      const mockAnalytics = {
        totalAssignments: 100,
        successfulAssignments: 85,
        failedAssignments: 15,
        averageAssignmentTime: 300000,
        successRate: 85,
      };

      mockAssignmentService.getAssignmentAnalytics.mockResolvedValue(
        mockAnalytics,
      );

      const result = await controller.getAssignmentAnalytics();

      expect(result).toEqual(mockAnalytics);
      expect(mockAssignmentService.getAssignmentAnalytics).toHaveBeenCalled();
    });
  });
});
