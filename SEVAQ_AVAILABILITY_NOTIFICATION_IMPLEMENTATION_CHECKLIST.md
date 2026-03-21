# SEVAQ Availability Notification Implementation Checklist

## Phase 1: Database & Backend Foundation

### 1.1 Database Migration
- [ ] Create SQL migration to add `availabilityDetectedAt` column to subscriptions table
  ```sql
  ALTER TABLE subscriptions ADD COLUMN availabilityDetectedAt TIMESTAMP DEFAULT NULL;
  ```

### 1.2 Update Subscription Entity
- [ ] Add `availabilityDetectedAt` field to [`Subscription`](flutter-nest-househelp-master/src/subscriptions/entities/subscription.entity.ts:1) entity
  ```typescript
  @Column({ type: 'timestamp', nullable: true })
  availabilityDetectedAt: Date | null;
  ```

### 1.3 Create Availability Detection Service
- [ ] Create new file: `flutter-nest-househelp-master/src/availability/availability-detection.service.ts`
- [ ] Implement `detectAndNotifyAvailability()` method
- [ ] Query all ACTIVE subscriptions where:
  - `availabilityDetectedAt IS NULL`
  - `startDate > now` (future subscriptions)
- [ ] For each subscription, check worker availability using existing [`AvailabilityService`](flutter-nest-househelp-master/src/availability/availability.service.ts:1)
- [ ] If worker available:
  - Set `subscription.availabilityDetectedAt = new Date()`
  - Save subscription
  - Trigger notification

### 1.4 Add Notification Service Integration
- [ ] Add notification type enum value: `SUBSCRIPTION_AVAILABILITY_DETECTED`
- [ ] Implement [`sendAvailabilityDetectedNotification()`](flutter-nest-househelp-master/src/notifications/notifications.service.ts:1) method
- [ ] Notification payload:
  ```typescript
  {
    type: 'SUBSCRIPTION_AVAILABILITY_DETECTED',
    userId: string,
    title: 'Professional Available',
    body: 'A SEVAQ professional is available for your service. We\'ll confirm and assign them within 24 hours of your start date.',
    data: {
      subscriptionId: number,
      availabilityDetectedAt: string,
    }
  }
  ```

### 1.5 Create Availability Detection Scheduler
- [ ] Create new scheduler: `flutter-nest-househelp-master/src/subscriptions/availability-detection.scheduler.ts`
- [ ] Add `@Cron(CronExpression.EVERY_15_MINUTES)` decorator
- [ ] Implement [`handleAvailabilityDetection()`](flutter-nest-househelp-master/src/subscriptions/availability-detection.scheduler.ts:1) method
- [ ] Register scheduler in [`SubscriptionsModule`](flutter-nest-househelp-master/src/subscriptions/subscriptions.module.ts:1)

### 1.6 Extend Subscription Assignment Scheduler
- [ ] Update [`SubscriptionAssignmentScheduler`](flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts:1) to skip subscriptions with `availabilityDetectedAt` set (no duplicate detection)
- [ ] Add logging for availability detection status

---

## Phase 2: API Endpoints

### 2.1 Subscription Details Endpoint Updates
- [ ] Update [`SubscriptionsService.getSubscriptionById()`](flutter-nest-househelp-master/src/subscriptions/subscriptions.service.ts:1) to include `availabilityDetectedAt` in response
- [ ] Add computed field `availabilityStatus`:
  ```typescript
  get availabilityStatus() {
    if (this.assignedWorkerId) return 'ASSIGNED';
    if (this.availabilityDetectedAt) return 'AVAILABLE_DETECTED';
    return 'PENDING';
  }
  ```

### 2.2 New Availability Check Endpoint (Optional)
- [ ] Add endpoint: `GET /subscriptions/:id/availability-status`
- [ ] Returns:
  ```typescript
  {
    status: 'PENDING' | 'AVAILABLE_DETECTED' | 'ASSIGNED',
    availabilityDetectedAt?: string,
    assignedAt?: string,
    message?: string,
  }
  ```

---

## Phase 3: Frontend Implementation

### 3.1 Update Subscription Model
- [ ] Add `availabilityDetectedAt` field to [`Subscription`](frontend-flutter-house-help-master/lib/models/subscription.dart:1) model
- [ ] Add computed getter `workerState`:
  ```dart
  enum WorkerState { pending, availableDetected, assigned }
  
  WorkerState get workerState {
    if (assignedWorkerId != null) return WorkerState.assigned;
    if (availabilityDetectedAt != null) return WorkerState.availableDetected;
    return WorkerState.pending;
  }
  ```

### 3.2 Update Subscription Details Screen
- [ ] Modify [`SubscriptionDetailsScreen`](frontend-flutter-house-help-master/lib/screens/subscription_details_screen.dart:1) to handle three states
- [ ] Add UI for `availableDetected` state:
  ```dart
  Container(
    child: Column(
      children: [
        Icon(Icons.check_circle, color: Colors.green),
        Text('Professional available'),
        Text('Final assignment will be confirmed before service begins', 
             style: TextStyles.subtitle),
      ],
    ),
  )
  ```

### 3.3 Update Notification Handling
- [ ] Add handler for `SUBSCRIPTION_AVAILABILITY_DETECTED` in [`NotificationService`](frontend-flutter-house-help-master/lib/services/notification_service.dart:1)
- [ ] When received:
  - Refresh subscription data
  - Show snackbar/dialog: "A professional is available for your service!"
  - Update UI state to `availableDetected`

### 3.4 Update Subscription Bloc/Provider
- [ ] Add state: `SubscriptionAvailableDetected`
- [ ] Emit state when `availabilityDetectedAt` is set
- [ ] Update UI based on new state

---

## Phase 4: Copy & Messaging

### 4.1 Notification Copy
- [ ] Title: "Professional Available"
- [ ] Body: "A SEVAQ professional is available for your service. We'll confirm and assign them within 24 hours of your start date."
- [ ] Do NOT include: Worker name, photo, contact info

### 4.2 In-App Message Copy
- [ ] Available Detected State:
  ```
  "Professional available
   Final assignment will be confirmed before service begins"
  ```
- [ ] Assignment Confirmed State (unchanged):
  ```
  "Your SEVAQ professional is assigned
   They'll visit daily during your selected time window"
  ```

---

## Phase 5: Testing

### 5.1 Backend Testing
- [ ] Test availability detection finds qualified workers
- [ ] Test notification is sent only once per subscription
- [ ] Test scheduler runs every 15 minutes
- [ ] Test `availabilityDetectedAt` is saved correctly
- [ ] Test assignment still happens within 24h window

### 5.2 Frontend Testing
- [ ] Test UI shows "available" state after notification
- [ ] Test notification click navigates to subscription details
- [ ] Test state transitions: pending → availableDetected → assigned
- [ ] Test no worker identity shown in availableDetected state

### 5.3 Integration Testing
- [ ] End-to-end flow: subscription creation → availability detection → notification → UI update → assignment
- [ ] Verify no early worker identity exposure
- [ ] Verify assignment timing compliance

---

## Phase 6: Deployment & Monitoring

### 6.1 Database Migration
- [ ] Run migration in development
- [ ] Run migration in staging
- [ ] Run migration in production (with backup)

### 6.2 Backend Deployment
- [ ] Deploy new scheduler
- [ ] Monitor logs for availability detection
- [ ] Monitor notification delivery rate

### 6.3 Frontend Deployment
- [ ] Deploy updated app
- [ ] Monitor crash reports
- [ ] Monitor notification handling

---

## File Changes Summary

### New Files to Create
| File | Purpose |
|------|---------|
| `src/availability/availability-detection.service.ts` | Core availability detection logic |
| `src/subscriptions/availability-detection.scheduler.ts` | 15-minute scheduler job |

### Files to Modify
| File | Changes |
|------|---------|
| `src/subscriptions/entities/subscription.entity.ts` | Add `availabilityDetectedAt` field |
| `src/subscriptions/subscriptions.service.ts` | Include `availabilityDetectedAt` in responses |
| `src/subscriptions/subscriptions.module.ts` | Register new services |
| `src/notifications/notifications.service.ts` | Add availability notification method |
| `lib/models/subscription.dart` | Add `availabilityDetectedAt` and state getter |
| `lib/screens/subscription_details_screen.dart` | Handle availableDetected state |
| `lib/services/notification_service.dart` | Handle availability notification |

---

## Rollback Plan

If issues arise:
1. Disable the availability detection scheduler
2. Frontend continues to work (gracefully degrades to pending state)
3. Original assignment logic remains unchanged
4. Remove `availabilityDetectedAt` column if needed (nullable, no data loss)

---

## Success Criteria

- [ ] Users receive availability notification within 15 minutes of subscription creation (when worker available)
- [ ] No worker identity exposed before 24h assignment window
- [ ] Assignment still happens within 24-48h of start date
- [ ] UI clearly distinguishes "available" from "assigned"
- [ ] Zero notification spam (one notification per subscription)
- [ ] All existing functionality preserved
