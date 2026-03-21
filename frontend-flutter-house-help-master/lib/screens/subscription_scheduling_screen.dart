import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../config/app_config.dart';
import '../models/location.dart';
import '../models/service_profile.dart';
import '../services/api_service.dart';
import 'subscription_confirmation_screen.dart';

/// Subscription Scheduling Screen (Canonical v1)
///
/// Purpose: Collect required inputs for daily subscription creation
/// Eliminates frequency confusion - visits are always daily as a system promise
class SubscriptionSchedulingScreen extends StatefulWidget {
  final ServiceProfile serviceProfile;
  final dynamic
  userId; // Accept both int and String (UUID) - kept for backward compat
  final Location? initialLocation; // Pass location from parent

  const SubscriptionSchedulingScreen({
    Key? key,
    required this.serviceProfile,
    this.userId,
    this.initialLocation,
  }) : super(key: key);

  @override
  State<SubscriptionSchedulingScreen> createState() =>
      _SubscriptionSchedulingScreenState();
}

class _SubscriptionSchedulingScreenState
    extends State<SubscriptionSchedulingScreen> {
  late ApiService _apiService;
  Location? _currentLocation;

  // Resolve userId - use passed parameter (most reliable)
  // Note: We don't access AuthProvider here because this screen may be pushed
  // without being under the provider scope. The userId should be passed from parent.
  // Returns the publicId (UUID String) for subscription operations.
  dynamic get resolvedUserId {
    // Use passed userId parameter
    final id = widget.userId;
    if (id is int) {
      // Return int for legacy support (shouldn't happen with new flow)
      return id;
    } else if (id is String) {
      // Return the publicId (UUID) as String
      return id;
    }
    return null;
  }

  // State variables
  DateTime? _selectedStartDate;
  PreferredTimeWindow? _selectedTimeWindow;
  bool _isProcessing = false;

  // Constants
  static const int MAX_DATE_PILLS = 5;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    // Use passed initial location or try to get from provider
    _currentLocation = widget.initialLocation;
    // Auto-select earliest viable date (tomorrow)
    _selectedStartDate = _getEarliestViableDate();
    // Default to Morning time window
    _selectedTimeWindow = PreferredTimeWindow.morning;
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    // Location must be passed from parent screen - no fallback to provider
  }

  DateTime _getEarliestViableDate() {
    final now = DateTime.now();
    // Start from tomorrow to ensure we have time for setup
    return now.add(const Duration(days: 1));
  }

  List<DateTime> _getAvailableDates() {
    final dates = <DateTime>[];
    final startDate = _getEarliestViableDate();

    for (int i = 0; i < MAX_DATE_PILLS; i++) {
      dates.add(startDate.add(Duration(days: i)));
    }
    return dates;
  }

  List<PreferredTimeWindow> _getTimeWindows() {
    return [
      PreferredTimeWindow.morning,
      PreferredTimeWindow.afternoon,
      PreferredTimeWindow.evening,
    ];
  }

  String _formatTimeWindow(PreferredTimeWindow window) {
    switch (window) {
      case PreferredTimeWindow.morning:
        return '8:00 – 11:00';
      case PreferredTimeWindow.afternoon:
        return '12:00 – 15:00';
      case PreferredTimeWindow.evening:
        return '16:00 – 19:00';
    }
  }

  String _getTimeWindowLabel(PreferredTimeWindow window) {
    switch (window) {
      case PreferredTimeWindow.morning:
        return 'Morning';
      case PreferredTimeWindow.afternoon:
        return 'Afternoon';
      case PreferredTimeWindow.evening:
        return 'Evening';
    }
  }

  String _getTimeWindowDescription(PreferredTimeWindow window) {
    switch (window) {
      case PreferredTimeWindow.morning:
        return 'Most households choose this';
      case PreferredTimeWindow.afternoon:
        return 'Good availability';
      case PreferredTimeWindow.evening:
        return 'Limited availability';
    }
  }

  void _handleConfirmSubscription() async {
    if (_selectedStartDate == null || _selectedTimeWindow == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a start date and time window'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Check if location is available
      if (_currentLocation == null) {
        throw Exception('Location services not available');
      }

      // Create payment order with preferredTimeWindow
      final paymentOrder = await _apiService.createSubscriptionOrder(
        userId: resolvedUserId,
        serviceProfileId: widget.serviceProfile.id,
        preferredTimeWindow: _selectedTimeWindow
            .toString()
            .split('.')
            .last
            .toUpperCase(),
        startDate: _selectedStartDate!,
        lat: _currentLocation?.latitude ?? 0.0,
        lng: _currentLocation?.longitude ?? 0.0,
      );

      if (paymentOrder == null || paymentOrder['id'] == null) {
        throw Exception('Failed to create payment order');
      }

      // Initialize Razorpay
      final razorpay = Razorpay();

      // Configure payment options
      final Map<String, dynamic> options = {
        'key': AppConfig.razorpayTestKey, // Razorpay test key from config
        'amount': paymentOrder['amount'], // Amount in paise
        'currency': 'INR',
        'name': 'SEVAQ Services',
        'description':
            'Daily Service Subscription - ${widget.serviceProfile.profileName}',
        'order_id': paymentOrder['id'],
        'prefill': {
          'contact':
              AppConfig.defaultContactNumber, // Default contact from config
          'email': AppConfig.defaultEmail, // Default email from config
        },
        'theme': {'color': '#007bff'},
      };

      // Open payment gateway
      razorpay.open(options);

      // Listen for payment events
      razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, (
        PaymentSuccessResponse response,
      ) {
        _handlePaymentSuccess(response, paymentOrder);
      });

      razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, (
        PaymentFailureResponse response,
      ) {
        _handlePaymentError(response);
      });

      razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, (
        ExternalWalletResponse response,
      ) {
        _handleExternalWallet(response);
      });
    } catch (e) {
      print('🔍 DEBUG: Error in _handleConfirmSubscription: ${e.toString()}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      setState(() => _isProcessing = false);
    }
  }

  void _handlePaymentSuccess(
    PaymentSuccessResponse response,
    dynamic paymentOrder,
  ) async {
    try {
      // Payment successful, create subscription
      final paymentId = response.paymentId;
      final signature = response.signature;

      if (paymentId == null || signature == null) {
        throw Exception('Payment verification failed: missing payment details');
      }

      final subscriptionResponse = await _apiService
          .createSubscriptionAfterPayment(
            paymentId: paymentId,
            orderId: paymentOrder['id'],
            signature: signature,
            subscriptionData: {
              'userId': paymentOrder['subscription']['userId'],
              'serviceProfileId':
                  paymentOrder['subscription']['serviceProfileId'],
              'preferredTimeWindow':
                  paymentOrder['subscription']['preferredTimeWindow'],
              'startDate': paymentOrder['subscription']['startDate'],
              'location': paymentOrder['subscription']['location'],
              'monthlyPriceSnapshot':
                  paymentOrder['subscription']['monthlyPriceSnapshot'],
            },
          );

      if (subscriptionResponse != null &&
          subscriptionResponse['status'] == 'success' &&
          subscriptionResponse['subscription'] != null) {
        // Subscription created successfully
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text(
              'Subscription created successfully! Daily service will begin on your start date.',
            ),
            backgroundColor: Colors.green,
          ),
        );

        // Navigate to SubscriptionConfirmationScreen with SEVAQ messaging
        Navigator.pushAndRemoveUntil(
          context,
          MaterialPageRoute(
            builder: (context) => SubscriptionConfirmationScreen(
              serviceProfile: widget.serviceProfile,
              startDate: _selectedStartDate ?? DateTime.now(),
              timeWindow: _selectedTimeWindow?.name ?? 'MORNING',
              userId: resolvedUserId,
            ),
          ),
          (route) => route.isFirst,
        );
      } else {
        throw Exception('Failed to create subscription after payment');
      }
    } catch (e) {
      print('🔍 DEBUG: Error in _handlePaymentSuccess: ${e.toString()}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    print('🔍 DEBUG: Payment failed: ${response.code} - ${response.message}');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment failed: ${response.message}'),
        backgroundColor: Colors.red,
      ),
    );
    setState(() => _isProcessing = false);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    print('🔍 DEBUG: External wallet selected: ${response.walletName}');
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('External wallet not supported'),
        backgroundColor: Colors.red,
      ),
    );
    setState(() => _isProcessing = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final dates = _getAvailableDates();
    final timeWindows = _getTimeWindows();

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'Schedule your subscription',
          style: theme.textTheme.titleLarge?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        child: Column(
          children: [
            // Main scrollable content area
            Flexible(
              fit: FlexFit.loose,
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // 1️⃣ HEADER
                    _buildHeader(theme),

                    const SizedBox(height: 28),

                    // 2️⃣ SERVICE SUMMARY (READ-ONLY)
                    _buildServiceSummary(theme),

                    const SizedBox(height: 24),

                    // 3️⃣ SERVICE START DATE
                    _buildStartDateSelection(theme, dates),

                    const SizedBox(height: 24),

                    // 4️⃣ PREFERRED DAILY TIME WINDOW
                    _buildTimeWindowSelection(theme, timeWindows),

                    const SizedBox(height: 16),

                    // 5️⃣ SYSTEM CLARIFICATION TEXT
                    _buildSystemClarification(theme),

                    const SizedBox(height: 24),

                    // 6️⃣ TRUST NOTE
                    _buildTrustNote(theme),

                    const SizedBox(height: 24),
                  ],
                ),
              ),
            ),

            // 7️⃣ PRIMARY CTA (Fixed footer)
            _buildPrimaryCTA(theme),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(ThemeData theme) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Choose when your daily service should start.',
          style: theme.textTheme.bodyLarge?.copyWith(color: Colors.black54),
        ),
        const SizedBox(height: 4),
        Text(
          'SEVAQ will handle all recurring visits.',
          style: theme.textTheme.bodyLarge?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildServiceSummary(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Selected plan',
            style: theme.textTheme.labelMedium?.copyWith(
              color: Colors.black54,
              fontWeight: FontWeight.w500,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '${widget.serviceProfile.profileName} — ${widget.serviceProfile.serviceType}',
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            widget.serviceProfile.scopeDefinition,
            style: theme.textTheme.bodyMedium?.copyWith(color: Colors.black54),
          ),
          const SizedBox(height: 12),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: theme.primaryColor.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.calendar_today, size: 16, color: theme.primaryColor),
                const SizedBox(width: 8),
                Flexible(
                  child: Text(
                    'Visits are scheduled daily as part of this plan.',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.primaryColor,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStartDateSelection(ThemeData theme, List<DateTime> dates) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Service start date',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        SizedBox(
          height: 70,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            itemCount: dates.length,
            itemBuilder: (context, index) {
              final date = dates[index];
              final isSelected =
                  _selectedStartDate != null &&
                  _isSameDay(date, _selectedStartDate!);

              final isTomorrow = _isSameDay(
                date,
                DateTime.now().add(const Duration(days: 1)),
              );

              return GestureDetector(
                onTap: () => setState(() => _selectedStartDate = date),
                child: Container(
                  margin: const EdgeInsets.only(right: 12),
                  width: 70,
                  decoration: BoxDecoration(
                    color: isSelected
                        ? theme.primaryColor
                        : (index == 0
                              ? theme.primaryColor.withValues(alpha: 0.1)
                              : Colors.grey[100]),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: isSelected
                          ? theme.primaryColor
                          : Colors.grey[200]!,
                      width: 1,
                    ),
                  ),
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(
                        isTomorrow
                            ? 'Tomorrow'
                            : DateFormat('EEE').format(date),
                        style: theme.textTheme.bodySmall?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: isSelected
                              ? Colors.white
                              : (index == 0
                                    ? theme.primaryColor
                                    : Colors.black87),
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        DateFormat('d').format(date),
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: isSelected
                              ? Colors.white
                              : (index == 0
                                    ? theme.primaryColor
                                    : Colors.black87),
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Your service will begin on this date and continue daily.',
          style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  Widget _buildTimeWindowSelection(
    ThemeData theme,
    List<PreferredTimeWindow> timeWindows,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Preferred daily time window',
          style: theme.textTheme.titleMedium?.copyWith(
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 12),
        ...timeWindows.map((window) {
          final isSelected =
              _selectedTimeWindow != null && _selectedTimeWindow == window;
          final isMorning = window == PreferredTimeWindow.morning;

          return Padding(
            padding: const EdgeInsets.only(bottom: 8),
            child: GestureDetector(
              onTap: () => setState(() => _selectedTimeWindow = window),
              child: Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: isSelected ? theme.primaryColor : Colors.white,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: isSelected ? theme.primaryColor : Colors.grey[300]!,
                    width: 1,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Text(
                                _getTimeWindowLabel(window),
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: isSelected
                                      ? Colors.white
                                      : Colors.black87,
                                ),
                              ),
                              if (isMorning) ...[
                                const SizedBox(width: 8),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 8,
                                    vertical: 2,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isSelected
                                        ? Colors.white.withValues(alpha: 0.2)
                                        : theme.primaryColor.withValues(
                                            alpha: 0.1,
                                          ),
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'Default',
                                    style: theme.textTheme.labelSmall?.copyWith(
                                      color: isSelected
                                          ? Colors.white
                                          : theme.primaryColor,
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                ),
                              ],
                            ],
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _formatTimeWindow(window),
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.9)
                                  : Colors.black54,
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _getTimeWindowDescription(window),
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: isSelected
                                  ? Colors.white.withValues(alpha: 0.7)
                                  : Colors.black38,
                            ),
                          ),
                        ],
                      ),
                    ),
                    if (isSelected)
                      Icon(Icons.check_circle, color: Colors.white, size: 24),
                  ],
                ),
              ),
            ),
          );
        }).toList(),
      ],
    );
  }

  Widget _buildSystemClarification(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.blue[50],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.blue[100]!),
      ),
      child: Row(
        children: [
          Icon(Icons.info_outline, color: Colors.blue[700], size: 20),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              "We'll assign a verified professional before your service begins. "
              "Exact arrival time may vary slightly within your selected window.",
              style: theme.textTheme.bodySmall?.copyWith(
                color: Colors.blue[900],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustNote(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Row(
            children: [
              Icon(Icons.verified_user, color: Colors.green[700], size: 24),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  'Covered by SEVAQ Service Guarantee',
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Padding(
            padding: const EdgeInsets.only(left: 36),
            child: Text(
              "We'll assign a verified professional 24-48 hours before your service starts. "
              "SEVAQ handles all monitoring and replacement.",
              style: theme.textTheme.bodySmall?.copyWith(color: Colors.black54),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPrimaryCTA(ThemeData theme) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(top: BorderSide(color: Colors.grey[200]!)),
      ),
      child: SizedBox(
        width: double.infinity,
        child: ElevatedButton(
          onPressed: _isProcessing ? null : _handleConfirmSubscription,
          style: ElevatedButton.styleFrom(
            backgroundColor: theme.primaryColor,
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
            elevation: 0,
            textStyle: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w600,
            ),
          ),
          child: _isProcessing
              ? Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                    const SizedBox(width: 12),
                    const Text('Processing...'),
                  ],
                )
              : const Text('Confirm & start daily service'),
        ),
      ),
    );
  }

  bool _isSameDay(DateTime date1, DateTime date2) {
    return date1.year == date2.year &&
        date1.month == date2.month &&
        date1.day == date2.day;
  }
}

/// Preferred time window enum for daily subscriptions
enum PreferredTimeWindow { morning, afternoon, evening }
