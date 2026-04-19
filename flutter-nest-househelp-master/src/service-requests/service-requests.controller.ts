import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestsService } from './service-requests.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JwtRequest } from '../common/types/jwt-user.type';

@Controller('service-requests')
@UseGuards(JwtAuthGuard)
export class ServiceRequestsController {
  constructor(private serviceRequestsService: ServiceRequestsService) {}

  @Post()
  async createServiceRequest(
    @Request() req: JwtRequest,
    @Body() request: CreateServiceRequestDto,
  ): Promise<{ requestId: string; assignmentStatus: string }> {
    const userId = req.user.userId;
    const serviceRequest = await this.serviceRequestsService.create(
      userId,
      request,
    );

    return {
      requestId: serviceRequest.publicId,
      assignmentStatus: serviceRequest.assignmentStatus,
    };
  }

  @Get(':id')
  async getServiceRequestStatus(@Param('id') id: string): Promise<{
    assignmentStatus: string;
    assignedWorker?: any;
    failureReason?: string | null;
  }> {
    return this.serviceRequestsService.getStatus(id);
  }
}
