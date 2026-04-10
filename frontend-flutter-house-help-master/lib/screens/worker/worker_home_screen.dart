import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../services/api_service.dart';
import '../../models/worker.dart';
import '../../models/booking.dart';
import '../../providers/auth_provider.dart';

/// Worker Home Screen - Main dashboard for workers
class WorkerHomeScreen extends StatefulWidget {
  const WorkerHomeScreen({super.key});

  @override
  State<WorkerHomeScreen> createState() => _WorkerHomeScreenState();
}

class _WorkerHomeScreenState extends State<WorkerHomeScreen> {
  final ApiService _apiService = ApiService();
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  bool _isLoading = true;
  Worker? _workerProfile;
  Map<String, dynamic>? _earnings;
  List<Booking> _upcomingBookings = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadWorkerData();
  }

  Future<void> _loadWorkerData() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      // Get worker's profile
      final profileResponse = await _apiService.getMyWorkerProfile();
      if (profileResponse != null && profileResponse['worker'] != null) {
        _workerProfile = Worker.fromJson(profileResponse);
      }

      // Get worker's earnings
      _earnings = await _apiService.getMyWorkerEarnings();

      // Get upcoming bookings
      final bookingsResponse = await _apiService.getMyWorkerBookings();
      if (bookingsResponse is List) {
        _upcomingBookings = [];
        for (var i = 0; i < bookingsResponse.length; i++) {
          var b = bookingsResponse[i];
          // Ensure b is a Map<String, dynamic> before passing to fromJson
          if (b is! Map<String, dynamic>) {
            debugPrint('Skipping non-Map booking item $i: ${b.runtimeType}');
            continue;
          }
          try {
            _upcomingBookings.add(Booking.fromJson(b));
          } catch (e, stackTrace) {
            debugPrint('Error parsing booking at index $i: $e');
            debugPrint('Booking keys: ${b.keys.toList()}');
            // Try to identify which nested object is causing the issue
            try {
              // Check user field
              if (b['user'] is Map<String, dynamic>) {
                debugPrint('user field parsed OK');
              } else {
                debugPrint('user field type: ${b['user']?.runtimeType}');
              }
              // Check worker field
              if (b['worker'] is Map<String, dynamic>) {
                debugPrint('worker field parsed OK');
              } else {
                debugPrint('worker field type: ${b['worker']?.runtimeType}');
              }
              // Check service field
              if (b['service'] is Map<String, dynamic>) {
                debugPrint('service field parsed OK');
              } else {
                debugPrint('service field type: ${b['service']?.runtimeType}');
              }
            } catch (nestedErr) {
              debugPrint('Error checking nested fields: $nestedErr');
            }
            debugPrint('Stack trace: $stackTrace');
            // Continue with next booking even if one fails
          }
        }
        debugPrint(
          'Parsed ${_upcomingBookings.length} bookings out of ${bookingsResponse.length}',
        );
      } else if (bookingsResponse != null) {
        debugPrint(
          'Bookings response is not a List, it is: ${bookingsResponse.runtimeType}',
        );
        debugPrint('Bookings response: $bookingsResponse');
      }
    } on TokenExpiredException {
      debugPrint('WorkerHomeScreen: Token expired');
      if (mounted) {
        final authProvider = AuthProvider.instance;
        await authProvider.handleTokenExpired();
      }
    } catch (e) {
      debugPrint('Error loading worker data: $e');
      setState(() {
        _error = 'Failed to load worker data: $e';
      });
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  Future<void> _toggleAvailability() async {
    if (_workerProfile == null) return;

    try {
      final newAvailability = !_workerProfile!.isAvailable;
      await _apiService.updateMyWorkerAvailability(newAvailability);

      setState(() {
        _workerProfile = Worker(
          id: _workerProfile!.id,
          publicId: _workerProfile!.publicId,
          user: _workerProfile!.user,
          bio: _workerProfile!.bio,
          rating: _workerProfile!.rating,
          reviewCount: _workerProfile!.reviewCount,
          services: _workerProfile!.services,
          isAvailable: newAvailability,
        );
      });

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              newAvailability
                  ? 'You are now available for new jobs'
                  : 'You are now marked as unavailable',
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed to update availability: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Worker Dashboard'),
        backgroundColor: Theme.of(context).colorScheme.primary,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadWorkerData,
          ),
        ],
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(_error!, style: const TextStyle(color: Colors.red)),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _loadWorkerData,
                    child: const Text('Retry'),
                  ),
                ],
              ),
            )
          : RefreshIndicator(
              onRefresh: _loadWorkerData,
              child: SingleChildScrollView(
                physics: const AlwaysScrollableScrollPhysics(),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Worker Profile Card
                    _buildProfileCard(),
                    const SizedBox(height: 16),

                    // Quick Stats
                    _buildQuickStats(),
                    const SizedBox(height: 16),

                    // Today's Jobs
                    _buildUpcomingJobs(),
                    const SizedBox(height: 16),

                    // Earnings Summary
                    _buildEarningsSummary(),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildProfileCard() {
    final worker = _workerProfile;
    final user = worker?.user;

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            CircleAvatar(
              radius: 40,
              backgroundColor: Theme.of(context).colorScheme.primary,
              child: Text(
                user?.firstName?.substring(0, 1).toUpperCase() ?? 'W',
                style: const TextStyle(
                  fontSize: 32,
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 12),
            Text(
              '${user?.firstName ?? ''} ${user?.lastName ?? ''}',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 20),
                const SizedBox(width: 4),
                Text(
                  '${worker?.rating.toStringAsFixed(1) ?? '0.0'} (${worker?.reviewCount ?? 0} reviews)',
                  style: const TextStyle(fontSize: 14),
                ),
              ],
            ),
            const SizedBox(height: 12),
            // Availability Toggle
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  worker?.isAvailable == true ? 'Available' : 'Unavailable',
                  style: TextStyle(
                    color: worker?.isAvailable == true
                        ? Colors.green
                        : Colors.red,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Switch(
                  value: worker?.isAvailable ?? false,
                  onChanged: (value) => _toggleAvailability(),
                  activeColor: Colors.green,
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildQuickStats() {
    final earnings = _earnings ?? {};
    final totalEarnings = earnings['totalEarnings'] ?? 0;
    final completedJobs = earnings['completedJobs'] ?? 0;
    final pendingPayments = earnings['pendingPayments'] ?? 0;

    return Row(
      children: [
        Expanded(
          child: _buildStatCard(
            'Total Earnings',
            '₹${totalEarnings.toStringAsFixed(0)}',
            Icons.account_balance_wallet,
            Colors.green,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildStatCard(
            'Jobs Done',
            '$completedJobs',
            Icons.check_circle,
            Colors.blue,
          ),
        ),
        const SizedBox(width: 8),
        Expanded(
          child: _buildStatCard(
            'Pending',
            '₹${pendingPayments.toStringAsFixed(0)}',
            Icons.pending,
            Colors.orange,
          ),
        ),
      ],
    );
  }

  Widget _buildStatCard(
    String title,
    String value,
    IconData icon,
    Color color,
  ) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 8),
            Text(
              value,
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: const TextStyle(fontSize: 11),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildUpcomingJobs() {
    final pendingBookings = _upcomingBookings
        .where(
          (b) =>
              b.status == BookingStatus.assignmentInProgress ||
              b.status == BookingStatus.confirmed,
        )
        .toList();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Upcoming Jobs',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        if (pendingBookings.isEmpty)
          const Card(
            child: Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: Text('No upcoming jobs')),
            ),
          )
        else
          ...pendingBookings
              .take(3)
              .map((booking) => _buildBookingCard(booking)),
      ],
    );
  }

  Widget _buildBookingCard(Booking booking) {
    final statusColor = _getStatusColor(booking.status);

    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ListTile(
        leading: CircleAvatar(
          backgroundColor: statusColor,
          child: Icon(_getStatusIcon(booking.status), color: Colors.white),
        ),
        title: Text(booking.service?.name ?? 'Service'),
        subtitle: Text(
          '${booking.startTime.toLocal().toString().split(' ')[0]} at ${booking.startTime.hour}:${booking.startTime.minute.toString().padLeft(2, '0')}',
        ),
        trailing: Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          decoration: BoxDecoration(
            color: statusColor.withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            _getStatusText(booking.status),
            style: TextStyle(
              color: statusColor,
              fontSize: 12,
              fontWeight: FontWeight.bold,
            ),
          ),
        ),
        onTap: () {
          // Navigate to booking detail - to be implemented
        },
      ),
    );
  }

  Color _getStatusColor(BookingStatus? status) {
    switch (status) {
      case BookingStatus.assignmentInProgress:
        return Colors.orange;
      case BookingStatus.scheduled:
        return Colors.blue;
      case BookingStatus.confirmed:
        return Colors.blue;
      case BookingStatus.inProgress:
        return Colors.purple;
      case BookingStatus.completed:
        return Colors.green;
      case BookingStatus.cancelled:
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(BookingStatus? status) {
    switch (status) {
      case BookingStatus.assignmentInProgress:
        return Icons.hourglass_empty;
      case BookingStatus.scheduled:
        return Icons.calendar_today;
      case BookingStatus.confirmed:
        return Icons.check;
      case BookingStatus.inProgress:
        return Icons.play_arrow;
      case BookingStatus.completed:
        return Icons.check_circle;
      case BookingStatus.cancelled:
        return Icons.cancel;
      default:
        return Icons.help;
    }
  }

  String _getStatusText(BookingStatus? status) {
    switch (status) {
      case BookingStatus.assignmentInProgress:
        return 'Pending';
      case BookingStatus.scheduled:
        return 'Scheduled';
      case BookingStatus.confirmed:
        return 'Confirmed';
      case BookingStatus.inProgress:
        return 'In Progress';
      case BookingStatus.completed:
        return 'Completed';
      case BookingStatus.cancelled:
        return 'Cancelled';
      default:
        return 'Unknown';
    }
  }

  Widget _buildEarningsSummary() {
    final earnings = _earnings ?? {};
    final thisMonth = earnings['thisMonth'] ?? 0;
    final lastMonth = earnings['lastMonth'] ?? 0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Earnings Summary',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        Card(
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('This Month'),
                    Text(
                      '₹${thisMonth.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 18,
                        color: Colors.green,
                      ),
                    ),
                  ],
                ),
                const Divider(),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Last Month'),
                    Text(
                      '₹${lastMonth.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}
