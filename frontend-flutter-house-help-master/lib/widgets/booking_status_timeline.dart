import 'package:flutter/material.dart';
import '../models/booking.dart';

/// A widget that displays a visual timeline showing the booking status progress
class BookingStatusTimeline extends StatelessWidget {
  final BookingAssignmentState? currentState;
  final BookingStatus? bookingStatus;
  final bool showLabels;

  const BookingStatusTimeline({
    Key? key,
    this.currentState,
    this.bookingStatus,
    this.showLabels = true,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Determine which states to show based on booking status
    final states = _getTimelineStates();
    final currentIndex = _getCurrentIndex();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (showLabels) ...[
          Text(
            'Booking Status',
            style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.bold,
              color: Colors.black87,
            ),
          ),
          const SizedBox(height: 12),
        ],
        // Timeline
        Row(
          children: List.generate(states.length * 2 - 1, (index) {
            if (index.isOdd) {
              // Connector line
              final stateIndex = index ~/ 2;
              final isCompleted = stateIndex < currentIndex;
              return Expanded(
                child: Container(
                  height: 3,
                  color: isCompleted
                      ? const Color(0xFF2E7D32)
                      : Colors.grey.shade300,
                ),
              );
            } else {
              // State dot
              final stateIndex = index ~/ 2;
              final isCompleted = stateIndex <= currentIndex;
              final isCurrent = stateIndex == currentIndex;

              return _buildStateDot(
                context,
                states[stateIndex],
                isCompleted,
                isCurrent,
              );
            }
          }),
        ),
        const SizedBox(height: 8),
        // Labels
        if (showLabels)
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: states.map((state) {
              final stateIndex = states.indexOf(state);
              final isCompleted = stateIndex <= currentIndex;
              return Expanded(
                child: Text(
                  _getStateLabel(state),
                  style: TextStyle(
                    fontSize: 10,
                    color: isCompleted
                        ? const Color(0xFF2E7D32)
                        : Colors.grey.shade600,
                    fontWeight: isCompleted
                        ? FontWeight.bold
                        : FontWeight.normal,
                  ),
                  textAlign: TextAlign.center,
                ),
              );
            }).toList(),
          ),
      ],
    );
  }

  Widget _buildStateDot(
    BuildContext context,
    BookingAssignmentState state,
    bool isCompleted,
    bool isCurrent,
  ) {
    Color color;
    IconData icon;

    if (isCompleted) {
      color = const Color(0xFF2E7D32); // Green
      icon = Icons.check;
    } else if (isCurrent) {
      color = const Color(0xFFFF9800); // Orange - current
      icon = Icons.access_time;
    } else {
      color = Colors.grey.shade300; // Grey - pending
      icon = Icons.circle;
    }

    return Container(
      width: 28,
      height: 28,
      decoration: BoxDecoration(
        color: isCurrent ? color.withOpacity(0.2) : Colors.transparent,
        shape: BoxShape.circle,
        border: Border.all(color: color, width: 2),
      ),
      child: Center(
        child: isCompleted
            ? Icon(icon, size: 14, color: color)
            : isCurrent
            ? Icon(icon, size: 14, color: color)
            : null,
      ),
    );
  }

  List<BookingAssignmentState> _getTimelineStates() {
    // Default timeline for assignment states
    return [
      BookingAssignmentState.pending,
      BookingAssignmentState.assigned,
      BookingAssignmentState.confirmed,
      BookingAssignmentState.enRoute,
      BookingAssignmentState.arrived,
      BookingAssignmentState.inProgress,
      BookingAssignmentState.completed,
    ];
  }

  int _getCurrentIndex() {
    if (currentState != null) {
      final states = _getTimelineStates();
      return states.indexOf(currentState!);
    }

    // Fallback to booking status
    if (bookingStatus != null) {
      switch (bookingStatus!) {
        case BookingStatus.assignmentInProgress:
          return 0;
        case BookingStatus.scheduled:
          return 1;
        case BookingStatus.confirmed:
          return 4;
        case BookingStatus.inProgress:
          return 5;
        case BookingStatus.completed:
          return 6;
        case BookingStatus.cancelled:
          return -1;
      }
    }

    return 0;
  }

  String _getStateLabel(BookingAssignmentState state) {
    switch (state) {
      case BookingAssignmentState.pending:
        return 'Pending';
      case BookingAssignmentState.assigned:
        return 'Assigned';
      case BookingAssignmentState.confirmed:
        return 'Confirmed';
      case BookingAssignmentState.enRoute:
        return 'En Route';
      case BookingAssignmentState.arrived:
        return 'Arrived';
      case BookingAssignmentState.inProgress:
        return 'In Progress';
      case BookingAssignmentState.completed:
        return 'Completed';
      case BookingAssignmentState.cancelled:
        return 'Cancelled';
    }
  }
}

/// A compact version of the status timeline for use in cards
class CompactStatusIndicator extends StatelessWidget {
  final BookingAssignmentState? assignmentState;
  final BookingStatus? bookingStatus;

  const CompactStatusIndicator({
    Key? key,
    this.assignmentState,
    this.bookingStatus,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final state = _getDisplayState();
    final color = _getStateColor();
    final label = _getStateLabel();
    final icon = _getStateIcon();

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Text(
            label,
            style: TextStyle(
              color: color,
              fontWeight: FontWeight.w600,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }

  String _getStateLabel() {
    if (assignmentState != null) {
      switch (assignmentState!) {
        case BookingAssignmentState.pending:
          return 'Pending';
        case BookingAssignmentState.assigned:
          return 'Assigned';
        case BookingAssignmentState.confirmed:
          return 'Confirmed';
        case BookingAssignmentState.enRoute:
          return 'En Route';
        case BookingAssignmentState.arrived:
          return 'Arrived';
        case BookingAssignmentState.inProgress:
          return 'In Progress';
        case BookingAssignmentState.completed:
          return 'Completed';
        case BookingAssignmentState.cancelled:
          return 'Cancelled';
      }
    }

    if (bookingStatus != null) {
      switch (bookingStatus!) {
        case BookingStatus.assignmentInProgress:
          return 'Assigning...';
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
      }
    }

    return 'Unknown';
  }

  Color _getStateColor() {
    if (assignmentState != null) {
      switch (assignmentState!) {
        case BookingAssignmentState.pending:
          return Colors.orange;
        case BookingAssignmentState.assigned:
          return Colors.blue;
        case BookingAssignmentState.confirmed:
          return Colors.indigo;
        case BookingAssignmentState.enRoute:
          return Colors.cyan;
        case BookingAssignmentState.arrived:
          return Colors.teal;
        case BookingAssignmentState.inProgress:
          return Colors.purple;
        case BookingAssignmentState.completed:
          return Colors.green;
        case BookingAssignmentState.cancelled:
          return Colors.red;
      }
    }

    if (bookingStatus != null) {
      switch (bookingStatus!) {
        case BookingStatus.assignmentInProgress:
          return Colors.orange;
        case BookingStatus.scheduled:
          return Colors.blue;
        case BookingStatus.confirmed:
          return Colors.green;
        case BookingStatus.inProgress:
          return Colors.purple;
        case BookingStatus.completed:
          return Colors.green;
        case BookingStatus.cancelled:
          return Colors.red;
      }
    }

    return Colors.grey;
  }

  IconData _getStateIcon() {
    if (assignmentState != null) {
      switch (assignmentState!) {
        case BookingAssignmentState.pending:
          return Icons.hourglass_empty;
        case BookingAssignmentState.assigned:
          return Icons.person;
        case BookingAssignmentState.confirmed:
          return Icons.check_circle;
        case BookingAssignmentState.enRoute:
          return Icons.directions_car;
        case BookingAssignmentState.arrived:
          return Icons.location_on;
        case BookingAssignmentState.inProgress:
          return Icons.build;
        case BookingAssignmentState.completed:
          return Icons.task_alt;
        case BookingAssignmentState.cancelled:
          return Icons.cancel;
      }
    }

    return Icons.info;
  }

  String _getDisplayState() {
    if (assignmentState != null) {
      return 'assignmentState';
    }
    if (bookingStatus != null) {
      return 'bookingStatus';
    }
    return 'unknown';
  }
}
