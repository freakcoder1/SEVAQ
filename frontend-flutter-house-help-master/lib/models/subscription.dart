import 'dart:convert';

/// Subscription model for displaying subscription information in the UI
class Subscription {
  final String id;
  final String publicId;
  final String userId;
  final String serviceProfileId;
  final String status;
  final DateTime startDate;
  final DateTime? endDate;
  final String preferredTimeWindow;
  final String billingCycle;
  final double monthlyPriceSnapshot;
  final DateTime createdAt;
  final DateTime updatedAt;

  // Availability detection timestamp (new field)
  final DateTime? availabilityDetectedAt;

  // Worker assignment failed flag (set when scheduler fails to find available workers)
  final bool workerAssignmentFailed;

  // Display fields from serviceProfile
  final String serviceType;
  final String description;

  // Custom plan data (for custom subscriptions)
  final Map<String, dynamic>? customPlanData;

  // Display fields from assignedWorker
  final String? workerId;
  final String? workerName;
  final String? workerPhone;
  final String? workerPhotoUrl;

  Subscription({
    required this.id,
    required this.publicId,
    required this.userId,
    required this.serviceProfileId,
    required this.status,
    required this.startDate,
    this.endDate,
    required this.preferredTimeWindow,
    required this.billingCycle,
    required this.monthlyPriceSnapshot,
    required this.createdAt,
    required this.updatedAt,
    this.availabilityDetectedAt,
    this.workerAssignmentFailed = false,
    required this.serviceType,
    required this.description,
    this.customPlanData,
    this.workerId,
    this.workerName,
    this.workerPhone,
    this.workerPhotoUrl,
  });

  /// Get display name for the service
  String get serviceName {
    final serviceTypeDisplay = _getServiceTypeDisplay(serviceType);
    return description.isNotEmpty
        ? '$serviceTypeDisplay - $description'
        : serviceTypeDisplay;
  }

  /// Get formatted price string
  String get priceDisplay {
    // Use calculatedPrice from customPlanData if available (for custom plans)
    if (customPlanData != null && customPlanData!['calculatedPrice'] != null) {
      final calculatedPrice = customPlanData!['calculatedPrice'];
      if (calculatedPrice is num) {
        return '₹${calculatedPrice.toInt()}/month';
      }
    }
    return '₹${monthlyPriceSnapshot.toInt()}/month';
  }

  /// Get formatted time window
  String get timeWindowDisplay {
    return _getTimeWindowDisplay(preferredTimeWindow);
  }

  /// Get uppercase status for display
  String get statusDisplay => status.toUpperCase();

  /// Check if subscription is active (case-insensitive)
  bool get isActive => status.toUpperCase() == 'ACTIVE';

  /// Check if subscription is paused (case-insensitive)
  bool get isPaused => status.toUpperCase() == 'PAUSED';

  /// Check if subscription is cancelled (case-insensitive)
  bool get isCancelled => status.toUpperCase() == 'CANCELLED';

  /// Worker assignment state for UI display
  /// Determines what message to show to the user
  WorkerState get workerState {
    if (workerId != null) return WorkerState.assigned;
    if (workerAssignmentFailed) return WorkerState.failed;
    if (availabilityDetectedAt != null) return WorkerState.availableDetected;
    return WorkerState.pending;
  }

  /// Helper to parse double from various types (including Decimal from backend)
  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    // Handle Decimal from TypeORM (may be stored as object with value/scale)
    if (value is Map) {
      final numericValue = value['value'] ?? value['numericValue'] ?? '0';
      return double.tryParse(numericValue.toString()) ?? 0.0;
    }
    return 0.0;
  }

  /// Factory constructor from JSON
  factory Subscription.fromJson(Map<String, dynamic> json) {
    print(
      '[subscription.dart] Subscription.fromJson Parsing subscription JSON: ${json['publicId']}',
    );
    try {
      // Extract serviceProfile data
      final serviceProfile = json['serviceProfile'] as Map<String, dynamic>?;
      // Extract assignedWorker data
      final assignedWorker = json['assignedWorker'] as Map<String, dynamic>?;
      // Extract customPlanData - handle both Map and String (JSON) cases
      print(
        '[subscription.dart] Subscription.fromJson customPlanData raw type: ${json['customPlanData']?.runtimeType}',
      );
      dynamic rawCustomPlanData = json['customPlanData'];
      Map<String, dynamic>? customPlanData;
      if (rawCustomPlanData is String) {
        print(
          '[subscription.dart] Subscription.fromJson Decoding customPlanData string: $rawCustomPlanData',
        );
        customPlanData = jsonDecode(rawCustomPlanData) as Map<String, dynamic>?;
      } else if (rawCustomPlanData is Map) {
        customPlanData = rawCustomPlanData as Map<String, dynamic>?;
      } else {
        customPlanData = null;
      }

      // Determine service type: use customPlanData first, then serviceProfile
      final String resolvedServiceType =
          customPlanData?['serviceType'] ??
          serviceProfile?['serviceType'] ??
          'UNKNOWN';
      print(
        '[subscription.dart] Subscription.fromJson Resolved serviceType: $resolvedServiceType',
      );

      // Determine description: use customPlanData, then serviceProfile
      final String resolvedDescription =
          customPlanData?['scopeDefinition'] ??
          serviceProfile?['description'] ??
          '';
      print(
        '[subscription.dart] Subscription.fromJson Resolved description: $resolvedDescription',
      );

      final double parsedPrice = _parseDouble(json['monthlyPriceSnapshot']);
      print(
        '[subscription.dart] Subscription.fromJson Parsed subscription: publicId=${json['publicId']}, serviceType=$resolvedServiceType, description=$resolvedDescription, price=$parsedPrice',
      );
      return Subscription(
        id: (json['id'] ?? '').toString(),
        publicId: json['publicId'] ?? '',
        userId: (json['userId'] ?? '').toString(),
        serviceProfileId: (json['serviceProfileId'] ?? '').toString(),
        status: json['status'] ?? 'UNKNOWN',
        startDate: json['startDate'] != null
            ? DateTime.parse(json['startDate'])
            : DateTime.now(),
        endDate: json['endDate'] != null
            ? DateTime.parse(json['endDate'])
            : null,
        preferredTimeWindow: json['preferredTimeWindow'] ?? 'MORNING',
        billingCycle: json['billingCycle'] ?? 'MONTHLY',
        monthlyPriceSnapshot: parsedPrice,
        createdAt: json['createdAt'] != null
            ? DateTime.parse(json['createdAt'])
            : DateTime.now(),
        updatedAt: json['updatedAt'] != null
            ? DateTime.parse(json['updatedAt'])
            : DateTime.now(),
        serviceType: resolvedServiceType,
        description: resolvedDescription,
        customPlanData: customPlanData,
        workerId: assignedWorker != null
            ? (assignedWorker['id'] ?? assignedWorker['publicId'] ?? '')
                  .toString()
            : null,
        workerName: assignedWorker != null
            ? '${assignedWorker['user']?['firstName'] ?? ''} ${assignedWorker['user']?['lastName'] ?? ''}'
                  .trim()
            : null,
        workerPhone: assignedWorker?['user']?['phone'] ?? null,
        workerPhotoUrl: assignedWorker?['user']?['photoUrl'] ?? null,
        availabilityDetectedAt: json['availabilityDetectedAt'] != null
            ? DateTime.parse(json['availabilityDetectedAt'])
            : null,
        workerAssignmentFailed: json['workerAssignmentFailed'] == true,
      );
    } catch (e, stackTrace) {
      print(
        '[subscription.dart] Subscription.fromJson ERROR parsing subscription: $e',
      );
      print(
        '[subscription.dart] Subscription.fromJson Stack trace: $stackTrace',
      );
      rethrow;
    }
  }

  /// Convert to JSON
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'publicId': publicId,
      'userId': userId,
      'serviceProfileId': serviceProfileId,
      'status': status,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'preferredTimeWindow': preferredTimeWindow,
      'billingCycle': billingCycle,
      'monthlyPriceSnapshot': monthlyPriceSnapshot,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'availabilityDetectedAt': availabilityDetectedAt?.toIso8601String(),
      'serviceProfile': {
        'serviceType': serviceType,
        'description': description,
      },
    };
  }

  String _getServiceTypeDisplay(String type) {
    switch (type) {
      case 'COOK':
      case 'COOKING':
        return 'Cooking';
      case 'MAID':
      case 'MAID_SERVICE':
        return 'Maid Service';
      case 'CLEANING':
        return 'Cleaning';
      default:
        return 'Service';
    }
  }

  String _getTimeWindowDisplay(String window) {
    switch (window) {
      case 'MORNING':
        return 'Morning (6AM - 12PM)';
      case 'AFTERNOON':
        return 'Afternoon (12PM - 6PM)';
      case 'EVENING':
        return 'Evening (6PM - 10PM)';
      default:
        return window;
    }
  }
}

/// Worker assignment state enum
/// Used to determine what message to show in the UI
enum WorkerState {
  pending, // No availability detected yet
  availableDetected, // Availability detected, waiting for assignment
  assigned, // Worker officially assigned
  failed, // Worker assignment failed - no workers available
}
