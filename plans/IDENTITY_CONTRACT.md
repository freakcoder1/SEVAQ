# Identity Contract

**Status:** Frozen
**Date:** 2026-01-15

## Overview
This document formalizes the identity contract for the SEVAQ platform to ensure consistency and prevent regressions in the future.

## Contract Rules

### 1. Primary and Foreign Keys
- **All primary keys** in SEVAQ entities **must** be of type `UUID`.
- **All foreign keys** referencing these primary keys **must** also be of type `UUID`.
- **Numeric identifiers** (e.g., auto-incrementing integers) are **strictly forbidden** at the persistence boundary.

### 2. Entity-Specific Rules

#### User Entity
- **Primary Key:** `id` (UUID)
- **Foreign Key References:** All references to `User` must use the `id` field (UUID).

#### Worker Entity
- **Primary Key:** `id` (UUID)
- **Foreign Key:** `userId` (UUID) referencing `User.id`

#### Service Entity
- **Primary Key:** `id` (UUID)

#### Booking Entity
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** All references to `User`, `Worker`, and `Service` must use UUID fields.

#### Payment Entity
- **Primary Key:** `id` (UUID)
- **Foreign Keys:** All references to `User` and `Booking` must use UUID fields.

### 3. Join Tables
- Join tables (e.g., `service_worker`) must use UUID columns for both sides of the relationship.
- Example: `service_worker.worker_id` and `service_worker.service_id` must be UUIDs.

### 4. JWT and Database Identity Mapping
- JWT tokens must include the `sub` claim set to the user's UUID (`User.id`).
- All database operations must use the UUID for identity resolution.

## Compliance
- Any new entity or migration must adhere to this contract.
- Violations must be caught during code review and rejected.

## Rationale
This contract ensures:
- **Consistency** across all entities and relationships
- **Scalability** for distributed systems
- **Security** by avoiding predictable numeric identifiers
- **Future-proofing** for system evolution

## Approval
Approved by: [Your Name]
Date: 2026-01-15