import 'user.dart';
import 'service.dart';

class Worker {
  final int id;
  final String publicId;
  final User user;
  final String bio;
  final double rating;
  final int reviewCount;
  final List<Service> services;

  Worker({
    required this.id,
    required this.publicId,
    required this.user,
    required this.bio,
    required this.rating,
    required this.reviewCount,
    required this.services,
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
      id: json['id'] as int? ?? 0,
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
    );
  }
}
