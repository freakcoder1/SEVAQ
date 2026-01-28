# Sevaq Service In Progress Screen - Technical Specification

## Screen Overview
The Service In Progress screen is a critical trust-building component that shows the current status of a service without giving users control. It reinforces SEVAQ's managed service promise by providing visibility while maintaining responsibility for the outcome.

## Purpose and Objectives
- Show real-time service status without control
- Provide support access
- Reassure outcome ownership
- Reduce worker-user conflict
- Maintain trust through transparency without control

## Screen Type
This is a **standalone screen** that users see when their service is in progress. It should be accessible from the History/Upcoming Bookings screen.

## Status States

### 1. On the Way
- Worker is en route to the service location
- Display estimated arrival time
- Show support contact options
- Reassure that SEVAQ is monitoring

### 2. Started
- Service has begun
- Display current status
- Show support contact options
- Reassure that service is being performed

## Screen Structure (Top → Bottom)

### A. Header (Status-first)
```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Text(
      _getStatusTitle(),
      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
        fontWeight: FontWeight.bold,
        color: Colors.black87,
      ),
    ),
    const SizedBox(height: 8),
    Text(
      _getStatusSubtitle(),
      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
        color: Colors.black54,
      ),
    ),
  ],
)
```

**Status Titles and Subtitles:**

- **On the Way**:
  - Title: "Professional is on the way"
  - Subtitle: "Your service provider is en route to your location"

- **Started**:
  - Title: "Service in progress"
  - Subtitle: "Your service is being performed"

### B. Status Indicator (Critical)
```dart
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: _getStatusColor(),
    borderRadius: BorderRadius.circular(12),
  ),
  child: Row(
    children: [
      Icon(_getStatusIcon(), color: Colors.white, size: 24),
      const SizedBox(width: 12),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              _getStatusTitle(),
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            if (_showArrivalTime())
              Text(
                'Estimated arrival: ${_formatTime(_arrivalTime)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: Colors.white70,
                ),
              ),
          ],
        ),
      ),
    ],
  ),
)
```

**Status Colors and Icons:**

- **On the Way**:
  - Color: const Color(0xFF2196F3) (Blue)
  - Icon: Icons.directions_car
  - Show arrival time

- **Started**:
  - Color: const Color(0xFF2E7D32) (Green)
  - Icon: Icons.check_circle
  - No arrival time

### C. Service Summary Card
```dart
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: Colors.white,
    borderRadius: BorderRadius.circular(12),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.05),
        blurRadius: 4,
        offset: Offset(0, 2),
      ),
    ],
    border: Border.all(color: Colors.black12),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Icon(
            Icons.cleaning_services,
            color: const Color(0xFF2E7D32),
            size: 24,
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  service.name ?? 'Home Cleaning',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${DateFormat('EEE, d MMM').format(startTime)} • ${_getTimeWindowText()}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.black54,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${amount.toStringAsFixed(0)} per visit',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF2E7D32),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ],
  ),
)
```

### D. Worker Information (Limited Visibility)
Show minimal worker information to maintain managed service integrity:

```dart
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: const Color(0xFFF8F9FA),
    borderRadius: BorderRadius.circular(12),
  ),
  child: Row(
    children: [
      CircleAvatar(
        backgroundImage: NetworkImage(worker.photoUrl),
        radius: 30,
      ),
      const SizedBox(width: 16),
      Expanded(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              '${worker.firstName} ${worker.lastName}',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
                color: Colors.black87,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              'Verified Professional',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.black54,
              ),
            ),
          ],
        ),
      ),
    ],
  ),
)
```

### E. Support Section (Always Visible)
```dart
Container(
  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
  decoration: BoxDecoration(
    border: Border(
      top: BorderSide(color: Colors.black12),
      bottom: BorderSide(color: Colors.black12),
    ),
    color: Colors.white,
  ),
  child: Row(
    children: [
      const Icon(Icons.help_outline, color: Colors.black54),
      const SizedBox(width: 8),
      Expanded(
        child: Text(
          'Need help?',
          style: Theme.of(context).textTheme.bodyMedium?.copyWith(
            color: Colors.black87,
            fontWeight: FontWeight.w600,
          ),
        ),
      ),
      IconButton(
        icon: const Icon(Icons.arrow_forward, color: Colors.black54),
        onPressed: _showSupportOptions,
      ),
    ],
  ),
)
```

### F. Reassurance Text
```dart
Padding(
  padding: const EdgeInsets.symmetric(horizontal: 8),
  child: Text(
    'We’re monitoring your service and will handle any issues that arise.',
    style: Theme.of(context).textTheme.bodySmall?.copyWith(
      color: Colors.black54,
      fontSize: 12,
    ),
    textAlign: TextAlign.center,
  ),
)
```

## Support Options
When support is requested, show a modal with limited options:

```dart
void _showSupportOptions() {
  showModalBottomSheet(
    context: context,
    builder: (context) => Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            'Need help?',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'Choose how you\'d like to get assistance:',
            style: Theme.of(context).textTheme.bodyMedium,
          ),
          const SizedBox(height: 24),
          ListTile(
            leading: const Icon(Icons.chat_bubble, color: Colors.green),
            title: Text('Chat with support'),
            subtitle: Text('Get help in real-time'),
            onTap: () {
              Navigator.pop(context);
              _openChatSupport();
            },
          ),
          ListTile(
            leading: const Icon(Icons.call, color: Colors.green),
            title: Text('Call support'),
            subtitle: Text('Speak with our team'),
            onTap: () {
              Navigator.pop(context);
              _openCallSupport();
            },
          ),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.white,
              foregroundColor: Colors.black87,
              side: const BorderSide(color: Colors.black12),
              padding: const EdgeInsets.symmetric(
                horizontal: 40,
                vertical: 12,
              ),
            ),
            child: const Text('Cancel'),
          ),
        ],
      ),
    ),
  );
}
```

## Behavioral Rules

### Rule 1: No User Control
- No "Manage service" button
- No "Cancel service" button
- No "Contact worker" button
- No "Rate worker" button
- No form inputs or actions that modify the service

### Rule 2: Auto-Update Logic
```dart
void _checkServiceStatus() async {
  if (_isCheckingStatus) return;
  
  setState(() => _isCheckingStatus = true);
  
  try {
    final response = await _apiService.get('services/status/${widget.bookingId}');
    
    if (response != null) {
      setState(() {
        _serviceStatus = response['status'];
        _arrivalTime = response['arrivalTime'];
      });
    }
  } catch (e) {
    debugPrint('Error checking service status: $e');
  } finally {
    setState(() => _isCheckingStatus = false);
  }
}
```

### Rule 3: Status Transitions
- **On the Way → Started**: When worker arrives
- **Started → Completed**: When service finishes
- Auto-transition to Service Completed screen

## Trust Principles

### Visibility Without Control
The screen shows what's happening but doesn't allow users to modify anything. This reinforces SEVAQ's responsibility.

### Responsibility Reinforcement
- "We’re monitoring your service"
- "We’ll handle any issues that arise"
- No direct worker communication (SEVAQ acts as intermediary)

### Conflict Reduction
By not providing direct worker contact, SEVAQ prevents potential conflicts and maintains control over the service experience.

## Implementation Details

### Data Source
Fetches data from the API:
```dart
final response = await _apiService.get('services/status/${widget.bookingId}');
```

### State Management
Uses Provider or Riverpod for state management:
```dart
final serviceStatusProvider = StateNotifierProvider<ServiceStatusNotifier, ServiceStatus>((ref) {
  return ServiceStatusNotifier();
});
```

### Error Handling
```dart
catch (e) {
  debugPrint('Error checking service status: $e');
  // Show error message without blaming anyone
  _showError('We\'re having trouble updating your service status. Please try again later.');
}
```

## Testing Requirements

### Unit Tests
- Test status transitions
- Test auto-update logic
- Test error handling

### Widget Tests
- Test UI component rendering for different statuses
- Test support modal
- Test state management

### Integration Tests
- Test complete flow from service start to completion
- Test status updates
- Test error scenarios

## Performance Considerations

### Efficient Polling
- Use appropriate polling intervals (30-60 seconds)
- Cancel polling when screen is disposed
- Handle rapid state changes gracefully

### Memory Management
- Disposes of timers properly
- Cancel pending network requests
- Clean up state listeners

This specification ensures the Service In Progress screen meets all requirements for building trust, reducing anxiety, and maintaining the managed service ethos.
