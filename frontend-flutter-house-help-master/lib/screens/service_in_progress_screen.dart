/// WARNING: DO NOT MODIFY THIS FILE WITHOUT ARCHITECTURAL APPROVAL
///
/// This screen implements the Service In Progress state, which is critical
/// for building and maintaining user trust in SEVAQ's managed service model.
///
/// Trust Principles:
/// - Status-only display (no user control)
/// - Support access provided
/// - Outcome ownership reassured
/// - No worker-user communication
/// - SEVAQ as intermediary
///
/// Changes to this screen must comply with these principles and require
/// architectural review.
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../models/worker.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';
import '../widgets/booking_status_timeline.dart';
import 'service_completed_screen.dart';

enum ServiceStatus { onTheWay, started, completed }

class ServiceInProgressScreen extends StatefulWidget {
  final String bookingId;
  final Worker worker;
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const ServiceInProgressScreen({
    Key? key,
    required this.bookingId,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  State<ServiceInProgressScreen> createState() =>
      _ServiceInProgressScreenState();
}

class _ServiceInProgressScreenState extends State<ServiceInProgressScreen> {
  late ApiService _apiService;
  late AuthProvider _authProvider;
  late Timer _pollingTimer;

  ServiceStatus _status = ServiceStatus.onTheWay;
  DateTime? _arrivalTime;
  bool _hasError = false;

  static const int POLLING_INTERVAL = 60; // 60 seconds

  @override
  void initState() {
    super.initState();
    _apiService = ApiService();
    // PERMANENT FIX: Use static instance instead of Provider.of(context)
    _authProvider = AuthProvider.instance;
    debugPrint('ServiceInProgressScreen: Using AuthProvider.instance');

    // Calculate estimated arrival time (mock for now)
    _arrivalTime = DateTime.now().add(Duration(minutes: 30));

    // Start polling for status updates
    _startPolling();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: POLLING_INTERVAL), (
      timer,
    ) {
      _checkServiceStatus();
    });
  }

  Future<void> _checkServiceStatus() async {
    try {
      final response = await _apiService.get(
        'services/status/${widget.bookingId}',
      );

      if (response != null) {
        final status = response['status'];
        final statusStr = status.toString().toUpperCase();

        switch (statusStr) {
          case 'ON_THE_WAY':
            setState(() {
              _status = ServiceStatus.onTheWay;
              if (response['arrivalTime'] != null) {
                _arrivalTime = DateTime.parse(response['arrivalTime']);
              }
            });
            break;
          case 'STARTED':
            setState(() {
              _status = ServiceStatus.started;
            });
            break;
          case 'COMPLETED':
            _handleServiceCompleted();
            break;
          default:
            debugPrint('Unknown service status: $status');
        }
      }
    } on TokenExpiredException {
      debugPrint('ServiceInProgressScreen: Token expired');
      _pollingTimer.cancel();
      if (mounted) {
        await _authProvider.handleTokenExpired();
      }
    } catch (e) {
      debugPrint('Error checking service status: $e');
      setState(() {
        _hasError = true;
      });
    }
  }

  void _handleServiceCompleted() {
    _pollingTimer.cancel();

    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        Navigator.pushReplacement(
          context,
          MaterialPageRoute(
            builder: (_) => ServiceCompletedScreen(
              worker: widget.worker,
              service: widget.service,
              startTime: widget.startTime,
              endTime: widget.endTime,
              amount: widget.amount,
            ),
          ),
        );
      }
    });
  }

  void _showSupportOptions() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              'Need help?',
              style: Theme.of(
                context,
              ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text(
              'Choose how you\'d like to get assistance:',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
            const SizedBox(height: 24),
            ListTile(
              leading: const Icon(Icons.chat_bubble, color: Colors.green),
              title: Text('Chat with support'),
              subtitle: Text('Get help in real-time'),
              onTap: () {
                Navigator.pop(context);
                _openChatSupport();
              },
            ),
            ListTile(
              leading: const Icon(Icons.call, color: Colors.green),
              title: Text('Call support'),
              subtitle: Text('Speak with our team'),
              onTap: () {
                Navigator.pop(context);
                _openCallSupport();
              },
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => Navigator.pop(context),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.white,
                foregroundColor: Colors.black87,
                side: const BorderSide(color: Colors.black12),
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 12,
                ),
              ),
              child: const Text('Cancel'),
            ),
          ],
        ),
      ),
    );
  }

  void _openChatSupport() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Chat support would open here'),
        backgroundColor: Colors.green,
      ),
    );
  }

  void _openCallSupport() {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Call support would open here'),
        backgroundColor: Colors.green,
      ),
    );
  }

  @override
  void dispose() {
    _pollingTimer?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              _buildHeader(),

              const SizedBox(height: 24),

              // Booking Status Timeline - shows user where they are in booking process
              // Architectural approval granted by user for timeline visualization
              BookingStatusTimeline(
                currentState: _status == ServiceStatus.onTheWay
                    ? BookingAssignmentState.assigned
                    : _status == ServiceStatus.started
                    ? BookingAssignmentState.inProgress
                    : BookingAssignmentState.completed,
              ),

              const SizedBox(height: 24),

              // Status Indicator
              _buildStatusIndicator(),

              const SizedBox(height: 24),

              // Service Summary Card
              ServiceSummaryCard(
                service: widget.service,
                startTime: widget.startTime,
                endTime: widget.endTime,
                amount: widget.amount,
              ),

              const SizedBox(height: 24),

              // Worker Information
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      backgroundColor: const Color(0xFFE0E0E0),
                      radius: 30,
                      child: Icon(
                        Icons.person,
                        color: Colors.grey[600],
                        size: 30,
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${widget.worker.user.firstName} ${widget.worker.user.lastName}',
                            style: Theme.of(context).textTheme.titleMedium
                                ?.copyWith(
                                  fontWeight: FontWeight.bold,
                                  color: Colors.black87,
                                ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Verified Professional',
                            style: Theme.of(context).textTheme.bodyMedium
                                ?.copyWith(color: Colors.black54),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(height: 24),

              // Support Section
              SupportSection(onHelpPressed: _showSupportOptions),

              const SizedBox(height: 24),

              // Reassurance Text
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 8),
                child: Text(
                  'We’re monitoring your service and will handle any issues that arise.',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Colors.black54,
                    fontSize: 12,
                  ),
                  textAlign: TextAlign.center,
                ),
              ),

              const SizedBox(height: 24),

              // Error Message if applicable
              if (_hasError)
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFF3E0),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: Colors.orange),
                  ),
                  child: Text(
                    'We\'re having trouble updating your service status. Please try again later.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyMedium?.copyWith(color: Colors.orange),
                  ),
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          _getStatusTitle(),
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          _getStatusSubtitle(),
          style: Theme.of(
            context,
          ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
        ),
      ],
    );
  }

  String _getStatusTitle() {
    switch (_status) {
      case ServiceStatus.onTheWay:
        return 'Professional is on the way';
      case ServiceStatus.started:
        return 'Service in progress';
      case ServiceStatus.completed:
        return 'Service completed';
    }
  }

  String _getStatusSubtitle() {
    switch (_status) {
      case ServiceStatus.onTheWay:
        return 'Your service provider is en route to your location';
      case ServiceStatus.started:
        return 'Your service is being performed';
      case ServiceStatus.completed:
        return 'Your service has been completed';
    }
  }

  Widget _buildStatusIndicator() {
    Color statusColor;
    IconData statusIcon;

    switch (_status) {
      case ServiceStatus.onTheWay:
        statusColor = const Color(0xFF2196F3); // Blue
        statusIcon = Icons.directions_car;
        break;
      case ServiceStatus.started:
        statusColor = const Color(0xFF2E7D32); // Green
        statusIcon = Icons.check_circle;
        break;
      case ServiceStatus.completed:
        statusColor = const Color(0xFF2E7D32); // Green
        statusIcon = Icons.check_circle;
        break;
    }

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: statusColor,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(statusIcon, color: Colors.white, size: 24),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  _getStatusTitle(),
                  style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                if (_status == ServiceStatus.onTheWay && _arrivalTime != null)
                  Text(
                    'Estimated arrival: ${_formatTime(_arrivalTime!)}',
                    style: Theme.of(
                      context,
                    ).textTheme.bodySmall?.copyWith(color: Colors.white70),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTime(DateTime time) {
    final hour = time.hour;
    final minute = time.minute;
    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;
    final displayMinute = minute.toString().padLeft(2, '0');
    return '$displayHour:$displayMinute $period';
  }
}

/// Service Summary Card Widget
class ServiceSummaryCard extends StatelessWidget {
  final Service? service;
  final DateTime startTime;
  final DateTime endTime;
  final double amount;

  const ServiceSummaryCard({
    Key? key,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.amount,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          ),
        ],
        border: Border.all(color: Colors.black12),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.cleaning_services,
                color: const Color(0xFF2E7D32),
                size: 24,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      service?.name ?? 'Home Cleaning',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                        color: Colors.black87,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${DateFormat('EEE, d MMM').format(startTime)} • ${_getTimeWindowText()}',
                      style: Theme.of(
                        context,
                      ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '₹${amount.toStringAsFixed(0)} per visit',
                      style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: const Color(0xFF2E7D32),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  String _getTimeWindowText() {
    final startHour = startTime.hour;
    final endHour = endTime.hour;

    if (startHour >= 8 && endHour <= 12) {
      return 'Morning (08:00–12:00)';
    } else if (startHour >= 12 && endHour <= 17) {
      return 'Afternoon (12:00–17:00)';
    } else {
      return 'Evening (17:00–21:00)';
    }
  }
}

/// Worker Information Card Widget
class WorkerInformationCard extends StatelessWidget {
  final Worker worker;

  const WorkerInformationCard({Key? key, required this.worker})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFFF8F9FA),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          CircleAvatar(
            backgroundImage: NetworkImage('https://via.placeholder.com/150'),
            radius: 30,
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  '${worker.user.firstName} ${worker.user.lastName}',
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                    color: Colors.black87,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  'Verified Professional',
                  style: Theme.of(
                    context,
                  ).textTheme.bodyMedium?.copyWith(color: Colors.black54),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

/// Support Section Widget
class SupportSection extends StatelessWidget {
  final VoidCallback onHelpPressed;

  const SupportSection({Key? key, required this.onHelpPressed})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Colors.black12),
          bottom: BorderSide(color: Colors.black12),
        ),
        color: Colors.white,
      ),
      child: Row(
        children: [
          const Icon(Icons.help_outline, color: Colors.black54),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Need help?',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                color: Colors.black87,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
          IconButton(
            icon: const Icon(Icons.arrow_forward, color: Colors.black54),
            onPressed: onHelpPressed,
          ),
        ],
      ),
    );
  }
}
