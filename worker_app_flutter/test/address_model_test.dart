import 'package:flutter_test/flutter_test.dart';
import '../lib/models/address.dart';

void main() {
  group('Address Model', () {
    test('should create Address from valid JSON', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440000',
        'userId': '550e8400-e29b-41d4-a716-446655440001',
        'societyName': 'Test Society',
        'towerNumber': 'Tower A',
        'flatNumber': 'A-101',
        'landmark': 'Near park',
        'area': 'Sector 15',
        'city': 'Noida',
        'state': 'Uttar Pradesh',
        'pincode': '201301',
        'latitude': 28.5355,
        'longitude': 77.391,
        'isDefault': true,
        'label': 'Home',
        'createdAt': '2024-01-15T10:00:00.000Z',
        'updatedAt': '2024-01-15T10:00:00.000Z',
      };

      final address = Address.fromJson(json);

      expect(address.id, '550e8400-e29b-41d4-a716-446655440000');
      expect(address.userId, '550e8400-e29b-41d4-a716-446655440001');
      expect(address.societyName, 'Test Society');
      expect(address.flatNumber, 'A-101');
      expect(address.towerNumber, 'Tower A');
      expect(address.landmark, 'Near park');
      expect(address.area, 'Sector 15');
      expect(address.city, 'Noida');
      expect(address.state, 'Uttar Pradesh');
      expect(address.pincode, '201301');
      expect(address.latitude, 28.5355);
      expect(address.longitude, 77.391);
      expect(address.isDefault, true);
      expect(address.label, 'Home');
    });

    test('should handle null optional fields safely', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440002',
        'userId': '550e8400-e29b-41d4-a716-446655440003',
        'societyName': 'Null Test',
        'flatNumber': 'N-1',
        'towerNumber': null,
        'landmark': null,
        'area': null,
        'city': null,
        'state': null,
        'pincode': null,
        'latitude': null,
        'longitude': null,
        'isDefault': false,
        'label': null,
        'createdAt': null,
        'updatedAt': null,
      };

      final address = Address.fromJson(json);

      expect(address.towerNumber, isNull);
      expect(address.landmark, isNull);
      expect(address.area, isNull);
      expect(address.city, isNull);
      expect(address.state, isNull);
      expect(address.pincode, isNull);
      expect(address.latitude, isNull);
      expect(address.longitude, isNull);
      expect(address.createdAt, isNull);
      expect(address.updatedAt, isNull);
    });

    test('should handle missing optional fields as null', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440004',
        'userId': '550e8400-e29b-41d4-a716-446655440005',
        'societyName': 'Missing Fields Test',
        'flatNumber': 'M-1',
      };

      final address = Address.fromJson(json);

      expect(address.towerNumber, isNull);
      expect(address.landmark, isNull);
      expect(address.area, isNull);
      expect(address.city, isNull);
      expect(address.state, isNull);
      expect(address.pincode, isNull);
      expect(address.latitude, isNull);
      expect(address.longitude, isNull);
    });

    test('should convert string numbers to double for latitude/longitude', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440006',
        'userId': '550e8400-e29b-41d4-a716-446655440007',
        'societyName': 'String Number Test',
        'flatNumber': 'S-1',
        'latitude': '28.5355',
        'longitude': '77.391',
        'isDefault': false,
      };

      final address = Address.fromJson(json);

      expect(address.latitude, 28.5355);
      expect(address.longitude, 77.391);
    });

    test('should convert integer to double for latitude/longitude', () {
      final json = {
        'id': '550e8400-e29b-41d4-a716-446655440008',
        'userId': '550e8400-e29b-41d4-a716-446655440009',
        'societyName': 'Integer Test',
        'flatNumber': 'I-1',
        'latitude': 28,
        'longitude': 77,
        'isDefault': false,
      };

      final address = Address.fromJson(json);

      expect(address.latitude, 28.0);
      expect(address.longitude, 77.0);
    });

    test('should serialize to JSON correctly', () {
      final address = Address(
        id: '550e8400-e29b-41d4-a716-446655440010',
        userId: '550e8400-e29b-41d4-a716-446655440011',
        societyName: 'Serialize Test',
        flatNumber: 'ST-1',
        isDefault: true,
      );

      final json = address.toJson();

      expect(json['id'], '550e8400-e29b-41d4-a716-446655440010');
      expect(json['userId'], '550e8400-e29b-41d4-a716-446655440011');
      expect(json['societyName'], 'Serialize Test');
      expect(json['flatNumber'], 'ST-1');
      expect(json['isDefault'], true);
    });

    test('should generate create JSON without id and userId', () {
      final address = Address(
        id: '550e8400-e29b-41d4-a716-446655440012',
        userId: '550e8400-e29b-41d4-a716-446655440013',
        societyName: 'Create JSON Test',
        flatNumber: 'CT-1',
        isDefault: false,
      );

      final createJson = address.toCreateJson();

      expect(createJson.containsKey('id'), false);
      expect(createJson.containsKey('userId'), false);
      expect(createJson['societyName'], 'Create JSON Test');
      expect(createJson['flatNumber'], 'CT-1');
    });

    test('should generate fullAddress correctly', () {
      final address = Address(
        id: 'test-id',
        userId: 'test-user-id',
        societyName: 'My Society',
        flatNumber: 'A-101',
        towerNumber: 'Tower B',
        area: 'Sector 15',
        city: 'Noida',
        isDefault: false,
      );

      final fullAddress = address.fullAddress;

      expect(fullAddress, contains('Flat A-101'));
      expect(fullAddress, contains('Tower B'));
      expect(fullAddress, contains('My Society'));
      expect(fullAddress, contains('Sector 15'));
      expect(fullAddress, contains('Noida'));
    });

    test('should generate shortAddress correctly', () {
      final address = Address(
        id: 'test-id',
        userId: 'test-user-id',
        societyName: 'My Society',
        flatNumber: 'A-101',
        towerNumber: 'Tower B',
        isDefault: false,
      );

      final shortAddress = address.shortAddress;

      expect(shortAddress, contains('Flat A-101'));
      expect(shortAddress, contains('My Society'));
    });
  });
}
