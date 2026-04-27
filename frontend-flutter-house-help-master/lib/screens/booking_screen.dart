import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:provider/provider.dart';
import '../models/slot.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../models/address.dart';
import 'booking_confirmation_screen.dart';
import 'assignment_confirmed_screen.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_service.dart';
import '../widgets/address_input_popup.dart';

/// BookingScreen - SEVAQ assignment system
/// Workers are assigned just-in-time (24-48h before service)
/// Users do NOT select or see workers before payment
class BookingScreen extends StatefulWidget {
  final Slot slot;
  final Service? service;
  final String? workerPublicId; // Internal - only for assignment flow

  const BookingScreen({
    Key? key,
    required this.slot,
    this.service,
    this.workerPublicId,
  }) : super(key: key);

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String? _orderId;
  final ApiService _apiService = ApiService();
  Address? _savedAddress;
  bool _isLoadingAddress = true;

  @override
  void initState() {
    super.initState();
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

  void _startPayment() async {
    // Check if user has a saved address
    if (_savedAddress == null) {
      // Show address popup first
      _showAddressPopup();
    } else {
      // Proceed directly to payment
      _proceedToPayment();
    }
  }

  void _proceedToPayment() async {
    setState(() => _isProcessing = true);

    try {
      final selectedService = widget.service;
      final duration = widget.slot.endTime
          .difference(widget.slot.startTime)
          .inHours;
      // Flat rate pricing - time slot is for worker availability, not billing
      final amountInRupees = selectedService != null
          ? selectedService.basePrice
          : 49.0; // Default to Home Cleaning price

      // Create order on backend
      final orderResponse = await _apiService.post('payments/create-order', {
        'amount': amountInRupees,
        'currency': 'INR',
        'addressId': _savedAddress?.id,
      });

      if (orderResponse != null && orderResponse['id'] != null) {
        _orderId = orderResponse['id'];

        var options = {
          'key': 'rzp_test_1234567890', // Replace with your actual Razorpay key
          'amount': (amountInRupees * 100).toInt(), // Amount in paise
          'currency': 'INR',
          'name': 'SEVAQ',
          'description': 'Professional Home Service',
          'order_id': _orderId,
          'prefill': {'contact': '9999999999', 'email': 'test@example.com'},
          'external': {
            'wallets': ['paytm'],
          },
        };

        _razorpay.open(options);
      } else {
        throw Exception('Failed to create order');
      }
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Error creating payment order: ${e.toString()}'),
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
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final user = authProvider.user;
      if (user == null || _orderId == null) {
        throw Exception('User not logged in or order ID missing');
      }

      // Check if this booking is part of an assignment flow
      // If coming from assignment system, we should have assignment data
      final assignmentData = await _checkAssignmentStatus();

      if (assignmentData != null && assignmentData['status'] == 'assigned') {
        // This is an assignment-based booking - use assignment data
        await _handleAssignmentBasedBooking(response, assignmentData);
      } else {
        // This is a direct booking - use original flow
        await _handleDirectBooking(response);
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
    } finally {
      setState(() => _isProcessing = false);
    }
  }

  /// Check if there's an active assignment for this booking
  Future<Map<String, dynamic>?> _checkAssignmentStatus() async {
    try {
      final response = await _apiService.get('assignments/status/latest');
      if (response != null && response['status'] == 'assigned') {
        return response;
      }
      return null;
    } catch (e) {
      print('No active assignment found: $e');
      return null;
    }
  }

  /// Handle assignment-based booking flow
  Future<void> _handleAssignmentBasedBooking(
    PaymentSuccessResponse response,
    Map<String, dynamic> assignmentData,
  ) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user!;

    // Prepare booking data with assignment reference
    // SEVAQ: Worker is assigned by backend from assignment data
    final selectedService = widget.service;
    final duration = widget.slot.endTime
        .difference(widget.slot.startTime)
        .inHours;
    // Flat rate pricing - time slot is for worker availability, not billing
    final amount = selectedService != null
        ? (selectedService.basePrice * 100).toInt()
        : 4900; // Default: ₹49 * 100

    // Build location data from saved address
    Map<String, dynamic>? locationData;
    if (_savedAddress != null) {
      locationData = {
        'latitude': _savedAddress!.latitude,
        'longitude': _savedAddress!.longitude,
        'address': _savedAddress!.fullAddress,
      };
    }

    final bookingData = {
      'user': user.id,
      'worker': assignmentData['worker']['id'],
      'service': selectedService?.id,
      'startTime': widget.slot.startTime.toIso8601String(),
      'endTime': widget.slot.endTime.toIso8601String(),
      'amount': amount,
      'currency': 'INR',
      'assignmentId': assignmentData['assignmentId'],
      'isFromAssignment': true,
      'location': locationData,
      'addressId': _savedAddress?.id,
    };

    // Verify payment and create booking
    final verifyResponse = await _apiService.post('payments/verify', {
      'razorpayOrderId': _orderId,
      'razorpayPaymentId': response.paymentId,
      'signature': response.signature,
      'bookingData': bookingData,
    });

    if (verifyResponse != null && verifyResponse['status'] == 'success') {
      final booking = Booking.fromJson(verifyResponse['booking']);

      // Navigate to assignment confirmed screen
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => AssignmentConfirmedScreen(
            worker:
                assignmentData['worker'] ?? assignmentData['assignedWorker'],
            service: selectedService,
            startTime: widget.slot.startTime,
            endTime: widget.slot.endTime,
            amount: (amount / 100),
            assignmentData: assignmentData,
          ),
        ),
      );
    } else {
      throw Exception('Payment verification failed');
    }
  }

  /// Handle direct booking flow (original implementation)
  Future<void> _handleDirectBooking(PaymentSuccessResponse response) async {
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final user = authProvider.user!;

    // Prepare booking data - worker will be assigned by backend
    final selectedService = widget.service;
    final duration = widget.slot.endTime
        .difference(widget.slot.startTime)
        .inHours;
    // Flat rate pricing - time slot is for worker availability, not billing
    final amount = selectedService != null
        ? (selectedService.basePrice * 100).toInt()
        : 4900; // Default: ₹49 * 100

    // Build location data from saved address
    Map<String, dynamic>? locationData;
    if (_savedAddress != null) {
      locationData = {
        'latitude': _savedAddress!.latitude,
        'longitude': _savedAddress!.longitude,
        'address': _savedAddress!.fullAddress,
      };
    }

    final bookingData = {
      'user': user.id,
      'service': selectedService?.id,
      'startTime': widget.slot.startTime.toIso8601String(),
      'endTime': widget.slot.endTime.toIso8601String(),
      'amount': amount,
      'currency': 'INR',
      'location': locationData,
      'addressId': _savedAddress?.id,
    };

    // Verify payment and create booking
    final verifyResponse = await _apiService.post('payments/verify', {
      'razorpayOrderId': _orderId,
      'razorpayPaymentId': response.paymentId,
      'signature': response.signature,
      'bookingData': bookingData,
    });

    if (verifyResponse != null && verifyResponse['status'] == 'success') {
      final booking = Booking.fromJson(verifyResponse['booking']);
      Navigator.pushReplacement(
        context,
        MaterialPageRoute(
          builder: (_) => BookingConfirmationScreen(booking: booking),
        ),
      );
    } else {
      throw Exception('Payment verification failed');
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Payment Failed: ${response.message}')),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('External Wallet: ${response.walletName}')),
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selectedService = widget.service;
    final duration = widget.slot.endTime
        .difference(widget.slot.startTime)
        .inHours;
    // Flat rate pricing - time slot is for worker availability, not billing
    final totalAmount = selectedService != null
        ? selectedService.basePrice
        : 49.0; // Default to Home Cleaning price

    return Scaffold(
      appBar: AppBar(title: Text('Confirm Booking')),
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: ElevatedButton(
            onPressed: _isProcessing ? null : _startPayment,
            child: _isProcessing
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                : Text('PAY ₹${totalAmount.toStringAsFixed(0)} & BOOK'),
          ),
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Assignment messaging - SEVAQ core rule
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.blue[50],
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue[200]!),
              ),
              child: Row(
                children: [
                  Icon(Icons.info_outline, color: Colors.blue[700]),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Text(
                      'We\'ll assign a verified professional 24-48 hours before your service begins.',
                      style: TextStyle(color: Colors.blue[800], fontSize: 14),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text('Booking Summary', style: theme.textTheme.headlineSmall),
            const SizedBox(height: 16),
            if (selectedService != null) ...[
              ListTile(
                leading: Icon(Icons.work, color: Colors.blue[700]),
                title: Text('Service'),
                subtitle: Text(selectedService.name),
              ),
              const Divider(),
            ],
            ListTile(
              leading: Icon(Icons.calendar_today, color: Colors.blue[700]),
              title: Text(
                DateFormat('EEEE, MMMM d, yyyy').format(widget.slot.startTime),
              ),
              subtitle: Text(
                '${DateFormat('jm').format(widget.slot.startTime)} - ${DateFormat('jm').format(widget.slot.endTime)} (${duration}h)',
              ),
            ),
            const Divider(),
            ListTile(
              leading: Icon(Icons.attach_money, color: Colors.blue[700]),
              title: Text('Total Amount'),
              trailing: Text(
                '₹${totalAmount.toStringAsFixed(0)}',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: Colors.blue[700],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
