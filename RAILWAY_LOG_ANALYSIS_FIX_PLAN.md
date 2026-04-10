# Railway Backend Log Analysis - Fix Plan

## Executive Summary

This document addresses two critical issues identified in the Railway backend logs:

1. **Push Notification Issue**: Firebase Admin SDK not initialized due to missing FIREBASE_SERVICE_ACCOUNT environment variable
2. **Subscription Assignment Error**: serviceId type mismatch - UUID passed where integer expected

---

## Issue 1: Firebase Push Notification Not Initialized

### Root Cause Analysis

The error "Firebase Admin SDK not initialized, skipping push notification" occurs because:

1. The `NotificationsService` in [`notifications.service.ts`](flutter-nest-househelp-master/src/notifications/notifications.service.ts:52) attempts to initialize Firebase Admin SDK in the `initializeFirebase()` method
2. The initialization checks for `FIREBASE_SERVICE_ACCOUNT` environment variable (lines 54-106)
3. If the variable is not set or improperly configured, Firebase initialization fails silently
4. Push notifications are then skipped when attempting to send

### Current Code Flow

```typescript
// notifications.service.ts - Lines 52-107
private initializeFirebase(): void {
  const serviceAccountJson = this.configService.get('FIREBASE_SERVICE_ACCOUNT');
  // ... checks if credentials exist
  if (!serviceAccountJson.includes('service_account')) {
    console.warn('Firebase Admin SDK credentials not configured, push notifications will be skipped');
  }
}
```

### Fix Plan for Railway Deployment

**Step 1**: Add Firebase credentials to Railway environment variables

Navigate to Railway dashboard → Your Project → Variables tab:

| Variable | Value |
|----------|-------|
| `FIREBASE_SERVICE_ACCOUNT` | Full Firebase service account JSON (must contain `"type": "service_account"`) |
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |

**Step 2**: Alternative - Use individual credentials if JSON doesn't work:

| Variable | Value |
|----------|-------|
| `FIREBASE_PROJECT_ID` | Your Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | client_email from service account |
| `FIREBASE_PRIVATE_KEY` | Private key (replace newlines with `\n`) |

**Step 3**: Redeploy the backend on Railway to pick up new environment variables

---

## Issue 2: Subscription Assignment Type Error

### Root Cause Analysis

The error "invalid input syntax for type integer: 7ff3de68-1068-4cbf-8f9f-9d283bca1f5b" occurs because:

1. **Data Type Mismatch**:
   - [`Booking.entity.ts`](flutter-nest-househelp-master/src/bookings/entities/booking.entity.ts:69) defines `serviceId` as `number` (integer)
   - [`Service.entity.ts`](flutter-nest-househelp-master/src/services/entities/service.entity.ts:18) has `id: number` (internal) and `publicId: string` (UUID)
   
2. **SubscriptionAssignmentScheduler** ([`subscription-assignment.scheduler.ts`](flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts:31-35)) uses hardcoded UUIDs:
   ```typescript
   const SERVICE_NAME_TO_ID: Record<string, string> = {
     'Cooking': '7f8e4b5c-a883-4c6c-b348-f966508fd49d',
     'Home Cleaning': '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
     'Maid Service': '7ff3de68-1068-4cbf-8f9f-9d283bca1f5b',
   };
   ```

3. When creating bookings (lines 452-469), the scheduler passes the UUID string as `serviceId`:
   ```typescript
   const bookingData = {
     serviceId, // This is a UUID string!
     date: tomorrow.toISOString().split('T')[0],
     // ...
   };
   ```

4. PostgreSQL expects an integer for the serviceId column, but receives a UUID string, causing the syntax error.

### Most Likely Source (Based on Analysis)

**Primary Issue**: The `SubscriptionAssignmentScheduler` passes UUID strings (publicId) to booking creation, but the Booking entity expects integer service IDs.

**Secondary Contributing Factor**: The scheduler's `SERVICE_NAME_TO_ID` mapping uses hardcoded UUIDs that may not match the actual Service table's `publicId` values in production.

### Fix Plan for Subscription serviceId Type Issue

**Option A: Quick Fix - Convert UUID to Integer ID (Recommended)**

Modify [`subscription-assignment.scheduler.ts`](flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts) to look up the actual integer `id` from the Service table using the `publicId`:

```typescript
// Add this method to SubscriptionAssignmentScheduler
private async getServiceIdByName(serviceName: string): Promise<number | null> {
  const service = await this.serviceRepository.findOne({
    where: { name: serviceName },
  });
  return service ? service.id : null;
}

// Modify assignWorkerForSubscription to use integer IDs
const serviceId = await this.getServiceIdByName(serviceName);
// Then pass serviceId (now integer) to booking creation
```

**Option B: Alternative - Query by publicId**

```typescript
private async getServiceIdByPublicId(publicId: string): Promise<number | null> {
  const service = await this.serviceRepository.findOne({
    where: { publicId: publicId },
  });
  return service ? service.id : null;
}

// Usage in booking creation
const serviceUuid = SERVICE_NAME_TO_ID[serviceName];
const serviceId = await this.getServiceIdByPublicId(serviceUuid);
```

**Option C: Full Fix - Use ServiceProfile for Service Lookup**

Instead of hardcoded mappings, use the subscription's `serviceProfile` to find the correct service:

```typescript
async assignWorkerForSubscription(subscription: Subscription): Promise<...> {
  // Get service from serviceProfile
  const service = await this.serviceRepository.findOne({
    where: { category: subscription.serviceProfile.serviceType },
  });
  
  if (!service) {
    return { success: false, reason: 'Service not found' };
  }
  
  const serviceId = service.id; // This is an integer!
  // Use serviceId in booking creation
}
```

### Implementation Steps

1. **Modify** [`subscription-assignment.scheduler.ts`](flutter-nest-househelp-master/src/subscriptions/subscription-assignment.scheduler.ts):
   - Add method to convert service name/publicId to integer ID
   - Update `assignWorkerForSubscription` to use integer IDs
   - Remove hardcoded UUID mapping or use it only for worker lookup

2. **Test the fix**:
   - Create a test subscription and trigger the scheduler
   - Verify booking is created without integer conversion errors
   - Check Railway logs for successful assignment

---

## Summary

| Issue | Root Cause | Fix |
|-------|-----------|-----|
| Push Notification | Missing FIREBASE_SERVICE_ACCOUNT env var in Railway | Add Firebase credentials to Railway environment variables |
| ServiceId Type Error | UUID passed to integer column | Convert UUID to integer ID using Service table lookup |

The subscription serviceId issue is a code bug that needs to be fixed in the backend, while the Firebase issue is a deployment configuration issue on Railway.