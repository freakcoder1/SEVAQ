import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../domain/entities/service_details_state.dart';
import '../domain/entities/subscription_config_state.dart';
import '../domain/entities/subscription_schedule_state.dart';
import '../domain/entities/checkout_state.dart';
import '../domain/entities/payment_state.dart';
import '../domain/entities/confirmation_state.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

class CookingState {
  final ServiceDetailsState serviceState;
  final SubscriptionConfigState configState;
  final SubscriptionScheduleState scheduleState;
  final CheckoutState checkoutState;
  final PaymentState? paymentState;
  final ConfirmationState? confirmationState;

  const CookingState({
    this.serviceState = const ServiceDetailsState(),
    this.configState = const SubscriptionConfigState(),
    this.scheduleState = const SubscriptionScheduleState(),
    this.checkoutState = const CheckoutState(),
    this.paymentState,
    this.confirmationState,
  });

  CookingState copyWith({
    ServiceDetailsState? serviceState,
    SubscriptionConfigState? configState,
    SubscriptionScheduleState? scheduleState,
    CheckoutState? checkoutState,
    PaymentState? paymentState,
    ConfirmationState? confirmationState,
  }) {
    return CookingState(
      serviceState: serviceState ?? this.serviceState,
      configState: configState ?? this.configState,
      scheduleState: scheduleState ?? this.scheduleState,
      checkoutState: checkoutState ?? this.checkoutState,
      paymentState: paymentState ?? this.paymentState,
      confirmationState: confirmationState ?? this.confirmationState,
    );
  }
}

final cookingProvider = StateNotifierProvider<CookingNotifier, CookingState>((ref) {
  return CookingNotifier(ref);
});

class CookingNotifier extends StateNotifier<CookingState> {
  CookingNotifier(this.ref) : super(const CookingState());

  final Ref ref;

  void selectService(ServiceSelection selection) {
    state = state.copyWith(
      serviceState: state.serviceState.copyWith(selectedService: selection),
    );
  }

  void setPersons(int persons) {
    state = state.copyWith(
      configState: state.configState.copyWith(persons: persons),
    );
  }

  void toggleMeal(MealType meal) {
    final currentMeals = List<MealType>.from(state.configState.selectedMeals);
    if (currentMeals.contains(meal)) {
      currentMeals.remove(meal);
    } else {
      currentMeals.add(meal);
    }
    state = state.copyWith(
      configState: state.configState.copyWith(selectedMeals: currentMeals),
    );
  }

  void setStartDate(StartDateOption startDate) {
    state = state.copyWith(
      scheduleState: state.scheduleState.copyWith(startDate: startDate),
    );
  }

  void setCustomDate(DateTime date) {
    state = state.copyWith(
      scheduleState: state.scheduleState.copyWith(
        startDate: StartDateOption.custom,
        customDate: date,
      ),
    );
  }

  void setTimeWindow(TimeWindow timeWindow) {
    state = state.copyWith(
      scheduleState: state.scheduleState.copyWith(timeWindow: timeWindow),
    );
  }

  void setPaymentMethod(PaymentMethod method) {
    state = state.copyWith(
      checkoutState: state.checkoutState.copyWith(
        selectedPaymentMethod: method,
        error: null,
      ),
    );
  }

  void createOrder() {
    state = state.copyWith(
      checkoutState: state.checkoutState.copyWith(
        isCreatingOrder: true,
        error: null,
      ),
    );
  }

  void setError(String error) {
    state = state.copyWith(
      checkoutState: state.checkoutState.copyWith(
        isCreatingOrder: false,
        error: error,
      ),
    );
  }

  void initiatePayment() {
    final method = state.checkoutState.selectedPaymentMethod;
    if (method == null) return;

    state = state.copyWith(
      paymentState: const PaymentState(
        orderId: '12345',
        paymentMethod: PaymentMethod.upi,
      ),
    );
  }

  void setPaymentSuccess(String gatewayReference) {
    state = state.copyWith(
      paymentState: state.paymentState!.copyWith(
        status: PaymentStatus.success,
        gatewayReference: gatewayReference,
      ),
    );
  }

  void setPaymentFailure(String error) {
    state = state.copyWith(
      paymentState: state.paymentState!.copyWith(
        status: PaymentStatus.failed,
        error: error,
      ),
    );
  }

  void setConfirmation(ConfirmationState confirmation) {
    state = state.copyWith(confirmationState: confirmation);
  }
}