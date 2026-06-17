import 'checkout_state.dart';

enum PaymentStatus { idle, processing, success, failed }

class PaymentState {
  final String orderId;
  final PaymentMethod paymentMethod;
  final PaymentStatus status;
  final String? gatewayReference;
  final String? error;

  const PaymentState({
    required this.orderId,
    required this.paymentMethod,
    this.status = PaymentStatus.idle,
    this.gatewayReference,
    this.error,
  });

  bool get isProcessing => status == PaymentStatus.processing;
  bool get canRetry => status == PaymentStatus.failed;
  bool get isSuccess => status == PaymentStatus.success;

  PaymentState copyWith({
    PaymentStatus? status,
    String? gatewayReference,
    String? error,
  }) {
    return PaymentState(
      orderId: orderId,
      paymentMethod: paymentMethod,
      status: status ?? this.status,
      gatewayReference: gatewayReference ?? this.gatewayReference,
      error: error,
    );
  }
}