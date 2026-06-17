class LoginState {
  final String phoneNumber;
  final bool isLoading;
  final String? error;

  const LoginState({
    required this.phoneNumber,
    this.isLoading = false,
    this.error,
  });

  bool get isValid {
    final phoneRegex = RegExp(r'^[6-9]\d{9}$');
    return phoneRegex.hasMatch(phoneNumber);
  }

  bool get canSubmit => isValid && !isLoading;

  LoginState copyWith({
    String? phoneNumber,
    bool? isLoading,
    String? error,
  }) {
    return LoginState(
      phoneNumber: phoneNumber ?? this.phoneNumber,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}