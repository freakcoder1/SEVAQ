class Worker {
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
    Map<String, dynamic> userData = json['user'] ?? json;

    // Build name from firstName and lastName
    String fullName = '';
    if (userData['firstName'] != null || userData['lastName'] != null) {
      fullName =
          '${userData['firstName'] ?? ''} ${userData['lastName'] ?? ''}'.trim();
    } else {
      fullName = json['name'] ?? userData['name'] ?? '';
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
      services: json['services'] != null
          ? List<String>.from(json['services'])
          : json['serviceCategories'] != null
              ? List<String>.from(json['serviceCategories'])
              : [],
      rating: (json['rating'] ?? json['averageRating'] ?? 0).toDouble(),
      totalJobs: json['totalJobs'] ??
          json['jobsCompleted'] ??
          json['completedJobs'] ??
          0,
      location: json['location'] ?? json['serviceArea'],
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
