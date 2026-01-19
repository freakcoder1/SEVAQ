# SevaQ Managed Service Refactoring - Implementation Guide

## Copy-Paste Instructions for Kwai Pilot Pro

Use this verbatim to instruct Kwai Pilot Pro to implement the managed-service refactoring:

---

**TASK**: Refactor SevaQ frontend to fully adopt a managed-service model.

**OBJECTIVE**: Remove all pre-booking worker browsing and selection flows, ensuring users cannot select individual professionals before assignment.

## Specific Changes Required

### 1. Service Details Screen - COMPLETE REFACTOR

**File**: `frontend-flutter-house-help-master/lib/screens/service_details_screen.dart`

**REMOVE**:
- Worker list display (lines 104-181)
- Worker selection navigation (line 167-176)
- Worker provider dependency for selection

**ADD**:
- Service scope information section
- "What's included" section
- CTA that goes directly to Schedule & Pricing screen
- Copy that emphasizes Sevaq handles assignment

**NEW FLOW**: Service Details → Schedule & Pricing (no worker selection)

### 2. Worker Details Screen - RESTRICT USAGE

**File**: `frontend-flutter-house-help-master/lib/screens/worker_details_screen.dart`

**REMOVE**:
- From service details navigation
- Worker selection capabilities
- Pre-assignment access

**KEEP**:
- Post-assignment informational display
- Professional introduction after assignment

### 3. Worker Card Widget - CONTEXTUAL RESTRICTION

**File**: `frontend-flutter-house-help-master/lib/widgets/worker_card.dart`

**CHANGE**:
- Remove selection capabilities in pre-booking flows
- Update to be informational only
- Restrict usage to post-assignment contexts

### 4. Navigation Flow Update

**CURRENT FLOW** (REMOVE):
```
Home → Service Details → Worker Selection → Worker Details → Booking
```

**NEW FLOW** (IMPLEMENT):
```
Home → Service Clarification → Schedule & Pricing → Assignment In Progress → Professional Assigned
```

### 5. UI Copy Updates

**CHANGE ALL**:
- "Select a professional" → "We'll assign a professional"
- "Choose your worker" → "Service assignment in progress"
- "Available workers" → "Service availability"
- "Worker details" → "Professional information"

### 6. Backend API Integration

**UPDATE**:
- Booking creation to not require worker ID
- Assignment to happen server-side
- Status tracking for assignment progress

## Implementation Priority

1. **HIGH**: Remove worker selection from Service Details Screen
2. **HIGH**: Update navigation flow to skip worker selection
3. **MEDIUM**: Restrict Worker Card widget usage
4. **MEDIUM**: Update UI copy throughout
5. **LOW**: Enhance post-assignment professional display

## Success Criteria

✅ Users can only select: Service, Date, Time
✅ SevaQ handles all professional assignment
✅ No worker browsing before booking
✅ Assignment happens asynchronously
✅ Professional details shown only after assignment
✅ Reviews restricted to post-assignment only

## Files to Modify

1. `frontend-flutter-house-help-master/lib/screens/service_details_screen.dart`
2. `frontend-flutter-house-help-master/lib/screens/worker_details_screen.dart`
3. `frontend-flutter-house-help-master/lib/widgets/worker_card.dart`
4. Navigation logic in relevant screens
5. UI copy in all affected screens

## Files to Keep Unchanged

- `frontend-flutter-house-help-master/lib/screens/trust_first_home_screen.dart` (maintain trust-first approach)
- `frontend-flutter-house-help-master/lib/screens/service_clarification_screen.dart` (already managed-service focused)
- `frontend-flutter-house-help-master/lib/screens/schedule_pricing_screen.dart` (already handles assignment)

## Testing Requirements

1. Verify no worker selection before assignment
2. Confirm assignment happens server-side
3. Test post-assignment professional display
4. Validate new navigation flow
5. Check UI copy consistency

---

**IMPORTANT**: This refactoring eliminates the architectural schizophrenia between marketplace and managed-service models. The frontend must reflect that SevaQ, not the user, selects professionals.