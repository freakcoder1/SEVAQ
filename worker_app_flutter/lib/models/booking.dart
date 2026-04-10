import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

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
  final double? customerLatitude;
  final double? customerLongitude;
  final String scheduledDate;
  final String startTime;
  final String? endTime;
  final String
      status; // PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED
  final double price;
  final String? paymentStatus;
  final String? notes;
  final String? bookingType; // ONE_TIME, SUBSCRIPTION
  final String?
      subscriptionId; // Present if this is a subscription-based booking
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Booking({
    required this.id,
    required this.serviceName,
    this.serviceCategory,
    required this.customerName,
    this.customerPhone,
    this.customerAddress,
    this.customerLatitude,
    this.customerLongitude,
    required this.scheduledDate,
    required this.startTime,
    this.endTime,
    required this.status,
    required this.price,
    this.paymentStatus,
    this.notes,
    this.bookingType,
    this.subscriptionId,
    this.createdAt,
    this.updatedAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    // Debug logging to understand booking type fields and status
    final rawStatus = json['status'] ?? json['bookingStatus'] ?? 'PENDING';
    final normalizedStatus = _normalizeStatus(rawStatus);
    final isPending =
        normalizedStatus == 'REQUESTED' || normalizedStatus == 'PENDING';
    print(
        '🔍 Booking ${json['id']}: type=${json['type']}, status=${rawStatus}, normalizedStatus=${normalizedStatus}, bookingType=${json['bookingType']}, isPending=${isPending}');

    // Parse nested user object for customer info
    final userData = _parseNestedObject(json['user']);
    final customerFirstName = _safeString(userData?['firstName']);
    final customerLastName = _safeString(userData?['lastName']);
    final customerName = '$customerFirstName $customerLastName'.trim();

    // Parse user's addresses for customer address
    // Priority: user.addresses array (default first) → user.address (legacy string)
    String? customerAddressFromUser;
    if (userData != null) {
      // First check for addresses array (structured address objects)
      if (userData['addresses'] is List) {
        final addresses = userData['addresses'] as List;
        if (addresses.isNotEmpty) {
          // Find the default address, or use the first one
          Map? targetAddress;
          for (final addr in addresses) {
            if (addr is Map && addr['isDefault'] == true) {
              targetAddress = addr;
              break;
            }
          }
          targetAddress ??= addresses[0] is Map ? addresses[0] as Map : null;

          if (targetAddress != null) {
            final parts = <String>[];
            if (_safeString(targetAddress['flatNumber']).isNotEmpty) {
              parts.add('Flat ${targetAddress['flatNumber']}');
            }
            if (_safeString(targetAddress['towerNumber']).isNotEmpty) {
              parts.add('Tower ${targetAddress['towerNumber']}');
            }
            if (_safeString(targetAddress['societyName']).isNotEmpty) {
              parts.add(targetAddress['societyName']);
            }
            if (_safeString(targetAddress['landmark']).isNotEmpty) {
              parts.add(targetAddress['landmark']);
            }
            if (_safeString(targetAddress['area']).isNotEmpty) {
              parts.add(targetAddress['area']);
            }
            if (_safeString(targetAddress['city']).isNotEmpty &&
                _safeString(targetAddress['pincode']).isNotEmpty) {
              parts.add(
                  '${targetAddress['city']} - ${targetAddress['pincode']}');
            } else {
              if (_safeString(targetAddress['city']).isNotEmpty) {
                parts.add(targetAddress['city']);
              }
              if (_safeString(targetAddress['pincode']).isNotEmpty) {
                parts.add(targetAddress['pincode']);
              }
            }
            if (_safeString(targetAddress['state']).isNotEmpty) {
              parts.add(targetAddress['state']);
            }
            if (parts.isNotEmpty) {
              customerAddressFromUser = parts.join(', ');
            }
          }
        }
      }
      // Fall back to direct address field (legacy string)
      if (customerAddressFromUser == null || customerAddressFromUser.isEmpty) {
        final legacyAddress = _safeString(userData['address']);
        if (legacyAddress.isNotEmpty) {
          customerAddressFromUser = legacyAddress;
        }
      }
    }

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

    // Parse location data from booking
    final locationData = _parseNestedObject(json['location']);
    final subscriptionData = _parseNestedObject(json['subscription']);
    double? customerLatitude;
    double? customerLongitude;

    if (locationData != null) {
      customerLatitude = _parseDouble(locationData['latitude']);
      customerLongitude = _parseDouble(locationData['longitude']);
    }
    // Fallback to subscription location for subscription bookings
    else if (subscriptionData != null) {
      final subscriptionLocation =
          _parseNestedObject(subscriptionData['location']);
      if (subscriptionLocation != null) {
        customerLatitude = _parseDouble(subscriptionLocation['lat']);
        customerLongitude = _parseDouble(subscriptionLocation['lng']);
      }
    }

    return Booking(
      id: _safeString(json['id'] ?? json['bookingId']),
      serviceName: serviceName.isNotEmpty ? serviceName : 'Service',
      serviceCategory: serviceCategory.isNotEmpty ? serviceCategory : null,
      customerName: customerName.isNotEmpty ? customerName : 'Customer',
      customerPhone: userData != null ? _safeString(userData['phone']) : null,
      customerAddress: _safeString(json['customerAddress'] ??
          customerAddressFromUser ??
          json['address'] ??
          (json['location'] is Map ? json['location']['address'] : null) ??
          json['location'] ??
          (subscriptionData != null && subscriptionData['location'] is Map
              ? subscriptionData['location']['address']
              : null)),
      customerLatitude: customerLatitude,
      customerLongitude: customerLongitude,
      scheduledDate: scheduledDate,
      startTime: startTime,
      endTime: endTime,
      status: status,
      price: price,
      paymentStatus: _safeString(json['paymentStatus'] ?? json['payment']),
      notes: _safeString(json['notes'] ?? json['description']),
      bookingType: _safeString(json['bookingType'] ?? json['type']),
      subscriptionId:
          _safeString(json['subscriptionId'] ?? json['subscription']),
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
      'customerLatitude': customerLatitude,
      'customerLongitude': customerLongitude,
      'scheduledDate': scheduledDate,
      'startTime': startTime,
      'endTime': endTime,
      'status': status,
      'price': price,
      'paymentStatus': paymentStatus,
      'notes': notes,
      'bookingType': bookingType,
      'subscriptionId': subscriptionId,
    };
  }

  // ===== Booking Type Helpers =====

  /// Returns true if this is a subscription-based booking
  bool get isSubscription {
    // Check explicit bookingType field first (maps from backend's 'type' field)
    // Backend values: 'on_demand', 'scheduled', 'subscription'
    if (bookingType != null && bookingType!.isNotEmpty) {
      final type = bookingType!.toUpperCase();
      if (type == 'SUBSCRIPTION' || type == 'RECURRING') return true;
      if (type == 'ON_DEMAND' ||
          type == 'ONE_TIME' ||
          type == 'ONETIME' ||
          type == 'SCHEDULED') return false;
    }

    // Check subscriptionId - must be a valid non-null UUID
    // Only used as fallback if bookingType is not set
    if (subscriptionId != null && subscriptionId!.isNotEmpty) {
      // Only consider it a subscription if subscriptionId looks like a real UUID
      // and not a default/placeholder value
      final uuidRegex = RegExp(
          r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
          caseSensitive: false);
      return uuidRegex.hasMatch(subscriptionId!);
    }

    return false;
  }

  /// Returns true if this is a one-time/on-demand booking
  bool get isOnDemand => !isSubscription;

  /// Returns a human-readable label for the booking type
  String get bookingTypeLabel => isSubscription ? 'Subscription' : 'One-Time';

  /// Returns the appropriate color for the booking type badge
  /// Blue/indigo for subscription, orange/amber for one-time
  Color get bookingTypeColor {
    if (isSubscription) {
      return const Color(0xFF3F51B5); // Indigo blue
    }
    return const Color(0xFFFF9800); // Orange/amber
  }

  /// Returns the surface/background color for the booking type badge
  Color get bookingTypeSurfaceColor {
    if (isSubscription) {
      return const Color(0xFFE8EAF6); // Light indigo
    }
    return const Color(0xFFFFF3E0); // Light orange
  }

  // ===== Status Helpers =====

  bool get isPending =>
      status.toUpperCase() == 'PENDING' || status.toUpperCase() == 'REQUESTED';
  bool get isConfirmed =>
      status.toUpperCase() == 'CONFIRMED' || status.toUpperCase() == 'ACCEPTED';
  bool get isInProgress =>
      status.toUpperCase() == 'IN_PROGRESS' ||
      status.toUpperCase() == 'STARTED';
  bool get isCompleted => status.toUpperCase() == 'COMPLETED';
  bool get isCancelled => status.toUpperCase() == 'CANCELLED';
  bool get isRejected => status.toUpperCase() == 'REJECTED';

  /// Returns true if this booking should appear in the "New" tab.
  /// Includes:
  /// - Pending bookings (REQUESTED/PENDING status) - both subscription and on-demand
  /// - Confirmed on-demand bookings that haven't started yet (scheduled date is today or future)
  bool get isNewBooking {
    // Pending bookings (both subscription and on-demand)
    if (isPending) return true;

    // Confirmed on-demand bookings that haven't started yet
    if (isConfirmed && isOnDemand) {
      final scheduledDateTime = DateTime.tryParse(scheduledDate);
      if (scheduledDateTime != null) {
        final now = DateTime.now();
        // Compare dates only (ignore time) - show if today or in the future
        final today = DateTime(now.year, now.month, now.day);
        final bookingDate = DateTime(scheduledDateTime.year,
            scheduledDateTime.month, scheduledDateTime.day);
        return bookingDate.isAtSameMomentAs(today) ||
            bookingDate.isAfter(today);
      }
    }

    return false;
  }

  /// Get a human-readable status label
  String get statusLabel {
    switch (status.toUpperCase()) {
      case 'REQUESTED':
      case 'PENDING':
        return 'Pending';
      case 'CONFIRMED':
      case 'ACCEPTED':
        return 'Confirmed';
      case 'IN_PROGRESS':
      case 'STARTED':
        return 'In Progress';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REJECTED':
        return 'Rejected';
      default:
        return status.split('_').map((word) {
          if (word.isEmpty) return word;
          return word[0].toUpperCase() + word.substring(1).toLowerCase();
        }).join(' ');
    }
  }

  /// Get the appropriate status color for this booking
  Color get statusColor {
    switch (status.toUpperCase()) {
      case 'REQUESTED':
      case 'PENDING':
        return AppColors.pending;
      case 'CONFIRMED':
      case 'ACCEPTED':
        return AppColors.confirmed;
      case 'IN_PROGRESS':
      case 'STARTED':
        return AppColors.inProgress;
      case 'COMPLETED':
        return AppColors.completed;
      case 'CANCELLED':
      case 'REJECTED':
        return AppColors.cancelled;
      default:
        return AppColors.textSecondary;
    }
  }

  /// Get the surface/background color for this booking status
  Color get statusSurfaceColor {
    switch (status.toUpperCase()) {
      case 'REQUESTED':
      case 'PENDING':
        return AppColors.pendingSurface;
      case 'CONFIRMED':
      case 'ACCEPTED':
        return AppColors.confirmedSurface;
      case 'IN_PROGRESS':
      case 'STARTED':
        return AppColors.inProgressSurface;
      case 'COMPLETED':
        return AppColors.completedSurface;
      case 'CANCELLED':
      case 'REJECTED':
        return AppColors.cancelledSurface;
      default:
        return AppColors.surfaceVariant;
    }
  }
}
