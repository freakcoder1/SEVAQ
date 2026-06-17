class VerifyOtpResponse {
  final String token;
  final String userId;
  final bool isNewUser;

  const VerifyOtpResponse({
    required this.token,
    required this.userId,
    required this.isNewUser,
  });

  factory VerifyOtpResponse.fromJson(Map<String, dynamic> json) {
    return VerifyOtpResponse(
      token: json['token'] as String? ?? '',
      userId: json['user']?['id'] as String? ?? '',
      isNewUser: json['user']?['newUser'] as bool? ?? false,
    );
  }
}