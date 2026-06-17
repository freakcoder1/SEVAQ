import 'dart:async';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/api_client.dart';
import '../data/auth_repository.dart';
import '../domain/entities/login_state.dart';
import '../domain/entities/otp_state.dart';

final apiClientProvider = Provider<ApiClient>((ref) {
  return ApiClient();
});

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepository(ref.read(apiClientProvider));
});

final loginProvider = StateNotifierProvider<LoginNotifier, LoginState>((ref) {
  return LoginNotifier(ref);
});

final otpProvider = StateNotifierProvider<OtpNotifier, OtpState>((ref) {
  return OtpNotifier(ref);
});

class LoginNotifier extends StateNotifier<LoginState> {
  LoginNotifier(this.ref) : super(const LoginState(phoneNumber: ''));

  final Ref ref;

  void setPhoneNumber(String phone) {
    state = state.copyWith(phoneNumber: phone, error: null);
  }

  Future<void> login() async {
    if (!state.canSubmit) return;

    state = state.copyWith(isLoading: true, error: null);

    try {
      final success = await ref.read(authRepositoryProvider).sendOtp(state.phoneNumber);
      if (!success) {
        state = state.copyWith(isLoading: false, error: 'Failed to send OTP');
      }
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  void clearError() {
    state = state.copyWith(error: null);
  }
}

class OtpNotifier extends StateNotifier<OtpState> {
  OtpNotifier(this.ref) : super(const OtpState(phoneNumber: '', otp: ''));

  final Ref ref;
  Timer? _debounceTimer;
  Timer? _resendTimer;

  void initialize(String phoneNumber) {
    state = const OtpState(phoneNumber: '', otp: '').copyWith(
      phoneNumber: phoneNumber,
    );
    _startResendTimer();
  }

  void setOtp(String otp) {
    state = state.copyWith(otp: otp, error: null);

    if (otp.length == 6 && _debounceTimer == null) {
      _debounceTimer = Timer(const Duration(milliseconds: 150), () {
        _debounceTimer = null;
        verifyOtp();
      });
    }
  }

  Future<void> verifyOtp() async {
    if (!state.canSubmit) return;

    _debounceTimer?.cancel();
    _debounceTimer = null;

    state = state.copyWith(status: OtpStatus.verifying, error: null);

    try {
      final response = await ref.read(authRepositoryProvider).verifyOtp(state.phoneNumber, state.otp);
      state = state.copyWith(status: OtpStatus.verified, isNewUser: response.isNewUser);
    } catch (e) {
      state = state.copyWith(status: OtpStatus.failed, error: 'Invalid code. Please try again.');
    }
  }

  Future<void> resendOtp() async {
    if (!state.canResend) return;

    state = state.copyWith(resendTimer: 30);

    try {
      await ref.read(authRepositoryProvider).sendOtp(state.phoneNumber);
      _startResendTimer();
    } catch (e) {
      state = state.copyWith(error: 'Failed to resend OTP');
    }
  }

  void _startResendTimer() {
    _resendTimer?.cancel();
    _resendTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (state.resendTimer <= 1) {
        timer.cancel();
        _resendTimer = null;
        state = state.copyWith(
          resendTimer: 0,
          status: OtpStatus.expired,
        );
      } else {
        state = state.copyWith(resendTimer: state.resendTimer - 1);
      }
    });
  }

  void clearError() {
    state = state.copyWith(error: null);
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    _resendTimer?.cancel();
    super.dispose();
  }
}