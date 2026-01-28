import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;

// Import the API service
import '../lib/services/api_service.dart';
import '../lib/config/app_config.dart';

// Mock classes
class MockFlutterSecureStorage extends Mock implements FlutterSecureStorage {}

class MockHttpClient extends Mock implements http.Client {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  group('API Connectivity Tests', () {
    late ApiService apiService;
    late MockFlutterSecureStorage mockStorage;
    late MockHttpClient mockHttpClient;

    setUp(() {
      mockStorage = MockFlutterSecureStorage();
      mockHttpClient = MockHttpClient();
      apiService = ApiService();
    });

    test('API base URL is correctly configured', () {
      // Test that the API base URL uses the correct IP and port
      expect(AppConfig.apiBaseUrl, 'http://192.168.1.45:45357/api');
    });

    test('API service uses correct base URL', () {
      // Test that the API service uses the configured base URL
      expect(ApiService.baseUrl, 'http://192.168.1.45:45357/api');
    });

    test('API configuration supports multiple environments', () {
      // Test that different API base URLs are available
      expect(AppConfig.localApiBaseUrl, 'http://localhost:45357/api');
      expect(AppConfig.testApiBaseUrl, 'http://192.168.1.45:45357/api');
      expect(AppConfig.alternativeApiBaseUrl, 'http://192.168.1.45:45357/api');

      // But the main one should be our configured IP and port
      expect(AppConfig.apiBaseUrl, 'http://192.168.1.45:45357/api');
    });
  });
}
