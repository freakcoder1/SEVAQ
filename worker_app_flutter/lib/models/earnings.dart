class Earnings {
  // Helper method to parse double from various types
  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }

  final double thisMonth;
  final double lastMonth;
  final double todayEarnings;
  final double thisWeek;
  final double totalEarnings;
  final double pendingPayments;
  final int completedJobsThisMonth;
  final int completedJobsLastMonth;
  final List<EarningDetail> breakdown;

  Earnings({
    required this.thisMonth,
    required this.lastMonth,
    required this.todayEarnings,
    required this.thisWeek,
    required this.totalEarnings,
    required this.pendingPayments,
    required this.completedJobsThisMonth,
    required this.completedJobsLastMonth,
    required this.breakdown,
  });

  factory Earnings.fromJson(Map<String, dynamic> json) {
    return Earnings(
      thisMonth: _parseDouble(
          json['thisMonth'] ?? json['currentMonth'] ?? json['this_month'] ?? 0),
      lastMonth: _parseDouble(json['lastMonth'] ??
          json['previousMonth'] ??
          json['last_month'] ??
          0),
      todayEarnings: _parseDouble(json['today'] ??
          json['todayEarnings'] ??
          json['today_earnings'] ??
          0),
      thisWeek: _parseDouble(
          json['thisWeek'] ?? json['currentWeek'] ?? json['this_week'] ?? 0),
      totalEarnings:
          _parseDouble(json['totalEarnings'] ?? json['total_earnings'] ?? 0),
      pendingPayments: _parseDouble(
          json['pendingPayments'] ?? json['pending_payments'] ?? 0),
      completedJobsThisMonth: _parseDouble(json['completedJobs'] ??
              json['completedJobsThisMonth'] ??
              json['jobsThisMonth'] ??
              json['completed_jobs'] ??
              0)
          .toInt(),
      completedJobsLastMonth: _parseDouble(json['completedJobsLastMonth'] ??
              json['jobsLastMonth'] ??
              json['completed_jobs_last_month'] ??
              0)
          .toInt(),
      breakdown: json['breakdown'] != null
          ? (json['breakdown'] as List)
              .map((e) => EarningDetail.fromJson(e as Map<String, dynamic>))
              .toList()
          : json['earnings'] != null
              ? (json['earnings'] as List)
                  .map((e) => EarningDetail.fromJson(e as Map<String, dynamic>))
                  .toList()
              : json['transactions'] != null
                  ? (json['transactions'] as List)
                      .map((e) =>
                          EarningDetail.fromJson(e as Map<String, dynamic>))
                      .toList()
                  : [],
    );
  }
}

class EarningDetail {
  // Helper method to parse double from various types
  static double _parseDouble(dynamic value) {
    if (value == null) return 0.0;
    if (value is double) return value;
    if (value is int) return value.toDouble();
    if (value is String) {
      return double.tryParse(value) ?? 0.0;
    }
    return 0.0;
  }

  final String date;
  final double amount;
  final String? description;
  final String? bookingId;

  EarningDetail({
    required this.date,
    required this.amount,
    this.description,
    this.bookingId,
  });

  factory EarningDetail.fromJson(Map<String, dynamic> json) {
    return EarningDetail(
      date: json['date'] ?? json['day'] ?? '',
      amount: _parseDouble(json['amount'] ?? json['earnings'] ?? 0),
      description: json['description'] ?? json['service'],
      bookingId: json['bookingId']?.toString(),
    );
  }
}
