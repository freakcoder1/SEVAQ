class Slot {
  final String id;
  final String workerId;
  final DateTime startTime;
  final DateTime endTime;
  final bool isBooked;

  Slot({
    required this.id,
    required this.workerId,
    required this.startTime,
    required this.endTime,
    required this.isBooked,
  });

  factory Slot.fromJson(Map<String, dynamic> json) {
    return Slot(
      id: json['id'],
      workerId: json['worker'] is Map ? json['worker']['id'] : json['worker'],
      startTime: DateTime.parse(json['startTime']),
      endTime: DateTime.parse(json['endTime']),
      isBooked: json['isBooked'] ?? false,
    );
  }
}
