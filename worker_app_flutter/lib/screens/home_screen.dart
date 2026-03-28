import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/booking_provider.dart';
import '../providers/earnings_provider.dart';
import 'booking_detail_screen.dart';

class WorkerHomeScreen extends StatelessWidget {
  const WorkerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('SEVAQ Worker'),
        actions: [
          Consumer<AuthProvider>(
            builder: (context, auth, _) {
              return Padding(
                padding: const EdgeInsets.only(right: 16),
                child: Row(
                  children: [
                    Icon(
                      auth.isAvailable ? Icons.circle : Icons.circle_outlined,
                      color: auth.isAvailable ? Colors.green : Colors.grey,
                      size: 12,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      auth.isAvailable ? 'Online' : 'Offline',
                      style: TextStyle(
                        color: auth.isAvailable ? Colors.green : Colors.grey,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () async {
          await context.read<BookingProvider>().fetchBookings();
          await context.read<EarningsProvider>().fetchEarnings();
        },
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Welcome and Availability Toggle
              _buildWelcomeCard(context),
              const SizedBox(height: 16),

              // Today's Jobs Summary
              _buildTodayJobsCard(context),
              const SizedBox(height: 16),

              // Earnings Summary
              _buildEarningsCard(context),
              const SizedBox(height: 16),

              // Upcoming Jobs
              _buildUpcomingJobsSection(context),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildWelcomeCard(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        final worker = auth.worker;
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                CircleAvatar(
                  radius: 30,
                  backgroundColor: Theme.of(
                    context,
                  ).primaryColor.withValues(alpha: 0.1),
                  child: Icon(
                    Icons.person,
                    size: 30,
                    color: Theme.of(context).primaryColor,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Welcome, ${worker?.name ?? 'Worker'}!',
                        style: Theme.of(context).textTheme.titleLarge,
                      ),
                      const SizedBox(height: 4),
                      Text(
                        '${worker?.totalJobs ?? 0} jobs completed',
                        style: Theme.of(
                          context,
                        ).textTheme.bodyMedium?.copyWith(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                Column(
                  children: [
                    const Text('Available'),
                    Switch(
                      value: worker?.isAvailable ?? false,
                      onChanged: (_) => auth.toggleAvailability(),
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildTodayJobsCard(BuildContext context) {
    return Consumer<BookingProvider>(
      builder: (context, bookingProvider, _) {
        final pending = bookingProvider.pendingBookings.length;
        final inProgress = bookingProvider.inProgressBookings.length;
        final completed = bookingProvider.completedBookings
            .where(
              (b) => b.scheduledDate == DateTime.now().toString().split(' ')[0],
            )
            .length;

        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "Today's Jobs",
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildJobStat(
                      context,
                      pending.toString(),
                      'New',
                      Colors.orange,
                    ),
                    _buildJobStat(
                      context,
                      inProgress.toString(),
                      'Active',
                      Colors.blue,
                    ),
                    _buildJobStat(
                      context,
                      completed.toString(),
                      'Done',
                      Colors.green,
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildJobStat(
    BuildContext context,
    String value,
    String label,
    Color color,
  ) {
    return Column(
      children: [
        Text(
          value,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            color: color,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(label, style: Theme.of(context).textTheme.bodySmall),
      ],
    );
  }

  Widget _buildEarningsCard(BuildContext context) {
    return Consumer<EarningsProvider>(
      builder: (context, earningsProvider, _) {
        final earnings = earningsProvider.earnings;
        return Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Earnings',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                const SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'This Month',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          '₹${earnings?.thisMonth.toStringAsFixed(0) ?? '0'}',
                          style: Theme.of(context).textTheme.headlineSmall
                              ?.copyWith(
                                color: Colors.green,
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                      ],
                    ),
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Last Month',
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                        Text(
                          '₹${earnings?.lastMonth.toStringAsFixed(0) ?? '0'}',
                          style: Theme.of(
                            context,
                          ).textTheme.titleMedium?.copyWith(color: Colors.grey),
                        ),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildUpcomingJobsSection(BuildContext context) {
    return Consumer<BookingProvider>(
      builder: (context, bookingProvider, _) {
        final upcomingJobs = [
          ...bookingProvider.pendingBookings,
          ...bookingProvider.inProgressBookings,
        ].take(5).toList();

        return Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Upcoming Jobs',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
                if (upcomingJobs.isNotEmpty)
                  TextButton(
                    onPressed: () {
                      // Navigate to jobs tab - handled by parent
                    },
                    child: const Text('View All'),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            if (upcomingJobs.isEmpty)
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(24),
                  child: Center(
                    child: Column(
                      children: [
                        Icon(
                          Icons.calendar_today,
                          size: 48,
                          color: Colors.grey.shade400,
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'No upcoming jobs',
                          style: Theme.of(
                            context,
                          ).textTheme.bodyMedium?.copyWith(color: Colors.grey),
                        ),
                      ],
                    ),
                  ),
                ),
              )
            else
              ...upcomingJobs.map(
                (booking) => Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: booking.isPending
                          ? Colors.orange.shade100
                          : Colors.blue.shade100,
                      child: Icon(
                        Icons.home_work,
                        color: booking.isPending ? Colors.orange : Colors.blue,
                      ),
                    ),
                    title: Text(booking.serviceName),
                    subtitle: Text(
                      '${booking.scheduledDate} at ${booking.startTime}',
                    ),
                    trailing: _buildStatusChip(booking.status),
                    onTap: () {
                      Navigator.of(context).push(
                        MaterialPageRoute(
                          builder: (_) =>
                              WorkerBookingDetailScreen(booking: booking),
                        ),
                      );
                    },
                  ),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status) {
      case 'PENDING':
        color = Colors.orange;
        break;
      case 'CONFIRMED':
        color = Colors.blue;
        break;
      case 'IN_PROGRESS':
        color = Colors.purple;
        break;
      case 'COMPLETED':
        color = Colors.green;
        break;
      default:
        color = Colors.grey;
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w500,
        ),
      ),
    );
  }
}
