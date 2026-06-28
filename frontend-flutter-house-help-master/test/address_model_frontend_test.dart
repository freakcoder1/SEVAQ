import 'package:flutter_test/flutter_test.dart';
import '../lib/models/address.dart';

// Simple address model tests for frontend-flutter-house-help-master
void main() {
  group('Address Model Frontend Tests', () {
    test('should create Address from valid JSON', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440000',
        'userId': '550e8400-e29b-41d4-a716-446655440001',
        'societyName': 'Test Society',
        'flatNumber': 'A-101',
        'isDefault': true,
      };

      final address = Address.fromJson(json);

      expect(address.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(address.userId, '550e8400-e29b-41d4-a716-446655440001');
      expect(address.societyName, 'Test Society');
      expect(address.isDefault, true);
    });

    test('should parse string coordinates to double', () {
      final json = {
        'id': 'test-id',
        'userId': 'user-id',
        'societyName': 'Geo Test',
        'flatNumber': 'G-1',
        'latitude': '28.5355',
        'longitude': '77.391',
        'isDefault': false,
      };

      final address = Address.fromJson(json);

      expect(address.latitude, 28.5355);
      expect(address.longitude, 77.391);
    });

    test('should serialize to JSON correctly', () {
      final address = Address(
        id: 'test-id',
        userId: 'user-id',
        societyName: 'Serialize Test',
        flatNumber: 'ST-1',
      );

      final json = address.toJson();

      expect(json['id'], 'test-id');
      expect(json['societyName'], 'Serialize Test');
    });

    test('should generate fullAddress correctly', () {
      final address = Address(
        id: 'id',
        userId: 'uid',
        societyName: 'My Society',
        flatNumber: 'A-101',
        towerNumber: 'Tower B',
        city: 'Noida',
        isDefault: false,
      );

      final fullAddress = address.fullAddress;

      expect(fullAddress, contains('Flat A-101'));
      expect(fullAddress, contains('My Society'));
      expect(fullAddress, contains('Noida'));
    });
  });
}
