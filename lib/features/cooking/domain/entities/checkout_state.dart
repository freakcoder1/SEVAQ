enum PaymentMethod { upi, creditDebitCard }

class CheckoutState {
  final PaymentMethod? selectedPaymentMethod;
  final bool isCreatingOrder;
  final String? error;

  const CheckoutState({
    this.selectedPaymentMethod,
    this.isCreatingOrder = false,
    this.error,
  });

  bool get canComplete => selectedPaymentMethod != null && !isCreatingOrder;

  CheckoutState copyWith({
    PaymentMethod? selectedPaymentMethod,
    bool? isCreatingOrder,
    String? error,
  }) {
    return CheckoutState(
      selectedPaymentMethod: selectedPaymentMethod ?? this.selectedPaymentMethod,
      isCreatingOrder: isCreatingOrder ?? this.isCreatingOrder,
      error: error,
    );
  }
}