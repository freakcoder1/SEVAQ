class ReviewPlanState {
  final double monthlyCost;
  final double? setupFee;

  const ReviewPlanState({
    required this.monthlyCost,
    this.setupFee,
  });

  bool get canContinue => true;

  ReviewPlanState copyWith({double? monthlyCost, double? setupFee}) {
    return ReviewPlanState(
      monthlyCost: monthlyCost ?? this.monthlyCost,
      setupFee: setupFee ?? this.setupFee,
    );
  }
}