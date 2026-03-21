# Assignment Columns Fix Plan

## Problem
The backend is showing non-critical errors about missing assignment columns in the database.

## Analysis

### Booking Entity Expected Columns
Based on [`booking.entity.ts`](flutter-nest-househelp-master/src/bookings/entities/booking.entity.ts), the following assignment-related columns are expected:

| Column | Type | Default | Nullable |
|--------|------|---------|----------|
| `assignmentState` | TEXT | 'pending' | No |
| `assignmentType` | TEXT | - | Yes |
| `assignmentExpiresAt` | TIMESTAMP | - | Yes |
| `assignmentStartsAt` | TIMESTAMP | - | Yes |
| `assignedWorkerId` | INTEGER | - | Yes |
| `assignmentReason` | TEXT | - | Yes |
| `reassignmentCount` | INTEGER | 0 | No |
| `assignmentTimestamp` | TIMESTAMP | - | Yes |
| `assignmentMetadata` | TEXT | - | Yes |

### Existing Migration Files
1. [`add-assignment-columns.sql`](flutter-nest-househelp-master/add-assignment-columns.sql) - Missing `assignmentState`, `assignedWorkerId`, `assignmentTimestamp`, `assignmentMetadata`
2. [`add-all-assignment-columns.js`](flutter-nest-househelp-master/src/database/add-all-assignment-columns.js) - Has inconsistency (adds `assignmentState` but names it `assignmentType` in query)

## Solution

### Step 1: Create Comprehensive SQL Migration
Create a new SQL file that adds all missing columns with proper `IF NOT EXISTS` clauses.

### Step 2: Run the Migration
Execute the SQL migration against the PostgreSQL database.

### Step 3: Verify
Check that the backend no longer shows column-related errors.

## SQL Migration Script
```sql
-- Add all missing assignment columns for SEVAQ assignment system

ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentState TEXT DEFAULT 'pending';
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentType TEXT;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentExpiresAt TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentStartsAt TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignedWorkerId INTEGER;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentReason TEXT;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS reassignmentCount INTEGER DEFAULT 0;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentTimestamp TIMESTAMP;
ALTER TABLE booking ADD COLUMN IF NOT EXISTS assignmentMetadata TEXT;
```

## Files to Create/Modify
1. Create: `flutter-nest-househelp-master/add-all-missing-assignment-columns.sql`
