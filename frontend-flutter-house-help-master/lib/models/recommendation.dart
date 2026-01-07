import 'package:flutter/material.dart';
import 'service.dart';
import 'worker.dart';

// System Status Enums and Models
enum SystemStatus { allOnTrack, highDemand, limitedAvailability, maintenance }

class SystemStatusData {
  final SystemStatus status;
  final int availableWorkers;
  final int estimatedWaitTime;
  final String message;

  SystemStatusData({
    required this.status,
    required this.availableWorkers,
    required this.estimatedWaitTime,
    required this.message,
  });

  String get displayText {
    switch (status) {
      case SystemStatus.allOnTrack:
        return 'All services on track';
      case SystemStatus.highDemand:
        return 'High demand right now';
      case SystemStatus.limitedAvailability:
        return 'Limited availability';
      case SystemStatus.maintenance:
        return 'System maintenance';
    }
  }

  Color get statusColor {
    switch (status) {
      case SystemStatus.allOnTrack:
        return Colors.green;
      case SystemStatus.highDemand:
        return Colors.orange;
      case SystemStatus.limitedAvailability:
        return Colors.red;
      case SystemStatus.maintenance:
        return Colors.blue;
    }
  }

  IconData get statusIcon {
    switch (status) {
      case SystemStatus.allOnTrack:
        return Icons.check_circle;
      case SystemStatus.highDemand:
        return Icons.warning;
      case SystemStatus.limitedAvailability:
        return Icons.cancel;
      case SystemStatus.maintenance:
        return Icons.construction;
    }
  }
}

// Recommendation Model
class Recommendation {
  final Service service;
  final Worker worker;
  final int estimatedArrivalTime;
  final double reliabilityScore;
  final String reasoning;
  final String title;

  Recommendation({
    required this.service,
    required this.worker,
    required this.estimatedArrivalTime,
    required this.reliabilityScore,
    required this.reasoning,
    required this.title,
  });
}

// Suggestion Types
enum SuggestionType {
  usuallyBooked,
  repeatService,
  safeOption,
  highlyRated,
  fastBooking,
}

class Suggestion {
  final SuggestionType type;
  final String title;
  final String subtitle;
  final IconData icon;
  final VoidCallback onTap;
  final Color backgroundColor;
  final Color iconColor;

  Suggestion({
    required this.type,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.onTap,
    required this.backgroundColor,
    required this.iconColor,
  });

  factory Suggestion.usuallyBooked({
    required String serviceType,
    required VoidCallback onTap,
  }) {
    return Suggestion(
      type: SuggestionType.usuallyBooked,
      title: 'Usually booked at this time',
      subtitle: serviceType,
      icon: Icons.schedule,
      onTap: onTap,
      backgroundColor: Colors.blue[50]!,
      iconColor: Colors.blue[700]!,
    );
  }

  factory Suggestion.repeatService({
    required String serviceName,
    required String lastBooked,
    required VoidCallback onTap,
  }) {
    return Suggestion(
      type: SuggestionType.repeatService,
      title: 'Repeat last service',
      subtitle: '$serviceName - $lastBooked',
      icon: Icons.repeat,
      onTap: onTap,
      backgroundColor: Colors.green[50]!,
      iconColor: Colors.green[700]!,
    );
  }

  factory Suggestion.safeOption({
    required String serviceType,
    required VoidCallback onTap,
  }) {
    return Suggestion(
      type: SuggestionType.safeOption,
      title: 'Safe option today',
      subtitle: serviceType,
      icon: Icons.shield,
      onTap: onTap,
      backgroundColor: Colors.purple[50]!,
      iconColor: Colors.purple[700]!,
    );
  }

  factory Suggestion.highlyRated({
    required String serviceType,
    required double rating,
    required VoidCallback onTap,
  }) {
    return Suggestion(
      type: SuggestionType.highlyRated,
      title: 'Highly rated service',
      subtitle: '$serviceType • ${rating.toStringAsFixed(1)}★',
      icon: Icons.star,
      onTap: onTap,
      backgroundColor: Colors.orange[50]!,
      iconColor: Colors.orange[700]!,
    );
  }
}

// User History Model
class UserHistory {
  final Worker? favoriteWorker;
  final Service? lastBookedService;
  final DateTime? lastBookingDate;
  final int totalBookings;

  UserHistory({
    this.favoriteWorker,
    this.lastBookedService,
    this.lastBookingDate,
    required this.totalBookings,
  });

  bool get hasFavoriteWorker => favoriteWorker != null;
  bool get hasRecentBooking =>
      lastBookingDate != null &&
      lastBookingDate!.isAfter(DateTime.now().subtract(Duration(days: 30)));

  String get lastBookingText {
    if (lastBookingDate == null) return 'No recent bookings';

    final daysAgo = DateTime.now().difference(lastBookingDate!).inDays;
    if (daysAgo == 0) return 'Booked today';
    if (daysAgo == 1) return 'Booked yesterday';
    return 'Booked $daysAgo days ago';
  }
}
