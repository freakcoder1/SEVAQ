import 'user.dart';
import 'service.dart';

class Worker {
  final String id;
  final User user;
  final String bio;
  final double rating;
  final int reviewCount;
  final List<Service> services;

  Worker({
    required this.id,
    required this.user,
    required this.bio,
    required this.rating,
    required this.reviewCount,
    required this.services,
  });

  factory Worker.fromJson(Map<String, dynamic> json) {
    return Worker(
      id: json['id'],
      user: User.fromJson(json['user']),
      bio: json['bio'] ?? '',
      rating: double.parse(json['rating'].toString()),
      reviewCount: json['reviewCount'] ?? 0,
      services: (json['services'] as List)
          .map((s) => Service.fromJson(s))
          .toList(),
    );
  }
}
