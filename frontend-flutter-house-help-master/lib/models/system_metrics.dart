class SystemMetrics {
  final double cpuUsage;
  final double memoryUsage;
  final double diskUsage;
  final double networkIn;
  final double networkOut;
  final List<SystemMetricsPoint> historicalData;

  SystemMetrics({
    required this.cpuUsage,
    required this.memoryUsage,
    required this.diskUsage,
    required this.networkIn,
    required this.networkOut,
    required this.historicalData,
  });

  factory SystemMetrics.fromJson(Map<String, dynamic> json) {
    return SystemMetrics(
      cpuUsage: json['cpuUsage']?.toDouble() ?? 0.0,
      memoryUsage: json['memoryUsage']?.toDouble() ?? 0.0,
      diskUsage: json['diskUsage']?.toDouble() ?? 0.0,
      networkIn: json['networkIn']?.toDouble() ?? 0.0,
      networkOut: json['networkOut']?.toDouble() ?? 0.0,
      historicalData:
          (json['historicalData'] as List<dynamic>?)
              ?.map((e) => SystemMetricsPoint.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class SystemMetricsPoint {
  final DateTime timestamp;
  final double cpuUsage;
  final double memoryUsage;
  final double diskUsage;
  final double networkIn;
  final double networkOut;

  SystemMetricsPoint({
    required this.timestamp,
    required this.cpuUsage,
    required this.memoryUsage,
    required this.diskUsage,
    required this.networkIn,
    required this.networkOut,
  });

  factory SystemMetricsPoint.fromJson(Map<String, dynamic> json) {
    return SystemMetricsPoint(
      timestamp: DateTime.parse(json['timestamp']),
      cpuUsage: json['cpuUsage']?.toDouble() ?? 0.0,
      memoryUsage: json['memoryUsage']?.toDouble() ?? 0.0,
      diskUsage: json['diskUsage']?.toDouble() ?? 0.0,
      networkIn: json['networkIn']?.toDouble() ?? 0.0,
      networkOut: json['networkOut']?.toDouble() ?? 0.0,
    );
  }
}
