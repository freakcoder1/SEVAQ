/// Subscription Reminder Banner
/// Shows active subscriptions and their status (awaiting worker, assigned, etc.)
import 'dart:async';
import 'package:flutter/material.dart';
import '../providers/booking_provider.dart';
import '../providers/auth_provider.dart';
import '../models/subscription.dart';
import '../screens/history_screen.dart';
import 'package:provider/provider.dart';

class SubscriptionReminderBanner extends StatefulWidget {
  final AuthProvider? authProvider;
  final BookingProvider? bookingProvider;

  const SubscriptionReminderBanner({
    super.key,
    this.authProvider,
    this.bookingProvider,
  });

  @override
  State<SubscriptionReminderBanner> createState() =>
      _SubscriptionReminderBannerState();
}

class _SubscriptionReminderBannerState
    extends State<SubscriptionReminderBanner> {
  Timer? _refreshTimer;
  bool _isFetching = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _fetchSubscriptions();
      // Start periodic refresh every 300 seconds (5 minutes)
      // Backend scheduler only runs every 5-15 minutes, faster polling is useless
      _refreshTimer = Timer.periodic(const Duration(seconds: 300), (
        Timer timer,
      ) {
        if (mounted) {
          _fetchSubscriptions();
        }
      });
    });
  }

  @override
  void dispose() {
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _fetchSubscriptions() async {
    // Prevent concurrent duplicate requests
    if (_isFetching || !mounted) return;

    try {
      _isFetching = true;

      BookingProvider? resolvedBookingProvider = widget.bookingProvider;

      if (resolvedBookingProvider == null) {
        try {
          resolvedBookingProvider = Provider.of<BookingProvider>(
            context,
            listen: false,
          );
        } catch (e) {
          debugPrint('Failed to get BookingProvider: $e');
          return;
        }
      }

      await resolvedBookingProvider.fetchBookingsAndSubscriptions(
        context: context,
      );
    } catch (e) {
      debugPrint(
        'Error fetching subscriptions in SubscriptionReminderBanner: $e',
      );
      // Silent fail - do not crash widget tree on network errors
      // Next timer tick will retry automatically
    } finally {
      if (mounted) {
        _isFetching = false;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    try {
      AuthProvider? resolvedAuthProvider = widget.authProvider;
      BookingProvider? resolvedBookingProvider = widget.bookingProvider;

      if (resolvedAuthProvider == null) {
        try {
          resolvedAuthProvider = Provider.of<AuthProvider>(
            context,
            listen: false,
          );
        } catch (e) {
          debugPrint('Failed to get AuthProvider: $e');
          return const SizedBox.shrink();
        }
      }

      if (resolvedBookingProvider == null) {
        try {
          resolvedBookingProvider = Provider.of<BookingProvider>(
            context,
            listen: false,
          );
        } catch (e) {
          debugPrint('Failed to get BookingProvider: $e');
          return const SizedBox.shrink();
        }
      }

      if (resolvedAuthProvider == null ||
          !resolvedAuthProvider.isFullyAuthenticated) {
        return const SizedBox.shrink();
      }

      // Listen for changes in subscriptions
      return Consumer<BookingProvider>(
        builder: (context, bookingProvider, child) {
          final activeSubscriptions = bookingProvider.subscriptions
              .where((s) => s.isActive)
              .toList();

          if (activeSubscriptions.isEmpty) {
            return const SizedBox.shrink();
          }

          // Check if any subscription is awaiting worker assignment
          // Use proper workerState getter from Subscription model
          final awaitingWorker = activeSubscriptions
              .where(
                (s) =>
                    s.workerState == WorkerState.pending ||
                    s.workerState == WorkerState.availableDetected ||
                    s.workerState == WorkerState.failed,
              )
              .toList();

          debugPrint('=== SubscriptionReminderBanner Debug ===');
          debugPrint(
            'Active subscriptions count: ${activeSubscriptions.length}',
          );
          for (var sub in activeSubscriptions) {
            debugPrint(
              '  Sub ${sub.id}: workerName=${sub.workerName}, workerId=${sub.workerId}, status=${sub.status}',
            );
          }
          debugPrint('Awaiting worker count: ${awaitingWorker.length}');

          if (awaitingWorker.isNotEmpty) {
            return _buildAwaitingWorkerBanner(context, awaitingWorker.first);
          }

          // Show banner for active subscription with worker
          return _buildActiveSubscriptionBanner(
            context,
            activeSubscriptions.first,
          );
        },
      );
    } catch (e) {
      debugPrint('Error in SubscriptionReminderBanner: $e');
      return const SizedBox.shrink();
    }
  }

  Widget _buildAwaitingWorkerBanner(
    BuildContext context,
    Subscription subscription,
  ) {
    // Determine if worker assignment failed
    final bool isWorkerAssignmentFailed = subscription.workerAssignmentFailed;

    // Different message based on worker assignment status
    final String titleText;
    final String descriptionText;
    final Color backgroundColor;
    final Color borderColor;
    final Color textColor;
    final IconData icon;

    if (isWorkerAssignmentFailed) {
      // Worker assignment failed - show "Worker not available"
      titleText = 'Worker not available';
      descriptionText =
          'We\'re currently unable to find an available ${subscription.serviceName} professional in your area. We\'ll keep trying and notify you when one becomes available.';
      backgroundColor = const Color(0xFFFFEBEE); // Light red background
      borderColor = const Color(0xFFEF5350); // Red border
      textColor = const Color(0xFFC62828); // Dark red text
      icon = Icons.person_off_outlined;
    } else {
      // Still looking for a worker - show "Finding your perfect match"
      titleText = 'Finding your perfect match';
      descriptionText =
          'We\'re selecting a ${subscription.serviceName} professional for you. This usually takes a few minutes.';
      backgroundColor = const Color(0xFFFFF3E0); // Light orange background
      borderColor = const Color(0xFFFFB74D); // Orange border
      textColor = const Color(0xFFE65100); // Dark orange text
      icon = Icons.person_search_outlined;
    }

    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HistoryScreen()),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 14,
        ), // Increased 2-3px for better balance
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: backgroundColor,
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: borderColor, width: 1),
        ),
        child: Row(
          children: [
            Icon(icon, color: textColor, size: 22),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titleText,
                    style: TextStyle(
                      color: textColor,
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    descriptionText,
                    style: TextStyle(
                      color: textColor.withOpacity(0.8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            Icon(Icons.chevron_right, color: textColor, size: 20),
          ],
        ),
      ),
    );
  }

  Widget _buildActiveSubscriptionBanner(
    BuildContext context,
    Subscription subscription,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.push(
          context,
          MaterialPageRoute(builder: (context) => HistoryScreen()),
        );
      },
      child: Container(
        width: double.infinity,
        padding: const EdgeInsets.symmetric(
          horizontal: 20,
          vertical: 12,
        ), // Increased 2-3px for better balance
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: const Color(0xFFE8F5E9), // Light green background
          borderRadius: BorderRadius.circular(10),
          border: Border.all(
            color: const Color(0xFF81C784), // Green border
            width: 1,
          ),
        ),
        child: Row(
          children: [
            const Icon(
              Icons.check_circle_outline,
              color: Color(0xFF2E7D32),
              size: 20,
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    '${subscription.workerName} is your ${_getServiceTypeDisplay(subscription.serviceType)}',
                    style: const TextStyle(
                      color: Color(0xFF2E7D32),
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '${_getCustomPlanDisplayText(subscription)} - ${subscription.priceDisplay}',
                    style: TextStyle(
                      color: const Color(0xFF2E7D32).withOpacity(0.8),
                      fontSize: 12,
                    ),
                  ),
                ],
              ),
            ),
            const Icon(Icons.chevron_right, color: Color(0xFF2E7D32), size: 20),
          ],
        ),
      ),
    );
  }

  String _getServiceTypeDisplay(String type) {
    switch (type) {
      case 'COOK':
        return 'Cooking';
      case 'MAID':
        return 'Maid Service';
      case 'CLEANING':
        return 'Cleaning';
      default:
        return 'Service';
    }
  }

  /// Get display text for custom plan based on service type
  String _getCustomPlanDisplayText(Subscription subscription) {
    final serviceType = subscription.serviceType.toUpperCase();
    final customPlanData = subscription.customPlanData;

    if (customPlanData == null) return '';

    if (serviceType == 'COOKING' || serviceType == 'COOK') {
      final persons = customPlanData['numberOfPeople'] ?? 1;
      final mealPlan = customPlanData['mealPlan'] ?? 'all';
      return '$persons person(s), $mealPlan';
    } else if (serviceType == 'CLEANING') {
      final bhk = customPlanData['bhk'] ?? 1;
      return '$bhk BHK';
    } else if (serviceType == 'MAID' || serviceType == 'MAID_SERVICE') {
      return 'Maid Service';
    }
    return 'Custom Plan';
  }
}
