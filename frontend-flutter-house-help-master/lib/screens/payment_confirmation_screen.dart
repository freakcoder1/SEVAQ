import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'package:provider/provider.dart';
import '../models/user.dart';
import '../services/api_service.dart';
import '../widgets/loading_widget.dart';

class PaymentConfirmationScreen extends StatefulWidget {
  final String requestId;
  final double amount;

  const PaymentConfirmationScreen({
    Key? key,
    required this.requestId,
    required this.amount,
  }) : super(key: key);

  @override
  _PaymentConfirmationScreenState createState() =>
      _PaymentConfirmationScreenState();
}

class _PaymentConfirmationScreenState extends State<PaymentConfirmationScreen> {
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

      // Create booking from service request
      final bookingResponse = await _apiService.post(
        'bookings/create-with-assignment',
        {'serviceRequestId': widget.requestId, 'userId': user.publicId},
      );

      // DEBUG: Log the raw booking response
      debugPrint('=== PAYMENT CONFIRMATION DEBUG ===');
      debugPrint('bookingResponse: $bookingResponse');
      if (bookingResponse != null && bookingResponse['booking'] != null) {
        final booking = bookingResponse['booking'];
        debugPrint('Booking startTime: ${booking['startTime']}');
        debugPrint('Booking date: ${booking['date']}');
        debugPrint('Booking endTime: ${booking['endTime']}');
      }
      debugPrint('=================================');

      if (bookingResponse != null && bookingResponse['status'] == 'success') {
        // Navigate to booking confirmation
        Navigator.pushReplacementNamed(
          context,
          '/booking-confirmation',
          arguments: {'booking': bookingResponse['booking']},
        );
      } else {
        throw Exception('Booking creation failed');
      }
    } catch (e) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text('Error: ${e.toString()}')));
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
      // Create order on backend
      final orderResponse = await _apiService.post('payments/create-order', {
        'amount': widget.amount,
        'currency': 'INR',
      });

      if (orderResponse != null && orderResponse['id'] != null) {
        _orderId = orderResponse['id'];

        var options = {
          'key': 'rzp_test_S5NgGMcDqTBauH', // Razorpay test key
          'amount': (widget.amount * 100).toInt(), // Amount in paise
          'currency': 'INR',
          'name': 'House Help',
          'description': 'Payment for professional assignment',
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
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Payment'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Navigate back to finding professional screen
            Navigator.pop(context);
          },
        ),
      ),
      body: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Complete Payment',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            // Assignment details
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Assignment Details',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Service Request ID:'),
                        Text(
                          widget.requestId.substring(0, 8) + '...',
                          style: const TextStyle(fontWeight: FontWeight.bold),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('Amount:'),
                        Text(
                          '₹${widget.amount.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 18,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 24),

            // Payment options
            Text(
              'Payment Methods',
              style: Theme.of(
                context,
              ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),

            const ListTile(
              leading: Icon(Icons.credit_card, color: Colors.blue),
              title: Text('Credit/Debit Card'),
              subtitle: Text('Secure payment via Razorpay'),
            ),

            const ListTile(
              leading: Icon(Icons.mobile_friendly, color: Colors.green),
              title: Text('Net Banking'),
              subtitle: Text('Pay via your bank'),
            ),

            const ListTile(
              leading: Icon(Icons.account_balance_wallet, color: Colors.orange),
              title: Text('Wallets'),
              subtitle: Text('Paytm, PhonePe and more'),
            ),

            const Spacer(),

            // Pay button
            LoadingContainer(
              isLoading: _isProcessing,
              loadingMessage: 'Processing payment...',
              child: SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isProcessing ? null : _startPayment,
                  style: ElevatedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: _isProcessing
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(color: Colors.white),
                        )
                      : Text(
                          'Pay ₹${widget.amount.toStringAsFixed(0)}',
                          style: const TextStyle(fontSize: 18),
                        ),
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Security notice
            const Text(
              '🔒 Your payment is secure. We use industry-standard encryption.',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

// Mock AuthProvider for now - should be imported from providers
class AuthProvider {
  final user = User(id: 'user123', firstName: 'Test', lastName: 'User');
}

class User {
  final String id;
  final String firstName;
  final String lastName;

  User({required this.id, required this.firstName, required this.lastName});
}
