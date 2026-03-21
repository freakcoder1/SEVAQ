import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../models/location.dart';
import '../providers/auth_provider.dart';
import '../providers/assignment_provider.dart';
import '../providers/booking_provider.dart';
import '../providers/location_provider.dart';
import '../screens/service_clarification_screen.dart';
import '../screens/schedule_pricing_screen.dart';
import '../screens/assignment_in_progress_screen.dart';
import '../screens/professional_assigned_screen.dart';
import '../screens/booking_confirmation_screen.dart';

/// Enhanced Navigation Service for Sevaq Assignment Flow
/// Provides optimized navigation with state management and error handling
class EnhancedNavigationService {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Navigate to Service Clarification Screen with proper state management
  Future<void> navigateToServiceClarification({
    required BuildContext context,
    Service? service,
    dynamic userId,
    Location? initialLocation,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Reset assignment state when starting fresh
    assignmentProvider.resetAssignmentState();

    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => ServiceClarificationScreen(
          userId: userId,
          initialLocation: initialLocation,
        ),
        settings: RouteSettings(name: '/service-clarification'),
      ),
    );
  }

  /// Navigate to Schedule & Pricing Screen with state preservation
  Future<void> navigateToSchedulePricing({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Store current assignment state
    assignmentProvider.setAssignmentState(
      worker: worker,
      service: service,
      startTime: null,
      endTime: null,
      amount: 0.0,
    );

    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) =>
            SchedulePricingScreen(worker: worker, service: service),
        settings: RouteSettings(name: '/schedule-pricing'),
      ),
    );
  }

  /// Navigate to Assignment In Progress Screen with state management
  Future<void> navigateToAssignmentInProgress({
    required BuildContext context,
    required Worker worker,
    Service? service,
    required DateTime startTime,
    required DateTime endTime,
    required double amount,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Update assignment state
    assignmentProvider.setAssignmentState(
      worker: worker,
      service: service,
      startTime: startTime,
      endTime: endTime,
      amount: amount,
    );

    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => AssignmentInProgressScreen(
          worker: worker,
          service: service,
          startTime: startTime,
          endTime: endTime,
          amount: amount,
        ),
        settings: RouteSettings(name: '/assignment-in-progress'),
      ),
    );
  }

  /// Navigate to Professional Assigned Screen with state management
  Future<void> navigateToProfessionalAssigned({
    required BuildContext context,
    required Worker worker,
    Service? service,
    required DateTime startTime,
    required DateTime endTime,
    required double amount,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Update assignment state
    assignmentProvider.setAssignmentState(
      worker: worker,
      service: service,
      startTime: startTime,
      endTime: endTime,
      amount: amount,
    );

    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => ProfessionalAssignedScreen(
          worker: worker,
          service: service,
          startTime: startTime,
          endTime: endTime,
          amount: amount,
        ),
        settings: RouteSettings(name: '/professional-assigned'),
      ),
    );
  }

  /// Navigate to Booking Confirmation Screen with state management
  Future<void> navigateToBookingConfirmation({
    required BuildContext context,
    required Booking booking,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Update assignment state with booking details
    assignmentProvider.setAssignmentState(
      worker: booking.worker,
      service: booking.service,
      startTime: booking.startTime,
      endTime: booking.endTime,
      amount: booking.amount ?? 0.0,
    );

    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => BookingConfirmationScreen(booking: booking),
        settings: RouteSettings(name: '/booking-confirmation'),
      ),
    );
  }

  /// Navigate back with proper state handling
  void goBack({BuildContext? context}) {
    if (context != null) {
      final assignmentProvider = Provider.of<AssignmentProvider>(
        context,
        listen: false,
      );

      // Reset assignment state if going back to service clarification
      assignmentProvider.resetAssignmentState();
    }

    navigatorKey.currentState?.pop();
  }

  /// Navigate back to home with state cleanup
  void goHome({BuildContext? context}) {
    if (context != null) {
      final assignmentProvider = Provider.of<AssignmentProvider>(
        context,
        listen: false,
      );

      // Reset all assignment state
      assignmentProvider.resetAssignmentState();
    }

    navigatorKey.currentState?.popUntil((route) => route.isFirst);
  }

  /// Start complete assignment flow
  Future<void> startAssignmentFlow({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Set initial assignment state
    assignmentProvider.setAssignmentState(
      worker: worker,
      service: service,
      startTime: null,
      endTime: null,
      amount: 0.0,
    );

    // Navigate to schedule pricing
    await navigateToSchedulePricing(
      context: context,
      worker: worker,
      service: service,
    );
  }

  /// Handle assignment completion with proper navigation
  Future<void> handleAssignmentCompletion({
    required BuildContext context,
    required Booking booking,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Update assignment state
    assignmentProvider.setAssignmentState(
      worker: booking.worker,
      service: booking.service,
      startTime: booking.startTime,
      endTime: booking.endTime,
      amount: booking.amount ?? 0.0,
    );

    // Navigate to confirmation
    await navigateToBookingConfirmation(context: context, booking: booking);
  }

  /// Handle assignment failure with proper navigation and error handling
  void handleAssignmentFailure({
    required BuildContext context,
    String? errorMessage,
  }) {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Reset assignment state
    assignmentProvider.resetAssignmentState();

    // Show error message
    if (errorMessage != null) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(errorMessage),
          backgroundColor: Colors.red,
          action: SnackBarAction(
            label: 'Retry',
            onPressed: () {
              // Retry logic could be implemented here
              goBack(context: context);
            },
          ),
        ),
      );
    }

    // Navigate back to service clarification
    goBack(context: context);
  }

  /// Handle assignment timeout with fallback options
  void handleAssignmentTimeout({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) {
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
              startAssignmentFlow(
                context: context,
                worker: worker,
                service: service,
              );
            },
            child: const Text('Try Again'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              // Navigate to manual selection
              navigateToServiceClarification(context: context);
            },
            child: const Text('Browse Professionals'),
          ),
        ],
      ),
    );
  }

  /// Navigate with custom back handler for specific screens
  Future<T?> navigateWithBackHandler<T>({
    required BuildContext context,
    required Widget screen,
    required String routeName,
    required VoidCallback onBack,
  }) async {
    return await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => WillPopScope(
          onWillPop: () async {
            onBack();
            return false; // Prevent default back behavior
          },
          child: screen,
        ),
        settings: RouteSettings(name: routeName),
      ),
    );
  }

  /// Navigate to assignment flow with proper back navigation that respects assignment state
  Future<void> navigateToAssignmentFlowWithBackHandler({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );

    // Set assignment state
    assignmentProvider.setAssignmentState(
      worker: worker,
      service: service,
      startTime: null,
      endTime: null,
      amount: 0.0,
    );

    // Navigate with custom back handler
    await navigateWithBackHandler(
      context: context,
      screen: SchedulePricingScreen(worker: worker, service: service),
      routeName: '/schedule-pricing',
      onBack: () {
        // Custom back handling for assignment flow
        assignmentProvider.resetAssignmentState();
        goBack(context: context);
      },
    );
  }

  /// Check if user can navigate back in assignment flow
  bool canNavigateBack(BuildContext context) {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );
    return assignmentProvider.hasAssignmentState;
  }

  /// Get current assignment state for navigation decisions
  AssignmentState getCurrentAssignmentState(BuildContext context) {
    final assignmentProvider = Provider.of<AssignmentProvider>(
      context,
      listen: false,
    );
    return AssignmentState(
      worker: assignmentProvider.worker,
      service: assignmentProvider.service,
      startTime: assignmentProvider.startTime,
      endTime: assignmentProvider.endTime,
      amount: assignmentProvider.amount,
      isAssignmentInProgress: assignmentProvider.isAssignmentInProgress,
    );
  }
}

/// Assignment State Data Class
class AssignmentState {
  final Worker? worker;
  final Service? service;
  final DateTime? startTime;
  final DateTime? endTime;
  final double amount;
  final bool isAssignmentInProgress;

  AssignmentState({
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
    required this.isAssignmentInProgress,
  });

  bool get hasWorker => worker != null;
  bool get hasService => service != null;
  bool get hasTime => startTime != null && endTime != null;
  bool get hasAmount => amount > 0;
  bool get isComplete => hasWorker && hasService && hasTime && hasAmount;
}
