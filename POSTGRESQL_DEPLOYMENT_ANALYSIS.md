# PostgreSQL Deployment Analysis & Fix Summary

## 📋 Overview

Your PostgreSQL database deployed successfully on Railway, but your application is experiencing multiple errors due to **database schema not being synchronized** and **seed data not being populated**. This document explains the root causes and the fixes already implemented.

---

## 🔍 Root Cause Analysis

### 1. **Database Tables Not Created** (CRITICAL)
**Error:**
```
ERROR: relation "service_profiles" does not exist
ERROR: relation "subscriptions" does not exist
ERROR: relation "booking" does not exist
ERROR: relation "worker" does not exist
```

**Root Cause:** TypeORM's `synchronize` option was disabled by default, so no tables were created when the application started.

**Location:** [`flutter-nest-househelp-master/src/app.module.ts:158`](flutter-nest-househelp-master/src/app.module.ts:158)
```typescript
synchronize: process.env.SYNCHRONIZE === 'true' || false, // Enable via SYNCHRONIZE=true
```

**Fix:** Set environment variable `SYNCHRONIZE=true` when deploying to Railway.

---

### 2. **Missing Seed Data** (CRITICAL)
**Error:**
```
ERROR: insert or update on table "service_requests" violates foreign key constraint "FK_07f8d78c034a3b01c8fe0921df3"
DETAIL: Key (serviceId)=(1) is not present in table "service".
```

**Root Cause:** The `service` table is empty because no seed data was loaded. Foreign key references fail.

**Fix:** Run the database seed command after deployment:
```bash
railway run npm run seed
```

---

### 3. **UUID Type Mismatch** (HIGH)
**Error:**
```
ERROR: invalid input syntax for type integer: "3a872ebb-7477-454e-a678-5719cdbd6ad3"
STATEMENT: INSERT INTO "waitlist"("userId"...
```

**Root Cause:** The `waitlist` table's `userId` column expects an integer but the application is passing a UUID string.

**Fix:** Already implemented in entity definitions - ensure UUID hooks are working properly.

---

### 4. **Missing publicId Values** (HIGH)
**Error:**
```
ERROR: null value in column "publicId" of relation "service" violates not-null constraint
ERROR: null value in column "publicId" of relation "user" violates not-null constraint
ERROR: null value in column "publicId" of relation "worker" violates not-null constraint
```

**Root Cause:** Entity hooks for generating UUIDs aren't triggering properly during INSERT operations.

**Fix:** Already implemented in entity decorators. The synchronize flag needs to be enabled for this to work.

---

### 5. **Duplicate Phone Numbers** (MEDIUM)
**Error:**
```
ERROR: duplicate key value violates unique constraint "UQ_8e1f623798118e629b46a9e6299"
Key (phone)=(+919876543219) already exists.
```

**Root Cause:** Attempting to create duplicate user records with the same phone number.

**Fix:** This is expected behavior - the seeder should check for existing records before inserting.

---

## ✅ Fixes Already Implemented

| # | Fix | Status |
|---|-----|--------|
| 1 | TypeORM synchronize via `SYNCHRONIZE=true` env var | ✅ Implemented in [`app.module.ts:158`](flutter-nest-househelp-master/src/app.module.ts:158) |
| 2 | UUID generation hooks in entities | ✅ Already exists |
| 3 | Fix waitlist type mismatch | ✅ Already in entity definitions |
| 4 | Service seeding | ✅ Added to seed script |
| 5 | Railway environment config | ✅ Added `railway.json` |

---

## 🚀 Deployment Steps to Fix

### Step 1: Set Railway Environment Variables

In your Railway dashboard, add these environment variables:

| Variable | Value | Purpose |
|----------|-------|---------|
| `SYNCHRONIZE` | `true` | Creates database tables on startup |
| `LOG_LEVEL` | `info` | Enable logging |
| `NODE_ENV` | `production` | Production mode |

### Step 2: Redeploy Backend

After setting the variables, redeploy your backend:
1. Go to Railway Dashboard
2. Find your deployed backend service
3. Click "Redeploy"

### Step 3: Run Seed Data

Once the backend is running, run the seed command:

```bash
# Using Railway CLI
railway run npm run seed

# Or via npx
npx -y @railway/cli run npm run seed
```

### Step 4: Disable Synchronize (After First Deploy)

After tables are created and seeded, you can either:
- Keep `SYNCHRONIZE=true` for development (easiest)
- Or set to `false` and use proper migrations for production

---

## 📊 Log Summary by Time Period

### Initial Startup (Lines 1-24)
- PostgreSQL 18.3 initialized successfully
- SSL certificates generated
- Database ready to accept connections ✅

### Mid-Day Errors (13:58 - 16:20)
- Continuous errors about missing tables
- Application trying to query non-existent tables

### Later Errors (18:01 - 18:44)
- Type mismatch errors (UUID passed where integer expected)
- NOT NULL constraint violations (publicId not generated)
- Foreign key violations (empty reference tables)

---

## 🎯 Priority Action Items

1. **IMMEDIATE:** Set `SYNCHRONIZE=true` in Railway environment variables
2. **IMMEDIATE:** Redeploy backend
3. **IMMEDIATE:** Run `npm run seed` via Railway CLI
4. **VERIFY:** Check logs for successful table creation
5. **MONITOR:** Test booking flow to ensure no FK violations

---

## 📝 Quick Fix Commands

```bash
# Login to Railway
railway login

# Link to project
railway link

# Set environment variable
railway variables set SYNCHRONIZE=true

# Redeploy
railway redeploy

# Run seed
railway run npm run seed
```

---

## Generated
2026-03-26

Based on: Railway PostgreSQL deployment logs analysis
