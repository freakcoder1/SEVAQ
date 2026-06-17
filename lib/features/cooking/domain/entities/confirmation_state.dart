class ConfirmationState {
  final String subscriptionId;
  final String startDate;
  final String timeWindow;
  final String persons;
  final List<String> meals;

  const ConfirmationState({
    required this.subscriptionId,
    required this.startDate,
    required this.timeWindow,
    required this.persons,
    required this.meals,
  });

  ConfirmationState copyWith({
    String? subscriptionId,
    String? startDate,
    String? timeWindow,
    String? persons,
    List<String>? meals,
  }) {
    return ConfirmationState(
      subscriptionId: subscriptionId ?? this.subscriptionId,
      startDate: startDate ?? this.startDate,
      timeWindow: timeWindow ?? this.timeWindow,
      persons: persons ?? this.persons,
      meals: meals ?? this.meals,
    );
  }
}