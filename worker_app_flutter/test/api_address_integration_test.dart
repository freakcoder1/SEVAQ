import 'package:flutter_test/flutter_test.dart';
import '../lib/models/address.dart';

void main() {
  group('ApiService Address Integration', () {
    test('should serialize address for API POST request', () {
      final address = Address(
        id: '',
        userId: '550e8400-e29b-41d4-a716-446655440000',
        societyName: 'Integration Test Society',
        flatNumber: 'IT-101',
        towerNumber: 'Tower X',
        landmark: 'Near main gate',
        area: 'Sector 99',
        city: 'Noida',
        state: 'UP',
        pincode: '201301',
        latitude: 28.5355,
        longitude: 77.391,
        isDefault: true,
        label: 'Work',
      );

      final requestBody = address.toCreateJson();

      expect(requestBody['societyName'], 'Integration Test Society');
      expect(requestBody['flatNumber'], 'IT-101');
      expect(requestBody['towerNumber'], 'Tower X');
      expect(requestBody['landmark'], 'Near main gate');
      expect(requestBody['area'], 'Sector 99');
      expect(requestBody['city'], 'Noida');
      expect(requestBody['state'], 'UP');
      expect(requestBody['pincode'], '201301');
      expect(requestBody['latitude'], 28.5355);
      expect(requestBody['longitude'], 77.391);
      expect(requestBody['isDefault'], true);
      expect(requestBody['label'], 'Work');

      final addressWithoutOptionals = Address(
        id: 'id-1',
        userId: 'user-1',
        societyName: 'Min Address',
        flatNumber: 'M-1',
        isDefault: false,
      );

      final minRequestBody = addressWithoutOptionals.toCreateJson();
      expect(minRequestBody['societyName'], 'Min Address');
      expect(minRequestBody['flatNumber'], 'M-1');
    });

    test('should deserialize API response to Address model', () {
      final apiResponse = {
        'id': '550e8400-e29b-41d4-a716-446655440001',
        'userId': '550e8400-e29b-41d4-a716-446655440002',
        'societyName': 'API Response Society',
        'flatNumber': 'API-1',
        'towerNumber': 'Tower API',
        'landmark': 'API Landmark',
        'area': 'Sector API',
        'city': 'Noida',
        'state': 'Uttar Pradesh',
        'pincode': '201301',
        'latitude': 28.5355,
        'longitude': 77.391,
        'isDefault': true,
        'label': 'API Label',
        'createdAt': '2024-01-15T10:00:00.000Z',
        'updatedAt': '2024-01-15T10:00:00.000Z',
      };

      final address = Address.fromJson(apiResponse);

      expect(address.id, '550e8400-e29b-41d4-a716-446655440001');
      expect(address.userId, '550e8400-e29b-41d4-a716-446655440002');
      expect(address.societyName, 'API Response Society');
      expect(address.flatNumber, 'API-1');
      expect(address.isDefault, true);
      expect(address.createdAt, isNotNull);
      expect(address.updatedAt, isNotNull);
    });

    test('should handle empty list response for addresses', () {
      final emptyList = <Address>[];
      expect(emptyList, isEmpty);
      
      final emptyJsonList = [];
      final parsed = emptyJsonList.map((e) => Address.fromJson(e)).toList();
      expect(parsed, isEmpty);
    });

    test('should handle multiple addresses list from API', () {
      final multipleAddressesJson = [
        {
          'id': 'addr-1',
          'userId': 'user-1',
          'societyName': 'Society 1',
          'flatNumber': 'A-1',
          'isDefault': false,
        },
        {
          'id': 'addr-2',
          'userId': 'user-1',
          'societyName': 'Society 2',
          'flatNumber': 'A-2',
          'isDefault': true,
        },
      ];

      final addresses = multipleAddressesJson.map((e) => Address.fromJson(e)).toList();
      
      expect(addresses.length, 2);
      expect(addresses[0].societyName, 'Society 1');
      expect(addresses[1].isDefault, true);
    });

    test('should handle floating point precision in coordinates', () {
      final address = Address(
        id: 'geo-test',
        userId: 'user-geo',
        societyName: 'Geo Test',
        flatNumber: 'G-1',
        latitude: 28.535516789123,
        longitude: 77.391003219876,
        isDefault: false,
      );

      final json = address.toJson();
      final parsedBack = Address.fromJson(json);

      expect(parsedBack.latitude, equals(28.535516789123));
      expect(parsedBack.longitude, equals(77.391003219876));
    });

    test('should handle string coordinates from API response', () {
      final jsonWithStringCoords = {
        'id': 'str-coords',
        'userId': 'user-str',
        'societyName': 'String Coords Test',
        'flatNumber': 'SC-1',
        'latitude': '28.5355',
        'longitude': '77.391',
        'isDefault': false,
      };

      final address = Address.fromJson(jsonWithStringCoords);

      expect(address.latitude, 28.5355);
      expect(address.longitude, 77.391);
    });
  });
}
