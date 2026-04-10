import 'user.dart';
import 'service.dart';

class Worker {
  // Backend uses UUID (String) for id, but we support both int and String for compatibility
  final dynamic id;
  final String publicId;
  final User user;
  final String bio;
  final double rating;
  final int reviewCount;
  final List<Service> services;
  final bool isAvailable;
  final int yearsOfExperience;
  final int homesServedInArea;
  final bool isVerified;

  Worker({
    required this.id,
    required this.publicId,
    required this.user,
    required this.bio,
    required this.rating,
    required this.reviewCount,
    required this.services,
    this.isAvailable = false,
    this.yearsOfExperience = 0,
    this.homesServedInArea = 0,
    this.isVerified = false,
  });

  factory Worker.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return Worker(
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
        bio: '',
        rating: 0.0,
        reviewCount: 0,
        services: [],
      );
    }

    return Worker(
      id: _parseId(json['id']),
      publicId: json['publicId'] ?? '',
      user: json['user'] != null
          ? User.fromJson(json['user'])
          : User(
              id: 0,
              publicId: '',
              email: '',
              firstName: '',
              lastName: '',
              role: 'worker',
            ),
      bio: json['bio'] ?? '',
      rating: double.tryParse(json['rating'].toString()) ?? 0.0,
      reviewCount: json['reviewCount'] ?? 0,
      services: (json['services'] is List)
          ? (json['services'] as List)
                .where((s) => s != null)
                .map((s) => Service.fromJson(s))
                .toList()
          : [],
      isAvailable: json['isAvailable'] ?? false,
      yearsOfExperience: json['yearsOfExperience'] ?? 0,
      homesServedInArea: json['homesServedInArea'] ?? 0,
      isVerified: json['isVerified'] ?? false,
    );
  }

  /// Helper to parse id from various types (int or String UUID)
  static dynamic _parseId(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return value;
    return 0;
  }
}
