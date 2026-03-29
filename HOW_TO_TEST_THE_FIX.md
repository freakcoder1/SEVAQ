# HOW TO TEST THE 500 ERROR FIX IN THE APP

## Quick Test Steps

### 1. Ensure You're Using the PRODUCTION Backend
- Open the Flutter app
- Go to settings/location
- Make sure it's pointing to: `https://sevaq-production.up.railway.app`

### 2. Test Creating a Booking
1. Open the SEVAQ app
2. Select a location (Greater Noida - Alpha 1)
3. Choose any service (Home Cleaning, Deep Cleaning, etc.)
4. Try to book it

**Expected Result:** 
- ✅ No 500 error
- ✅ Booking flow works
- ✅ Service request created successfully

### 3. Test via API (Quick Verification)

If you want to verify the services exist before testing in-app:

```bash
# Test service endpoint
curl https://sevaq-production.up.railway.app/api/services

# Should return JSON with services (not empty)
```

### 4. Test Service Request Creation

```bash
# Create a service request (you'll need auth token)
curl -X POST https://sevaq-production.up.railway.app/api/service-requests \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "serviceId": 2,
    "date": "2026-03-28",
    "timeWindow": "10:00-12:00"
  }'
```

**Expected:** Success (not 500 error)

## What Was Fixed

The 500 error happened because:
1. Database had **NO services** seeded
2. When creating a service request, PostgreSQL rejected it due to foreign key constraint
3. Now services are seeded with proper UUIDs, so foreign key validation passes

## If Still Getting Errors

Check Railway logs:
1. Go to Railway Dashboard
2. Find your backend service
3. Check "Deploy" → "Logs"

Common remaining issues:
- **auth token expired** - login again in app
- **wrong backend URL** - verify it's production URL
