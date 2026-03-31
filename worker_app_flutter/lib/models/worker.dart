class Worker {
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

  final String id;
  final String name;
  final String phone;
  final String? profileImage;
  final bool isAvailable;
  final List<String> services;
  final double rating;
  final int totalJobs;
  final String? location;

  Worker({
    required this.id,
    required this.name,
    required this.phone,
    this.profileImage,
    required this.isAvailable,
    required this.services,
    required this.rating,
    required this.totalJobs,
    this.location,
  });

  factory Worker.fromJson(Map<String, dynamic> json) {
    // Handle nested 'user' object from backend
    Map<String, dynamic> userData =
        json['user'] is Map ? Map<String, dynamic>.from(json['user']) : json;

    // Build name from firstName and lastName
    String fullName = '';
    if (userData['firstName'] != null || userData['lastName'] != null) {
      fullName =
          '${userData['firstName'] ?? ''} ${userData['lastName'] ?? ''}'.trim();
    } else {
      fullName = json['name'] ?? userData['name'] ?? '';
    }

    // Handle services - could be List of strings or List of objects
    List<String> parsedServices = [];
    if (json['services'] != null) {
      final servicesList = json['services'];
      if (servicesList is List) {
        for (var service in servicesList) {
          if (service is Map) {
            // Service is an object, extract name or id
            parsedServices.add(
                service['name']?.toString() ?? service['id']?.toString() ?? '');
          } else if (service is String) {
            parsedServices.add(service);
          }
        }
      }
    } else if (json['serviceCategories'] != null) {
      parsedServices = List<String>.from(json['serviceCategories']);
    }

    // Handle location - could be a Map (nested location data) or String
    String? parsedLocation;
    final locationValue = json['location'] ?? json['serviceArea'];
    if (locationValue != null) {
      if (locationValue is String) {
        parsedLocation = locationValue;
      } else if (locationValue is Map) {
        // Extract address or name from location object
        parsedLocation = locationValue['address']?.toString() ??
            locationValue['name']?.toString();
      }
    }

    // Handle totalJobs - ensure it's an int
    int parsedTotalJobs = 0;
    final totalJobsValue =
        json['totalJobs'] ?? json['jobsCompleted'] ?? json['completedJobs'];
    if (totalJobsValue is int) {
      parsedTotalJobs = totalJobsValue;
    } else if (totalJobsValue is String) {
      parsedTotalJobs = int.tryParse(totalJobsValue) ?? 0;
    }

    return Worker(
      id: json['id']?.toString() ??
          json['publicId']?.toString() ??
          userData['id']?.toString() ??
          '',
      name: fullName,
      phone: json['phone'] ?? json['phoneNumber'] ?? userData['phone'] ?? '',
      profileImage: json['profileImage'] ??
          json['profileImageUrl'] ??
          userData['photoUrl'],
      isAvailable: json['isAvailable'] ?? json['availability'] ?? false,
      services: parsedServices,
      rating: _parseDouble(json['rating'] ?? json['averageRating'] ?? 0),
      totalJobs: parsedTotalJobs,
      location: parsedLocation,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'phone': phone,
      'profileImage': profileImage,
      'isAvailable': isAvailable,
      'services': services,
      'rating': rating,
      'totalJobs': totalJobs,
      'location': location,
    };
  }
}
