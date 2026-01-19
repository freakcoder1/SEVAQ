# SEVAQ Assignment Flow Decision Document

## Executive Summary

**CONFIRMED:** The root cause analysis is 100% correct. The system is incorrectly coupling "request creation" and "worker assignment" into a single synchronous operation during "Confirm & request professional".

## Problem Statement

### Current Behavior (Incorrect)
1. User clicks "Confirm & request professional"
2. Backend immediately tries to assign a worker synchronously
3. If no workers available → throws 400 error → shows apology screen
4. This breaks user's mental model and creates distrust

### User Mental Model (Correct)
1. User requests a service
2. System attempts assignment asynchronously
3. If available, assign worker
4. If not available, show alternatives/polite message

## Root Cause Analysis

### Architectural Violation
- **Assignment is a scarce-resource operation** - worker availability changes minute by minute
- **Assignment is probabilistic, not guaranteed** - cannot be tied to single user click
- **Current flow violates core principle:** Never hard-fail a user on a non-critical action

### Technical Issues
- `start-assignment-flow` is doing both request creation AND assignment in single operation
- Frontend treats 400 "No professionals available" as terminal state
- Assignment attempt happens synchronously instead of asynchronously

## Solution Architecture

### Phase 1: Decouple Request Creation from Assignment

#### New Flow
1. **Request Creation** (synchronous, never fails due to worker availability)
   - User clicks "Confirm & request professional"
   - System creates service request with status = REQUESTED
   - No assignment attempt yet

2. **Assignment Attempt** (asynchronous)
   - System tries to assign worker
   - May succeed or fail

3. **Success Path**
   - Show assigned professional
   - Proceed to payment/confirmation

4. **Failure Path** (where apology screen belongs)
   - Show "No professionals available" screen
   - Offer time/date changes
   - Offer waitlist

### Phase 2: API Changes Required

#### Backend Changes
- Split `start-assignment-flow` into two operations:
  1. `create-service-request` (intent only)
  2. `attempt-assignment` (async, may fail)

#### Frontend Changes
- Update state management to handle REQUESTED → ASSIGNED/FAILED transitions
- Move apology screen to post-assignment failure only
- Add "Finding professional" intermediate state

### Phase 3: Database Schema Updates

#### New Request Statuses
- `REQUESTED` - user intent captured, assignment pending
- `ASSIGNED` - worker successfully assigned
- `FAILED` - assignment attempt failed, alternatives offered

## Implementation Priority

### High Priority (Critical Path)
1. Create service request API (intent only)
2. Update frontend to handle new flow states
3. Move assignment logic to async process

### Medium Priority
1. Add "Finding professional" UI state
2. Update existing assignment endpoints
3. Database migration for new statuses

### Low Priority
1. Enhanced assignment retry logic
2. Advanced waitlist management
3. Assignment analytics

## Success Metrics

### User Experience
- Eliminate hard failures on "Confirm & request professional"
- Reduce user confusion about service availability
- Improve trust in platform reliability

### System Reliability
- Decouple user-facing operations from resource constraints
- Enable graceful degradation when workers unavailable
- Support future scaling of assignment algorithms

## Risk Mitigation

### Data Consistency
- Ensure atomic request creation
- Handle race conditions in assignment attempts
- Maintain audit trail for all state transitions

### Backward Compatibility
- Support existing API consumers during transition
- Provide migration path for current assignments
- Maintain existing payment flows

## Next Steps

1. **Immediate:** Create detailed technical specification
2. **Week 1:** Implement service request creation API
3. **Week 2:** Update frontend state management
4. **Week 3:** Implement async assignment logic
5. **Week 4:** Testing and deployment

## Conclusion

This architectural change will eliminate the entire class of bugs related to worker availability and align the system with user expectations for a managed-service platform. The decoupling of request intent from resource assignment is fundamental to building a reliable, user-friendly service platform.