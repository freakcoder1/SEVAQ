import 'package:flutter/foundation.dart';

class Booking {
  // Helper method to parse double from various types
  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }

  // Helper method to parse nested objects
  static Map<String, dynamic>? _parseNestedObject(dynamic value) {
    if (value == null) return null;
    if (value is Map<String, dynamic>) return value;
    // Handle Map<dynamic, dynamic>
    if (value is Map) {
      try {
        return Map<String, dynamic>.from(value);
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  // Helper to safely get string value from any type
  static String _safeString(dynamic value) {
    if (value == null) return '';
    if (value is String) return value;
    return value.toString();
  }

  // Helper to normalize status to uppercase for comparison
  static String _normalizeStatus(dynamic value) {
    return _safeString(value).toUpperCase();
  }

  final String id;
  final String serviceName;
  final String? serviceCategory;
  final String customerName;
  final String? customerPhone;
  final String? customerAddress;
  final String scheduledDate;
  final String startTime;
  final String? endTime;
  final String
      status; // PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED
  final double price;
  final String? paymentStatus;
  final String? notes;
  final String? bookingType; // ONE_TIME, SUBSCRIPTION
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Booking({
    required this.id,
    required this.serviceName,
    this.serviceCategory,
    required this.customerName,
    this.customerPhone,
    this.customerAddress,
    required this.scheduledDate,
    required this.startTime,
    this.endTime,
    required this.status,
    required this.price,
    this.paymentStatus,
    this.notes,
    this.bookingType,
    this.createdAt,
    this.updatedAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    debugPrint('Booking.fromJson called with keys: ${json.keys.toList()}');

    // Parse nested user object for customer info
    final userData = _parseNestedObject(json['user']);
    final customerFirstName = _safeString(userData?['firstName']);
    final customerLastName = _safeString(userData?['lastName']);
    final customerName = '$customerFirstName $customerLastName'.trim();

    // Parse nested service object for service info
    final serviceData = _parseNestedObject(json['service']);
    final serviceName = serviceData != null
        ? _safeString(serviceData['name'] ?? serviceData['serviceName'])
        : _safeString(json['serviceName'] ?? json['service']);
    final serviceCategory = serviceData != null
        ? _safeString(serviceData['category'] ?? serviceData['serviceCategory'])
        : _safeString(json['serviceCategory']);

    // Parse nested slot object for time info
    final slotData = _parseNestedObject(json['slot']);
    String startTime = _safeString(
        slotData?['startTime'] ?? json['startTime'] ?? json['time']);
    String? endTime = slotData != null
        ? _safeString(slotData['endTime'] ?? json['endTime'])
        : null;

    // Handle time value if present
    if (slotData != null && slotData['timeValue'] != null) {
      final timeValue = slotData['timeValue'];
      if (timeValue is String) {
        startTime = timeValue;
      } else if (timeValue is Map) {
        // Handle timeValue as Map like {hours: 10, minutes: 0}
        final hours = timeValue['hours'] ?? timeValue['hour'] ?? 0;
        final minutes = timeValue['minutes'] ?? timeValue['minute'] ?? 0;
        startTime =
            '${hours.toString().padLeft(2, '0')}:${minutes.toString().padLeft(2, '0')}';
      }
    }

    // Parse dates - could be date + startTime or scheduledDate
    String scheduledDate = _safeString(
        json['scheduledDate'] ?? json['date'] ?? json['bookingDate']);

    // Parse price - could be in various fields
    double price = 0.0;
    if (serviceData != null && serviceData['basePrice'] != null) {
      price = _parseDouble(serviceData['basePrice']);
    } else {
      price = _parseDouble(
          json['price'] ?? json['amount'] ?? json['totalPrice'] ?? 0);
    }

    // Normalize status to uppercase for consistent comparison
    String status =
        _normalizeStatus(json['status'] ?? json['bookingStatus'] ?? 'PENDING');

    return Booking(
      id: _safeString(json['id'] ?? json['bookingId']),
      serviceName: serviceName.isNotEmpty ? serviceName : 'Service',
      serviceCategory: serviceCategory.isNotEmpty ? serviceCategory : null,
      customerName: customerName.isNotEmpty ? customerName : 'Customer',
      customerPhone: userData != null ? _safeString(userData['phone']) : null,
      customerAddress: _safeString(
          json['customerAddress'] ?? json['address'] ?? json['location']),
      scheduledDate: scheduledDate,
      startTime: startTime,
      endTime: endTime,
      status: status,
      price: price,
      paymentStatus: _safeString(json['paymentStatus'] ?? json['payment']),
      notes: _safeString(json['notes'] ?? json['description']),
      bookingType: _safeString(json['bookingType'] ?? json['type']),
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(_safeString(json['createdAt']))
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(_safeString(json['updatedAt']))
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceName': serviceName,
      'serviceCategory': serviceCategory,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerAddress': customerAddress,
      'scheduledDate': scheduledDate,
      'startTime': startTime,
      'endTime': endTime,
      'status': status,
      'price': price,
      'paymentStatus': paymentStatus,
      'notes': notes,
      'bookingType': bookingType,
    };
  }

  bool get isPending => status.toUpperCase() == 'PENDING';
  bool get isConfirmed => status.toUpperCase() == 'CONFIRMED';
  bool get isInProgress => status.toUpperCase() == 'IN_PROGRESS';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isCancelled => status.toUpperCase() == 'CANCELLED';
  bool get isRejected => status.toUpperCase() == 'REJECTED';
}
