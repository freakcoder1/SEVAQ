class ABTest {
  final String name;
  final String description;
  final String status;
  final DateTime startDate;
  final DateTime? endDate;
  final Map<String, double> variants;
  final String metric;
  final String hypothesis;

  ABTest({
    required this.name,
    required this.description,
    required this.status,
    required this.startDate,
    this.endDate,
    required this.variants,
    required this.metric,
    required this.hypothesis,
  });

  factory ABTest.fromJson(Map<String, dynamic> json) {
    return ABTest(
      name: json['name'],
      description: json['description'],
      status: json['status'],
      startDate: DateTime.parse(json['startDate']),
      endDate: json['endDate'] != null ? DateTime.parse(json['endDate']) : null,
      variants: Map<String, double>.from(json['variants']),
      metric: json['metric'],
      hypothesis: json['hypothesis'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'name': name,
      'description': description,
      'status': status,
      'startDate': startDate.toIso8601String(),
      'endDate': endDate?.toIso8601String(),
      'variants': variants,
      'metric': metric,
      'hypothesis': hypothesis,
    };
  }
}

class ABTestResult {
  final String testName;
  final String variant;
  final String metric;
  final double value;
  final DateTime timestamp;

  ABTestResult({
    required this.testName,
    required this.variant,
    required this.metric,
    required this.value,
    required this.timestamp,
  });

  factory ABTestResult.fromJson(Map<String, dynamic> json) {
    return ABTestResult(
      testName: json['testName'],
      variant: json['variant'],
      metric: json['metric'],
      value: json['value'],
      timestamp: DateTime.parse(json['timestamp']),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'testName': testName,
      'variant': variant,
      'metric': metric,
      'value': value,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
