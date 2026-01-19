class DatabaseMetrics {
  final int activeConnections;
  final double avgQueryTime;
  final int totalQueries;
  final double diskUsage;
  final List<DatabaseMetricsPoint> historicalData;

  DatabaseMetrics({
    required this.activeConnections,
    required this.avgQueryTime,
    required this.totalQueries,
    required this.diskUsage,
    required this.historicalData,
  });

  factory DatabaseMetrics.fromJson(Map<String, dynamic> json) {
    return DatabaseMetrics(
      activeConnections: json['activeConnections'] ?? 0,
      avgQueryTime: json['avgQueryTime']?.toDouble() ?? 0.0,
      totalQueries: json['totalQueries'] ?? 0,
      diskUsage: json['diskUsage']?.toDouble() ?? 0.0,
      historicalData:
          (json['historicalData'] as List<dynamic>?)
              ?.map((e) => DatabaseMetricsPoint.fromJson(e))
              .toList() ??
          [],
    );
  }
}

class DatabaseMetricsPoint {
  final DateTime timestamp;
  final int activeConnections;
  final double avgQueryTime;
  final int totalQueries;
  final double diskUsage;

  DatabaseMetricsPoint({
    required this.timestamp,
    required this.activeConnections,
    required this.avgQueryTime,
    required this.totalQueries,
    required this.diskUsage,
  });

  factory DatabaseMetricsPoint.fromJson(Map<String, dynamic> json) {
    return DatabaseMetricsPoint(
      timestamp: DateTime.parse(json['timestamp']),
      activeConnections: json['activeConnections'] ?? 0,
      avgQueryTime: json['avgQueryTime']?.toDouble() ?? 0.0,
      totalQueries: json['totalQueries'] ?? 0,
      diskUsage: json['diskUsage']?.toDouble() ?? 0.0,
    );
  }
}
