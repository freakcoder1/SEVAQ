import 'user.dart';
import 'worker.dart';

class Review {
  final int id;
  final int rating;
  final String? comment;
  final User user;
  final Worker? worker;
  final int userId;
  final int workerId;

  Review({
    required this.id,
    required this.rating,
    this.comment,
    required this.user,
    this.worker,
    required this.userId,
    required this.workerId,
  });

  factory Review.fromJson(Map<String, dynamic> json) {
    return Review(
      id: json['id'],
      rating: json['rating'],
      comment: json['comment'],
      user: User.fromJson(json['user']),
      worker: json['worker'] != null ? Worker.fromJson(json['worker']) : null,
      userId: json['userId'],
      workerId: json['workerId'],
    );
  }

}