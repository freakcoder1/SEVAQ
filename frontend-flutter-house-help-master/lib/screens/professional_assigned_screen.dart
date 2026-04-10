import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../models/address.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_service.dart';
import '../widgets/booking_status_timeline.dart';
import '../widgets/address_input_popup.dart';
import 'booking_confirmation_screen.dart';
import '../config/app_config.dart';

/// Professional Assigned Screen
/// Shows professional details and payment prompt
class ProfessionalAssignedScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const ProfessionalAssignedScreen({
    Key? key,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  State<ProfessionalAssignedScreen> createState() =>
      _ProfessionalAssignedScreenState();
}

class _ProfessionalAssignedScreenState
    extends State<ProfessionalAssignedScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String? _orderId;
  Map<String, dynamic>? _pendingBookingData;
  Address? _savedAddress;
  bool _isLoadingAddress = true;

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    // PERMANENT FIX: Use static instance instead of Provider.of(context)
    // This avoids "Provider not found" errors when context doesn't have provider in scope
    _authProvider = AuthProvider.instance;
    debugPrint('ProfessionalAssignedScreen: Using AuthProvider.instance');

    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _loadSavedAddress();
  }

  Future<void> _loadSavedAddress() async {
    try {
      final response = await _apiService.getDefaultAddress();
      if (response != null) {
        setState(() {
          _savedAddress = Address.fromJson(response);
          _isLoadingAddress = false;
        });
      } else {
        setState(() => _isLoadingAddress = false);
      }
    } catch (e) {
      debugPrint('Error loading saved address: $e');
      setState(() => _isLoadingAddress = false);
    }
  }

  Future<void> _showAddressPopup() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      barrierDismissible: false,
      builder: (_) => AddressInputPopup(
        onAddressSaved: (address) {
          Navigator.of(context).pop(address.toCreateJson());
        },
      ),
    );

    if (result != null) {
      setState(() => _isProcessing = true);
      try {
        final savedAddress = await _apiService.saveAddress(result);
        if (savedAddress != null) {
          setState(() {
            _savedAddress = Address.fromJson(savedAddress);
          });
        }
        // Continue with payment
        _proceedToPayment();
      } catch (e) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error saving address: ${e.toString()}')),
        );
      } finally {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _handlePayment() async {
    if (_isProcessing) return;

    // Check if user has a saved address
    if (_savedAddress == null) {
      // Show address popup first
      _showAddressPopup();
    } else {
      // Proceed directly to payment
      _proceedToPayment();
    }
  }

  Future<void> _proceedToPayment() async {
    if (_isProcessing) return;

    setState(() => _isProcessing = true);

    try {
      final user = _authProvider.user;
      if (user == null) {
        throw Exception('User not logged in');
      }

      // Get the service - find valid one from worker if needed
      Service? selectedService = widget.service;

      // If widget.service is null or has invalid ID (0), find a valid service from worker
      if (selectedService == null || selectedService.id == 0) {
        // Find first service with valid ID (not 0)
        final validServices = widget.worker.services
            .where((s) => s.id != 0)
            .toList();
        if (validServices.isNotEmpty) {
          selectedService = validServices.first;
        } else {
          throw Exception('No valid service available for this worker');
        }
      }

      // Debug log the service being used
      debugPrint(
        'Using service for booking: id=${selectedService.id}, name=${selectedService.name}',
      );

      // Build location data from saved address
      Map<String, dynamic>? locationData;
      if (_savedAddress != null) {
        locationData = {
          'latitude': _savedAddress!.latitude,
          'longitude': _savedAddress!.longitude,
          'address': _savedAddress!.fullAddress,
        };
      }

      // Prepare booking data (will be used after payment success)
      _pendingBookingData = {
        'userId': user.publicId,
        'workerId': widget.worker.id,
        'serviceId': selectedService.id,
        'startTime': widget.startTime.toIso8601String(),
        'endTime': widget.endTime.toIso8601String(),
        'type': 'on_demand',
        'amount': (widget.amount * 100).toInt(), // Amount in paise
        'addressId': _savedAddress?.id,
        'location': locationData,
      };

      // Create payment order on backend
      final amountInPaise = (widget.amount * 100).toInt();
      final orderResponse = await _apiService.post('payments/create-order', {
        'amount': amountInPaise,
        'currency': 'INR',
        'addressId': _savedAddress?.id,
        'location': locationData,
      });

      if (orderResponse != null && orderResponse['id'] != null) {
        _orderId = orderResponse['id'];

        // Open Razorpay payment gateway
        var options = {
          'key': AppConfig.razorpayTestKey,
          'amount': amountInPaise,
          'currency': 'INR',
          'name': 'House Help',
          'description': 'Payment for ${selectedService.name}',
          'order_id': _orderId,
          'prefill': {
            'contact':
                '9999999999', // Default contact - phone number not available in User model
            'email': user.email ?? 'test@example.com',
          },
        };

        _razorpay.open(options);
      } else {
        throw Exception('Failed to create payment order');
      }
    } catch (e) {
      debugPrint('Payment error: ${e.toString()}');
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error: ${e.toString()}'),
          backgroundColor: Colors.red,
        ),
      );
      setState(() => _isProcessing = false);
    }
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    setState(() => _isProcessing = true);

    try {
      if (_pendingBookingData == null || _orderId == null) {
        throw Exception('Missing booking data or order ID');
      }

      // Verify payment and create booking
      final verifyResponse = await _apiService.post('payments/verify', {
        'razorpayOrderId': _orderId,
        'razorpayPaymentId': response.paymentId,
        'signature': response.signature,
        'bookingData': _pendingBookingData,
      });

      if (verifyResponse != null && verifyResponse['status'] == 'success') {
        final booking = Booking.fromJson(verifyResponse['booking']);

        // Navigate to booking confirmation
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => BookingConfirmationScreen(booking: booking),
          ),
        );
      } else {
        throw Exception('Payment verification failed');
      }
    } catch (e) {
      debugPrint('Payment success error: ${e.toString()}');
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
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Payment Failed: ${response.message}'),
        backgroundColor: Colors.red,
      ),
    );
    setState(() => _isProcessing = false);
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External Wallet: ${response.walletName}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final service =
        widget.service ??
        (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.black87),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Success icon and message
              const SizedBox(height: 24),
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFE8F5E9),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.check_circle,
                      color: Color(0xFF2E7D32),
                      size: 32,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Professional Assigned!',
                          style: theme.textTheme.headlineMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: const Color(0xFF2E7D32),
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          '${widget.worker.user.firstName} has been assigned to your ${widget.service?.name ?? 'service'} and will arrive at your scheduled time.',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            color: Colors.black54,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),

              const SizedBox(height: 32),

              // Worker Profile Card
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                    colors: [
                      const Color(0xFFE8F5E9).withOpacity(0.8),
                      const Color(0xFFF1F8E9).withOpacity(0.9),
                    ],
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color: const Color(0xFF2E7D32).withOpacity(0.2),
                    width: 1,
                  ),
                ),
                child: Column(
                  children: [
                    // Worker avatar and name
                    Row(
                      children: [
                        // Avatar
                        Container(
                          width: 64,
                          height: 64,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            color: const Color(0xFF2E7D32),
                            boxShadow: [
                              BoxShadow(
                                color: Colors.black.withOpacity(0.1),
                                blurRadius: 8,
                                offset: const Offset(0, 2),
                              ),
                            ],
                          ),
                          child: Center(
                            child: Text(
                              widget.worker.user.firstName.isNotEmpty
                                  ? widget.worker.user.firstName[0]
                                        .toUpperCase()
                                  : 'W',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 28,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        // Name and verified badge
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Text(
                                    '${widget.worker.user.firstName} ${widget.worker.user.lastName}'
                                            .trim()
                                            .isNotEmpty
                                        ? '${widget.worker.user.firstName} ${widget.worker.user.lastName}'
                                        : 'Professional',
                                    style: theme.textTheme.titleMedium
                                        ?.copyWith(
                                          fontWeight: FontWeight.bold,
                                          color: Colors.black87,
                                          fontSize: 18,
                                        ),
                                  ),
                                  const SizedBox(width: 8),
                                  Container(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 6,
                                      vertical: 2,
                                    ),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFF2E7D32),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: const Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Icon(
                                          Icons.verified,
                                          color: Colors.white,
                                          size: 12,
                                        ),
                                        SizedBox(width: 2),
                                        Text(
                                          'Verified',
                                          style: TextStyle(
                                            color: Colors.white,
                                            fontSize: 10,
                                            fontWeight: FontWeight.w600,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              // Rating
                              Row(
                                children: [
                                  const Icon(
                                    Icons.star,
                                    color: Color(0xFFFFB300),
                                    size: 18,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    widget.worker.rating.toStringAsFixed(1),
                                    style: theme.textTheme.bodyMedium?.copyWith(
                                      fontWeight: FontWeight.w600,
                                      color: Colors.black87,
                                    ),
                                  ),
                                  const SizedBox(width: 4),
                                  Text(
                                    '(${widget.worker.reviewCount} reviews)',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: Colors.black54,
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Divider
                    Divider(color: Colors.black.withOpacity(0.1)),
                    const SizedBox(height: 16),
                    // Worker bio
                    if (widget.worker.bio.isNotEmpty)
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              const Icon(
                                Icons.info_outline,
                                color: Color(0xFF2E7D32),
                                size: 16,
                              ),
                              const SizedBox(width: 6),
                              Text(
                                'About',
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            widget.worker.bio,
                            style: theme.textTheme.bodyMedium?.copyWith(
                              color: Colors.black54,
                            ),
                          ),
                        ],
                      ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Add booking status timeline - shows user where they are in the booking process
              BookingStatusTimeline(
                currentState: BookingAssignmentState.assigned,
                showLabels: true,
              ),

              const SizedBox(height: 24),

              // Service details
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
                      'Service Details',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today,
                          color: Colors.black54,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                DateFormat(
                                  'EEEE, MMMM d, yyyy',
                                ).format(widget.startTime),
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                              Text(
                                '${DateFormat('jm').format(widget.startTime)} - ${DateFormat('jm').format(widget.endTime)}',
                                style: theme.textTheme.bodyMedium?.copyWith(
                                  color: Colors.black54,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.work, color: Colors.black54, size: 20),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            service?.name ?? 'Service',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(
                          Icons.attach_money,
                          color: Colors.black54,
                          size: 20,
                        ),
                        const SizedBox(width: 12),
                        Text(
                          '₹${widget.amount.toStringAsFixed(0)}',
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: FontWeight.bold,
                            color: Colors.black87,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Payment prompt
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
                      'Confirm to proceed',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Payment confirms your booking. We’ll take care of everything else.',
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: Colors.black54,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 32),

              // Payment CTA
              Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 24,
                  vertical: 16,
                ),
                decoration: BoxDecoration(
                  color: Colors.white,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 10,
                      offset: const Offset(0, -2),
                    ),
                  ],
                ),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: _isProcessing ? null : _handlePayment,
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF2E7D32),
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
                            ? const SizedBox(
                                height: 20,
                                width: 20,
                                child: CircularProgressIndicator(
                                  strokeWidth: 2,
                                  color: Colors.white,
                                ),
                              )
                            : const Text('Confirm & pay'),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
