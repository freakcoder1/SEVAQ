import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() async {
  // Test 1: Check secure storage
  final secureStorage = FlutterSecureStorage();
  final tokenFromSecureStorage = await secureStorage.read(key: 'jwt_token');
  final userIdFromSecureStorage = await secureStorage.read(key: 'user_id');

  print('=== Secure Storage ===');
  print('Token exists: ${tokenFromSecureStorage != null}');
  if (tokenFromSecureStorage != null) {
    print('Token length: ${tokenFromSecureStorage.length}');
    print('Token starts with: ${tokenFromSecureStorage.substring(0, 20)}...');
  }
  print('User ID exists: ${userIdFromSecureStorage != null}');
  if (userIdFromSecureStorage != null) {
    print('User ID: $userIdFromSecureStorage');
  }

  print('---');

  // Test 2: Check shared preferences
  final prefs = await SharedPreferences.getInstance();
  final tokenFromPrefs = prefs.getString('jwt_token');
  final userIdFromPrefs = prefs.getString('user_id');
  final cachedUserFromPrefs = prefs.getString('cached_user');

  print('=== Shared Preferences ===');
  print('Token exists: ${tokenFromPrefs != null}');
  if (tokenFromPrefs != null) {
    print('Token length: ${tokenFromPrefs.length}');
    print('Token starts with: ${tokenFromPrefs.substring(0, 20)}...');
  }
  print('User ID exists: ${userIdFromPrefs != null}');
  if (userIdFromPrefs != null) {
    print('User ID: $userIdFromPrefs');
  }
  print('Cached user exists: ${cachedUserFromPrefs != null}');
  if (cachedUserFromPrefs != null) {
    print('Cached user length: ${cachedUserFromPrefs.length}');
  }

  print('---');

  // Test 3: Compare tokens if both exist
  if (tokenFromSecureStorage != null && tokenFromPrefs != null) {
    print('=== Token Comparison ===');
    print('Tokens match: ${tokenFromSecureStorage == tokenFromPrefs}');
    if (tokenFromSecureStorage != tokenFromPrefs) {
      print('Secure storage token: ${tokenFromSecureStorage}');
      print('Shared preferences token: ${tokenFromPrefs}');
    }
  }

  print('---');

  // Test 4: Test writing and reading to secure storage
  if (tokenFromSecureStorage == null) {
    print('=== Writing Test Token ===');
    const testToken =
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InRlc3QudXNlcjFAZXhhbXBsZS5jb20iLCJzdWIiOjE4LCJyb2xlIjoidXNlciIsImlhdCI6MTc2OTU4NTYyNCwiZXhwIjoxNzcyMTc3NjI0fQ.q0DQB8Ql1r_RzgClnXiUUbhj7StnFNsYCQvXo_yon_k';
    const testUserId = '18';

    await secureStorage.write(key: 'jwt_token', value: testToken);
    await secureStorage.write(key: 'user_id', value: testUserId);

    print('Test token written');

    final readToken = await secureStorage.read(key: 'jwt_token');
    final readUserId = await secureStorage.read(key: 'user_id');

    print('Read token matches: ${readToken == testToken}');
    print('Read user id matches: ${readUserId == testUserId}');
  }

  print('---');

  // Test 5: Check if we can read what we just wrote
  final finalToken = await secureStorage.read(key: 'jwt_token');
  final finalUserId = await secureStorage.read(key: 'user_id');

  print('=== Final Check ===');
  print('Token exists: ${finalToken != null}');
  if (finalToken != null) {
    print('Token length: ${finalToken.length}');
    print('Token starts with: ${finalToken.substring(0, 20)}...');
  }
  print('User ID exists: ${finalUserId != null}');
  if (finalUserId != null) {
    print('User ID: $finalUserId');
  }
}
