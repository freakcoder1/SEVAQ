import 'user.dart';
import 'worker.dart';
import 'service.dart';

enum BookingStatus { pending, confirmed, cancelled, completed }

class Booking {
  final String id;
  final User user;
  final Worker worker;
  final Service service;
  final DateTime startTime;
  final DateTime endTime;
  final BookingStatus status;
  final bool isPaid;

  Booking({
    required this.id,
    required this.user,
    required this.worker,
    required this.service,
    required this.startTime,
    required this.endTime,
    required this.status,
    required this.isPaid,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id'],
      user: User.fromJson(json['user']),
      worker: Worker.fromJson(json['worker']),
      service: Service.fromJson(json['service']),
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      status: BookingStatus.values.firstWhere(
        (e) => e.toString().split('.').last == json['status'],
        orElse: () => BookingStatus.pending,
      ),
      isPaid: json['isPaid'] ?? false,
    );
  }
}
