class HomeState {
  final String userName;
  final String? nextBookingType;
  final String? nextBookingDate;
  final String? nextBookingTime;
  final String? assignedProfessional;
  final int activeServiceCount;
  final int subscriptionCount;
  final bool hasActivePlan;
  final String? subscriptionPlanName;
  final String? nextVisit;
  final String? renewalDate;
  final bool isLoading;
  final String? error;

  const HomeState({
    this.userName = '',
    this.nextBookingType,
    this.nextBookingDate,
    this.nextBookingTime,
    this.assignedProfessional,
    this.activeServiceCount = 0,
    this.subscriptionCount = 0,
    this.hasActivePlan = false,
    this.subscriptionPlanName,
    this.nextVisit,
    this.renewalDate,
    this.isLoading = false,
    this.error,
  });

  bool get hasUpcomingService => nextBookingType != null;

  HomeState copyWith({
    String? userName,
    String? nextBookingType,
    String? nextBookingDate,
    String? nextBookingTime,
    String? assignedProfessional,
    int? activeServiceCount,
    int? subscriptionCount,
    bool? hasActivePlan,
    String? subscriptionPlanName,
    String? nextVisit,
    String? renewalDate,
    bool? isLoading,
    String? error,
  }) {
    return HomeState(
      userName: userName ?? this.userName,
      nextBookingType: nextBookingType ?? this.nextBookingType,
      nextBookingDate: nextBookingDate ?? this.nextBookingDate,
      nextBookingTime: nextBookingTime ?? this.nextBookingTime,
      assignedProfessional: assignedProfessional ?? this.assignedProfessional,
      activeServiceCount: activeServiceCount ?? this.activeServiceCount,
      subscriptionCount: subscriptionCount ?? this.subscriptionCount,
      hasActivePlan: hasActivePlan ?? this.hasActivePlan,
      subscriptionPlanName: subscriptionPlanName ?? this.subscriptionPlanName,
      nextVisit: nextVisit ?? this.nextVisit,
      renewalDate: renewalDate ?? this.renewalDate,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}