import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/booking.dart';
import '../providers/booking_provider.dart';
import '../providers/earnings_provider.dart';

class WorkerBookingDetailScreen extends StatelessWidget {
  final Booking booking;

  const WorkerBookingDetailScreen({super.key, required this.booking});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Job Details')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Status Card
            _buildStatusCard(context),
            const SizedBox(height: 16),

            // Service Info
            _buildInfoCard(context),
            const SizedBox(height: 16),

            // Customer Info
            _buildCustomerCard(context),
            const SizedBox(height: 16),

            // Address
            _buildAddressCard(context),
            const SizedBox(height: 16),

            // Pricing
            _buildPricingCard(context),

            // Action Buttons
            if (booking.isPending ||
                booking.isConfirmed ||
                booking.isInProgress)
              _buildActionButtons(context),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusCard(BuildContext context) {
    Color statusColor;
    IconData statusIcon;

    switch (booking.status) {
      case 'PENDING':
        statusColor = Colors.orange;
        statusIcon = Icons.pending_actions;
        break;
      case 'CONFIRMED':
        statusColor = Colors.blue;
        statusIcon = Icons.check_circle;
        break;
      case 'IN_PROGRESS':
        statusColor = Colors.purple;
        statusIcon = Icons.engineering;
        break;
      case 'COMPLETED':
        statusColor = Colors.green;
        statusIcon = Icons.task_alt;
        break;
      default:
        statusColor = Colors.grey;
        statusIcon = Icons.info;
    }

    return Card(
      color: statusColor.withValues(alpha: 0.1),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Row(
          children: [
            Icon(statusIcon, color: statusColor, size: 40),
            const SizedBox(width: 16),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.status,
                  style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    color: statusColor,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Text(
                  _getStatusDescription(booking.status),
                  style: Theme.of(context).textTheme.bodySmall,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  String _getStatusDescription(String status) {
    switch (status) {
      case 'PENDING':
        return 'You can accept or reject this job';
      case 'CONFIRMED':
        return 'Job accepted, ready to start';
      case 'IN_PROGRESS':
        return 'Currently working on this job';
      case 'COMPLETED':
        return 'Job completed successfully';
      default:
        return '';
    }
  }

  Widget _buildInfoCard(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Service Details',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Divider(),
            const SizedBox(height: 8),
            _buildInfoRow(context, 'Service', booking.serviceName),
            if (booking.serviceCategory != null)
              _buildInfoRow(context, 'Category', booking.serviceCategory!),
            _buildInfoRow(context, 'Date', booking.scheduledDate),
            _buildInfoRow(context, 'Time', booking.startTime),
            if (booking.endTime != null)
              _buildInfoRow(context, 'End Time', booking.endTime!),
            if (booking.bookingType != null)
              _buildInfoRow(context, 'Type', booking.bookingType!),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(BuildContext context, String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: Theme.of(
              context,
            ).textTheme.bodyMedium?.copyWith(color: Colors.grey),
          ),
          Text(value, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }

  Widget _buildCustomerCard(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Customer Information',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Divider(),
            const SizedBox(height: 8),
            _buildInfoRow(context, 'Name', booking.customerName),
            if (booking.customerPhone != null)
              _buildInfoRow(context, 'Phone', booking.customerPhone!),
          ],
        ),
      ),
    );
  }

  Widget _buildAddressCard(BuildContext context) {
    if (booking.customerAddress == null) return const SizedBox.shrink();

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text('Address', style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                IconButton(
                  icon: const Icon(Icons.copy),
                  onPressed: () {
                    // Copy address to clipboard
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(content: Text('Address copied!')),
                    );
                  },
                ),
              ],
            ),
            const Divider(),
            const SizedBox(height: 8),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Icon(Icons.location_on, color: Colors.grey),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    booking.customerAddress!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPricingCard(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Payment Details',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const Divider(),
            const SizedBox(height: 8),
            _buildInfoRow(
              context,
              'Amount',
              '₹${booking.price.toStringAsFixed(0)}',
            ),
            if (booking.paymentStatus != null)
              _buildInfoRow(context, 'Payment Status', booking.paymentStatus!),
            if (booking.notes != null)
              _buildInfoRow(context, 'Notes', booking.notes!),
          ],
        ),
      ),
    );
  }

  Widget _buildActionButtons(BuildContext context) {
    final bookingProvider = context.read<BookingProvider>();

    return Padding(
      padding: const EdgeInsets.only(top: 24),
      child: Column(
        children: [
          if (booking.isPending) ...[
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: bookingProvider.isLoading
                        ? null
                        : () => _handleReject(context, bookingProvider),
                    style: OutlinedButton.styleFrom(
                      foregroundColor: Colors.red,
                      side: const BorderSide(color: Colors.red),
                    ),
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: ElevatedButton(
                    onPressed: bookingProvider.isLoading
                        ? null
                        : () => _handleAccept(context, bookingProvider),
                    child: const Text('Accept Job'),
                  ),
                ),
              ],
            ),
          ],
          if (booking.isConfirmed) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: bookingProvider.isLoading
                    ? null
                    : () => _handleStart(context, bookingProvider),
                child: const Text('Start Job'),
              ),
            ),
          ],
          if (booking.isInProgress) ...[
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: bookingProvider.isLoading
                    ? null
                    : () => _handleComplete(context, bookingProvider),
                style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                child: const Text('Complete Job'),
              ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _handleAccept(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
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
            const SnackBar(content: Text('Job accepted successfully!')),
          );
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(provider.error ?? 'Failed to accept job')),
          );
        }
      }
    }
  }

  Future<void> _handleReject(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Job'),
        content: const Text('Are you sure you want to reject this job?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Reject'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await provider.rejectBooking(booking.id);
      if (context.mounted) {
        if (success) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Job rejected')));
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(provider.error ?? 'Failed to reject job')),
          );
        }
      }
    }
  }

  Future<void> _handleStart(
    BuildContext context,
    BookingProvider provider,
  ) async {
    final success = await provider.startBooking(booking.id);
    if (context.mounted) {
      if (success) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(const SnackBar(content: Text('Job started!')));
        Navigator.pop(context);
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(provider.error ?? 'Failed to start job')),
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
        title: const Text('Complete Job'),
        content: const Text('Mark this job as completed?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
            child: const Text('Complete'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await provider.completeBooking(booking.id);
      if (context.mounted) {
        if (success) {
          // Refresh earnings
          context.read<EarningsProvider>().fetchEarnings();
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(const SnackBar(content: Text('Job completed!')));
          Navigator.pop(context);
        } else {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text(provider.error ?? 'Failed to complete job')),
          );
        }
      }
    }
  }
}
