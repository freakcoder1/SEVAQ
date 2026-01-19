enum AlertLevel { info, warning, error, critical }

class Alert {
  final String id;
  final String message;
  final AlertLevel level;
  final DateTime timestamp;
  final String source;
  final bool resolved;

  Alert({
    required this.id,
    required this.message,
    required this.level,
    required this.timestamp,
    required this.source,
    required this.resolved,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'] ?? '',
      message: json['message'] ?? '',
      level: AlertLevel.values.firstWhere(
        (e) => e.name == json['level'],
        orElse: () => AlertLevel.info,
      ),
      timestamp: DateTime.parse(json['timestamp']),
      source: json['source'] ?? '',
      resolved: json['resolved'] ?? false,
    );
  }
}
