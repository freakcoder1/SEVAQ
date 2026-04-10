import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../constants/app_colors.dart';
import '../constants/app_spacing.dart';
import '../constants/app_radius.dart';

class NewBookingPopup extends StatefulWidget {
  final Map<String, dynamic> bookingData;
  final VoidCallback onViewDetails;

  const NewBookingPopup({
    super.key,
    required this.bookingData,
    required this.onViewDetails,
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
          padding: const EdgeInsets.all(AppSpacing.lg),
          decoration: BoxDecoration(
            gradient: const LinearGradient(
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
              colors: [
                AppColors.primary,
                AppColors.primaryLight,
              ],
            ),
            borderRadius: BorderRadius.circular(AppRadius.xl),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withOpacity(0.4),
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
                padding: const EdgeInsets.all(AppSpacing.lg),
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
              const SizedBox(height: AppSpacing.md),

              // Title
              Text(
                'नई बुकिंग आई!',
                style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // Booking details card
              Container(
                padding: const EdgeInsets.all(AppSpacing.md),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(AppRadius.lg),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDetailRow(Icons.cleaning_services_outlined, 'सेवा',
                        _getServiceName()),
                    const Divider(height: 20),
                    _buildDetailRow(
                        Icons.person_outline, 'ग्राहक', _getCustomerName()),
                    const Divider(height: 20),
                    _buildDetailRow(
                        Icons.location_on_outlined, 'पता', _getAddress()),
                    const Divider(height: 20),
                    _buildDetailRow(
                        Icons.access_time_outlined, 'समय', _getTime()),
                    const Divider(height: 20),
                    _buildDetailRow(
                        Icons.currency_rupee_outlined, 'कमाई', _getAmount()),
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.lg),

              // Action button - View Details only (no accept/reject)
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.heavyImpact();
                    widget.onViewDetails();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: AppColors.primary,
                    padding:
                        const EdgeInsets.symmetric(vertical: AppSpacing.md),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(AppRadius.md),
                    ),
                    elevation: 0,
                  ),
                  child: Text(
                    'विवरण देखें',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
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
        Icon(icon, color: AppColors.primary, size: 20),
        const SizedBox(width: AppSpacing.sm),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: Theme.of(context).textTheme.labelSmall?.copyWith(
                      color: AppColors.textSecondary,
                    ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: AppColors.textPrimary,
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
      onViewDetails: () => Navigator.of(context).pop({'action': 'view'}),
    ),
  );
}
