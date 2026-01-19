# Service Clarification Screen Implementation Instructions

## Code Changes Required

### 1. Fix Problem 3: Update Service Option Reassurance Badges

**File**: `frontend-flutter-house-help-master/lib/models/service_option.dart`

**Change**: Update the `getReassuranceBadge()` method to use observational language:

```dart
// BEFORE (advisory language):
case ServiceType.cleaning:
  return '🟢 Good for immediate cleaning needs';
case ServiceType.cooking:
  return '🟢 Suitable for daily cooking support';

// AFTER (observational language):
case ServiceType.cleaning:
  return '🟢 Typically used for one-time or periodic cleaning';
case ServiceType.cooking:
  return '🟢 Common for daily meal preparation';
```

### 2. Fix Problem 2: Gate Frequency Selection

**File**: `frontend-flutter-house-help-master/lib/widgets/contextual_followup.dart`

**Change**: Remove the helper text that appears before service selection:

```dart
// REMOVE this section (lines 27-37):
const SizedBox(height: 24),

// Helper text for frequency section
Text(
  'This helps us match you with the right professional. You can change this later.',
  style: TextStyle(
    fontSize: 12,
    fontWeight: FontWeight.w400,
    color: Colors.black54,
  ),
),

const SizedBox(height: 16),
```

### 3. Fix Problem 1: Remove Excessive Reassurance Repetition

**File**: `frontend-flutter-house-help-master/lib/widgets/contextual_followup.dart`

**Change**: Remove the helper text that repeats reassurance messages (already handled in step 2).

### 4. Fix Problem 4: Improve CTA State Behavior

**File**: `frontend-flutter-house-help-master/lib/screens/service_clarification_screen.dart`

**Change**: Add conditional microtext above the CTA:

```dart
// ADD this widget before the bottom navigation bar:
if (_selectedService == null)
  Padding(
    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
    child: Text(
      'Select one option to continue',
      style: TextStyle(
        fontSize: 14,
        color: Colors.black54,
        fontWeight: FontWeight.w500,
      ),
      textAlign: TextAlign.center,
    ),
  ),
```

## Implementation Order

1. **First**: Update service option reassurance badges (Problem 3)
2. **Second**: Remove helper text from contextual follow-up (Problem 2 & 1)
3. **Third**: Add conditional CTA microtext (Problem 4)

## Testing Verification

After implementation, verify:

1. ✅ Service options show observational reassurance badges
2. ✅ Frequency selection only appears after service selection
3. ✅ No redundant reassurance messages
4. ✅ CTA shows "Select one option to continue" when disabled
5. ✅ Single reassurance message at bottom remains

## Expected User Experience

- **Before**: User sees multiple reassurance messages and frequency options immediately
- **After**: User sees clean service options first, then contextual follow-up only after selection, with clear guidance on what to do next