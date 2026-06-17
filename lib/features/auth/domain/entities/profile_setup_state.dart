class ProfileSetupState {
  final String firstName;
  final String lastName;
  final String email;
  final bool isLoading;
  final String? error;

  const ProfileSetupState({
    this.firstName = '',
    this.lastName = '',
    this.email = '',
    this.isLoading = false,
    this.error,
  });

  bool get canSubmit {
    if (firstName.length < 2 || firstName.length > 50) return false;
    if (lastName.length < 2 || lastName.length > 50) return false;
    if (!_isValidEmail(email)) return false;
    return true;
  }

  bool _isValidEmail(String email) {
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    return email.isNotEmpty && emailRegex.hasMatch(email);
  }

  ProfileSetupState copyWith({
    String? firstName,
    String? lastName,
    String? email,
    bool? isLoading,
    String? error,
  }) {
    return ProfileSetupState(
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }
}