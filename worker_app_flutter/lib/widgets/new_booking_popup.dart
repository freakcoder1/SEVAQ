import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

class NewBookingPopup extends StatefulWidget {
  final Map<String, dynamic> bookingData;
  final VoidCallback onAccept;
  final VoidCallback onDecline;
  final VoidCallback onTap;

  const NewBookingPopup({
    super.key,
    required this.bookingData,
    required this.onAccept,
    required this.onDecline,
    required this.onTap,
  });

  @override
  State<NewBookingPopup> createState() => _NewBookingPopupState();
}

class _NewBookingPopupState extends State<NewBookingPopup>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  late Animation<double> _fadeAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 500),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(begin: 0.8, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeOutBack),
    );

    _fadeAnimation = Tween<double>(begin: 0.0, end: 1.0).animate(
      CurvedAnimation(parent: _controller, curve: Curves.easeIn),
    );

    // Play sound and vibrate on show
    _controller.forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  String _getServiceName() {
    return widget.bookingData['serviceName'] ?? 'नई बुकिंग';
  }

  String _getCustomerName() {
    return widget.bookingData['customerName'] ?? 'ग्राहक';
  }

  String _getAddress() {
    return widget.bookingData['address'] ?? 'पता उपलब्ध नहीं';
  }

  String _getTime() {
    final time =
        widget.bookingData['time'] ?? widget.bookingData['scheduledTime'];
    if (time != null) {
      return time;
    }
    return 'आज';
  }

  String _getAmount() {
    final amount = widget.bookingData['amount'] ?? widget.bookingData['price'];
    if (amount != null) {
      return '₹$amount';
    }
    return '₹0';
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        return Transform.scale(
          scale: _scaleAnimation.value,
          child: Opacity(
            opacity: _fadeAnimation.value,
            child: child,
          ),
        );
      },
      child: Dialog(
        backgroundColor: Colors.transparent,
        child: Container(
          padding: const EdgeInsets.all(20),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                Color(0xFF1E88E5),
                Color(0xFF1565C0),
              ],
            ),
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(
                color: Colors.blue.withOpacity(0.4),
                blurRadius: 30,
                offset: const Offset(0, 10),
              ),
            ],
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Header with icon
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.notifications_active,
                  color: Colors.white,
                  size: 48,
                ),
              ),
              const SizedBox(height: 16),

              // Title
              const Text(
                'नई बुकिंग आई!',
                style: TextStyle(
                  color: Colors.white,
                  fontSize: 24,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),

              // Booking details card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDetailRow(
                        Icons.cleaning_services, 'सेवा', _getServiceName()),
                    const Divider(height: 20),
                    _buildDetailRow(Icons.person, 'ग्राहक', _getCustomerName()),
                    const Divider(height: 20),
                    _buildDetailRow(Icons.location_on, 'पता', _getAddress()),
                    const Divider(height: 20),
                    _buildDetailRow(Icons.access_time, 'समय', _getTime()),
                    const Divider(height: 20),
                    _buildDetailRow(Icons.currency_rupee, 'कमाई', _getAmount()),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Action buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.heavyImpact();
                        widget.onDecline();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white.withOpacity(0.3),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'नहीं',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        HapticFeedback.heavyImpact();
                        widget.onAccept();
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.white,
                        foregroundColor: const Color(0xFF1565C0),
                        padding: const EdgeInsets.symmetric(vertical: 14),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(12),
                        ),
                      ),
                      child: const Text(
                        'स्वीकार करें',
                        style: TextStyle(
                            fontSize: 16, fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Row(
      children: [
        Icon(icon, color: const Color(0xFF1565C0), size: 20),
        const SizedBox(width: 8),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: const TextStyle(
                  color: Colors.grey,
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: const TextStyle(
                  color: Colors.black87,
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ],
    );
  }
}

/// Show the new booking popup
Future<Map<String, dynamic>?> showNewBookingPopup(
  BuildContext context,
  Map<String, dynamic> bookingData,
) {
  return showDialog<Map<String, dynamic>>(
    context: context,
    barrierDismissible: false,
    builder: (context) => NewBookingPopup(
      bookingData: bookingData,
      onAccept: () => Navigator.of(context).pop({'action': 'accept'}),
      onDecline: () => Navigator.of(context).pop({'action': 'decline'}),
      onTap: () {},
    ),
  );
}
