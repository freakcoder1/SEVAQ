# SEVAQ Professional Assignment System - Implementation Execution Guide

## Overview

This guide provides step-by-step instructions for implementing the SEVAQ Professional Assignment System based on the approved blueprint. The implementation is divided into 4 phases with specific daily tasks and validation checkpoints.

## Phase 1: Backend Foundation (Week 1)

### Day 1-2: ServiceRequest Entity and Database Migration

#### 1.1 Create ServiceRequest Entity
```typescript
// File: flutter-nest-househelp-master/src/service-requests/entities/service-request.entity.ts

import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('service_requests')
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  serviceId: string;

  @Column({ type: 'date' })
  scheduledDate: Date;

  @Column({ type: 'text' })
  timeWindow: 'morning' | 'afternoon' | 'evening';

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceSnapshot: number;

  @Column({ 
    type: 'text', 
    default: 'REQUESTED' 
  })
  assignmentStatus: 'REQUESTED' | 'ASSIGNED' | 'FAILED_TO_ASSIGN';

  @Column({ type: 'text', nullable: true })
  failureReason: string;

  @Column({ type: 'uuid', nullable: true })
  assignedWorkerId: string;

  @Column({ type: 'uuid', nullable: true })
  assignedSlotId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 1.2 Create ServiceRequest Module
```typescript
// File: flutter-nest-househelp-master/src/service-requests/service-requests.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequest } from './entities/service-request.entity';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';

@Module({
  imports: [TypeOrmModule.forFeature([ServiceRequest])],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
```

#### 1.3 Create ServiceRequest Service
```typescript
// File: flutter-nest-househelp-master/src/service-requests/service-requests.service.ts

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ServiceRequest } from './entities/service-request.entity';

@Injectable()
export class ServiceRequestsService {
  constructor(
    @InjectRepository(ServiceRequest)
    private serviceRequestsRepository: Repository<ServiceRequest>,
  ) {}

  async create(createDto: {
    userId: string;
    serviceId: string;
    scheduledDate: Date;
    timeWindow: 'morning' | 'afternoon' | 'evening';
    priceSnapshot: number;
  }): Promise<ServiceRequest> {
    const serviceRequest = this.serviceRequestsRepository.create({
      ...createDto,
      assignmentStatus: 'REQUESTED',
      failureReason: null,
      assignedWorkerId: null,
      assignedSlotId: null,
    });
    return this.serviceRequestsRepository.save(serviceRequest);
  }

  async findById(id: string): Promise<ServiceRequest | null> {
    return this.serviceRequestsRepository.findOne({ where: { id } });
  }

  async markAsAssigned(
    requestId: string,
    workerId: string,
    slotId: string,
  ): Promise<void> {
    await this.serviceRequestsRepository.update(requestId, {
      assignmentStatus: 'ASSIGNED',
      assignedWorkerId: workerId,
      assignedSlotId: slotId,
      failureReason: null,
    });
  }

  async markAsFailed(requestId: string, reason: string): Promise<void> {
    await this.serviceRequestsRepository.update(requestId, {
      assignmentStatus: 'FAILED_TO_ASSIGN',
      failureReason: reason,
      assignedWorkerId: null,
      assignedSlotId: null,
    });
  }

  async getStatus(requestId: string): Promise<{
    assignmentStatus: string;
    assignedWorker?: any;
    failureReason?: string;
  }> {
    const request = await this.findById(requestId);
    if (!request) {
      throw new Error('Service request not found');
    }

    if (request.assignmentStatus === 'ASSIGNED') {
      // Fetch worker details if needed
      return {
        assignmentStatus: request.assignmentStatus,
        assignedWorker: { id: request.assignedWorkerId },
      };
    }

    return {
      assignmentStatus: request.assignmentStatus,
      failureReason: request.failureReason,
    };
  }
}
```

#### 1.4 Create ServiceRequest Controller
```typescript
// File: flutter-nest-househelp-master/src/service-requests/service-requests.controller.ts

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(private serviceRequestsService: ServiceRequestsService) {}

  @Post()
  async createServiceRequest(@Body() request: {
    userId: string;
    serviceId: string;
    scheduledDate: Date;
    timeWindow: 'morning' | 'afternoon' | 'evening';
    priceSnapshot: number;
  }) {
    const serviceRequest = await this.serviceRequestsService.create(request);
    
    // Queue assignment job (to be implemented in Day 3-4)
    // await this.assignmentWorker.queueAssignment(serviceRequest.id);

    return {
      requestId: serviceRequest.id,
      assignmentStatus: 'REQUESTED',
    };
  }

  @Get(':id')
  async getServiceRequestStatus(@Param('id') id: string) {
    return this.serviceRequestsService.getStatus(id);
  }
}
```

#### 1.5 Database Migration
```typescript
// File: flutter-nest-househelp-master/src/migrations/1704892800000-CreateServiceRequests.ts

import { MigrationInterface, QueryRunner, Table } from 'typeorm';

export class CreateServiceRequests1704892800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'service_requests',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'userId',
            type: 'uuid',
          },
          {
            name: 'serviceId',
            type: 'uuid',
          },
          {
            name: 'scheduledDate',
            type: 'date',
          },
          {
            name: 'timeWindow',
            type: 'text',
          },
          {
            name: 'priceSnapshot',
            type: 'decimal',
            precision: 10,
            scale: 2,
          },
          {
            name: 'assignmentStatus',
            type: 'text',
            default: "'REQUESTED'",
          },
          {
            name: 'failureReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'assignedWorkerId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'assignedSlotId',
            type: 'uuid',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'now()',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'now()',
          },
        ],
      }),
      true,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('service_requests');
  }
}
```

#### 1.6 Update Main Module
```typescript
// File: flutter-nest-househelp-master/src/app.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ServiceRequestsModule } from './service-requests/service-requests.module';
// ... other imports

@Module({
  imports: [
    // ... existing modules
    ServiceRequestsModule,
    // ... other modules
  ],
  controllers: [
    // ... existing controllers
  ],
  providers: [
    // ... existing providers
  ],
})
export class AppModule {}
```

### Day 3-4: AssignmentWorker with Idempotent Behavior

#### 2.1 Install Bull Queue
```bash
cd flutter-nest-househelp-master
npm install @nestjs/bull bull
npm install -D @types/bull
```

#### 2.2 Configure Bull Module
```typescript
// File: flutter-nest-househelp-master/src/app.module.ts

import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    // ... existing modules
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
      },
    }),
    BullModule.registerQueue({
      name: 'assignment',
    }),
    // ... other modules
  ],
  // ... rest of module
})
export class AppModule {}
```

#### 2.3 Create Assignment Worker
```typescript
// File: flutter-nest-househelp-master/src/assignment-worker/assignment.worker.ts

import { Injectable, Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { ServiceRequestsService } from '../service-requests/service-requests.service';
import { AssignmentsService } from '../assignments/assignments.service';

@Injectable()
@Processor('assignment')
export class AssignmentWorker {
  private readonly logger = new Logger(AssignmentWorker.name);

  constructor(
    private serviceRequestsService: ServiceRequestsService,
    private assignmentsService: AssignmentsService,
  ) {}

  @Process('assignment')
  async processAssignment(job: Job<{ requestId: string }>) {
    const { requestId } = job.data;
    
    try {
      const request = await this.serviceRequestsService.findById(requestId);
      
      // CRITICAL: Ensure idempotent markAsFailed
      if (request.assignmentStatus !== 'REQUESTED') {
        this.logger.log(`Request ${requestId} already processed, skipping`);
        return; // Already processed
      }
      
      this.logger.log(`Processing assignment for request ${requestId}`);
      
      const result = await this.assignmentsService.attemptAssignment({
        serviceId: request.serviceId,
        scheduledDate: request.scheduledDate,
        timeWindow: request.timeWindow,
      });

      if (result.success) {
        await this.serviceRequestsService.markAsAssigned(
          requestId, 
          result.worker.id,
          result.slot.id
        );
        this.logger.log(`Successfully assigned worker ${result.worker.id} to request ${requestId}`);
      } else {
        await this.serviceRequestsService.markAsFailed(
          requestId, 
          result.reason
        );
        this.logger.log(`Failed to assign worker to request ${requestId}: ${result.reason}`);
      }
    } catch (error) {
      this.logger.error(`Error processing assignment for request ${requestId}: ${error.message}`);
      await this.serviceRequestsService.markAsFailed(
        requestId, 
        error.message
      );
    }
  }
}
```

#### 2.4 Update ServiceRequest Controller with Queue Integration
```typescript
// File: flutter-nest-househelp-master/src/service-requests/service-requests.controller.ts

import { Controller, Post, Get, Body, Param, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private serviceRequestsService: ServiceRequestsService,
    @Inject('ASSIGNMENT_QUEUE') private assignmentQueue: ClientProxy,
  ) {}

  @Post()
  async createServiceRequest(@Body() request: {
    userId: string;
    serviceId: string;
    scheduledDate: Date;
    timeWindow: 'morning' | 'afternoon' | 'evening';
    priceSnapshot: number;
  }) {
    const serviceRequest = await this.serviceRequestsService.create(request);
    
    // Queue assignment job
    await this.assignmentQueue.emit('assignment', { requestId: serviceRequest.id });

    return {
      requestId: serviceRequest.id,
      assignmentStatus: 'REQUESTED',
    };
  }

  @Get(':id')
  async getServiceRequestStatus(@Param('id') id: string) {
    return this.serviceRequestsService.getStatus(id);
  }
}
```

#### 2.5 Update ServiceRequest Module
```typescript
// File: flutter-nest-househelp-master/src/service-requests/service-requests.module.ts

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bull';
import { ServiceRequest } from './entities/service-request.entity';
import { ServiceRequestsController } from './service-requests.controller';
import { ServiceRequestsService } from './service-requests.service';
import { AssignmentWorker } from '../assignment-worker/assignment.worker';

@Module({
  imports: [
    TypeOrmModule.forFeature([ServiceRequest]),
    BullModule.registerQueue({
      name: 'assignment',
    }),
  ],
  controllers: [ServiceRequestsController],
  providers: [ServiceRequestsService, AssignmentWorker],
  exports: [ServiceRequestsService],
})
export class ServiceRequestsModule {}
```

### Day 5: API Endpoints and Basic Testing

#### 3.1 Create DTOs
```typescript
// File: flutter-nest-househelp-master/src/service-requests/dto/create-service-request.dto.ts

export class CreateServiceRequestDto {
  userId: string;
  serviceId: string;
  scheduledDate: Date;
  timeWindow: 'morning' | 'afternoon' | 'evening';
  priceSnapshot: number;
}
```

```typescript
// File: flutter-nest-househelp-master/src/service-requests/dto/service-request-status.dto.ts

export class ServiceRequestStatusDto {
  assignmentStatus: string;
  assignedWorker?: {
    id: string;
    name: string;
    rating: number;
  };
  failureReason?: string;
}
```

#### 3.2 Update Controller with DTOs
```typescript
// File: flutter-nest-househelp-master/src/service-requests/service-requests.controller.ts

import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { ServiceRequestStatusDto } from './dto/service-request-status.dto';
import { ServiceRequestsService } from './service-requests.service';

@Controller('service-requests')
export class ServiceRequestsController {
  constructor(
    private serviceRequestsService: ServiceRequestsService,
    @Inject('ASSIGNMENT_QUEUE') private assignmentQueue: ClientProxy,
  ) {}

  @Post()
  async createServiceRequest(@Body() request: CreateServiceRequestDto): Promise<{ requestId: string; assignmentStatus: string }> {
    const serviceRequest = await this.serviceRequestsService.create(request);
    
    // Queue assignment job
    await this.assignmentQueue.emit('assignment', { requestId: serviceRequest.id });

    return {
      requestId: serviceRequest.id,
      assignmentStatus: 'REQUESTED',
    };
  }

  @Get(':id')
  async getServiceRequestStatus(@Param('id') id: string): Promise<ServiceRequestStatusDto> {
    return this.serviceRequestsService.getStatus(id);
  }
}
```

#### 3.3 Basic Integration Test
```typescript
// File: flutter-nest-househelp-master/test/service-requests.e2e-spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('ServiceRequests (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/POST service-requests (should always succeed)', async () => {
    const createDto = {
      userId: 'test-user-id',
      serviceId: 'test-service-id',
      scheduledDate: new Date('2024-01-15'),
      timeWindow: 'morning',
      priceSnapshot: 500.00,
    };

    const response = await request(app.getHttpServer())
      .post('/service-requests')
      .send(createDto)
      .expect(201);

    expect(response.body).toHaveProperty('requestId');
    expect(response.body.assignmentStatus).toBe('REQUESTED');
  });

  it('/GET service-requests/:id (should return status)', async () => {
    // First create a service request
    const createResponse = await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        userId: 'test-user-id',
        serviceId: 'test-service-id',
        scheduledDate: new Date('2024-01-15'),
        timeWindow: 'morning',
        priceSnapshot: 500.00,
      });

    const requestId = createResponse.body.requestId;

    const response = await request(app.getHttpServer())
      .get(`/service-requests/${requestId}`)
      .expect(200);

    expect(response.body).toHaveProperty('assignmentStatus');
    expect(['REQUESTED', 'ASSIGNED', 'FAILED_TO_ASSIGN']).toContain(response.body.assignmentStatus);
  });

  afterEach(async () => {
    await app.close();
  });
});
```

## Phase 2: Frontend Integration (Week 2)

### Day 1-2: Finding Professional Screen with UX Improvements

#### 4.1 Create Finding Professional Screen
```dart
// File: frontend-flutter-house-help-master/lib/screens/finding_professional_screen.dart

import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:house_help/models/service_request.dart';
import 'package:house_help/services/api_service.dart';
import 'package:house_help/widgets/error_state_widget.dart';
import 'package:house_help/widgets/loading_widget.dart';

class FindingProfessionalScreen extends StatefulWidget {
  final String requestId;

  const FindingProfessionalScreen({
    Key? key,
    required this.requestId,
  }) : super(key: key);

  @override
  _FindingProfessionalScreenState createState() => _FindingProfessionalScreenState();
}

class _FindingProfessionalScreenState extends State<FindingProfessionalScreen> {
  late Timer _pollingTimer;
  AssignmentStatus _status = AssignmentStatus.requested;
  Worker? _assignedWorker;
  int _pollingCount = 0;
  String _failureReason = '';

  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      _pollingCount++;
      
      try {
        final status = await _apiService.getServiceRequestStatus(widget.requestId);
        
        setState(() {
          _status = status.assignmentStatus;
          _assignedWorker = status.assignedWorker;
          _failureReason = status.failureReason ?? '';
        });

        if (status.assignmentStatus == AssignmentStatus.assigned || 
            status.assignmentStatus == AssignmentStatus.failedToAssign) {
          _pollingTimer.cancel();
        }
      } catch (error) {
        setState(() {
          _status = AssignmentStatus.failedToAssign;
          _failureReason = 'Network error occurred';
        });
        _pollingTimer.cancel();
      }
    });
  }

  Widget _buildContent() {
    switch (_status) {
      case AssignmentStatus.requested:
        return _buildRequestedState(_pollingCount);
      case AssignmentStatus.assigned:
        return _buildAssignedState();
      case AssignmentStatus.failedToAssign:
        return _buildFailedState();
    }
  }

  Widget _buildRequestedState(int pollingCount) {
    String message = "Finding the best professional for you...";
    
    if (pollingCount > 10) { // ~30 seconds
      message = "This is taking a bit longer than usual. We're still trying.";
    } else if (pollingCount > 20) { // ~60 seconds
      message = "We're working hard to find someone for you. Please wait a moment longer.";
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const LoadingWidget(),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'Estimated time: 10-30 seconds',
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignedState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.check_circle,
            size: 80,
            color: Colors.green,
          ),
          const SizedBox(height: 16),
          const Text(
            'Great news!',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'We found ${_assignedWorker?.name ?? 'a professional'} for you!',
            style: const TextStyle(
              fontSize: 18,
              color: Colors.grey[800],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              // Navigate to payment screen
              Navigator.pushReplacementNamed(
                context,
                '/payment',
                arguments: {'requestId': widget.requestId},
              );
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Proceed to Payment',
              style: TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFailedState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(
            Icons.error,
            size: 80,
            color: Colors.red,
          ),
          const SizedBox(height: 16),
          const Text(
            'We couldn\'t find a professional',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _failureReason.isNotEmpty 
              ? _failureReason 
              : 'No professionals are available for your selected time slot.',
            style: const TextStyle(
              fontSize: 16,
              color: Colors.grey[700],
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton(
                onPressed: () {
                  // Try again with same parameters
                  Navigator.pushReplacement(
                    context,
                    MaterialPageRoute(
                      builder: (context) => BookingScreen(
                        serviceId: '', // Pass actual service ID
                        date: DateTime.now(), // Pass actual date
                        timeWindow: 'morning', // Pass actual time window
                      ),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: const Text('Try Again'),
              ),
              ElevatedButton(
                onPressed: () {
                  // Navigate to home screen
                  Navigator.pushReplacementNamed(context, '/home');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[600],
                  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                ),
                child: const Text('Go Home'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finding Professional'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Don't allow going back during assignment
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please wait while we find a professional for you.'),
              ),
            );
          },
        ),
      ),
      body: _buildContent(),
    );
  }
}

enum AssignmentStatus {
  requested,
  assigned,
  failedToAssign,
}
```

#### 4.2 Update API Service
```dart
// File: frontend-flutter-house-help-master/lib/services/api_service.dart

import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:house_help/models/worker.dart';

class ApiService {
  final String baseUrl = 'http://localhost:3000/api';

  Future<ServiceRequestStatus> getServiceRequestStatus(String requestId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/service-requests/$requestId'),
      headers: {
        'Content-Type': 'application/json',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return ServiceRequestStatus.fromJson(data);
    } else {
      throw Exception('Failed to load service request status');
    }
  }
}

class ServiceRequestStatus {
  final String assignmentStatus;
  final Worker? assignedWorker;
  final String? failureReason;

  ServiceRequestStatus({
    required this.assignmentStatus,
    this.assignedWorker,
    this.failureReason,
  });

  factory ServiceRequestStatus.fromJson(Map<String, dynamic> json) {
    return ServiceRequestStatus(
      assignmentStatus: json['assignmentStatus'],
      assignedWorker: json['assignedWorker'] != null 
        ? Worker.fromJson(json['assignedWorker'])
        : null,
      failureReason: json['failureReason'],
    );
  }
}
```

### Day 3-4: Status Polling and Navigation Flow

#### 5.1 Update Booking Screen
```dart
// File: frontend-flutter-house-help-master/lib/screens/booking_screen.dart

import 'package:flutter/material.dart';
import 'package:house_help/services/api_service.dart';
import 'package:house_help/screens/finding_professional_screen.dart';

class BookingScreen extends StatefulWidget {
  final String serviceId;
  final DateTime date;
  final String timeWindow;

  const BookingScreen({
    Key? key,
    required this.serviceId,
    required this.date,
    required this.timeWindow,
  }) : super(key: key);

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  bool _isSubmitting = false;
  final ApiService _apiService = ApiService();

  Future<void> _submitBooking() async {
    setState(() {
      _isSubmitting = true;
    });

    try {
      final response = await _apiService.createServiceRequest(
        userId: 'current-user-id', // Get from auth
        serviceId: widget.serviceId,
        scheduledDate: widget.date,
        timeWindow: widget.timeWindow,
        priceSnapshot: 500.00, // Get from service
      );

      // Navigate to finding professional screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (context) => FindingProfessionalScreen(
            requestId: response['requestId'],
          ),
        ),
      );
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Failed to create booking: $error'),
        ),
      );
    } finally {
      setState(() {
        _isSubmitting = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Confirm Booking'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Booking details display
            // ... existing booking details code ...
            
            const SizedBox(height: 32),
            
            // Submit button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSubmitting ? null : _submitBooking,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isSubmitting
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'Book Now',
                      style: TextStyle(fontSize: 18),
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

#### 5.2 Update API Service with Create Method
```dart
// File: frontend-flutter-house-help-master/lib/services/api_service.dart

class ApiService {
  final String baseUrl = 'http://localhost:3000/api';

  Future<Map<String, dynamic>> createServiceRequest({
    required String userId,
    required String serviceId,
    required DateTime scheduledDate,
    required String timeWindow,
    required double priceSnapshot,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/service-requests'),
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'userId': userId,
        'serviceId': serviceId,
        'scheduledDate': scheduledDate.toIso8601String(),
        'timeWindow': timeWindow,
        'priceSnapshot': priceSnapshot,
      }),
    );

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      throw Exception('Failed to create service request');
    }
  }

  // ... existing methods ...
}
```

### Day 5: Payment Flow Integration

#### 6.1 Create Payment Screen
```dart
// File: frontend-flutter-house-help-master/lib/screens/payment_screen.dart

import 'package:flutter/material.dart';
import 'package:house_help/services/api_service.dart';
import 'package:house_help/widgets/loading_widget.dart';

class PaymentScreen extends StatefulWidget {
  final String requestId;

  const PaymentScreen({
    Key? key,
    required this.requestId,
  }) : super(key: key);

  @override
  _PaymentScreenState createState() => _PaymentScreenState();
}

class _PaymentScreenState extends State<PaymentScreen> {
  bool _isProcessing = false;
  final ApiService _apiService = ApiService();

  Future<void> _processPayment() async {
    setState(() {
      _isProcessing = true;
    });

    try {
      await _apiService.processPayment(widget.requestId);
      
      // Navigate to success screen
      Navigator.pushReplacementNamed(context, '/booking-success');
    } catch (error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Payment failed: $error'),
        ),
      );
    } finally {
      setState(() {
        _isProcessing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Complete Payment',
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            
            // Payment details
            // ... payment details display ...
            
            const SizedBox(height: 32),
            
            // Pay button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isProcessing ? null : _processPayment,
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
                child: _isProcessing
                  ? const CircularProgressIndicator(color: Colors.white)
                  : const Text(
                      'Pay Now',
                      style: TextStyle(fontSize: 18),
                    ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
```

## Phase 3: Polish & Testing (Week 3)

### Day 1-2: Kill Legacy Sync Paths

#### 7.1 Identify Legacy Endpoints
```typescript
// File: flutter-nest-househelp-master/src/assignments/assignments.controller.ts

import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { FeatureFlagGuard } from '../common/guards/feature-flag.guard';

@Controller('assignments')
export class AssignmentsController {
  
  // CRITICAL: Kill this endpoint completely
  @Post('start-assignment-flow')
  @UseGuards(FeatureFlagGuard('legacy_assignment_disabled'))
  async startAssignmentFlow(@Body() request: any) {
    throw new BadRequestException(
      'Legacy assignment flow is deprecated. Use POST /service-requests instead.'
    );
  }

  // ... other endpoints ...
}
```

#### 7.2 Create Feature Flag Guard
```typescript
// File: flutter-nest-househelp-master/src/common/guards/feature-flag.guard.ts

import { Injectable, CanActivate, ExecutionContext, BadRequestException } from '@nestjs/common';

@Injectable()
export class FeatureFlagGuard implements CanActivate {
  constructor(private featureFlag: string) {}

  canActivate(context: ExecutionContext): boolean {
    const featureFlags = process.env.FEATURE_FLAGS?.split(',') || [];
    
    if (featureFlags.includes(this.featureFlag)) {
      throw new BadRequestException(
        `Feature ${this.featureFlag} is currently disabled`
      );
    }

    return true;
  }
}
```

### Day 3-4: Feature Flags and Monitoring

#### 8.1 Environment Configuration
```typescript
// File: flutter-nest-househelp-master/.env.example

# Feature Flags
FEATURE_FLAGS=legacy_assignment_disabled

# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379

# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=househelp
DATABASE_USER=postgres
DATABASE_PASSWORD=password
```

#### 8.2 Monitoring Setup
```typescript
// File: flutter-nest-househelp-master/src/monitoring/assignment.metrics.ts

import { Injectable } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

@Injectable()
export class AssignmentMetrics {
  constructor(private metricsService: MetricsService) {}

  recordAssignmentAttempt(serviceId: string, scheduledDate: Date) {
    this.metricsService.increment('assignment.attempt', {
      serviceId,
      date: scheduledDate.toISOString().split('T')[0],
    });
  }

  recordAssignmentSuccess(serviceId: string, workerId: string) {
    this.metricsService.increment('assignment.success', {
      serviceId,
      workerId,
    });
  }

  recordAssignmentFailure(serviceId: string, reason: string) {
    this.metricsService.increment('assignment.failure', {
      serviceId,
      reason,
    });
  }

  recordAssignmentLatency(serviceId: string, latency: number) {
    this.metricsService.histogram('assignment.latency', latency, {
      serviceId,
    });
  }
}
```

### Day 5: Integration Tests and Documentation

#### 9.1 Integration Test for Assignment Flow
```typescript
// File: flutter-nest-househelp-master/test/assignment-flow.e2e-spec.ts

describe('Assignment Flow (e2e)', () => {
  // Test that REQUESTED always succeeds
  it('should always succeed when creating service request', async () => {
    const response = await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        userId: 'test-user',
        serviceId: 'test-service',
        scheduledDate: new Date('2024-01-15'),
        timeWindow: 'morning',
        priceSnapshot: 500.00,
      })
      .expect(201);

    expect(response.body.requestId).toBeDefined();
    expect(response.body.assignmentStatus).toBe('REQUESTED');
  });

  // Test that ASSIGNMENT failure never returns 4xx to user
  it('should handle assignment failure gracefully', async () => {
    // Create a service request
    const createResponse = await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        userId: 'test-user',
        serviceId: 'test-service',
        scheduledDate: new Date('2024-01-15'),
        timeWindow: 'morning',
        priceSnapshot: 500.00,
      });

    const requestId = createResponse.body.requestId;

    // Wait for assignment to complete (simulate)
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check status - should not be 4xx
    const statusResponse = await request(app.getHttpServer())
      .get(`/service-requests/${requestId}`)
      .expect(200); // Should always be 200, never 4xx

    expect(statusResponse.body.assignmentStatus).toBeDefined();
  });
});
```

## Phase 4: Deployment & Monitoring (Week 4)

### Day 1-2: Staging Deployment and Validation

#### 10.1 Docker Configuration
```dockerfile
# File: flutter-nest-househelp-master/Dockerfile

FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start:prod"]
```

#### 10.2 Docker Compose for Staging
```yaml
# File: flutter-nest-househelp-master/docker-compose.staging.yml

version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://postgres:password@db:5432/househelp_staging
      - REDIS_URL=redis://redis:6379
      - FEATURE_FLAGS=legacy_assignment_disabled
    depends_on:
      - db
      - redis

  db:
    image: postgres:13
    environment:
      POSTGRES_DB: househelp_staging
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:6-alpine

volumes:
  postgres_data:
```

### Day 3-4: Production Rollout with Monitoring

#### 11.1 Health Check Endpoint
```typescript
// File: flutter-nest-househelp-master/src/health/health.controller.ts

import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  healthCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
```

#### 11.2 Assignment Dashboard
```typescript
// File: flutter-nest-househelp-master/src/dashboard/assignment.dashboard.ts

import { Controller, Get } from '@nestjs/common';
import { MetricsService } from '../metrics/metrics.service';

@Controller('dashboard/assignments')
export class AssignmentDashboardController {
  constructor(private metricsService: MetricsService) {}

  @Get('metrics')
  async getAssignmentMetrics() {
    const metrics = await this.metricsService.getMetrics([
      'assignment.attempt',
      'assignment.success', 
      'assignment.failure',
      'assignment.latency',
    ]);

    return {
      successRate: this.calculateSuccessRate(metrics),
      averageLatency: this.calculateAverageLatency(metrics),
      failureReasons: this.getFailureReasons(metrics),
      totalAttempts: metrics['assignment.attempt'] || 0,
    };
  }

  private calculateSuccessRate(metrics: any) {
    const attempts = metrics['assignment.attempt'] || 0;
    const successes = metrics['assignment.success'] || 0;
    return attempts > 0 ? (successes / attempts) * 100 : 0;
  }

  private calculateAverageLatency(metrics: any) {
    // Implementation for average latency calculation
    return metrics['assignment.latency'] || 0;
  }

  private getFailureReasons(metrics: any) {
    // Implementation for failure reason analysis
    return [];
  }
}
```

### Day 5: Post-Deployment Review

#### 12.1 Success Metrics Dashboard
Create a dashboard to monitor:
- Booking completion rate
- Assignment success rate
- User satisfaction scores
- Error rate reduction
- Assignment time metrics

#### 12.2 Rollback Plan
```yaml
# File: rollback-plan.md

## Rollback Triggers
- Assignment success rate < 80%
- User satisfaction < 4.0
- Error rate > 5%

## Rollback Steps
1. Disable new assignment flow via feature flag
2. Re-enable legacy sync flow
3. Monitor metrics for 24 hours
4. Analyze root cause and fix
```

## Success Criteria

### Primary KPIs (Must Achieve)
- **Booking completion rate:** 20% improvement target
- **Assignment success rate:** 95%+ for REQUESTED bookings
- **User satisfaction:** 4.5+ rating for booking flow

### Secondary Metrics (Should Achieve)
- **Error rate reduction:** 80% reduction in 400 errors
- **Assignment time:** <30 seconds for 90% of assignments
- **Polling efficiency:** <100ms response time

## Next Steps After Implementation

1. **Monitor metrics** for 2 weeks post-deployment
2. **Gather user feedback** and iterate on UX
3. **Optimize assignment algorithms** based on data
4. **Scale infrastructure** as needed
5. **Plan next features** (cancellation, rescheduling, etc.)

This implementation guide provides a complete roadmap for building the SEVAQ Professional Assignment System. Each phase builds upon the previous one, ensuring a stable and scalable solution.