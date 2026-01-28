import 'package:flutter/foundation.dart';
import 'user.dart';
import 'worker.dart';
import 'service.dart';

enum BookingStatus {
  assignmentInProgress,
  scheduled,
  confirmed,
  inProgress,
  completed,
  cancelled,
}

class Booking {
  final int id; // Internal ID
  final String publicId; // Public API ID
  final String? serviceRequestId;
  final User user;
  final Worker worker;
  final Service service;
  final DateTime startTime;
  final DateTime endTime;
  final BookingStatus status;
  final bool isPaid;
  final double? amount;

  Booking({
    required this.id,
    required this.publicId,
    this.serviceRequestId,
    required this.user,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.isPaid,
    this.amount,
  });

  static BookingStatus _mapStatus(String statusStr) {
    final normalized = statusStr.toLowerCase().trim();

    // Map old statuses to new ones
    if (normalized == 'pending' || normalized == 'requested') {
      return BookingStatus.assignmentInProgress;
    }

    try {
      return BookingStatus.values.firstWhere(
        (e) => e.toString().split('.').last == normalized,
        orElse: () => BookingStatus.assignmentInProgress,
      );
    } catch (e) {
      return BookingStatus.assignmentInProgress;
    }
  }

  static DateTime _parseTime(String timeStr, String? dateStr) {
    try {
      // First, try to parse as full ISO8601 timestamp
      if (timeStr.contains('T') || timeStr.contains('-')) {
        return DateTime.parse(timeStr);
      }

      // If just time string (HH:MM:SS), combine with date if available
      List<String> timeParts = timeStr.split(':');
      if (timeParts.length >= 2) {
        int hours = int.tryParse(timeParts[0]) ?? 0;
        int minutes = int.tryParse(timeParts[1]) ?? 0;
        int seconds = timeParts.length > 2
            ? (int.tryParse(timeParts[2]) ?? 0)
            : 0;

        DateTime baseDate = DateTime.now();
        if (dateStr != null && dateStr.contains('-')) {
          try {
            baseDate = DateTime.parse(dateStr);
          } catch (e) {
            debugPrint('Failed to parse date: $dateStr');
          }
        }

        return DateTime(
          baseDate.year,
          baseDate.month,
          baseDate.day,
          hours,
          minutes,
          seconds,
        );
      }
    } catch (e) {
      debugPrint('Failed to parse time: $timeStr - $e');
    }

    return DateTime.now();
  }

  factory Booking.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return Booking(
        id: 0,
        publicId: '',
        serviceRequestId: null,
        user: User(
          id: 0,
          publicId: '',
          email: '',
          firstName: '',
          lastName: '',
          role: 'user',
        ),
        worker: Worker(
          id: 0,
          publicId: '',
          user: User(
            id: 0,
            publicId: '',
            email: '',
            firstName: '',
            lastName: '',
            role: 'worker',
          ),
          services: [],
          rating: 0,
          reviewCount: 0,
          bio: '',
        ),
        service: Service(
          id: 0,
          publicId: '',
          name: '',
          description: '',
          basePrice: 0,
          category: '',
        ),
        startTime: DateTime.now(),
        endTime: DateTime.now().add(const Duration(hours: 1)),
        status: BookingStatus.assignmentInProgress,
        isPaid: false,
        amount: null,
      );
    }

    return Booking(
      id: json['id'] ?? 0,
      publicId: json['publicId'] ?? '',
      serviceRequestId: json['serviceRequestId'],
      user: json['user'] != null
          ? User.fromJson(json['user'])
          : User(
              id: 0,
              publicId: '',
              email: '',
              firstName: '',
              lastName: '',
              role: 'user',
            ),
      worker: json['worker'] != null
          ? Worker.fromJson(json['worker'])
          : Worker(
              id: 0,
              publicId: '',
              user: User(
                id: 0,
                publicId: '',
                email: '',
                firstName: '',
                lastName: '',
                role: 'worker',
              ),
              services: [],
              rating: 0,
              reviewCount: 0,
              bio: '',
            ),
      service: json['service'] != null
          ? Service.fromJson(json['service'])
          : Service(
              id: 0,
              publicId: '',
              name: '',
              description: '',
              basePrice: 0,
              category: '',
            ),
      startTime: (json['startTime'] != null && json['startTime'] is String)
          ? _parseTime(json['startTime'], json['date'])
          : DateTime.now(),
      endTime: (json['endTime'] != null && json['endTime'] is String)
          ? _parseTime(json['endTime'], json['date'])
          : DateTime.now().add(const Duration(hours: 1)),
      status: _mapStatus(json['status'] ?? 'assignmentInProgress'),

      isPaid: json['isPaid'] ?? false,
      amount: (json['amount'] != null)
          ? (json['amount'] is String
                ? double.tryParse(json['amount'])
                : json['amount']?.toDouble())
          : (json['totalAmount'] != null
                ? (json['totalAmount'] is String
                      ? double.tryParse(json['totalAmount'])
                      : json['totalAmount']?.toDouble())
                : 0.0),
    );
  }
}
