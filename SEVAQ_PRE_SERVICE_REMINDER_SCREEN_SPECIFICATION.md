# Sevaq Pre-Service Reminder Screen - Technical Specification

## Screen Overview
The Pre-Service Reminder is a critical trust-building component that appears before a scheduled service. It provides timely reminders to users about upcoming services without giving them unnecessary control, reinforcing SEVAQ's managed service promise.

## Purpose and Objectives
- Provide timely reminders about upcoming services
- Reduce pre-service anxiety
- Reinforce SEVAQ's responsibility for the service
- Maintain trust by showing visibility without control
- Ensure users are informed but not overwhelmed

## Screen Type
This is a **widget/banner** that appears within existing screens (primarily the home screen), not a standalone screen. It should be contextually relevant and non-intrusive.

## Display Logic

### Trigger Timing
The reminder should be shown at specific time intervals before the service:

```dart
final now = DateTime.now();
final bookingDateTime = upcomingBooking.startTime;
final timeUntilBooking = bookingDateTime.difference(now);

// Show reminder at T-24h (day before)
if (timeUntilBooking.inHours >= 23 && timeUntilBooking.inHours <= 25) {
  return _buildBanner(context, 'Your SEVAQ service is scheduled for tomorrow at ${_formatTime(bookingDateTime)}. We’ll take care of everything.');
} 
// Show reminder at T-2h (2 hours before)
else if (timeUntilBooking.inHours >= 1 && timeUntilBooking.inHours <= 3) {
  return _buildBanner(context, 'Your SEVAQ service starts at ${_formatTime(bookingDateTime)}. Everything is on track.');
}
// Show reminder at T-30 minutes (final reminder)
else if (timeUntilBooking.inMinutes >= 20 && timeUntilBooking.inMinutes <= 40) {
  return _buildBanner(context, 'Your SEVAQ service is starting soon at ${_formatTime(bookingDateTime)}. We\'re preparing for your service.');
}
```

### Display Conditions
- Only show to authenticated users with upcoming bookings
- Only show for bookings in "confirmed" or "assigned" states
- Hide if booking is canceled or completed
- Hide if user has already been reminded recently

## Visual Design

### Banner Structure
```dart
Container(
  width: double.infinity,
  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
  margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
  decoration: BoxDecoration(
    color: Theme.of(context).colorScheme.surfaceVariant,
    borderRadius: BorderRadius.circular(8),
    border: Border.all(
      color: Theme.of(context).colorScheme.outline,
      width: 1,
    ),
  ),
  child: Row(
    children: [
      Icon(
        Icons.notifications_none,
        color: Theme.of(context).colorScheme.onSurfaceVariant,
        size: 20,
      ),
      const SizedBox(width: 12),
      Expanded(
        child: Text(
          message,
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Theme.of(context).colorScheme.onSurfaceVariant,
          ),
        ),
      ),
    ],
  ),
)
```

### Design Principles
- **Calm and reassuring tone**: No urgent or alarming language
- **Non-intrusive**: Subtle colors (avoid red or bright yellow)
- **Clear information hierarchy**: Icon → Message
- **Consistent branding**: Uses theme colors
- **Professional appearance**: Clean, modern design

## Content Guidelines

### Message Templates

#### T-24h Reminder (Day Before)
- "Your SEVAQ service is scheduled for tomorrow at [time]. We’ll take care of everything."
- **Purpose**: Provide advance notice, reassure responsibility
- **Key elements**: Tomorrow's date, time, SEVAQ responsibility

#### T-2h Reminder (2 Hours Before) 
- "Your SEVAQ service starts at [time]. Everything is on track."
- **Purpose**: Confirm service is proceeding as planned
- **Key elements**: Exact time, reassurance of status

#### T-30 Minutes Reminder (Final)
- "Your SEVAQ service is starting soon at [time]. We're preparing for your service."
- **Purpose**: Final reminder, indicate active preparation
- **Key elements**: Imminence, active preparation

### Prohibited Content
- No actionable verbs (e.g., "Manage", "Update", "Cancel")
- No questions (e.g., "Are you ready?")
- No sales language
- No upsell attempts
- No rating requests

## Interactions

### Tap Behavior
When tapped, the banner should navigate to the History screen (which shows upcoming bookings):

```dart
GestureDetector(
  onTap: () {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => HistoryScreen()),
    );
  },
  child: _buildBanner(context, message),
)
```

### No Other Interactions
- No buttons
- No swiping to dismiss (must persist until time window passes)
- No expandable content
- No forms or inputs

## Trust Principles

### Visibility Without Control
The reminder shows that SEVAQ is aware of the upcoming service but does not give the user any control over it. This reinforces SEVAQ's managed service model.

### Responsibility Reinforcement
All messages include language that emphasizes SEVAQ's responsibility:
- "We’ll take care of everything"
- "Everything is on track"  
- "We're preparing for your service"

### Anxiety Reduction
The reminder provides clear information about what to expect without creating uncertainty. It confirms that the service is proceeding as planned.

## Implementation Details

### Data Source
The reminder fetches data from the BookingProvider:

```dart
final upcomingBooking = bookingProvider.upcomingBooking;
```

### State Management
Uses Provider for state management:
```dart
return Consumer<BookingProvider>(
  builder: (context, bookingProvider, child) {
    final upcomingBooking = bookingProvider.upcomingBooking;
    // Display logic here
  },
);
```

### Error Handling
Gracefully handles errors by hiding the banner:

```dart
catch (e) {
  debugPrint('Error in PreServiceReminderBanner: $e');
  return const SizedBox.shrink();
}
```

## Testing Requirements

### Unit Tests
- Test display logic for different time intervals
- Test authentication check
- Test error handling

### Widget Tests
- Test banner rendering with different messages
- Test tap navigation
- Test state management

### Integration Tests
- Test complete flow from booking to reminder display
- Test reminder behavior across app sessions

## Performance Considerations

### Efficient Data Fetching
- Fetches bookings only when needed
- Uses post-frame callback to avoid UI jank
- Debounces fetch requests

### Memory Management
- Disposes of listeners properly
- Handles null values gracefully
- Uses const widgets where possible

This specification ensures the Pre-Service Reminder screen meets all requirements for building trust, reducing anxiety, and maintaining the managed service ethos.
