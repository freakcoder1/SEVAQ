import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(
    private serviceRequestsService: ServiceRequestsService,
  ) {}

  @Post()
  async createServiceRequest(@Request() req, @Body() request: CreateServiceRequestDto): Promise<{ requestId: string; assignmentStatus: string }> {
    console.log('🔍 DEBUG: Received service request data:', JSON.stringify(request, null, 2));

    const userId = req.user.userId;
    const serviceRequest = await this.serviceRequestsService.create(userId, request);

    console.log('📝 SERVICE REQUEST CREATED:', {
      id: serviceRequest.id,
      status: serviceRequest.assignmentStatus,
      serviceId: serviceRequest.serviceId,
      date: serviceRequest.date,
      timeWindow: serviceRequest.timeWindow
    });

    // CRITICAL: Assignment is NOT being triggered automatically
    // The AssignmentWorker exists but is never called
    console.log('⚠️  WARNING: Assignment processing is NOT triggered automatically');

    return {
      requestId: serviceRequest.id,
      assignmentStatus: 'REQUESTED',
    };
  }

  @Get(':id')
  async getServiceRequestStatus(@Param('id') id: string): Promise<{
    assignmentStatus: string;
    assignedWorker?: any;
    failureReason?: string;
  }> {
    return this.serviceRequestsService.getStatus(id);
  }
}