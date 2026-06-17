enum ServiceSelection { none, oneTime, subscription }

class ServiceDetailsState {
  final ServiceSelection selectedService;

  const ServiceDetailsState({
    this.selectedService = ServiceSelection.none,
  });

  bool get canContinue => selectedService != ServiceSelection.none;

  ServiceDetailsState copyWith({ServiceSelection? selectedService}) {
    return ServiceDetailsState(
      selectedService: selectedService ?? this.selectedService,
    );
  }
}