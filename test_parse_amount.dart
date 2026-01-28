import 'dart:convert';

void main() {
  final testResponses = [
    '{"totalAmount": "1500.00"}',
    '{"totalAmount": 1500.00}',
    '{"totalAmount": "1000.00"}',
    '{"amount": 2000}',
    '{}',
  ];

  testResponses.asMap().forEach((index, responseJson) {
    print('\nTest ${index + 1}: $responseJson');
    try {
      final Map<String, dynamic> json = jsonDecode(responseJson);

      double? parsedAmount;

      if (json['amount'] != null) {
        parsedAmount = (json['amount'] is String)
            ? double.tryParse(json['amount'])
            : json['amount']?.toDouble();
      } else if (json['totalAmount'] != null) {
        parsedAmount = (json['totalAmount'] is String)
            ? double.tryParse(json['totalAmount'])
            : json['totalAmount']?.toDouble();
      } else {
        parsedAmount = 0.0;
      }

      print(
        'Parsed amount: $parsedAmount (Type: ${parsedAmount?.runtimeType})',
      );
    } catch (e) {
      print('Error parsing: $e');
    }
  });
}
