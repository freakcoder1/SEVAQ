# Service Request 500 Error - FIXED & READY TO DEPLOY

## ✅ Fix Applied

I've fixed the seed script - it was missing `publicId` for most services. Now all services properly generate UUIDs.

The backend has been rebuilt successfully with `npm run build`.

## How to Deploy to Railway

Since Railway CLI needs authentication, you have two options:

### Option 1: GitHub Deploy (Recommended)

1. **Push the code to GitHub:**
```bash
git add .
git commit -m "Fix service seeding - add publicId to all services"
git push origin main
```

2. **Railway will automatically deploy** when it detects the push to the linked repository.

### Option 2: Manual Railway Upload

1. Go to Railway Dashboard: https://railway.com/dashboard
2. Find your project (sevaq-production)
3. Click on the backend service
4. Click "Deploy" button
5. Upload the built files or connect to GitHub

### Option 3: Railway CLI (If logged in)

If you have Railway CLI installed and logged in:
```bash
cd flutter-nest-househelp-master
railway up
```

## After Deployment - Run Seed Script

Once deployed, run the seed script to populate services:

```bash
railway run node dist/database/seed-railway.js
```

Or via Railway Dashboard:
1. Go to your project → backend service
2. Click "Run" tab
3. Run: `node dist/database/seed-railway.js`

## Verify Services

Check if services exist:
```bash
curl https://sevaq-production.up.railway.app/api/services
```

Should return array with services like:
```json
[{"id":1,"publicId":"...","name":"Home Cleaning",...},...]
```

## Why This Fixes the 500 Error

The 500 error occurred because:
1. The `service` table was empty - no services seeded
2. When app tried to create a service request with `serviceId: 1`, it failed due to foreign key constraint

This fix seeds all 7 services with proper UUIDs, allowing bookings to work.
