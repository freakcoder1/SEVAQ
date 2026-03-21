import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../providers/auth_provider.dart';
import '../providers/assignment_provider.dart';
import '../providers/booking_provider.dart';
import '../screens/service_clarification_screen.dart';
import '../screens/schedule_pricing_screen.dart';
import '../screens/assignment_in_progress_screen.dart';
import '../screens/professional_assigned_screen.dart';
import '../screens/booking_confirmation_screen.dart';
import 'enhanced_navigation_service.dart';

/// Navigation Flow Manager
/// Manages the complete Sevaq assignment flow with optimized navigation
class NavigationFlowManager {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();
  final EnhancedNavigationService _navigationService =
      EnhancedNavigationService();

  /// Start the complete assignment flow from service clarification
  Future<void> startAssignmentFlow({
    required BuildContext context,
    Service? service,
  }) async {
    await _navigationService.navigateToServiceClarification(
      context: context,
      service: service,
    );
  }

  /// Navigate from service clarification to schedule pricing
  Future<void> navigateToSchedulePricing({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    await _navigationService.navigateToSchedulePricing(
      context: context,
      worker: worker,
      service: service,
    );
  }

  /// Navigate from schedule pricing to assignment in progress
  Future<void> navigateToAssignmentInProgress({
    required BuildContext context,
    required Worker worker,
    Service? service,
    required DateTime startTime,
    required DateTime endTime,
    required double amount,
  }) async {
    await _navigationService.navigateToAssignmentInProgress(
      context: context,
      worker: worker,
      service: service,
      startTime: startTime,
      endTime: endTime,
      amount: amount,
    );
  }

  /// Navigate from assignment in progress to professional assigned
  Future<void> navigateToProfessionalAssigned({
    required BuildContext context,
    required Worker worker,
    Service? service,
    required DateTime startTime,
    required DateTime endTime,
    required double amount,
  }) async {
    await _navigationService.navigateToProfessionalAssigned(
      context: context,
      worker: worker,
      service: service,
      startTime: startTime,
      endTime: endTime,
      amount: amount,
    );
  }

  /// Navigate from professional assigned to booking confirmation
  Future<void> navigateToBookingConfirmation({
    required BuildContext context,
    required Booking booking,
  }) async {
    await _navigationService.navigateToBookingConfirmation(
      context: context,
      booking: booking,
    );
  }

  /// Handle assignment completion with proper navigation
  Future<void> handleAssignmentCompletion({
    required BuildContext context,
    required Booking booking,
  }) async {
    await _navigationService.handleAssignmentCompletion(
      context: context,
      booking: booking,
    );
  }

  /// Handle assignment failure with proper navigation and error handling
  void handleAssignmentFailure({
    required BuildContext context,
    String? errorMessage,
  }) {
    _navigationService.handleAssignmentFailure(
      context: context,
      errorMessage: errorMessage,
    );
  }

  /// Handle assignment timeout with fallback options
  void handleAssignmentTimeout({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) {
    _navigationService.handleAssignmentTimeout(
      context: context,
      worker: worker,
      service: service,
    );
  }

  /// Navigate back with proper state handling
  void goBack({BuildContext? context}) {
    if (context != null) {
      _navigationService.goBack(context: context);
    } else {
      _navigationService.goBack();
    }
  }

  /// Navigate back to home with state cleanup
  void goHome({BuildContext? context}) {
    if (context != null) {
      _navigationService.goHome(context: context);
    } else {
      _navigationService.goHome();
    }
  }

  /// Get current assignment state for navigation decisions
  AssignmentState getCurrentAssignmentState(BuildContext context) {
    return _navigationService.getCurrentAssignmentState(context);
  }

  /// Check if user can navigate back in assignment flow
  bool canNavigateBack(BuildContext context) {
    return _navigationService.canNavigateBack(context);
  }

  /// Navigate with custom back handler for assignment flow screens
  Future<T?> navigateWithBackHandler<T>({
    required BuildContext context,
    required Widget screen,
    required String routeName,
    required VoidCallback onBack,
  }) async {
    return await _navigationService.navigateWithBackHandler(
      context: context,
      screen: screen,
      routeName: routeName,
      onBack: onBack,
    );
  }

  /// Navigate to assignment flow with proper back navigation that respects assignment state
  Future<void> navigateToAssignmentFlowWithBackHandler({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    await _navigationService.navigateToAssignmentFlowWithBackHandler(
      context: context,
      worker: worker,
      service: service,
    );
  }
}

/// Assignment Flow State Manager
/// Manages the state of the assignment flow across screen transitions
class AssignmentFlowStateManager {
  final AssignmentProvider _assignmentProvider;

  AssignmentFlowStateManager(this._assignmentProvider);

  /// Set assignment state
  void setAssignmentState({
    Worker? worker,
    Service? service,
    DateTime? startTime,
    DateTime? endTime,
    double? amount,
  }) {
    _assignmentProvider.setAssignmentState(
      worker: worker,
      service: service,
      startTime: startTime,
      endTime: endTime,
      amount: amount,
    );
  }

  /// Set assignment in progress state
  void setAssignmentInProgress(bool inProgress) {
    _assignmentProvider.setAssignmentInProgress(inProgress);
  }

  /// Reset assignment state
  void resetAssignmentState() {
    _assignmentProvider.resetAssignmentState();
  }

  /// Get current assignment state
  AssignmentState getCurrentState() {
    return AssignmentState(
      worker: _assignmentProvider.worker,
      service: _assignmentProvider.service,
      startTime: _assignmentProvider.startTime,
      endTime: _assignmentProvider.endTime,
      amount: _assignmentProvider.amount,
      isAssignmentInProgress: _assignmentProvider.isAssignmentInProgress,
    );
  }

  /// Check if assignment flow is complete
  bool isAssignmentFlowComplete() {
    final state = getCurrentState();
    return state.isComplete;
  }

  /// Check if assignment is in progress
  bool isAssignmentInProgress() {
    return _assignmentProvider.isAssignmentInProgress;
  }

  /// Check if assignment has worker assigned
  bool hasWorkerAssigned() {
    return _assignmentProvider.worker != null;
  }

  /// Check if assignment has service selected
  bool hasServiceSelected() {
    return _assignmentProvider.service != null;
  }

  /// Check if assignment has time scheduled
  bool hasTimeScheduled() {
    return _assignmentProvider.startTime != null &&
        _assignmentProvider.endTime != null;
  }

  /// Check if assignment has amount calculated
  bool hasAmountCalculated() {
    return _assignmentProvider.amount > 0;
  }
}

/// Assignment Flow Validator
/// Validates assignment flow state and provides navigation guidance
class AssignmentFlowValidator {
  /// Validate assignment state for navigation
  static bool canNavigateToSchedulePricing(AssignmentState state) {
    return state.hasWorker && state.hasService;
  }

  /// Validate assignment state for assignment in progress
  static bool canNavigateToAssignmentInProgress(AssignmentState state) {
    return state.hasWorker &&
        state.hasService &&
        state.hasTime &&
        state.hasAmount;
  }

  /// Validate assignment state for professional assigned
  static bool canNavigateToProfessionalAssigned(AssignmentState state) {
    return state.hasWorker &&
        state.hasService &&
        state.hasTime &&
        state.hasAmount;
  }

  /// Validate assignment state for booking confirmation
  static bool canNavigateToBookingConfirmation(AssignmentState state) {
    return state.hasWorker &&
        state.hasService &&
        state.hasTime &&
        state.hasAmount;
  }

  /// Get next valid navigation step
  /// SEVAQ DOCTRINE: Users never choose workers - assignment is automatic
  static String getNextNavigationStep(AssignmentState state) {
    // Worker assignment is system-managed, never user-driven
    if (!state.hasService) return 'select-service';
    if (!state.hasTime) return 'schedule-time';
    if (!state.hasAmount) return 'calculate-amount';
    return 'start-assignment';
  }

  /// Check if assignment flow can be completed
  static bool canCompleteAssignmentFlow(AssignmentState state) {
    return state.isComplete;
  }

  /// Validate assignment data integrity
  static bool validateAssignmentData(AssignmentState state) {
    if (!state.hasWorker ||
        !state.hasService ||
        !state.hasTime ||
        !state.hasAmount) {
      return false;
    }

    // Validate time range
    if (state.startTime!.isAfter(state.endTime!)) {
      return false;
    }

    // Validate amount is positive
    if (state.amount <= 0) {
      return false;
    }

    return true;
  }
}

/// Assignment Flow Error Handler
/// Handles errors and provides appropriate navigation responses
class AssignmentFlowErrorHandler {
  /// Handle assignment flow errors
  static void handleAssignmentFlowError({
    required BuildContext context,
    required String errorType,
    required String errorMessage,
    AssignmentFlowStateManager? stateManager,
  }) {
    // Reset assignment state if needed
    stateManager?.resetAssignmentState();

    // Show appropriate error message
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(errorMessage),
        backgroundColor: Colors.red,
        action: SnackBarAction(
          label: 'Retry',
          onPressed: () {
            // Retry logic could be implemented here
            if (stateManager != null) {
              // Navigate back to appropriate screen based on error type
              _navigateToRetryScreen(context, errorType, stateManager);
            }
          },
        ),
      ),
    );
  }

  /// Navigate to retry screen based on error type
  static void _navigateToRetryScreen(
    BuildContext context,
    String errorType,
    AssignmentFlowStateManager stateManager,
  ) {
    switch (errorType) {
      case 'assignment-failed':
        // Navigate back to service clarification
        Navigator.of(context).popUntil((route) => route.isFirst);
        break;
      case 'timeout':
        // Navigate back to schedule pricing
        Navigator.of(context).pop();
        break;
      case 'validation-error':
        // Navigate back to previous screen
        Navigator.of(context).pop();
        break;
      default:
        // Navigate back to home
        Navigator.of(context).popUntil((route) => route.isFirst);
        break;
    }
  }

  /// Handle timeout errors with user options
  static void handleTimeoutError({
    required BuildContext context,
    required Worker worker,
    Service? service,
    AssignmentFlowStateManager? stateManager,
  }) {
    // Reset assignment state
    stateManager?.resetAssignmentState();

    // Show timeout dialog with options
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Assignment taking longer than expected'),
        content: const Text(
          'We\'re still working on finding the perfect professional for you. You can try again or browse available professionals.',
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.pop(context);
              // Retry assignment
              // Implementation would depend on the specific retry logic needed
            },
            child: const Text('Try Again'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to manual selection
              Navigator.of(context).popUntil((route) => route.isFirst);
            },
            child: const Text('Browse Professionals'),
          ),
        ],
      ),
    );
  }
}
