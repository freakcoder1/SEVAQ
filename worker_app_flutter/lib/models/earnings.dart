class Earnings {
  final double thisMonth;
  final double lastMonth;
  final double todayEarnings;
  final double thisWeek;
  final int completedJobsThisMonth;
  final int completedJobsLastMonth;
  final List<EarningDetail> breakdown;

  Earnings({
    required this.thisMonth,
    required this.lastMonth,
    required this.todayEarnings,
    required this.thisWeek,
    required this.completedJobsThisMonth,
    required this.completedJobsLastMonth,
    required this.breakdown,
  });

  factory Earnings.fromJson(Map<String, dynamic> json) {
    return Earnings(
      thisMonth: (json['thisMonth'] ?? json['currentMonth'] ?? 0).toDouble(),
      lastMonth: (json['lastMonth'] ?? json['previousMonth'] ?? 0).toDouble(),
      todayEarnings: (json['today'] ?? json['todayEarnings'] ?? 0).toDouble(),
      thisWeek: (json['thisWeek'] ?? json['currentWeek'] ?? 0).toDouble(),
      completedJobsThisMonth:
          json['completedJobsThisMonth'] ?? json['jobsThisMonth'] ?? 0,
      completedJobsLastMonth:
          json['completedJobsLastMonth'] ?? json['jobsLastMonth'] ?? 0,
      breakdown: json['breakdown'] != null
          ? (json['breakdown'] as List)
                .map((e) => EarningDetail.fromJson(e))
                .toList()
          : json['earnings'] != null
          ? (json['earnings'] as List)
                .map((e) => EarningDetail.fromJson(e))
                .toList()
          : [],
    );
  }
}

class EarningDetail {
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
      amount: (json['amount'] ?? json['earnings'] ?? 0).toDouble(),
      description: json['description'] ?? json['service'],
      bookingId: json['bookingId']?.toString(),
    );
  }
}
