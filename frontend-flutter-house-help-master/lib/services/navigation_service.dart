import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import 'package:flutter_house_help/models/location.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../providers/assignment_provider.dart';
import '../providers/location_provider.dart';
import '../screens/service_clarification_screen.dart';
import '../screens/assignment_in_progress_screen.dart';
import '../screens/professional_assigned_screen.dart';
import '../screens/booking_confirmation_screen.dart';
import '../screens/schedule_pricing_screen.dart';

/// Navigation Service for Sevaq Assignment Flow
/// Manages seamless transitions between assignment-related screens
class NavigationService {
  final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

  /// Navigate to Service Clarification Screen
  Future<void> navigateToServiceClarification({
    required BuildContext context,
    Service? service,
    dynamic userId,
    Location? initialLocation,
  }) async {
    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => ServiceClarificationScreen(
          userId: userId,
          initialLocation: initialLocation,
        ),
      ),
    );
  }

  /// Navigate to Schedule & Pricing Screen
  Future<void> navigateToSchedulePricing({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) =>
            SchedulePricingScreen(worker: worker, service: service),
      ),
    );
  }

  /// Navigate to Assignment In Progress Screen
  Future<void> navigateToAssignmentInProgress({
    required BuildContext context,
    required Worker worker,
    Service? service,
    required DateTime startTime,
    required DateTime endTime,
    required double amount,
  }) async {
    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => AssignmentInProgressScreen(
          worker: worker,
          service: service,
          startTime: startTime,
          endTime: endTime,
          amount: amount,
        ),
      ),
    );
  }

  /// Navigate to Professional Assigned Screen
  Future<void> navigateToProfessionalAssigned({
    required BuildContext context,
    required Worker worker,
    Service? service,
    required DateTime startTime,
    required DateTime endTime,
    required double amount,
  }) async {
    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => ProfessionalAssignedScreen(
          worker: worker,
          service: service,
          startTime: startTime,
          endTime: endTime,
          amount: amount,
        ),
      ),
    );
  }

  /// Navigate to Booking Confirmation Screen
  Future<void> navigateToBookingConfirmation({
    required BuildContext context,
    required Booking booking,
  }) async {
    await navigatorKey.currentState?.push(
      MaterialPageRoute(
        builder: (context) => BookingConfirmationScreen(booking: booking),
      ),
    );
  }

  /// Navigate back to previous screen
  void goBack() {
    navigatorKey.currentState?.pop();
  }

  /// Navigate back to home screen
  void goHome() {
    navigatorKey.currentState?.popUntil((route) => route.isFirst);
  }

  /// Navigate to Login Screen
  void navigateToLogin() {
    navigatorKey.currentState?.pushNamedAndRemoveUntil(
      '/login',
      (route) => false,
    );
  }

  /// Navigate to assignment flow with proper state management
  Future<void> startAssignmentFlow({
    required BuildContext context,
    required Worker worker,
    Service? service,
  }) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final bookingProvider = Provider.of<BookingProvider>(
      context,
      listen: false,
    );
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
      amount: 0.0, // Booking model doesn't have amount field
    );

    // Navigate to confirmation
    await navigateToBookingConfirmation(context: context, booking: booking);
  }

  /// Handle assignment failure with proper navigation
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
        SnackBar(content: Text(errorMessage), backgroundColor: Colors.red),
      );
    }

    // Navigate back to service clarification
    goBack();
  }

  /// Handle timeout with fallback options
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

  /// Navigate with proper back navigation handling
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
}

/// Assignment State Provider
/// Manages assignment state across screen transitions
class AssignmentProvider with ChangeNotifier {
  Worker? _worker;
  Service? _service;
  DateTime? _startTime;
  DateTime? _endTime;
  double _amount = 0.0;
  bool _isAssignmentInProgress = false;

  Worker? get worker => _worker;
  Service? get service => _service;
  DateTime? get startTime => _startTime;
  DateTime? get endTime => _endTime;
  double get amount => _amount;
  bool get isAssignmentInProgress => _isAssignmentInProgress;

  void setAssignmentState({
    Worker? worker,
    Service? service,
    DateTime? startTime,
    DateTime? endTime,
    double? amount,
  }) {
    _worker = worker;
    _service = service;
    _startTime = startTime;
    _endTime = endTime;
    _amount = amount ?? _amount;
    notifyListeners();
  }

  void setAssignmentInProgress(bool inProgress) {
    _isAssignmentInProgress = inProgress;
    notifyListeners();
  }

  void resetAssignmentState() {
    _worker = null;
    _service = null;
    _startTime = null;
    _endTime = null;
    _amount = 0.0;
    _isAssignmentInProgress = false;
    notifyListeners();
  }

  bool get hasAssignmentState => _worker != null;
}
