import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { AssignmentsService } from './assignments.service';
import { AssignmentState } from '../bookings/entities/booking.entity';

@Controller('assignments')
export class AssignmentsController {
  constructor(private readonly assignmentsService: AssignmentsService) {}

  @Post('assign')
  async assignProfessional(@Body() assignmentRequest: {
    bookingId: string;
    serviceId: string;
    userLat: number;
    userLng: number;
    startTime: Date;
    endTime: Date;
  }) {
    // 🔒 KILL-SWITCH GUARD: Prevent synchronous assignment
    // This endpoint MUST NOT perform assignment directly
    // Assignment happens asynchronously in background worker
    throw new Error(
      'CRITICAL: Attempted synchronous assignment via /assignments/assign endpoint!\n' +
      'This violates the managed service contract.\n' +
      'Use /service-requests for intent capture instead.\n' +
      'Assignment must happen asynchronously in background worker only.'
    );
    
    return this.assignmentsService.assignProfessional(assignmentRequest);
  }

  @Post('reassign')
  async reassignProfessional(@Body() reassignmentRequest: {
    bookingId: string;
  }) {
    return this.assignmentsService.reassignProfessional(reassignmentRequest.bookingId);
  }

  @Get(':bookingId/status')
  async getAssignmentStatus(@Param('bookingId') bookingId: string) {
    return this.assignmentsService.getAssignmentStatus(bookingId);
  }

  @Get('status/latest')
  async getLatestAssignmentStatus() {
    // TODO: Get user from JWT token context when authentication is implemented
    // For now, return the default status
    return this.assignmentsService.getLatestAssignmentStatus();
  }

  @Post('create-booking-with-assignment')
  async createBookingWithAssignment(@Body() createBookingDto: any) {
    return this.assignmentsService.createBookingWithAssignment(createBookingDto);
  }

  @Post('start-assignment-flow')
  async startAssignmentFlow(@Body() assignmentFlowRequest: {
    serviceId: string;
    userLat: number;
    userLng: number;
    startTime: Date;
    endTime: Date;
    userId: string;
  }) {
    // 1. Create booking first
    const booking = await this.assignmentsService.createBookingWithAssignment({
      userId: assignmentFlowRequest.userId,
      serviceId: assignmentFlowRequest.serviceId,
      startTime: assignmentFlowRequest.startTime,
      endTime: assignmentFlowRequest.endTime,
      amount: 500.0, // Default amount for testing
      status: 'PENDING',
      type: 'SCHEDULED'
    });

    // 2. Trigger assignment for the created booking
    const assignmentResult = await this.assignmentsService.assignProfessional({
      bookingId: booking.id,
      serviceId: assignmentFlowRequest.serviceId,
      userLat: assignmentFlowRequest.userLat,
      userLng: assignmentFlowRequest.userLng,
      startTime: assignmentFlowRequest.startTime,
      endTime: assignmentFlowRequest.endTime
    });

    return {
      booking,
      assignment: assignmentResult
    };
  }

  // NEW: Two-phase assignment endpoints

  @Post('check-availability')
  async checkAvailability(@Body() availabilityRequest: {
    serviceId: string;
    userLat: number;
    userLng: number;
    startTime: Date;
    endTime: Date;
  }) {
    return this.assignmentsService.checkAvailabilityForAssignment(availabilityRequest);
  }

  @Post('attempt-assignment')
  async attemptAssignment(@Body() assignmentRequest: {
    bookingId: string;
    serviceId: string;
    userLat: number;
    userLng: number;
    startTime: Date;
    endTime: Date;
  }) {
    // 🔒 KILL-SWITCH GUARD: Legacy endpoint for testing only
    // This should be removed in production
    console.warn('⚠️  WARNING: Using legacy /assignments/attempt-assignment endpoint');
    console.warn('⚠️  This endpoint should be removed in production');
    
    console.log('🔍 Attempting assignment with request:', assignmentRequest);
    
    return this.assignmentsService.attemptAssignment(assignmentRequest);
  }
}