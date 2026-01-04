import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:provider/provider.dart';
import '../models/worker.dart';
import '../models/slot.dart';
import '../models/service.dart';
import '../models/booking.dart';
import 'booking_confirmation_screen.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../services/api_service.dart';

class BookingScreen extends StatefulWidget {
  final Worker worker;
  final Slot slot;
  final Service? service;

  const BookingScreen({
    Key? key,
    required this.worker,
    required this.slot,
    this.service,
  }) : super(key: key);

  @override
  _BookingScreenState createState() => _BookingScreenState();
}

class _BookingScreenState extends State<BookingScreen> {
  late Razorpay _razorpay;
  bool _isProcessing = false;
  String? _orderId;
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
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

      // Prepare booking data
      final selectedService = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);
      final duration = widget.slot.endTime.difference(widget.slot.startTime).inHours;
      final amount = selectedService != null ? (selectedService.basePrice * duration * 100).toInt() : 50000; // Amount in paise

      final bookingData = {
        'user': user.id,
        'worker': widget.worker.id,
        'service': selectedService?.id,
        'startTime': widget.slot.startTime.toIso8601String(),
        'endTime': widget.slot.endTime.toIso8601String(),
        'amount': amount,
        'currency': 'INR',
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
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: ${e.toString()}')),
      );
    } finally {
      setState(() => _isProcessing = false);
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

  void _startPayment() async {
    setState(() => _isProcessing = true);

    try {
      final selectedService = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);
      final duration = widget.slot.endTime.difference(widget.slot.startTime).inHours;
      final amountInRupees = selectedService != null ? (selectedService.basePrice * duration) : 500.0;

      // Create order on backend
      final orderResponse = await _apiService.post('payments/create-order', {
        'amount': amountInRupees,
        'currency': 'INR',
      });

      if (orderResponse != null && orderResponse['id'] != null) {
        _orderId = orderResponse['id'];

        var options = {
          'key': 'rzp_test_1234567890', // Replace with your actual Razorpay key
          'amount': (amountInRupees * 100).toInt(), // Amount in paise
          'currency': 'INR',
          'name': 'House Help',
          'description': 'Booking for ${widget.worker.user.firstName}',
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
        SnackBar(content: Text('Error creating payment order: ${e.toString()}')),
      );
      setState(() => _isProcessing = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selectedService = widget.service ?? (widget.worker.services.isNotEmpty ? widget.worker.services[0] : null);
    final duration = widget.slot.endTime.difference(widget.slot.startTime).inHours;
    final totalAmount = selectedService != null ? (selectedService.basePrice * duration) : 500.0;

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
            Text('Booking Summary', style: theme.textTheme.headlineSmall),
            SizedBox(height: 24),
            ListTile(
              leading: CircleAvatar(child: Icon(Icons.person)),
              title: Text(
                '${widget.worker.user.firstName} ${widget.worker.user.lastName}',
              ),
              subtitle: Text(widget.worker.bio, maxLines: 1),
            ),
            if (selectedService != null) ...[
              Divider(),
              ListTile(
                leading: Icon(Icons.work),
                title: Text('Service'),
                subtitle: Text(selectedService.name),
              ),
            ],
            Divider(),
            ListTile(
              leading: Icon(Icons.calendar_today),
              title: Text(
                DateFormat('EEEE, MMMM d, yyyy').format(widget.slot.startTime),
              ),
              subtitle: Text(
                '${DateFormat('jm').format(widget.slot.startTime)} - ${DateFormat('jm').format(widget.slot.endTime)} (${duration}h)',
              ),
            ),
            Divider(),
            ListTile(
              leading: Icon(Icons.attach_money),
              title: Text('Total Amount'),
              trailing: Text(
                '₹${totalAmount.toStringAsFixed(0)}',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
