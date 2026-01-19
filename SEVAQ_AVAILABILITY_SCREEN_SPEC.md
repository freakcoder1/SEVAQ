# AvailabilityAdjustmentScreen Technical Specification

## Overview
The AvailabilityAdjustmentScreen handles the case when no workers are available for the requested time slot. It provides users with clear options to adjust their preferences and retry the assignment.

## File Location
`frontend-flutter-house-help-master/lib/screens/availability_adjustment_screen.dart`

## Dependencies
- `package:flutter/material.dart`
- `package:provider/provider.dart`
- `../services/assignment_service.dart`
- `../providers/auth_provider.dart`
- `../models/assignment_request.dart`

## State Management
Uses Provider pattern with local state for UI interactions and global state for user context.

## UI Components

### 1. Main Container
```dart
Scaffold(
  appBar: AppBar(
    title: Text('Availability'),
    leading: IconButton(
      icon: Icon(Icons.arrow_back),
      onPressed: () => Navigator.pop(context),
    ),
  ),
  body: SingleChildScrollView(
    padding: EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [...]
    ),
  ),
)
```

### 2. Error State Card
```dart
Card(
  elevation: 2,
  child: Padding(
    padding: EdgeInsets.all(20),
    child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(Icons.error_outline, size: 48, color: Colors.orange),
        SizedBox(height: 16),
        Text(
          'No professionals available for this time',
          style: Theme.of(context).textTheme.headline6,
        ),
        SizedBox(height: 8),
        Text(
          'We couldn\'t find a professional for your selected time window.',
          style: Theme.of(context).textTheme.bodyText2,
        ),
      ],
    ),
  ),
)
```

### 3. Time Adjustment Section
```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Text('Try a different time', style: Theme.of(context).textTheme.subtitle1),
    SizedBox(height: 12),
    // Time picker widgets
    // Date picker widgets
  ],
)
```

### 4. Action Buttons
```dart
Column(
  children: [
    ElevatedButton(
      onPressed: _handleRetryAssignment,
      child: Text('Find Available Time'),
    ),
    TextButton(
      onPressed: _handleNotifyMe,
      child: Text('Notify me when available'),
    ),
    TextButton(
      onPressed: _handleContactSupport,
      child: Text('Contact support'),
    ),
  ],
)
```

## Core Logic

### 1. Assignment Request Handling
```dart
class AvailabilityAdjustmentScreen extends StatefulWidget {
  final AssignmentRequest originalRequest;
  
  AvailabilityAdjustmentScreen({@required this.originalRequest});
  
  @override
  _AvailabilityAdjustmentScreenState createState() => _AvailabilityAdjustmentScreenState();
}
```

### 2. State Management
```dart
class _AvailabilityAdjustmentScreenState extends State<AvailabilityAdjustmentScreen> {
  DateTime _selectedDate;
  TimeOfDay _selectedTime;
  bool _isLoading = false;
  
  @override
  void initState() {
    super.initState();
    _selectedDate = widget.originalRequest.startTime;
    _selectedTime = TimeOfDay.fromDateTime(widget.originalRequest.startTime);
  }
}
```

### 3. Retry Assignment Logic
```dart
Future<void> _handleRetryAssignment() async {
  setState(() => _isLoading = true);
  
  try {
    final newRequest = widget.originalRequest.copyWith(
      startTime: DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        _selectedTime.hour,
        _selectedTime.minute,
      ),
      endTime: DateTime(
        _selectedDate.year,
        _selectedDate.month,
        _selectedDate.day,
        _selectedTime.hour + 2,
        _selectedTime.minute,
      ),
    );
    
    final result = await AssignmentService.startAssignmentFlow(newRequest);
    
    if (result.success) {
      // Navigate to booking confirmation
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(builder: (_) => BookingConfirmationScreen()),
      );
    } else {
      // Show error or try again
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Still no availability. Please try different time.')),
      );
    }
  } catch (e) {
    // Handle other errors
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Something went wrong. Please try again.')),
    );
  } finally {
    setState(() => _isLoading = false);
  }
}
```

## Error Handling Strategy

### 1. Assignment Result Types
```dart
enum AssignmentResult {
  success,
  noWorkersAvailable,
  error
}
```

### 2. Service Response Handling
```dart
Future<AssignmentResult> startAssignmentFlow(AssignmentRequest request) async {
  try {
    final response = await _httpClient.post(
      '/assignments/start-assignment-flow',
      data: request.toJson(),
    );
    
    if (response.statusCode == 200) {
      return AssignmentResult.success;
    } else if (response.statusCode == 400) {
      final message = response.data['message'];
      if (message.contains('No workers available')) {
        return AssignmentResult.noWorkersAvailable;
      }
      throw ApiException(response.statusCode, message);
    } else {
      throw ApiException(response.statusCode, 'Server error');
    }
  } catch (e) {
    throw ApiException(0, 'Network error');
  }
}
```

## Navigation Flow

### 1. Entry Points
- From ServiceClarificationScreen on assignment failure
- From BookingScreen on worker unavailability

### 2. Exit Points
- Success → BookingConfirmationScreen
- Cancel → ServiceClarificationScreen
- Contact Support → SupportScreen

## Testing Strategy

### 1. Unit Tests
- Assignment service error handling
- State management logic
- UI component rendering

### 2. Integration Tests
- Complete assignment flow with unavailability
- Navigation between screens
- Error recovery scenarios

### 3. User Testing
- Clear messaging comprehension
- Easy retry mechanism
- Intuitive time selection

## Performance Considerations

### 1. Loading States
- Show loading indicator during assignment attempts
- Disable buttons during processing
- Provide clear feedback on success/failure

### 2. Memory Management
- Dispose of any subscriptions
- Clear temporary state on navigation
- Avoid memory leaks in async operations

## Accessibility Features

### 1. Screen Reader Support
- Proper semantic labels
- Clear error messages
- Logical focus order

### 2. Touch Targets
- Minimum 48dp touch targets
- Adequate spacing between elements
- Clear visual feedback

## Future Enhancements

### 1. Smart Suggestions
- Auto-suggest next available time slots
- Show availability calendar
- Recommend similar time windows

### 2. Notifications
- Push notifications for availability
- Email notifications
- SMS notifications

### 3. Analytics
- Track unavailability frequency
- Monitor user retry behavior
- Optimize worker allocation

## Success Metrics

### 1. User Experience
- No error messages for unavailability
- Clear next steps provided
- Easy retry mechanism

### 2. Business Metrics
- Reduced support tickets
- Improved user satisfaction
- Higher conversion rates

### 3. Technical Metrics
- Fast response times
- Low error rates
- Good accessibility scores