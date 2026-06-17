enum OtpStatus { idle, verifying, verified, failed, expired }

class OtpState {
  final String phoneNumber;
  final String otp;
  final OtpStatus status;
  final String? error;
  final int resendTimer;
  final bool? isNewUser;

  const OtpState({
    required this.phoneNumber,
    required this.otp,
    this.status = OtpStatus.idle,
    this.error,
    this.resendTimer = 30,
    this.isNewUser,
  });

  bool get canSubmit => otp.length == 6 && status == OtpStatus.idle;
  bool get canResend => resendTimer == 0 && (status == OtpStatus.expired || status == OtpStatus.failed);
  bool get isVerifying => status == OtpStatus.verifying;
  bool get isExpired => status == OtpStatus.expired;
  bool get isFailed => status == OtpStatus.failed;

  OtpState copyWith({
    String? phoneNumber,
    String? otp,
    OtpStatus? status,
    String? error,
    int? resendTimer,
    bool? isNewUser,
  }) {
    return OtpState(
      phoneNumber: phoneNumber ?? this.phoneNumber,
      otp: otp ?? this.otp,
      status: status ?? this.status,
      error: error,
      resendTimer: resendTimer ?? this.resendTimer,
      isNewUser: isNewUser ?? this.isNewUser,
    );
  }
}