# 🛡️ Sevaq Assignment Flow - Edge Cases & Error Handling

## 📋 **Edge Case Implementation Plan**

This document outlines the implementation of robust error handling and edge case management for the Sevaq assignment flow.

## 🚨 **Critical Edge Cases to Handle**

### 1. **Assignment Failures & Retries**

#### **Scenario: No Workers Available**
- **Trigger**: No workers found for service type in user's location
- **User Impact**: Assignment process fails
- **Solution**: 
  - Show "No professionals available" message
  - Offer alternative time slots
  - Provide waitlist option
  - Suggest similar services

#### **Scenario: Worker Unavailable After Assignment**
- **Trigger**: Assigned worker becomes unavailable (sick, emergency)
- **User Impact**: Assignment status changes after user approval
- **Solution**:
  - Real-time worker availability monitoring
  - Automatic reassignment with user notification
  - Compensation or discount for inconvenience

#### **Scenario: Network Failures During Assignment**
- **Trigger**: API calls fail during assignment process
- **User Impact**: Assignment status unclear
- **Solution**:
  - Retry logic with exponential backoff
  - Offline status persistence
  - Clear error messages with retry options

### 2. **Reassignment Logic**

#### **Scenario: User Requests Reassignment**
- **Trigger**: User wants different professional
- **User Impact**: Assignment process restarts
- **Solution**:
  - Reassignment button in ProfessionalAssignedScreen
  - Reassignment limits (max 2-3 times)
  - Clear messaging about reassignment process

#### **Scenario: Automatic Reassignment Needed**
- **Trigger**: Worker cancels, becomes unavailable
- **User Impact**: Service disruption
- **Solution**:
  - Automatic reassignment with notification
  - Priority matching for urgent cases
  - Compensation for service disruption

### 3. **Offline Assignment Status Persistence**

#### **Scenario: App Closed During Assignment**
- **Trigger**: User closes app during AssignmentInProgressScreen
- **User Impact**: Assignment status lost
- **Solution**:
  - Local storage of assignment state
  - Resume assignment on app restart
  - Push notifications for assignment completion

#### **Scenario: Device Offline**
- **Trigger**: No internet connection during assignment
- **User Impact**: Cannot check assignment status
- **Solution**:
  - Cached assignment data
  - Status sync when connection restored
  - Offline-friendly UI with clear connectivity status

### 4. **Error Handling & User Feedback**

#### **Scenario: API Errors**
- **Trigger**: Backend service unavailable
- **User Impact**: Assignment process blocked
- **Solution**:
  - Graceful error messages
  - Retry mechanisms
  - Fallback to manual assignment option

#### **Scenario: Invalid Assignment State**
- **Trigger**: Database inconsistency, corrupted data
- **User Impact**: Assignment flow breaks
- **Solution**:
  - State validation and recovery
  - Clear error reporting
  - Support escalation path

### 5. **Assignment Timeout Handling**

#### **Scenario: Assignment Takes Too Long**
- **Trigger**: No workers available, system overload
- **User Impact**: User waits indefinitely
- **Solution**:
  - Timeout after 2-3 minutes
  - Show "Still working on your assignment" message
  - Offer manual selection option as fallback
  - Provide estimated wait time

#### **Scenario: User Abandons Assignment**
- **Trigger**: User leaves AssignmentInProgressScreen
- **User Impact**: Assignment process incomplete
- **Solution**:
  - Background assignment continuation
  - Push notification when assignment complete
  - Easy return to assignment status

## 🛠️ **Implementation Strategy**

### **Backend Enhancements**

#### **1. Enhanced AssignmentService**
```typescript
// Add timeout handling
async assignProfessionalWithTimeout(bookingId: string, timeoutMs: number = 180000) {
  const timeout = setTimeout(() => {
    throw new AssignmentTimeoutError('Assignment took too long');
  }, timeoutMs);
  
  try {
    const result = await this.assignProfessional(bookingId);
    clearTimeout(timeout);
    return result;
  } catch (error) {
    clearTimeout(timeout);
    throw error;
  }
}

// Add retry logic
async assignWithRetry(bookingId: string, maxRetries: number = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.assignProfessional(bookingId);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.delay(1000 * Math.pow(2, i)); // Exponential backoff
    }
  }
}
```

#### **2. Enhanced AssignmentController**
```typescript
@Post('assign-with-timeout')
async assignWithTimeout(@Body() request: AssignProfessionalRequest) {
  try {
    const result = await this.assignmentsService.assignProfessionalWithTimeout(
      request.bookingId,
      request.timeoutMs || 180000
    );
    return { success: true, result };
  } catch (error) {
    if (error instanceof AssignmentTimeoutError) {
      return { 
        success: false, 
        error: 'timeout',
        message: 'Still working on your assignment. We\'ll notify you shortly.',
        retryAfter: 60000 
      };
    }
    throw error;
  }
}
```

### **Frontend Enhancements**

#### **1. Enhanced AssignmentInProgressScreen**
```dart
class AssignmentInProgressScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;
  final int maxTimeoutMinutes; // New: Configurable timeout

  const AssignmentInProgressScreen({
    Key? key,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
    this.maxTimeoutMinutes = 3, // Default 3 minutes
  }) : super(key: key);
}

class _AssignmentInProgressScreenState extends State<AssignmentInProgressScreen> {
  late Timer _timeoutTimer;
  bool _showTimeoutMessage = false;
  int _timeoutCount = 0;

  @override
  void initState() {
    super.initState();
    _startTimeoutTimer();
  }

  void _startTimeoutTimer() {
    _timeoutTimer = Timer(
      Duration(minutes: widget.maxTimeoutMinutes),
      () {
        setState(() {
          _showTimeoutMessage = true;
        });
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // ... existing content
          
          if (_showTimeoutMessage)
            TimeoutMessage(
              onRetry: _handleTimeoutRetry,
              onManualSelection: _handleManualSelection,
            ),
        ],
      ),
    );
  }

  void _handleTimeoutRetry() {
    setState(() {
      _showTimeoutMessage = false;
      _timeoutCount++;
    });
    _startAssignmentCheck();
  }

  void _handleManualSelection() {
    // Navigate to manual worker selection as fallback
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(
        builder: (_) => ServiceClarificationScreen(
          // Show with worker selection enabled
        ),
      ),
    );
  }
}
```

#### **2. Enhanced Error Handling**
```dart
class AssignmentErrorWidget extends StatelessWidget {
  final String message;
  final VoidCallback onRetry;
  final bool showSupport;

  const AssignmentErrorWidget({
    Key? key,
    required this.message,
    required this.onRetry,
    this.showSupport = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.red[200]!),
      ),
      child: Column(
        children: [
          Icon(Icons.error, color: Colors.red, size: 48),
          const SizedBox(height: 16),
          Text(
            'Assignment Error',
            style: Theme.of(context).textTheme.headlineSmall?.copyWith(
              color: Colors.red,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            message,
            style: Theme.of(context).textTheme.bodyMedium,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton(
                onPressed: onRetry,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.red,
                  foregroundColor: Colors.white,
                ),
                child: const Text('Try Again'),
              ),
              if (showSupport)
                OutlinedButton(
                  onPressed: _showSupportOptions,
                  child: const Text('Get Help'),
                ),
            ],
          ),
        ],
      ),
    );
  }

  void _showSupportOptions() {
    // Show support options modal
  }
}
```

### **3. Offline Status Persistence**
```dart
class AssignmentStateManager {
  static const String _assignmentKey = 'current_assignment';
  
  Future<void> saveAssignmentState(AssignmentState state) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(_assignmentKey, state.toJson());
  }

  Future<AssignmentState?> getAssignmentState() async {
    final prefs = await SharedPreferences.getInstance();
    final data = prefs.getString(_assignmentKey);
    return data != null ? AssignmentState.fromJson(data) : null;
  }

  Future<void> clearAssignmentState() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_assignmentKey);
  }
}
```

## 📊 **Monitoring & Analytics**

### **Key Metrics to Track**
1. **Assignment Success Rate**: Percentage of successful assignments
2. **Assignment Time**: Average time to complete assignment
3. **Reassignment Rate**: Percentage of assignments requiring reassignment
4. **Timeout Rate**: Percentage of assignments timing out
5. **Error Rate**: Percentage of assignments failing due to errors
6. **User Abandonment**: Percentage of users leaving during assignment

### **Alerting**
- Assignment success rate below 90%
- Average assignment time above 2 minutes
- Error rate above 5%
- Timeout rate above 10%

## 🚀 **Implementation Priority**

### **Phase 1: Critical (High Priority)**
1. Assignment timeout handling
2. Network failure retry logic
3. Basic error messages

### **Phase 2: Important (Medium Priority)**
1. Reassignment logic
2. Offline status persistence
3. Enhanced error handling

### **Phase 3: Nice to Have (Low Priority)**
1. Advanced analytics
2. A/B testing for timeout durations
3. Smart fallback mechanisms

## ✅ **Success Criteria**

- **99% of assignments complete successfully** within 3 minutes
- **95% user satisfaction** with assignment process
- **<1% timeout rate** with proper fallback handling
- **<2% reassignment rate** due to system issues
- **Zero data loss** during assignment process

This comprehensive edge case handling ensures the Sevaq assignment flow is robust, user-friendly, and maintains high reliability even under adverse conditions.