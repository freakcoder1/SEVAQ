# SEVAQ Root-Level Fixes Plan

## Executive Summary

This document outlines the critical root-level architectural issues discovered in the SEVAQ project that require immediate fixes. These are not cosmetic issues but fundamental problems affecting system stability, monitoring accuracy, and alerting reliability.

---

## Critical Issues Identified

### Issue 1: Subscription Scheduler Date Error

**Location**: `src/subscriptions/subscription-assignment.scheduler.ts:69`

**Problem**:
```typescript
this.logger.log(
  `Assigning primary worker for subscription ${subscription.id} ` +
  `(starts: ${subscription.startDate.toISOString()})`
);
```

**Root Cause**: 
- TypeORM returns `startDate` as a JavaScript Date object when loaded from PostgreSQL
- However, when the date is stored as a string or comes from JSON/raw queries, calling `.toISOString()` fails
- The error `subscription.startDate.toISOString is not a function` indicates `startDate` is not a proper Date instance

**Impact**:
- Subscription assignment scheduler fails for 5+ subscriptions every hour
- Workers are not being assigned to subscription bookings
- Revenue-impacting bug for subscription services

**Fix Strategy**:
```typescript
// Defensive date handling
const startDate = subscription.startDate instanceof Date 
  ? subscription.startDate 
  : new Date(subscription.startDate);
  
this.logger.log(
  `Assigning primary worker for subscription ${subscription.id} ` +
  `(starts: ${startDate.toISOString()})`
);
```

---

### Issue 2: Metrics Service Placeholder Implementations

**Location**: `src/metrics/metrics.service.ts:366-379`

**Problem**:
```typescript
private async getActiveUsersCount(): Promise<number> {
  return Math.floor(Math.random() * 1000); // Placeholder!
}

private async getActiveWorkersCount(): Promise<number> {
  return Math.floor(Math.random() * 500); // Placeholder!
}

private async getQueueLength(): Promise<number> {
  return Math.floor(Math.random() * 100); // Placeholder!
}
```

**Root Cause**:
- These methods were implemented with random number generators as placeholders
- Never replaced with actual database queries
- Used by alert system and monitoring dashboard

**Impact**:
- False "Queue Length High" alerts (random value 57 > threshold 50)
- Monitoring dashboard shows fake data
- Cannot trust system metrics for decision-making

**Fix Strategy**:
```typescript
private async getActiveUsersCount(): Promise<number> {
  // Count users with recent activity (last 30 minutes)
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
  const result = await this.userBehaviorMetricsRepository
    .createQueryBuilder('metric')
    .select('COUNT(DISTINCT metric.userId)', 'count')
    .where('metric.timestamp > :timestamp', { timestamp: thirtyMinutesAgo })
    .getRawOne();
  return parseInt(result?.count || '0', 10);
}

private async getActiveWorkersCount(): Promise<number> {
  // Count workers with isAvailable = true
  const result = await this.workerPerformanceMetricsRepository
    .createQueryBuilder('metric')
    .select('COUNT(DISTINCT metric.workerId)', 'count')
    .where('metric.timestamp > :timestamp', { timestamp: new Date(Date.now() - 60 * 60 * 1000) })
    .getRawOne();
  return parseInt(result?.count || '0', 10);
}

private async getQueueLength(): Promise<number> {
  // Get actual queue length from Bull or database
  // For now, return 0 since we don't have a real queue table
  return 0;
}
```

---

### Issue 3: Alert System False Positives

**Location**: `src/alerts/alerts.service.ts:54-95` and `src/metrics/metrics.service.ts:245-276`

**Problem**:
1. **Assignment Success Rate Alert**: Triggers when `assignmentSuccessRate = 0` (no assignments in last hour)
2. **System Health Alert**: Triggers when `systemHealth = 0` (string compared to number)
3. **Queue Length Alert**: Triggers on random values

**Root Cause**:
```typescript
// In alerts.service.ts
{
  id: 'assignment-success-rate-low',
  metricType: 'assignment_success_rate',
  threshold: 80,
  operator: 'lt',  // Less than 80%
  // ...
}

// In metrics.service.ts
const assignmentSuccessRate = totalAssignments > 0 
  ? (successfulAssignments / totalAssignments) * 100 
  : 0;  // Returns 0 when no data
```

When no assignments exist in the last hour, `assignmentSuccessRate = 0`, which is `< 80`, triggering the alert.

**Impact**:
- Alert fatigue: "ALERT ESCALATED: Assignment Success Rate Low" every 5 minutes
- "System Health Poor" alert at level 3 (highest)
- Team wastes time investigating non-issues

**Fix Strategy**:
```typescript
// Option 1: Don't calculate rate when no data
const assignmentSuccessRate = totalAssignments > 0 
  ? (successfulAssignments / totalAssignments) * 100 
  : null; // Return null instead of 0

// Option 2: Add minimum sample size
const MIN_SAMPLE_SIZE = 5;
const assignmentSuccessRate = totalAssignments >= MIN_SAMPLE_SIZE
  ? (successfulAssignments / totalAssignments) * 100 
  : 100; // Assume 100% when insufficient data

// Option 3: Skip alert when no data
private evaluateRule(value: number, rule: AlertRule): boolean {
  if (value === null || value === undefined) return false; // Skip if no data
  // ... rest of logic
}
```

---

### Issue 4: System Health Metric Type Mismatch

**Location**: `src/metrics/metrics.service.ts:271` and `src/alerts/alerts.service.ts:79`

**Problem**:
```typescript
// metrics.service.ts returns string
systemHealth: string; // 'excellent', 'good', 'fair', 'poor'

// alerts.service.ts compares to number
{
  metricType: 'system_health',
  threshold: 0,
  operator: 'eq',  // Equals 0
}
```

**Root Cause**:
- `calculateSystemHealth()` returns a string ('excellent', 'good', 'fair', 'poor')
- Alert rule expects a number and checks if `value === 0`
- String 'poor' !== 0, but the logic is fundamentally broken

**Impact**:
- "System Health Poor" alert logic is nonsensical
- Cannot properly monitor actual system health

**Fix Strategy**:
```typescript
// Option 1: Return numeric health score
private calculateSystemHealth(successRate: number, avgTime: number): number {
  if (successRate >= 90 && avgTime <= 300) return 100; // excellent
  if (successRate >= 80 && avgTime <= 600) return 75;  // good
  if (successRate >= 70 && avgTime <= 900) return 50;  // fair
  return 25; // poor
}

// Option 2: Fix alert rule to check string
{
  id: 'system-health-poor',
  metricType: 'system_health',
  threshold: 'poor',  // Compare to string
  operator: 'eq',
  // ...
}

// Then update evaluateRule to handle strings
private evaluateRule(value: string | number, rule: AlertRule): boolean {
  if (typeof value === 'string') {
    return rule.operator === 'eq' ? value === rule.threshold : false;
  }
  // ... numeric comparison
}
```

---

### Issue 5: Assignment Metric Recording Missing Data

**Location**: `src/metrics/metrics.service.ts:56-85`

**Problem**:
```typescript
async recordAssignmentMetric(
  assignment: any, // Assignment entity not yet created
  booking: Booking,
  worker: Worker,
  status: 'success' | 'failure' | 'timeout' | 'cancelled',
  metadata?: any
): Promise<void> {
  const metric = new AssignmentMetric();
  metric.assignmentId = assignment.id;
  metric.bookingId = booking.id;
  // ...
  metric.location = 'unknown'; // Hardcoded!
  metric.distance = 0; // Hardcoded!
  // ...
}
```

**Root Cause**:
- Comments indicate "Assignment entity not yet created"
- Location and distance are hardcoded to placeholder values
- Metric data is incomplete and unreliable

**Impact**:
- Cannot analyze performance by location
- Distance-based metrics are meaningless
- Analytics dashboard shows incomplete data

**Fix Strategy**:
```typescript
async recordAssignmentMetric(
  assignmentId: string,
  bookingId: string,
  userId: number,
  workerId: number,
  serviceType: string,
  location: { lat: number; lng: number },
  workerLocation: { lat: number; lng: number },
  status: 'success' | 'failure' | 'timeout' | 'cancelled',
  assignmentTime: number, // in seconds
  metadata?: any
): Promise<void> {
  const metric = new AssignmentMetric();
  metric.assignmentId = assignmentId;
  metric.bookingId = bookingId;
  metric.userId = userId;
  metric.workerId = workerId;
  metric.serviceType = serviceType;
  metric.location = `${location.lat},${location.lng}`;
  metric.timestamp = new Date();
  metric.status = status;
  metric.assignmentTime = assignmentTime;
  metric.distance = this.calculateHaversineDistance(location, workerLocation);
  // ...
}

private calculateHaversineDistance(
  loc1: { lat: number; lng: number },
  loc2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in km
  const dLat = this.toRadians(loc2.lat - loc1.lat);
  const dLon = this.toRadians(loc2.lng - loc1.lng);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.toRadians(loc1.lat)) * Math.cos(this.toRadians(loc2.lat)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}
```

---

## Implementation Priority

### Phase 1: Critical Fixes (Immediate)
1. **Subscription Scheduler Date Error** - Revenue-impacting
2. **Metrics Placeholder Fix** - Stop false alerts

### Phase 2: Alert System Fixes (Same Day)
3. **Assignment Success Rate Logic** - Stop alert fatigue
4. **System Health Type Mismatch** - Fix monitoring

### Phase 3: Data Quality (Next Sprint)
5. **Assignment Metric Recording** - Improve analytics

---

## Files to Modify

1. `src/subscriptions/subscription-assignment.scheduler.ts`
2. `src/metrics/metrics.service.ts`
3. `src/alerts/alerts.service.ts`
4. `src/metrics/entities/metric.entity.ts` (if schema changes needed)

---

## Testing Strategy

1. **Unit Tests**: Add tests for date handling edge cases
2. **Integration Tests**: Verify metrics calculation with real data
3. **Alert Testing**: Simulate various metric values to verify alert behavior
4. **Staging Deployment**: Run for 24 hours to verify no false alerts

---

## Success Criteria

- [ ] No more `toISOString is not a function` errors in logs
- [ ] Metrics show real data, not random numbers
- [ ] No false alerts when system is healthy
- [ ] Alerts only trigger for genuine issues
- [ ] Assignment metrics include accurate location and distance data
