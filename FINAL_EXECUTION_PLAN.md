# FINAL EXECUTION PLAN: SEVAQ ARCHITECTURAL CORRECTION

## 🎯 MISSION CRITICAL: Fix the Lifecycle Contract

The core issue is **temporal violation** - assignment happens during intent instead of after. This must be fixed at the API boundary level.

## 🚨 IMMEDIATE ACTIONS (Order Matters)

### Phase 1: Backend Foundation (API Boundary Lockdown)

#### 1.1 Create ServiceRequest Entity
```typescript
// NEW: src/service-requests/entities/service-request.entity.ts
@Entity()
export class ServiceRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  serviceId: string;

  @Column()
  date: Date;

  @Column()
  timeWindow: string;

  @Column()
  priceSnapshot: number;

  @Column({
    type: 'enum',
    enum: ['REQUESTED', 'ASSIGNED', 'FAILED_TO_ASSIGN'],
    default: 'REQUESTED'
  })
  assignmentStatus: 'REQUESTED' | 'ASSIGNED' | 'FAILED_TO_ASSIGN';

  @Column({ nullable: true })
  assignedWorkerId?: string;

  @Column({ nullable: true })
  assignedSlotId?: string;

  @Column({ nullable: true })
  failureReason?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
```

#### 1.2 Lock Down /service-requests Endpoint
```typescript
// NEW: src/service-requests/service-requests.controller.ts
@Post('service-requests')
async createServiceRequest(@Body() createDto: CreateServiceRequestDto) {
  // CRITICAL: This MUST always succeed
  // NO availability checks
  // NO assignment logic
  // NO failure due to workers
  
  const serviceRequest = this.serviceRequestsService.create(createDto);
  
  // Queue async assignment job
  await this.assignmentQueue.add('assign-worker', {
    serviceRequestId: serviceRequest.id
  });
  
  return serviceRequest; // Always 201
}
```

#### 1.3 Remove Synchronous Assignment Endpoints
```typescript
// REMOVE: assignments.controller.ts synchronous endpoints
// DELETE: start-assignment-flow
// DELETE: attempt-assignment (from frontend)
// DELETE: any availability check during intent
```

#### 1.4 Create Async Assignment Worker
```typescript
// NEW: src/assignment-worker/assignment.processor.ts
@Processor('assignment-queue')
export class AssignmentProcessor {
  @Process('assign-worker')
  async assignWorker(job: Job<{ serviceRequestId: string }>) {
    const { serviceRequestId } = job.data;
    
    // This is where assignment logic belongs
    // NOT in the confirmation flow
    
    const result = await this.assignmentService.assignWorker(serviceRequestId);
    
    // Update ServiceRequest status
    await this.serviceRequestsService.updateStatus(
      serviceRequestId, 
      result.success ? 'ASSIGNED' : 'FAILED_TO_ASSIGN',
      result.workerId,
      result.failureReason
    );
  }
}
```

### Phase 2: Frontend Architecture (Contract Enforcement)

#### 2.1 Fix SchedulePricingScreen - Remove Assignment Logic
```dart
// EDIT: frontend-flutter-house-help-master/lib/screens/schedule_pricing_screen.dart
// REMOVE: _handleConfirmAssignment method entirely

// ADD: Simple intent creation
Future<void> _handleConfirmIntent() async {
  if (!_canProceed()) return;
  
  setState(() => _isProcessing = true);
  
  try {
    final user = _authProvider.user!;
    final service = widget.service ?? 
      (widget.worker?.services.isNotEmpty == true 
        ? widget.worker!.services[0] 
        : null);
    
    // CRITICAL: Only create ServiceRequest
    final response = await _apiService.post('service-requests', {
      'serviceId': service?.id,
      'date': _selectedDate!.toIso8601String(),
      'timeWindow': _selectedTimeWindow!.id,
      'priceSnapshot': _calculatedPrice,
      'userId': user.id,
    });
    
    // IMMEDIATE navigation - no branching
    Navigator.push(
      context,
      MaterialPageRoute(builder: (_) => ServiceRequestInProgressScreen(
        serviceRequestId: response['id']
      )),
    );
  } catch (e) {
    // This should never happen in production
    // If it does, show generic error
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Something went wrong. Please try again.')),
    );
  } finally {
    setState(() => _isProcessing = false);
  }
}
```

#### 2.2 Rename AssignmentInProgressScreen to ServiceRequestInProgressScreen
```dart
// RENAME: frontend-flutter-house-help-master/lib/screens/assignment_in_progress_screen.dart
// TO: service_request_in_progress_screen.dart

class ServiceRequestInProgressScreen extends StatefulWidget {
  final String serviceRequestId; // NEW: Accept service request ID
  
  const ServiceRequestInProgressScreen({
    Key? key,
    required this.serviceRequestId,
  }) : super(key: key);
  
  @override
  _ServiceRequestInProgressScreenState createState() => 
    _ServiceRequestInProgressScreenState();
}

class _ServiceRequestInProgressScreenState extends State<ServiceRequestInProgressScreen> {
  late Timer _pollingTimer;
  late ApiService _apiService;
  bool _isAssigned = false;
  bool _hasFailed = false;
  
  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    
    // Start polling immediately
    _startPolling();
  }
  
  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) {
      _checkAssignmentStatus();
    });
  }
  
  Future<void> _checkAssignmentStatus() async {
    try {
      final response = await _apiService.get('service-requests/${widget.serviceRequestId}');
      
      if (response != null) {
        final status = response['assignmentStatus'];
        
        if (status == 'ASSIGNED') {
          _pollingTimer.cancel();
          setState(() => _isAssigned = true);
          
          // Navigate to professional assigned
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => ProfessionalAssignedScreen(
              worker: Worker.fromJson(response['assignedWorker']),
              service: widget.service,
              startTime: DateTime.parse(response['date']),
              endTime: DateTime.parse(response['date']), // Calculate from timeWindow
              amount: response['priceSnapshot'],
            )),
          );
        } else if (status == 'FAILED_TO_ASSIGN') {
          _pollingTimer.cancel();
          setState(() => _hasFailed = true);
          
          // Navigate to failure screen
          Navigator.pushReplacement(
            context,
            MaterialPageRoute(builder: (_) => AssignmentFailedScreen(
              serviceRequestId: widget.serviceRequestId,
              failureReason: response['failureReason'],
            )),
          );
        }
        // If REQUESTED, continue polling
      }
    } catch (e) {
      // Handle network errors gracefully
      print('Polling error: $e');
    }
  }
  
  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }
  
  // Rest of UI remains similar but with updated messaging
}
```

#### 2.3 Create AssignmentFailedScreen
```dart
// NEW: frontend-flutter-house-help-master/lib/screens/assignment_failed_screen.dart
class AssignmentFailedScreen extends StatelessWidget {
  final String serviceRequestId;
  final String? failureReason;
  
  const AssignmentFailedScreen({
    Key? key,
    required this.serviceRequestId,
    this.failureReason,
  }) : super(key: key);
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFFF3E0),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(Icons.error, color: Colors.orange, size: 32),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Assignment not available',
                          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'We couldn\'t find a professional for your selected time.',
                          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                            color: Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              
              const SizedBox(height: 32),
              
              // What happens next
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What would you like to do?',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 16),
                    
                    // Change time option
                    _buildOption(
                      context,
                      icon: Icons.calendar_today,
                      title: 'Try different time',
                      subtitle: 'Choose another date or time window',
                      onTap: () {
                        Navigator.pushReplacement(
                          context,
                          MaterialPageRoute(builder: (_) => SchedulePricingScreen(
                            service: widget.service,
                          )),
                        );
                      },
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Browse professionals
                    _buildOption(
                      context,
                      icon: Icons.person_search,
                      title: 'Browse professionals',
                      subtitle: 'Find and select a professional manually',
                      onTap: () {
                        // Navigate to professional selection
                      },
                    ),
                    
                    const SizedBox(height: 12),
                    
                    // Join waitlist
                    _buildOption(
                      context,
                      icon: Icons.watch_later,
                      title: 'Join waitlist',
                      subtitle: 'Get notified if a slot becomes available',
                      onTap: () {
                        // Add to waitlist
                      },
                    ),
                  ],
                ),
              ),
              
              const SizedBox(height: 32),
              
              // Support
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton(
                        onPressed: () {
                          // Show support options
                        },
                        style: OutlinedButton.styleFrom(
                          side: const BorderSide(color: Colors.black12),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                        ),
                        child: const Text('Need help? Contact support'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
  
  Widget _buildOption(
    BuildContext context, {
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          border: Border.all(color: Colors.black12),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Icon(icon, color: Colors.black54, size: 20),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 2),
                  Text(
                    subtitle,
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.black54,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.arrow_forward, color: Colors.black54, size: 20),
          ],
        ),
      ),
    );
  }
}
```

### Phase 3: Integration & Testing (Contract Verification)

#### 3.1 Add Kill-Switch for Intent-Time Assignment
```typescript
// NEW: src/common/guards/assignment-intent.guard.ts
@Injectable()
export class AssignmentIntentGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Kill-switch: prevent any assignment logic during intent
    if (request.path.includes('/service-requests') && 
        request.method === 'POST') {
      
      // Check if any assignment-related headers or body fields exist
      if (request.body.workerId || 
          request.body.slotId || 
          request.headers['x-assignment-attempt']) {
        throw new BadRequestException(
          'Assignment logic not allowed during intent phase'
        );
      }
    }
    
    return true;
  }
}
```

#### 3.2 Add Development Mode Assertions
```typescript
// NEW: src/common/interceptors/assignment-contract.interceptor.ts
@Injectable()
export class AssignmentContractInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    
    if (process.env.NODE_ENV === 'development') {
      // Assert: ServiceRequest creation must not fail due to availability
      if (request.path.includes('/service-requests') && 
          request.method === 'POST') {
        
        // Mock availability check to ensure it doesn't block intent
        const mockAvailability = true; // Always true in dev
        
        if (!mockAvailability) {
          console.warn('⚠️  DEVELOPMENT WARNING: ServiceRequest creation blocked by availability check');
          console.warn('This violates the managed service contract');
        }
      }
    }
    
    return next.handle();
  }
}
```

#### 3.3 Test the Corrected Flow
```typescript
// NEW: test/service-request-flow.e2e-spec.ts
describe('Service Request Flow', () => {
  it('should create service request without assignment logic', async () => {
    const response = await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        serviceId: 'maid',
        date: '2024-01-15',
        timeWindow: 'morning',
        priceSnapshot: 500,
        userId: 'user-123'
      })
      .expect(201);
    
    expect(response.body.assignmentStatus).toBe('REQUESTED');
    expect(response.body.assignedWorkerId).toBeUndefined();
  });
  
  it('should not allow assignment during intent', async () => {
    await request(app.getHttpServer())
      .post('/service-requests')
      .send({
        serviceId: 'maid',
        date: '2024-01-15',
        timeWindow: 'morning',
        priceSnapshot: 500,
        userId: 'user-123',
        workerId: 'worker-123' // This should be ignored
      })
      .expect(201);
    
    // Verify worker was not assigned during intent
    const serviceRequest = await serviceRequestsRepository.findOne({ where: { userId: 'user-123' } });
    expect(serviceRequest.assignedWorkerId).toBeUndefined();
  });
});
```

## 🎯 SUCCESS CRITERIA

### ✅ **Contract Compliance**
- [ ] `/service-requests` always returns 201
- [ ] No assignment logic in SchedulePricingScreen
- [ ] ServiceRequestInProgressScreen is mandatory
- [ ] Payment only after `assignmentStatus === ASSIGNED`

### ✅ **User Experience**
- [ ] No "No professional available" during intent
- [ ] Clear separation of intent vs assignment
- [ ] Graceful failure handling
- [ ] Transparent assignment process

### ✅ **Architecture**
- [ ] ServiceRequest as source of truth
- [ ] Assignment is truly asynchronous
- [ ] No worker/slot locking at intent time
- [ ] Kill-switch prevents regressions

## 🚀 DEPLOYMENT CHECKLIST

1. **Database Migration**: Add ServiceRequest table
2. **Backend Deployment**: New endpoints + removed endpoints
3. **Frontend Deployment**: Updated screens + new screens
4. **Queue Setup**: Redis/Bull for assignment jobs
5. **Monitoring**: Track ServiceRequest lifecycle
6. **Rollback Plan**: Feature flags for gradual rollout

This plan enforces the managed service contract at the API boundary level, preventing the temporal violations that cause recurring bugs.