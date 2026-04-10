import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import '../models/booking.dart';
import '../providers/booking_provider.dart';
import '../providers/earnings_provider.dart';
import '../constants/app_colors.dart';
import '../constants/app_spacing.dart';
import '../constants/app_radius.dart';
import '../constants/app_elevation.dart';
import '../widgets/status_chip.dart';
import '../widgets/info_row.dart';
import '../widgets/section_header.dart';

class WorkerBookingDetailScreen extends StatelessWidget {
  final Booking booking;

  const WorkerBookingDetailScreen({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Job Details'),
        actions: [
          StatusChip.fromBookingStatus(booking.status),
          const SizedBox(width: AppSpacing.md),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(AppSpacing.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildStatusCard(context),
            const SizedBox(height: AppSpacing.md),
            _buildInfoCard(context),
            const SizedBox(height: AppSpacing.md),
            _buildCustomerCard(context),
            const SizedBox(height: AppSpacing.md),
            if (booking.customerAddress != null &&
                booking.customerAddress!.isNotEmpty)
              _buildAddressCard(context),
            if (booking.customerAddress != null &&
                booking.customerAddress!.isNotEmpty)
              const SizedBox(height: AppSpacing.md),
            _buildPricingCard(context),
            if (booking.isPending ||
                booking.isConfirmed ||
                booking.isInProgress) ...[
              const SizedBox(height: AppSpacing.lg),
              _buildActionButtons(context),
            ],
            const SizedBox(height: AppSpacing.lg),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    final statusColor = AppColors.getStatusColor(booking.status);
    final statusSurface = AppColors.getStatusSurfaceColor(booking.status);
    IconData statusIcon;

    switch (booking.status.toUpperCase()) {
      case 'PENDING':
      case 'REQUESTED':
        statusIcon = Icons.pending_actions_outlined;
        break;
      case 'CONFIRMED':
      case 'ACCEPTED':
        statusIcon = Icons.check_circle_outline;
        break;
      case 'IN_PROGRESS':
        statusIcon = Icons.engineering;
        break;
      case 'COMPLETED':
        statusIcon = Icons.task_alt;
        break;
      case 'CANCELLED':
      case 'REJECTED':
        statusIcon = Icons.cancel_outlined;
        break;
      default:
        statusIcon = Icons.info_outline;
    }

    return Container(
      padding: const EdgeInsets.all(AppSpacing.lg),
      decoration: BoxDecoration(
        color: statusSurface,
        borderRadius: BorderRadius.circular(AppRadius.md),
        border: Border.all(
          color: statusColor.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(AppSpacing.md),
            decoration: BoxDecoration(
              color: statusColor.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(statusIcon, color: statusColor, size: 32),
          ),
          const SizedBox(width: AppSpacing.md),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getFormattedStatus(booking.status),
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                        color: statusColor,
                        fontWeight: FontWeight.bold,
                      ),
                ),
                const SizedBox(height: AppSpacing.xxs),
                Text(
                  _getStatusDescription(booking.status),
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        color: AppColors.textSecondary,
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getFormattedStatus(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'REQUESTED':
        return 'Pending Review';
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'Confirmed';
      case 'IN_PROGRESS':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
      case 'REJECTED':
        return 'Cancelled';
      default:
        return status;
    }
  }

  String _getStatusDescription(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
      case 'REQUESTED':
        return 'Review the job details and accept or reject';
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'Job accepted, ready to start';
      case 'IN_PROGRESS':
        return 'Currently working on this job';
      case 'COMPLETED':
        return 'Job completed successfully';
      case 'CANCELLED':
      case 'REJECTED':
        return 'This job has been cancelled';
      default:
        return '';
    }
  }

  Widget _buildInfoCard(BuildContext context) {
    return Card(
      elevation: AppElevation.sm,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(title: 'Service Details'),
            const SizedBox(height: AppSpacing.sm),
            InfoRow(
              icon: Icons.cleaning_services_outlined,
              label: 'Service',
              value: booking.serviceName,
            ),
            if (booking.serviceCategory != null)
              InfoRow(
                icon: Icons.category_outlined,
                label: 'Category',
                value: booking.serviceCategory!,
              ),
            InfoRow(
              icon: Icons.calendar_today_outlined,
              label: 'Date',
              value: booking.scheduledDate,
            ),
            InfoRow(
              icon: Icons.access_time_outlined,
              label: 'Time',
              value: booking.startTime,
            ),
            if (booking.endTime != null)
              InfoRow(
                icon: Icons.access_time_filled_outlined,
                label: 'End Time',
                value: booking.endTime!,
              ),
            if (booking.bookingType != null)
              InfoRow(
                icon: Icons.work_outline,
                label: 'Type',
                value: booking.bookingType!,
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCustomerCard(BuildContext context) {
    return Card(
      elevation: AppElevation.sm,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(title: 'Customer Information'),
            const SizedBox(height: AppSpacing.sm),
            InfoRow(
              icon: Icons.person_outline,
              label: 'Name',
              value: booking.customerName,
            ),
            if (booking.customerPhone != null)
              InfoRow(
                icon: Icons.phone_outlined,
                label: 'Phone',
                value: booking.customerPhone!,
                trailing: IconButton(
                  icon: const Icon(Icons.call, size: 20),
                  color: AppColors.success,
                  onPressed: () {
                    // TODO: Implement phone call
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressCard(BuildContext context) {
    return Card(
      elevation: AppElevation.sm,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Customer Address',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.copy_outlined, size: 20),
                      onPressed: () {
                        Clipboard.setData(
                          ClipboardData(text: booking.customerAddress!),
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: const Text('Address copied to clipboard'),
                            behavior: SnackBarBehavior.floating,
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(AppRadius.sm),
                            ),
                          ),
                        );
                      },
                      tooltip: 'Copy address',
                    ),
                    if (booking.customerLatitude != null &&
                        booking.customerLongitude != null)
                      IconButton(
                        icon: const Icon(Icons.map, size: 20),
                        onPressed: () => _openInMaps(context),
                        tooltip: 'View on Map',
                      ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.location_on_outlined,
                    size: 20,
                    color: AppColors.textSecondary,
                  ),
                  const SizedBox(width: AppSpacing.sm),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.customerAddress!,
                          style: Theme.of(context).textTheme.bodyMedium,
                        ),
                        if (booking.customerLatitude != null &&
                            booking.customerLongitude != null) ...[
                          const SizedBox(height: AppSpacing.xs),
                          Row(
                            children: [
                              Icon(
                                Icons.gps_fixed,
                                size: 14,
                                color: Colors.green[700],
                              ),
                              const SizedBox(width: AppSpacing.xxs),
                              Text(
                                'Lat: ${booking.customerLatitude!.toStringAsFixed(6)}, Lng: ${booking.customerLongitude!.toStringAsFixed(6)}',
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: Colors.green[700],
                                      fontFamily: 'monospace',
                                      fontSize: 11,
                                    ),
                              ),
                            ],
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  void _openInMaps(BuildContext context) async {
    if (booking.customerLatitude == null || booking.customerLongitude == null) {
      return;
    }

    final lat = booking.customerLatitude!;
    final lng = booking.customerLongitude!;
    final url = 'https://www.google.com/maps/search/?api=1&query=$lat,$lng';

    // Try to open in external browser
    try {
      final Uri uri = Uri.parse(url);
      // Use launchUrl if url_launcher is available, otherwise show snackbar
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Opening maps: $lat, $lng'),
          action: SnackBarAction(
            label: 'Copy',
            onPressed: () {
              Clipboard.setData(
                ClipboardData(text: '$lat, $lng'),
              );
            },
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Coordinates: $lat, $lng')),
      );
    }
  }

  Widget _buildPricingCard(BuildContext context) {
    return Card(
      elevation: AppElevation.sm,
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Payment Details',
              action: Icon(
                Icons.currency_rupee,
                size: 20,
                color: AppColors.success,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Container(
              padding: const EdgeInsets.all(AppSpacing.md),
              decoration: BoxDecoration(
                color: AppColors.successSurface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(
                  color: AppColors.success.withOpacity(0.2),
                ),
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Total Amount',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.success,
                        ),
                  ),
                  Text(
                    '₹${booking.price.toStringAsFixed(0)}',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          color: AppColors.success,
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ],
              ),
            ),
            if (booking.paymentStatus != null) ...[
              const SizedBox(height: AppSpacing.sm),
              InfoRow(
                icon: Icons.payment_outlined,
                label: 'Payment Status',
                value: booking.paymentStatus!,
              ),
            ],
            if (booking.notes != null && booking.notes!.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.sm),
              InfoRow(
                icon: Icons.note_outlined,
                label: 'Notes',
                value: booking.notes!,
                isMultiline: true,
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    final bookingProvider = context.read<BookingProvider>();

    return Column(
      children: [
        if (booking.isPending) ...[
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: bookingProvider.isLoading
                      ? null
                      : () => _handleReject(context, bookingProvider),
                  icon: const Icon(Icons.close, size: 18),
                  label: const Text('Reject'),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: AppColors.error,
                    side: const BorderSide(color: AppColors.error),
                    padding:
                        const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.md),
              Expanded(
                child: ElevatedButton.icon(
                  onPressed: bookingProvider.isLoading
                      ? null
                      : () => _handleAccept(context, bookingProvider),
                  icon: const Icon(Icons.check, size: 18),
                  label: const Text('Accept Job'),
                  style: ElevatedButton.styleFrom(
                    padding:
                        const EdgeInsets.symmetric(vertical: AppSpacing.md),
                  ),
                ),
              ),
            ],
          ),
        ],
        if (booking.isConfirmed) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: bookingProvider.isLoading
                  ? null
                  : () => _handleStart(context, bookingProvider),
              icon: const Icon(Icons.play_arrow, size: 20),
              label: const Text('Start Job'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.primary,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              ),
            ),
          ),
        ],
        if (booking.isInProgress) ...[
          SizedBox(
            width: double.infinity,
            child: ElevatedButton.icon(
              onPressed: bookingProvider.isLoading
                  ? null
                  : () => _handleComplete(context, bookingProvider),
              icon: const Icon(Icons.check_circle, size: 20),
              label: const Text('Complete Job'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.success,
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.md),
              ),
            ),
          ),
        ],
      ],
    );
  }

  Future<void> _handleAccept(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        title: const Text('Accept Job'),
        content: const Text('Are you sure you want to accept this job?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            child: const Text('Accept'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await provider.acceptBooking(booking.id);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Job accepted successfully!'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.error ?? 'Failed to accept job'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
        }
      }
    }
  }

  Future<void> _handleReject(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final reasonController = TextEditingController();
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        title: const Text('Reject Job'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('Are you sure you want to reject this job?'),
            const SizedBox(height: AppSpacing.md),
            const Text('Reason for rejection (optional):'),
            const SizedBox(height: AppSpacing.sm),
            TextField(
              controller: reasonController,
              decoration: InputDecoration(
                hintText: 'Enter reason...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                ),
              ),
              maxLines: 3,
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final reason = reasonController.text.trim().isEmpty
          ? null
          : reasonController.text.trim();
      final success = await provider.rejectBooking(booking.id, reason: reason);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Job rejected'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.error ?? 'Failed to reject job'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
        }
      }
    }
  }

  Future<void> _handleStart(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        title: const Text('Start Job'),
        content: const Text(
            'Are you sure you want to start this job now? You will not be able to accept other jobs while this is active.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style:
                ElevatedButton.styleFrom(backgroundColor: AppColors.inProgress),
            child: const Text('Start Now'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await provider.startBooking(booking.id);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text(
                  '✅ Job started successfully! Screen will update automatically.'),
              backgroundColor: AppColors.success,
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
          // Do NOT pop immediately - let state refresh show live changes
          await Future.delayed(const Duration(milliseconds: 800));
          if (context.mounted) {
            Navigator.pop(context);
          }
        }
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(provider.error ?? 'Failed to start job'),
            behavior: SnackBarBehavior.floating,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(AppRadius.sm),
            ),
          ),
        );
      }
    }
  }

  Future<void> _handleComplete(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(AppRadius.lg),
        ),
        title: const Text('Complete Job'),
        content: const Text('Mark this job as completed?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.success),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await provider.completeBooking(booking.id);
      if (context.mounted) {
        if (success) {
          context.read<EarningsProvider>().fetchEarnings();
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Job completed!'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(provider.error ?? 'Failed to complete job'),
              behavior: SnackBarBehavior.floating,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(AppRadius.sm),
              ),
            ),
          );
        }
      }
    }
  }
}
