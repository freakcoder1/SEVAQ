# Sevaq Assignment In Progress Screen - Technical Specification

## Screen Overview
The Assignment In Progress screen is the critical trust-building screen that appears immediately after a user confirms their booking. It must answer three fundamental questions and provide a seamless experience while the backend assigns a professional.

## Screen Structure (Top → Bottom)

### A. Header (Status-first, not celebratory)
```dart
// Title
Text(
  'Finding a professional',
  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
    fontWeight: FontWeight.bold,
    color: Colors.black87,
  ),
)

// Subtitle
Text(
  'We’re assigning a verified professional for your scheduled service.',
  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
    color: Colors.black54,
  ),
)
```

**Requirements:**
- No emojis
- No excitement
- Calm, operational tone
- Clear status communication

### B. Status Indicator (Critical)
**Option 1: Progress Bar (Preferred)**
```dart
LinearProgressIndicator(
  backgroundColor: Colors.grey[200],
  color: const Color(0xFF2E7D32),
  minHeight: 8,
)

Text(
  'Assignment in progress',
  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
    fontWeight: FontWeight.w600,
    color: Colors.black87,
  ),
)

Text(
  'This usually takes a few minutes.',
  style: Theme.of(context).textTheme.bodySmall?.copyWith(
    color: Colors.black54,
  ),
)
```

**Option 2: Animated Dots**
```dart
Row(
  mainAxisAlignment: MainAxisAlignment.center,
  children: [
    _buildAnimatedDot(0),
    _buildAnimatedDot(1),
    _buildAnimatedDot(2),
  ],
)

Text(
  'Assignment in progress',
  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
    fontWeight: FontWeight.w600,
    color: Colors.black87,
  ),
)
```

**Requirements:**
- No countdown timers unless backend guarantees SLA
- Clear indication of current state
- Calm visual design

### C. Service Summary Card (Reassurance)
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
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Row(
        children: [
          Icon(Icons.cleaning_services, color: const Color(0xFF2E7D32), size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  widget.service?.name ?? 'Home Cleaning',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${DateFormat('EEE, d MMM').format(widget.startTime)} • ${_getTimeWindowText()}',
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.black54,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '₹${widget.amount.toStringAsFixed(0)} per visit',
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

**Requirements:**
- Service type, date, time window, price
- Clear visual hierarchy
- Reassurance-focused design
- No lost information

### D. What Happens Next (Expectation Setting)
```dart
Container(
  padding: const EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: const Color(0xFFF8F9FA),
    borderRadius: BorderRadius.circular(12),
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text(
        'What happens next',
        style: Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: Colors.black87,
        ),
      ),
      const SizedBox(height: 12),
      _buildNextStep(
        icon: Icons.person,
        text: 'We assign a verified professional',
      ),
      const SizedBox(height: 8),
      _buildNextStep(
        icon: Icons.notifications,
        text: 'You’ll be notified once assigned',
      ),
      const SizedBox(height: 8),
      _buildNextStep(
        icon: Icons.payment,
        text: 'Payment will be requested after assignment',
      ),
    ],
  ),
)
```

**Requirements:**
- Short, plain language
- Clear sequence of events
- Non-negotiable for trust
- Numbered or bullet format

### E. Support Entry (Always Visible)
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

**Requirements:**
- Always visible
- Opens chat OR call support
- Not buried in menu
- Prominent placement

### F. Primary CTA (Contextual, Not Action-Heavy)
```dart
Container(
  padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
  child: ElevatedButton(
    onPressed: _viewRequestDetails,
    style: ElevatedButton.styleFrom(
      backgroundColor: Colors.white,
      foregroundColor: const Color(0xFF2E7D32),
      side: const BorderSide(color: Color(0xFF2E7D32)),
      padding: const EdgeInsets.symmetric(vertical: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
    ),
    child: const Text('View request details'),
  ),
)
```

**Requirements:**
- "View request details" (preferred)
- No button (informational only) as alternative
- Avoid "Cancel request" (too aggressive)
- Avoid "Go home" (dismissive)

## Behavioral Rules

### Rule 1: Auto-Update Logic
```dart
void _checkAssignmentStatus() async {
  if (_isCheckingStatus) return;
  
  setState(() => _isCheckingStatus = true);
  
  try {
    final response = await _apiService.get('assignments/status/latest');
    
    if (response != null && response['status'] == 'assigned') {
      // Update UI to show assigned state
      setState(() {
        _isAssigned = true;
        _assignmentData = response;
      });
    } else if (response != null && response['status'] == 'in_progress') {
      // Continue checking
      _checkCount++;
      _startAssignmentCheck();
    } else {
      // No assignment yet, continue checking
      _checkCount++;
      _startAssignmentCheck();
    }
  } catch (e) {
    // Error handling
    _checkCount++;
    _startAssignmentCheck();
  } finally {
    setState(() => _isCheckingStatus = false);
  }
}
```

**Requirements:**
- Same screen updates content (no navigation jump)
- Content updates to "Professional assigned"
- Smooth transition animation

### Rule 2: Delay Handling
```dart
void _handleDelay() {
  if (_checkCount >= 10 && !_isDelayed) {
    setState(() {
      _isDelayed = true;
      _delayMessage = 'Still working on your assignment. We’ll notify you shortly.';
    });
  }
}
```

**Requirements:**
- Auto-insert message after 10 minutes
- Never blame supply
- Maintain calm tone

### Rule 3: Failure Handling
```dart
void _handleAssignmentFailure() {
  Navigator.pushReplacement(
    context,
    MaterialPageRoute(
      builder: (_) => AssignmentFailureScreen(
        worker: widget.worker,
        service: widget.service,
        startTime: widget.startTime,
        endTime: widget.endTime,
        amount: widget.amount,
        onRetry: _retryAssignment,
        onContactSupport: _contactSupport,
      ),
    ),
  );
}
```

**Requirements:**
- Transition to same screen state
- Clear failure message
- "Change time" and "Contact support" actions
- Do NOT dump user back to schedule screen

## State Management

### Screen States
1. **Initial State**: Assignment in progress
2. **Assigned State**: Professional assigned
3. **Delayed State**: Still working (after 10 minutes)
4. **Failure State**: Assignment failed

### State Transitions
```dart
enum AssignmentState {
  inProgress,
  assigned,
  delayed,
  failed,
}
```

## Navigation Flow

### Entry Point
```dart
// From SchedulePricingScreen
Navigator.push(
  context,
  MaterialPageRoute(
    builder: (_) => AssignmentInProgressScreen(
      worker: widget.worker,
      service: widget.service,
      startTime: startTime,
      endTime: endTime,
      amount: _calculatedPrice!,
    ),
  ),
);
```

### Exit Points
1. **Success**: Auto-transition to assigned state
2. **Delay**: Show delay message, continue checking
3. **Failure**: Navigate to failure screen
4. **User Action**: Navigate to details or support

## Error Handling

### Network Errors
- Continue checking assignment status
- Show generic error message if needed
- Maintain calm tone

### Assignment Errors
- Navigate to failure screen
- Provide clear next steps
- Maintain user trust

### Timeout Handling
- Show delay message after 10 minutes
- Continue checking in background
- Provide support options

## Performance Considerations

### Auto-Update Optimization
- Use appropriate polling intervals (2-5 seconds)
- Cancel polling when screen is disposed
- Handle rapid state changes gracefully

### Memory Management
- Dispose of timers properly
- Cancel pending network requests
- Clean up state listeners

## Testing Requirements

### Unit Tests
- State management logic
- Auto-update functionality
- Error handling

### Widget Tests
- UI component rendering
- User interactions
- State transitions

### Integration Tests
- Complete flow from confirmation to assignment
- Delay handling
- Failure scenarios

This specification ensures the Assignment In Progress screen meets all requirements for building trust, reducing anxiety, and providing clear communication during the assignment process.