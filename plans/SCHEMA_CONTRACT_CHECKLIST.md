# Schema Contract Checklist

**Status:** Active
**Date:** 2026-01-15

## Overview
This checklist ensures consistency and correctness across the SEVAQ platform's schema. It must be reviewed and validated before any schema changes or migrations.

## Checklist Items

### 1. ID Type Consistency
- [ ] All primary keys are UUIDs.
- [ ] All foreign keys referencing primary keys are UUIDs.
- [ ] No numeric identifiers (e.g., auto-incrementing integers) are used at the persistence boundary.

### 2. Join Table Ownership
- [ ] Join tables (e.g., `service_worker`) are explicitly defined with UUID columns.
- [ ] Join table columns are named consistently (e.g., `worker_id`, `service_id`).
- [ ] Join table ownership is documented (e.g., which entity owns the relationship).

### 3. Naming Strategy
- [ ] Entity names are in singular form (e.g., `User`, `Worker`).
- [ ] Table names are in snake_case (e.g., `service_worker`).
- [ ] Column names are in camelCase for TypeScript and snake_case for database tables.

### 4. Migration vs Sync Rules
- [ ] Schema changes are implemented via migrations, not `synchronize: true`.
- [ ] Migrations are tested in a staging environment before deployment.
- [ ] Rollback plans are documented for each migration.

### 5. JWT ↔ DB Identity Mapping
- [ ] JWT tokens include the `sub` claim set to the user's UUID (`User.id`).
- [ ] All database operations use the UUID for identity resolution.
- [ ] No numeric identifiers are used in JWT claims.

### 6. Indexing and Performance
- [ ] All foreign keys are indexed.
- [ ] Frequently queried columns are indexed.
- [ ] Indexes are reviewed for performance impact.

### 7. Data Integrity
- [ ] All required fields are marked as non-nullable in the database.
- [ ] Default values are specified where applicable.
- [ ] Constraints (e.g., unique, check) are applied where necessary.

### 8. Backward Compatibility
- [ ] Schema changes are backward-compatible where possible.
- [ ] Breaking changes are documented and communicated.
- [ ] Deprecation plans are in place for removed fields.

### 9. Testing
- [ ] Schema changes are tested with realistic data.
- [ ] Edge cases (e.g., null values, duplicates) are tested.
- [ ] Performance impact is measured and documented.

### 10. Documentation
- [ ] Schema changes are documented in the changelog.
- [ ] Entity relationships are documented (e.g., ER diagrams).
- [ ] Migration scripts include comments explaining changes.

## Approval
- [ ] Checklist reviewed by the development team.
- [ ] Checklist approved by the lead architect.

## Notes
- This checklist must be completed for every schema change or migration.
- Any deviations must be documented and justified.

## Approval
Approved by: [Your Name]
Date: 2026-01-15