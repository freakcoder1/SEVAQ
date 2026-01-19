# Worker Location Requirements Implementation

This document summarizes the implementation of location requirements for workers to ensure they have proper location data before being marked as available.

## Changes Made

### 1. Database Entity Updates

**File**: `src/workers/entities/worker.entity.ts`

- Added validation decorators to `CreateWorkerDto` for latitude and longitude
- Added `@IsNumber()`, `@IsNotEmpty()`, `@Min()`, and `@Max()` decorators
- Latitude range: -90 to 90 degrees
- Longitude range: -180 to 180 degrees

### 2. DTO Validation

**File**: `src/workers/dto/create-worker.dto.ts`

- Added `latitude` and `longitude` fields to `CreateWorkerDto`
- Added proper validation decorators:
  - `@IsNumber()` - Ensures numeric values
  - `@IsNotEmpty()` - Ensures values are provided
  - `@Min(-90)` and `@Max(90)` - Validates latitude range
  - `@Min(-180)` and `@Max(180)` - Validates longitude range

### 3. Service Layer Updates

**File**: `src/workers/workers.service.ts`

- Updated `create()` method to accept latitude and longitude parameters
- Added `updateExistingWorkersWithDefaultLocation()` method to handle existing workers without location data
- Added `updateWorkerAvailability()` method with location validation before marking workers as available
- Updated worker creation to use provided location data instead of hardcoded defaults

### 4. Controller Updates

**File**: `src/workers/workers.controller.ts`

- Updated `create()` method to pass latitude and longitude from DTO to service
- Ensures all required location data is passed through the API

### 5. Migration Support

**Files**: 
- `src/migrations/fix-worker-location-data.ts` - TypeORM migration
- `src/migrate-workers.ts` - NestJS migration script
- `run-migration.js` - Standalone migration script

- Created migration to update existing workers with default location data (Noida, India coordinates)
- Provides multiple migration options for different deployment scenarios

## Implementation Details

### Location Validation Rules

1. **Latitude**: Must be between -90 and 90 degrees
2. **Longitude**: Must be between -180 and 180 degrees
3. **Required Fields**: Both latitude and longitude are required for new workers
4. **Availability Validation**: Workers cannot be marked as available without location data

### Default Location for Existing Workers

For existing workers without location data, the system will assign:
- **Latitude**: 28.5804579 (Noida, India)
- **Longitude**: 77.4392951 (Noida, India)
- **Current Location**: Same as base location

### API Changes

The worker creation API now requires:
```json
{
  "userId": "string",
  "bio": "string", 
  "serviceIds": ["string"],
  "latitude": 28.5804579,
  "longitude": 77.4392951
}
```

## Migration Process

To apply these changes to an existing system:

1. **Stop the application server**
2. **Run the migration script**:
   ```bash
   node run-migration.js
   ```
3. **Update the worker entity** to add NOT NULL constraints (after migration)
4. **Restart the application server**

## Benefits

1. **Prevents Invisible Workers**: Ensures all workers have location data and can be found in availability checks
2. **Improved User Experience**: Users can always see available workers in their area
3. **Better Assignment Logic**: System can properly match workers to service requests based on location
4. **Data Consistency**: Enforces location requirements at the validation level

## Future Enhancements

1. **Real-time Location Updates**: Implement GPS-based location tracking for workers
2. **Service Radius Configuration**: Allow workers to set their service radius
3. **Location-based Pricing**: Adjust pricing based on worker location and travel distance
4. **Geofencing**: Define service areas and restrict worker availability to specific zones

## Testing

The implementation includes validation at multiple levels:
- **DTO Level**: Input validation using class-validator
- **Service Level**: Business logic validation for availability
- **Database Level**: NOT NULL constraints (to be applied after migration)

This ensures that workers without location data cannot be created or marked as available, preventing the "invisible worker" problem.