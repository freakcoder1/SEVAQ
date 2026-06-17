enum StartDateOption { today, tomorrow, custom }

class TimeWindow {
  final String label;
  final String range;

  const TimeWindow(this.label, this.range);
}

class TimeWindows {
  static const morning = TimeWindow('Morning', '6 AM – 9 AM');
  static const daytime = TimeWindow('Daytime', '9 AM – 1 PM');
  static const afternoon = TimeWindow('Afternoon', '1 PM – 5 PM');
  static const evening = TimeWindow('Evening', '5 PM – 8 PM');
  static const all = [morning, daytime, afternoon, evening];
}

class SubscriptionScheduleState {
  final StartDateOption startDate;
  final DateTime? customDate;
  final TimeWindow? timeWindow;

  const SubscriptionScheduleState({
    this.startDate = StartDateOption.today,
    this.customDate,
    this.timeWindow,
  });

  bool get selectedStartDateIsValid =>
    startDate != StartDateOption.custom || customDate != null;

  bool get canContinue =>
    selectedStartDateIsValid &&
    timeWindow != null;

  SubscriptionScheduleState copyWith({
    StartDateOption? startDate,
    DateTime? customDate,
    TimeWindow? timeWindow,
  }) {
    return SubscriptionScheduleState(
      startDate: startDate ?? this.startDate,
      customDate: customDate ?? this.customDate,
      timeWindow: timeWindow ?? this.timeWindow,
    );
  }
}