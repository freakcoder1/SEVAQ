# Sevaq Assignment Flow - Performance Testing

## Overview
This document outlines the performance testing strategy for the Sevaq assignment flow implementation.

## Performance Testing Strategy

### 1. Load Testing
**Objective**: Test assignment API endpoints under high concurrent load

**Tools**: Artillery.js, k6, or JMeter

**Test Scenarios**:

#### Scenario 1: Assignment API Load Test
```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: "Warm up"
    - duration: 120
      arrivalRate: 50
      name: "Ramp up load"
    - duration: 300
      arrivalRate: 100
      name: "Sustained load"
    - duration: 60
      arrivalRate: 200
      name: "Peak load"

scenarios:
  - name: "Assignment Flow Test"
    weight: 100
    flow:
      - post:
          url: "/assignments/assign"
          json:
            bookingId: "{{ $randomString() }}"
            serviceId: "service-{{ $randomInt(1, 10) }}"
            userLat: "{{ $randomInt(28, 29) }}"
            userLng: "{{ $randomInt(77, 78) }}"
            startTime: "{{ $randomInt(1700000000000, 1800000000000) }}"
            endTime: "{{ $randomInt(1700000000000, 1800000000000) }}"
      - get:
          url: "/assignments/{{ bookingId }}/status"
```

#### Scenario 2: Worker Matching Algorithm Performance
**Objective**: Test worker matching performance with varying database sizes

**Test Data**:
- 100 workers, 1000 bookings
- 1000 workers, 10000 bookings
- 5000 workers, 50000 bookings

**Metrics to Track**:
- Response time for worker matching
- Database query performance
- Memory usage during matching

### 2. Database Performance Testing

#### Query Optimization Tests
```sql
-- Test worker availability query performance
EXPLAIN QUERY PLAN
SELECT w.*, u.latitude, u.longitude
FROM worker w
JOIN user u ON w.user_id = u.id
WHERE w.is_active = true
  AND w.is_available = true
  AND w.location = 'Noida';

-- Test assignment status query performance
EXPLAIN QUERY PLAN
SELECT b.*, w.name as worker_name
FROM booking b
LEFT JOIN worker w ON b.assigned_worker_id = w.id
WHERE b.id = ?;
```

#### Index Optimization
```sql
-- Add indexes for assignment queries
CREATE INDEX idx_booking_assignment_state ON booking(assignment_state);
CREATE INDEX idx_booking_assigned_worker ON booking(assigned_worker_id);
CREATE INDEX idx_worker_availability ON worker(is_active, is_available, location);
CREATE INDEX idx_worker_services ON worker_services_service(worker_id, service_id);
```

### 3. Frontend Performance Testing

#### Real-time Polling Performance
**Objective**: Test frontend polling performance under various conditions

**Test Scenarios**:
- 100 concurrent users polling every 3 seconds
- 500 concurrent users polling every 5 seconds
- 1000 concurrent users with varying polling intervals

**Metrics**:
- Browser memory usage
- Network request frequency
- UI responsiveness during polling

#### Component Rendering Performance
**Objective**: Test widget rendering performance

**Test Cases**:
- AssignmentInProgressScreen with 100+ bookings
- ProfessionalAssignedScreen with complex worker data
- Service summary card rendering with large datasets

### 4. Stress Testing

#### Assignment System Stress Test
**Objective**: Find breaking points of the assignment system

**Test Parameters**:
- Concurrent assignment requests: 500, 1000, 2000
- Database size: 10k, 50k, 100k records
- Memory pressure: 50%, 80%, 95% of available RAM

#### Timeout and Retry Handling
**Objective**: Test system behavior under stress

**Test Scenarios**:
- Database connection timeouts
- Worker service unavailability
- Network latency spikes

### 5. Memory Leak Detection

#### Backend Memory Testing
**Tools**: Node.js --inspect, clinic.js, heapdump

**Test Process**:
1. Run assignment flow 1000 times
2. Monitor memory usage
3. Check for memory leaks in worker matching
4. Verify garbage collection effectiveness

#### Frontend Memory Testing
**Tools**: Chrome DevTools Memory Profiler

**Test Process**:
1. Navigate through assignment flow multiple times
2. Monitor JavaScript heap usage
3. Check for DOM memory leaks
4. Verify proper cleanup of polling timers

## Performance Benchmarks

### Target Performance Metrics

#### API Response Times
- Assignment API: < 200ms (p95)
- Status check API: < 100ms (p95)
- Worker matching: < 100ms (p95)

#### Database Performance
- Worker availability query: < 50ms
- Assignment status query: < 30ms
- Booking update operation: < 20ms

#### Frontend Performance
- AssignmentInProgressScreen render: < 100ms
- ProfessionalAssignedScreen render: < 150ms
- Polling overhead: < 50ms per request

#### System Capacity
- Concurrent users: 1000+
- Assignment requests per minute: 5000+
- Database records: 100k+ bookings

## Performance Optimization Strategies

### 1. Database Optimization
- Implement connection pooling
- Add appropriate indexes
- Use query result caching
- Optimize worker matching queries

### 2. API Optimization
- Implement request/response caching
- Use pagination for large result sets
- Optimize JSON serialization
- Implement rate limiting

### 3. Frontend Optimization
- Implement efficient polling strategies
- Use memoization for expensive calculations
- Optimize widget rendering
- Implement proper state management

### 4. Infrastructure Optimization
- Use CDN for static assets
- Implement load balancing
- Use Redis for caching
- Optimize server configuration

## Monitoring and Alerting

### Performance Metrics to Monitor
- API response times (p50, p95, p99)
- Database query performance
- Memory usage (frontend and backend)
- Error rates
- Assignment success rates

### Alerting Thresholds
- API response time > 500ms (p95)
- Error rate > 1%
- Memory usage > 80%
- Assignment failure rate > 5%

## Testing Schedule

### Week 1: Baseline Testing
- Set up performance testing environment
- Establish baseline performance metrics
- Identify initial performance bottlenecks

### Week 2: Optimization Implementation
- Implement database optimizations
- Add caching strategies
- Optimize API endpoints

### Week 3: Validation Testing
- Re-run performance tests
- Validate improvements
- Fine-tune optimizations

### Week 4: Production Readiness
- Load testing with production-like data
- Stress testing for edge cases
- Final performance validation

## Tools and Resources

### Testing Tools
- Artillery.js: Load testing framework
- k6: Modern load testing tool
- JMeter: Comprehensive testing suite
- Chrome DevTools: Frontend performance analysis

### Monitoring Tools
- New Relic: Application performance monitoring
- DataDog: Infrastructure monitoring
- Prometheus + Grafana: Custom monitoring setup
- Chrome Lighthouse: Frontend performance auditing

### Performance Analysis
- clinic.js: Node.js performance analysis
- heapdump: Memory leak detection
- flamegraph: CPU profiling
- Chrome Performance Profiler: Frontend profiling