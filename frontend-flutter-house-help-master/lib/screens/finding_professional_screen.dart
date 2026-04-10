import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../widgets/loading_widget.dart';
import '../providers/auth_provider.dart';

class FindingProfessionalScreen extends StatefulWidget {
  final String requestId;

  const FindingProfessionalScreen({Key? key, required this.requestId})
    : super(key: key);

  @override
  _FindingProfessionalScreenState createState() =>
      _FindingProfessionalScreenState();
}

class _FindingProfessionalScreenState extends State<FindingProfessionalScreen> {
  late Timer _pollingTimer;
  AssignmentStatus _status = AssignmentStatus.requested;
  Worker? _assignedWorker;
  int _pollingCount = 0;
  String _failureReason = '';
  final ApiService _apiService = ApiService();

  @override
  void initState() {
    super.initState();
    _startPolling();
  }

  @override
  void dispose() {
    _pollingTimer.cancel();
    super.dispose();
  }

  void _startPolling() {
    _pollingTimer = Timer.periodic(const Duration(seconds: 3), (timer) async {
      _pollingCount++;

      try {
        final status = await _apiService.getServiceRequestStatus(
          widget.requestId,
        );

        setState(() {
          _status = _parseAssignmentStatus(status['assignmentStatus']);
          _assignedWorker = status['assignedWorker'] != null
              ? Worker.fromJson(status['assignedWorker'])
              : null;
          _failureReason = status['failureReason'] ?? '';
        });

        if (_status == AssignmentStatus.assigned ||
            _status == AssignmentStatus.failedToAssign) {
          _pollingTimer.cancel();
        }
      } on TokenExpiredException {
        debugPrint('FindingProfessionalScreen: Token expired');
        _pollingTimer.cancel();
        if (mounted) {
          final authProvider = Provider.of<AuthProvider>(
            context,
            listen: false,
          );
          await authProvider.handleTokenExpired();
        }
      } catch (error) {
        setState(() {
          _status = AssignmentStatus.failedToAssign;
          _failureReason = 'Network error occurred';
        });
        _pollingTimer.cancel();
      }
    });
  }

  AssignmentStatus _parseAssignmentStatus(dynamic status) {
    final statusStr = status.toString().toUpperCase();
    switch (statusStr) {
      case 'REQUESTED':
        return AssignmentStatus.requested;
      case 'ASSIGNED':
        return AssignmentStatus.assigned;
      case 'FAILED_TO_ASSIGN':
        return AssignmentStatus.failedToAssign;
      default:
        debugPrint('Unknown assignment status: $status');
        return AssignmentStatus.requested;
    }
  }

  Widget _buildContent() {
    switch (_status) {
      case AssignmentStatus.requested:
        return _buildRequestedState(_pollingCount);
      case AssignmentStatus.assigned:
        return _buildAssignedState();
      case AssignmentStatus.failedToAssign:
        return _buildFailedState();
    }
  }

  Widget _buildRequestedState(int pollingCount) {
    String message = "Finding the best professional for you...";

    if (pollingCount > 10) {
      // ~30 seconds
      message = "This is taking a bit longer than usual. We're still trying.";
    } else if (pollingCount > 20) {
      // ~60 seconds
      message =
          "We're working hard to find someone for you. Please wait a moment longer.";
    }

    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const LoadingWidget(),
          const SizedBox(height: 16),
          Text(
            message,
            style: const TextStyle(fontSize: 16, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            'Estimated time: 10-30 seconds',
            style: TextStyle(fontSize: 12, color: Colors.grey[600]),
          ),
        ],
      ),
    );
  }

  Widget _buildAssignedState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.check_circle, size: 80, color: Colors.green),
          const SizedBox(height: 16),
          const Text(
            'Professional assigned',
            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.green,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'A verified professional has been assigned to your service.',
            style: const TextStyle(fontSize: 18, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              // Navigate to payment confirmation screen
              Navigator.pushReplacementNamed(
                context,
                '/payment-confirmation',
                arguments: {
                  'requestId': widget.requestId,
                  'amount': 500.0, // This should come from the service request
                },
              );
            },
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
            child: const Text(
              'Proceed to Payment',
              style: TextStyle(fontSize: 16),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFailedState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error, size: 80, color: Colors.red),
          const SizedBox(height: 16),
          const Text(
            'We couldn\'t find a professional',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.bold,
              color: Colors.red,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            _failureReason.isNotEmpty
                ? _failureReason
                : 'No professionals are available for your selected time slot.',
            style: const TextStyle(fontSize: 16, color: Colors.grey),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceEvenly,
            children: [
              ElevatedButton(
                onPressed: () {
                  // Try again with same parameters
                  Navigator.pushReplacementNamed(context, '/booking');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
                child: const Text('Try Again'),
              ),
              ElevatedButton(
                onPressed: () {
                  // Navigate to home screen
                  Navigator.pushReplacementNamed(context, '/home');
                },
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.grey[600],
                  padding: const EdgeInsets.symmetric(
                    horizontal: 24,
                    vertical: 12,
                  ),
                ),
                child: const Text('Go Home'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Finding Professional'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () {
            // Don't allow going back during assignment
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Please wait while we find a professional for you.',
                ),
              ),
            );
          },
        ),
      ),
      body: _buildContent(),
    );
  }
}

enum AssignmentStatus { requested, assigned, failedToAssign }

// Mock Worker class for now - should be imported from models
class Worker {
  final String id;
  final User user;

  Worker({required this.id, required this.user});

  factory Worker.fromJson(Map<String, dynamic> json) {
    return Worker(id: json['id'], user: User.fromJson(json['user']));
  }
}

class User {
  final String id;
  final String firstName;
  final String lastName;

  User({required this.id, required this.firstName, required this.lastName});

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'],
      firstName: json['firstName'],
      lastName: json['lastName'],
    );
  }
}
