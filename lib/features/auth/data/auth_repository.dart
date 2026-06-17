import '../../../core/network/api_client.dart';
import '../domain/entities/verify_otp_response.dart';

extension AuthApi on ApiClient {
  Future<Map<String, dynamic>> sendOtp(String phone) async {
    return await post('auth/send-otp', {'phone': phone});
  }

  Future<Map<String, dynamic>> verifyOtp(String phone, String otp) async {
    return await post('auth/verify-otp', {'phone': phone, 'otp': otp});
  }
}

class AuthRepository {
  final ApiClient _api;

  AuthRepository(this._api);

  Future<bool> sendOtp(String phone) async {
    try {
      final response = await _api.sendOtp(phone);
      return response['success'] == true;
    } catch (e) {
      throw Exception('Failed to send OTP: $e');
    }
  }

  Future<VerifyOtpResponse> verifyOtp(String phone, String otp) async {
    final response = await _api.verifyOtp(phone, otp);
    return VerifyOtpResponse.fromJson(response);
  }
}