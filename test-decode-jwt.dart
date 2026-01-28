import 'dart:convert';
import 'dart:math' as math;

// Helper function to decode JWT token (from API Service)
Map<String, dynamic>? decodeJwt(String token) {
  try {
    final parts = token.split('.');
    if (parts.length != 3) return null;
    var payload = parts[1];

    // Fix padding for base64 URL decoding
    while (payload.length % 4 != 0) {
      payload += '=';
    }

    final decoded = base64Url.decode(payload);
    final json = utf8.decode(decoded);
    return jsonDecode(json);
  } catch (e) {
    print('Error decoding token: $e');
    return null;
  }
}

// Helper function to check if token is expired (from API Service)
bool isTokenExpired(Map<String, dynamic> tokenData) {
  if (!tokenData.containsKey('exp')) return true;
  final exp = tokenData['exp'] as int;
  final currentTime = DateTime.now().millisecondsSinceEpoch / 1000;
  return currentTime > exp;
}

void main() {
  // Test token from frontend
  const String testToken =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4NTYyNCwiZXhwIjoxNzcyMTc3NjI0fQ.q0DQB8Ql1r_RzgClnXiUUbhj7StnFNsYCQvXo_yon_k';

  print('Testing decodeJwt...');
  final decoded = decodeJwt(testToken);
  if (decoded == null) {
    print('❌ decodeJwt returned null');
    return;
  }

  print('✅ decodeJwt successful');
  print('Decoded Token: ${jsonEncode(decoded)}');

  print('\nTesting isTokenExpired...');
  final isExpired = isTokenExpired(decoded);
  print('Token is Expired: $isExpired');

  // Print expiry details
  final exp = decoded['exp'] as int;
  final iat = decoded['iat'] as int;
  final expDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
  final iatDate = DateTime.fromMillisecondsSinceEpoch(iat * 1000);
  final now = DateTime.now();

  print('\nToken Details:');
  print('  Issued At: $iatDate');
  print('  Expires At: $expDate');
  print('  Current Time: $now');
  print('  Time Until Expiry: ${expDate.difference(now)}');

  print('\nTesting token length:');
  print('  Token length: ${testToken.length}');

  // Test API headers
  print('\nTesting Authorization header:');
  final headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer $testToken',
  };
  print('Authorization header: ${headers['Authorization']}');
  print('Authorization header length: ${headers['Authorization']?.length}');
}
