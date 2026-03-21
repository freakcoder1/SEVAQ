# SEVAQ Availability Notification System - Comparison & Implementation Plan

## Executive Summary

**Task**: Compare the new "Immediate Availability Notification" model with the current subscription assignment flow and create an implementation plan.

---

## Current Flow vs New Model Comparison

### Current Flow (As-Is)

| Aspect | Current Implementation |
|--------|----------------------|
| **Availability Detection** | ❌ None - only assignment detection |
| **User Notification** | ❌ Silent until assignment (24-48h before start) |
| **UI State** | Always shows "Professional assignment pending" |
| **Worker Identity** | Revealed only at assignment time |
| **User Reassurance** | Low - user anxious "is anything happening?" |
| **Commitment Timeline** | Assignment locked only within 24h window |

**Current Timeline:**
```
Payment → ACTIVE subscription → [SILENT 24-48h] → Assignment → Worker revealed
```

### New Model (Proposed)

| Aspect | New Implementation |
|--------|-------------------|
| **Availability Detection** | ✅ Can happen ANY time after payment |
| **User Notification** | ✅ Immediate (availability, NOT assignment) |
| **UI State** | Shows "Professional available" after detection |
| **Worker Identity** | ❌ Still hidden until 24h assignment window |
| **User Reassurance** | High - "Something is happening!" |
| **Commitment Timeline** | Availability signal early, Assignment still locked |

**New Timeline:**
```
Payment → ACTIVE → [AVAILABLE DETECTED] → Notify user → [24h window] → Assignment → Worker revealed
                                                    ↑
                                           Commitment happens here
```

---

## Key Differences

### 1. Notification Timing

| | Current | New Model |
|---|---------|-----------|
| **When Notified** | Only at assignment (24-48h before) | Immediately when availability detected |
| **What User Sees** | "Your SEVAQ professional is assigned" | "A SEVAQ professional is available" |
| **Worker Identity** | Full profile shown | Identity hidden |
| **Message Type** | Commitment (assignment) | Reassurance (availability) |

### 2. UI State Transitions

```
CURRENT FLOW:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Payment         │────▶│ Pending         │────▶│ Assigned        │
│ Confirmed       │     │ (Silent)        │     │ (Worker shown)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘

NEW MODEL:
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│ Payment         │────▶│ Available       │────▶│ Assignment      │────▶│ Worker Revealed │
│ Confirmed       │     │ (Notify user)   │     │ (Lock worker)   │     │ (Full profile)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘     └─────────────────┘
                          ↑                                                                   │
                          └─ Optional state (if availability detected before 24h window) ─────┘
```

### 3. Database Changes Required

```sql
-- NEW FIELD (optional, non-breaking)
ALTER TABLE subscriptions ADD COLUMN availabilityDetectedAt TIMESTAMP DEFAULT NULL;

-- No changes to assignment timing logic
-- No changes to worker assignment fields
```

### 4. Notification Copy Differences

| Context | Current | New Model |
|---------|---------|----------|
| **Early Notification** | ❌ Not applicable | "A SEVAQ professional is available. We'll confirm and assign them within 24 hours of your start date." |
| **Assignment Notification** | "Your SEVAQ professional is assigned. They'll visit daily during your selected time window." | Same (unchanged) |

---

## Backend Implementation Changes

### 1. New Field in Subscription Entity

```typescript
// In subscription.entity.ts (already exists conceptually)
@Column({ type: 'timestamp', nullable: true })
availabilityDetectedAt: Date | null;
```

### 2. Availability Detection Logic

**Option A: Proactive Worker Matching (Recommended)**
- Run a background job periodically (e.g., every 15 minutes)
- For each ACTIVE subscription without `availabilityDetectedAt`
- Check if any qualified worker is available in the subscription's location/time window
- If found → set `availabilityDetectedAt` → trigger notification

**Option B: Reactive Availability Check**
- When subscription is created, immediately check availability
- If available → set field and notify
- If not available → do nothing (scheduler will retry later)

### 3. Scheduler Logic Extensions

```typescript
// Current: Only assigns within 24-48h window
// New: Also detects availability ANY time

@Cron(CronExpression.EVERY_15_MINUTES)
async handleAvailabilityDetection() {
  // For each ACTIVE subscription without availabilityDetectedAt
  // Check if a qualified worker is available
  // If yes → set availabilityDetectedAt → send notification
}

// Assignment logic remains unchanged (24-48h before start)
@Cron(CronExpression.EVERY_MINUTE)
async handleSubscriptionAssignments() {
  // Existing logic for assigning within 24h window
}
```

### 4. Notification Service Integration

```typescript
async notifyAvailabilityDetected(subscription: Subscription) {
  await this.notificationsService.send({
    userId: subscription.userId,
    type: 'SUBSCRIPTION_AVAILABILITY_DETECTED',
    title: 'Professional Available',
    body: 'A SEVAQ professional is available for your service. We\'ll confirm and assign them within 24 hours of your start date.',
    data: {
      subscriptionId: subscription.id,
      availabilityDetectedAt: new Date().toISOString(),
    }
  });
}
```

---

## Frontend Changes Required

### 1. Subscription Details Screen State

```dart
// Current
enum SubscriptionWorkerState {
  pending,      // Before assignment
  assigned,     // After assignment
}

// New
enum SubscriptionWorkerState {
  pending,           // No availability detected
  availableDetected, // Worker available (not yet assigned)
  assigned,          // Worker officially assigned
}
```

### 2. UI Copy Changes

| State | Current Copy | New Model Copy |
|-------|-------------|---------------|
| **Pending** | "Professional assignment pending" | "Professional assignment pending" (unchanged) |
| **Available Detected** | ❌ Not applicable | "Professional available. Final assignment will be confirmed before service begins." |
| **Assigned** | "Your SEVAQ professional is assigned" | "Your SEVAQ professional is assigned" (unchanged) |

### 3. Notification Handling

```dart
// When receiving SUBSCRIPTION_AVAILABILITY_DETECTED notification
void handleAvailabilityDetected(NotificationPayload payload) {
  // Update subscription state
  subscriptionBloc.add(UpdateSubscriptionState(
    state: SubscriptionWorkerState.availableDetected,
    availabilityDetectedAt: payload.availabilityDetectedAt,
  ));
  
  // Show confirmation dialog or snackbar
  showNotificationSnackBar(
    title: 'Professional Available',
    message: 'A SEVAQ professional is available for your service.',
  );
}
```

---

## Key Principles (From Your Specification)

### ✅ What IS Allowed
1. Notify immediately when availability is detected
2. Reassure user with availability signal
3. Change UI state to show confidence
4. Set `availabilityDetectedAt` timestamp
5. Keep assignment locked within 24h window

### ❌ What IS NOT Allowed
1. Show worker name, photo, or contact early
2. Make commitment (assignment) before 24h window
3. Promise specific worker ownership
4. Enable contact before service begins

### 🔐 Separation of Concerns

```
AVAILABILITY SIGNAL          ASSIGNMENT COMMITMENT
───────────────────          ──────────────────────
• Confidence indicator       • Worker locked in
• Happens anytime           • Only 24h before start
• No identity revealed       • Full profile shown
• Soft reassurance           • Hard commitment
```

---

## Implementation Priority

### Phase 1: Backend Foundation
- [ ] Add `availabilityDetectedAt` field to subscription entity
- [ ] Create availability detection scheduler (runs every 15 min)
- [ ] Add notification service integration
- [ ] Test availability detection logic

### Phase 2: Notification System
- [ ] Create notification type `SUBSCRIPTION_AVAILABILITY_DETECTED`
- [ ] Implement push notification sending
- [ ] Test notification delivery

### Phase 3: Frontend Updates
- [ ] Update subscription state enum
- [ ] Update Subscription Details screen UI
- [ ] Handle availability notification in app
- [ ] Test full flow

### Phase 4: Validation & Testing
- [ ] End-to-end testing
- [ ] Verify no early worker identity exposure
- [ ] Verify assignment still happens within 24h window
- [ ] User acceptance testing

---

## Risk Assessment

| Risk | Mitigation |
|------|------------|
| Worker availability changes after detection | Assignment still happens within 24h, giving final confirmation |
| User expects worker identity immediately | Clear copy: "available" vs "assigned", no profile shown |
| Notification spam | Only one notification per subscription (first availability detection) |
| Performance impact | Background job with throttling, no real-time blocking |

---

## Conclusion

The new model addresses a **real user pain point** (silence after payment) while **preserving system integrity** (assignment commitment still locked to 24h window).

This is a **trust infrastructure improvement**:
- Speed: Users feel something is happening immediately
- Safety: No broken promises (worker not committed until 24h)
- Clarity: Clear distinction between "available" and "assigned"

**Recommendation**: Proceed with implementation. The changes are minimal, non-breaking, and provide significant UX improvement.
