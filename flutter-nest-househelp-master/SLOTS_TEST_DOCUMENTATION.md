# Slots Service Test Documentation

## Overview

This document describes the comprehensive test suite for the enhanced slot management system in the Sevaq application. The tests cover all aspects of slot functionality including flexible time matching, slot creation, booking management, and integration with the assignment system.

## Test Files

### 1. Unit Tests (`src/slots/slots.service.spec.ts`)

**Purpose**: Test individual methods of the SlotsService in isolation.

**Coverage**:
- ✅ `findAvailableSlot()` - Exact time matching
- ✅ `findAvailableSlotFlexible()` - Flexible time matching with multiple strategies
- ✅ `createSlotsForWorker()` - Slot creation with validation
- ✅ `bookSlot()` - Slot booking with validation
- ✅ `unbookSlot()` - Slot unbooking with validation
- ✅ `getWorkerSlotStats()` - Statistics calculation
- ✅ `getAvailableSlotsForWorker()` - Available slots retrieval
- ✅ `createSlotsForMultipleWorkers()` - Bulk slot creation

**Test Scenarios**:
- Happy path scenarios
- Error conditions (worker not found, slot not found, already booked)
- Edge cases (zero slots, invalid data)

### 2. Integration Tests (`src/slots/slots.service.integration.spec.ts`)

**Purpose**: Test the enhanced slot management system in integration scenarios.

**Coverage**:
- ✅ Flexible slot matching with assignment flow
- ✅ Slot booking and unbooking workflow
- ✅ Slot creation with validation
- ✅ Error handling and graceful degradation
- ✅ Worker slot statistics calculation
- ✅ Multi-worker slot management
- ✅ Time window edge cases
- ✅ Same-day slot fallback scenarios

**Integration Scenarios**:
- Complete assignment flow with flexible slot matching
- Slot booking/unbooking with assignment system
- Bulk slot creation for multiple workers
- Edge case handling (no availability, same-day fallback)

## Test Execution

### Prerequisites

1. **Install Test Dependencies**:
   ```bash
   npm install --save-dev @types/jest
   ```

2. **Ensure Jest Configuration**:
   The project should have Jest configured in `package.json` or `jest.config.js`.

### Running Tests

#### Option 1: Using the Test Script
```bash
# Make the script executable
chmod +x test-slots.sh

# Run all slot tests
./test-slots.sh
```

#### Option 2: Manual Execution
```bash
# Run unit tests
npm test src/slots/slots.service.spec.ts

# Run integration tests
npm test src/slots/slots.service.integration.spec.ts

# Run all slot tests
npm test -- --testPathPattern="slots.*\\.spec\\.ts$"
```

#### Option 3: Using Jest Directly
```bash
# Run with Jest CLI
npx jest src/slots/slots.service.spec.ts
npx jest src/slots/slots.service.integration.spec.ts
```

## Test Data

### Mock Workers
```typescript
const mockWorker: Worker = {
  id: 'worker-1',
  name: 'John Doe',
  rating: 4.5,
  reviewCount: 10,
  yearsOfExperience: 5,
  isActive: true,
  isAvailable: true,
  latitude: 28.6139,
  longitude: 77.2090,
  currentLat: 28.6139,
  currentLng: 77.2090,
  // ... other fields
};
```

### Mock Slots
```typescript
const createMockSlot = (id: string, workerId: string, startTime: Date, endTime: Date, isBooked = false): Slot => ({
  id,
  worker: { ...mockWorker, id: workerId },
  startTime,
  endTime,
  isBooked,
});
```

## Test Coverage Areas

### 1. Flexible Time Matching
- **Exact Match**: Tests exact time slot matching
- **Flexible Window**: Tests 30-minute flexibility window
- **Same-Day Fallback**: Tests finding slots on the same day
- **No Availability**: Tests graceful handling when no slots available

### 2. Slot Management
- **Creation**: Tests slot creation with validation
- **Booking**: Tests slot booking with status updates
- **Unbooking**: Tests slot unbooking with status updates
- **Statistics**: Tests slot statistics calculation

### 3. Error Handling
- **Worker Not Found**: Tests handling when worker doesn't exist
- **Slot Not Found**: Tests handling when slot doesn't exist
- **Already Booked**: Tests handling when slot is already booked
- **Invalid Data**: Tests handling of invalid input data

### 4. Integration Scenarios
- **Assignment Flow**: Tests integration with assignment system
- **Multi-Worker**: Tests bulk operations across multiple workers
- **Edge Cases**: Tests boundary conditions and edge cases

## Expected Test Results

### Unit Tests
- **Total Tests**: 24 test cases
- **Coverage**: 100% of public methods
- **Mock Usage**: All external dependencies mocked

### Integration Tests
- **Total Tests**: 12 test cases
- **Coverage**: End-to-end scenarios
- **Real Integration**: Tests actual service interactions

## Troubleshooting

### Common Issues

1. **TypeScript Errors**:
   ```bash
   # Install type definitions
   npm install --save-dev @types/jest
   ```

2. **Test Failures**:
   - Check mock data setup
   - Verify test isolation
   - Ensure proper cleanup between tests

3. **Jest Configuration**:
   - Verify Jest is properly configured in `package.json`
   - Check for TypeScript compilation issues

### Debugging Tips

1. **Enable Verbose Logging**:
   ```bash
   npm test -- --verbose
   ```

2. **Run Single Test**:
   ```bash
   npm test -- --testNamePattern="specific test name"
   ```

3. **Watch Mode**:
   ```bash
   npm test -- --watch
   ```

## Continuous Integration

### GitHub Actions Integration
```yaml
- name: Run Slot Tests
  run: |
    npm install
    npm test src/slots/slots.service.spec.ts
    npm test src/slots/slots.service.integration.spec.ts
```

### Test Reports
- Jest generates coverage reports
- Integration with CI/CD pipelines
- Automated test execution on code changes

## Performance Testing

### Load Testing Scenarios
- Multiple concurrent slot requests
- Bulk slot creation performance
- Assignment flow performance under load

### Benchmarking
- Slot matching algorithm performance
- Database query optimization
- Memory usage during bulk operations

## Maintenance

### Test Updates
- Update tests when API changes
- Add new test cases for new features
- Remove obsolete test cases

### Test Data Management
- Keep mock data realistic
- Update test scenarios as business logic evolves
- Maintain test data consistency

## Conclusion

The comprehensive test suite ensures the enhanced slot management system is robust, reliable, and ready for production use. The tests cover all critical functionality and edge cases, providing confidence in the system's reliability and performance.