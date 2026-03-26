# PostgreSQL Deployment Log Analysis

## Executive Summary

Your PostgreSQL database on Railway deployed successfully, but your application's entities/tables are not properly synchronized with the database. This document analyzes the logs and provides actionable fixes.

---

## Log Analysis by Timestamp

### ✅ Phase 1: Successful PostgreSQL Startup (12:44:22 - 12:44:24)

```
[inf] Mounting volume on: /var/lib/containers/railwayapp/bind-mounts/...
[inf] fixing permissions on existing directory /var/lib/postgresql/data/pgdata ... ok
[inf] selecting dynamic shared memory implementation ... posix
[inf] selecting default "max_connections" ... 100
[inf] selecting default "shared_buffers" ... 128MB
[inf] creating configuration files ... ok
[inf] running bootstrap script ... ok
[inf] performing post-bootstrap initialization ... ok
[inf] Success. You can now start the database server using:
[inf] pg_ctl -D /var/lib/postgresql/data/pgdata -l logfile start
[inf] CREATE DATABASE
[inf] PostgreSQL init process complete; ready for start up.
[inf] starting PostgreSQL 18.3 (Debian 18.3-1.pgdg13+1) on x86_64-pc-linux-gnu
[inf] listening on IPv4 address "0.0.0.0", port 5432
[inf] database system is ready to accept connections
```

**Status**: ✅ Database is running and accepting connections on port 5432.

---

### ❌ Phase 2: Missing Tables Error (Starting 13:58:51)

**First Error Pattern**:
```
2026-03-25T13:58:51.558716935Z [err] ERROR: relation "service_profiles" does not exist at character 980
2026-03-25T13:58:51.558721808Z [err] STATEMENT: SELECT "ServiceProfile"."id" AS "ServiceProfile_id", 
"ServiceProfile"."publicId" AS "ServiceProfile_publicId", ... FROM "service_profiles" "ServiceProfile" 
WHERE (("ServiceProfile"."serviceType" = $1) AND ("ServiceProfile"."profileName" = $2)) LIMIT 1
```

**Analysis**: The `service_profiles` table doesn't exist in the database.

**Tables Affected**:
- `service_profiles`
- `subscriptions`
- `booking`
- `worker`
- `service`
- `service_requests`
- `assignment_metrics`
- `waitlist`
- `user`
- `micro_zone`

**Root Cause**: TypeORM synchronize is set to `false` or migrations were never run.

---

### ❌ Phase 3: Type Mismatch Errors (Starting 18:01:31)

**Error Pattern**:
```
2026-03-25T18:01:31.404781547Z [err] ERROR: invalid input syntax for type integer: "3a872ebb-7477-454e-a678-5719cdbd6ad3"
2026-03-25T18:01:31.404785102Z [err] CONTEXT: unnamed portal parameter $1 = '...'
2026-03-25T18:01:31.404789773Z [err] STATEMENT: INSERT INTO "waitlist"("userId", "serviceId", ...) VALUES ($1, $2, ...)
```

**Analysis**: The `waitlist` table's `userId` column is defined as `integer` but the application is passing a UUID string `"3a872ebb-7477-454e-a678-5719cdbd6ad3"`.

**Fix Required**: Change `userId` column type to `UUID` in both entity and database.

---

### ❌ Phase 4: Foreign Key Constraint Errors (Starting 18:01:31)

**Error Pattern**:
```
2026-03-25T18:01:31.404798210Z [err] ERROR: insert or update on table "service_requests" violates foreign key constraint "FK_07f8d78c034a3b01c8fe0921df3"
2026-03-25T18:01:31.404798210Z [err] DETAIL: Key (serviceId)=(3) is not present in table "service".
```

**Analysis**: The `service` table is empty. When trying to insert into `service_requests` with `serviceId = 3`, it fails because there's no corresponding record in the `service` table.

**Fix Required**: Seed the `service` table with initial service data.

---

### ❌ Phase 5: NULL Constraint Errors (Starting 15:57:28)

**Error Pattern 1** - Missing serviceAreaId:
```
2026-03-26T15:57:28.869133206Z [err] ERROR: null value in column "serviceAreaId" of relation "micro_zone" violates not-null constraint
2026-03-26T15:57:28.869139937Z [err] DETAIL: Failing row contains (057e87d7-3a09-4817-b27b-c45cc492df2f, Greater Noida - Alpha 1, null, 28.5805000, 77.4392000, 2.00, static, t, ...)
```

**Error Pattern 2** - Missing publicId:
```
2026-03-26T16:12:13.009674092Z [err] ERROR: null value in column "publicId" of relation "service" violates not-null constraint
2026-03-26T16:12:13.009678233Z [err] DETAIL: Failing row contains (1, null, Home Cleaning, Complete home cleaning service, 500.00, ...)
```

**Error Pattern 3** - Missing publicId for user:
```
2026-03-26T16:16:53.377338821Z [err] ERROR: null value in column "publicId" of relation "user" violates not-null constraint
```

**Error Pattern 4** - Missing publicId for worker:
```
2026-03-26T16:18:33.050933761Z [err] ERROR: null value in column "publicId" of relation "worker" violates not-null constraint
```

**Root Cause**: Entities don't have `@BeforeInsert()` hooks to generate UUIDs for `publicId` and other required fields.

---

### ✅ Phase 6: Expected Unique Constraint Error (16:21:43)

```
2026-03-26T16:21:43.250422460Z [err] ERROR: duplicate key value violates unique constraint "UQ_8e1f623798118e629b46a9e6299"
2026-03-26T16:21:43.250425839Z [err] DETAIL: Key (phone)=(+919876543219) already exists.
```

**Analysis**: ✅ This is CORRECT behavior - the phone number already exists in the database, preventing duplicate registrations.

---

### ⚠️ Phase 7: Non-Critical pg_stat_statements Error

```
2026-03-25T18:43:50.858091846Z [err] ERROR: relation "pg_stat_statements" does not exist at character 378
```

**Analysis**: This is a Railway monitoring query trying to use the `pg_stat_statements` extension. It's not critical and doesn't affect your application.

---

## Summary of Issues

| # | Issue | Table(s) Affected | Severity | Status |
|---|-------|-------------------|----------|--------|
| 1 | Tables don't exist | All entities | 🔴 Critical | Needs sync/migrations |
| 2 | Type mismatch (UUID passed as integer) | `waitlist` | 🔴 Critical | Fix column type |
| 3 | Missing seed data | `service`, `service_profiles` | 🔴 Critical | Run seeders |
| 4 | No UUID generation hooks | All entities with `publicId` | 🟠 High | Add @BeforeInsert |
| 5 | FK constraint failures | `service_requests` | 🟠 High | Seed related tables |
| 6 | pg_stat_statements | N/A | ⚪ Info | Non-critical |

---

## Recommended Fixes

### Fix 1: Enable TypeORM Synchronize (Development Only)
In `app.module.ts` or database config:
```typescript
TypeOrmModule.forRoot({
  synchronize: true, // WARNING: Never use in production!
  // OR use migrations instead
})
```

### Fix 2: Run Database Seeding
Ensure your seeders create:
- `service` records
- `service_profiles` records
- `service_area` records
- `micro_zone` records with proper `serviceAreaId`

### Fix 3: Add UUID Generation Hooks
In each entity, add:
```typescript
@BeforeInsert()
generatePublicId() {
  this.publicId = uuid();
}
```

### Fix 4: Fix waitlist Type
```typescript
@PrimaryGeneratedColumn('uuid') // Instead of 'increment'
id: string;

@Column({ type: 'uuid' }) // Instead of 'int'
userId: string;
```

---

## Verification Commands

To verify the database state, run these in your Railway PostgreSQL console:

```sql
-- Check all tables
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- Check if service table has data
SELECT * FROM service LIMIT 5;

-- Check column types for waitlist
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'waitlist';
```

---

*Generated on: 2026-03-26*
*For: SEVAQ PostgreSQL Deployment*
