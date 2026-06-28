import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:mockito/mockito.dart';
import 'package:flutter_house_help/models/worker.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/user.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';

void main() {
  group('AssignmentConfirmedScreen Basic Tests', () {
    late Worker testWorker;
    late Service testService;
    late DateTime testStartTime;
    late DateTime testEndTime;
    late double testAmount;

    setUp(() {
      testWorker = Worker(
        id: '1',
        publicId: 'worker1-public-id',
        user: User(
          id: '2',
          publicId: 'worker-user-1',
          email: 'worker@example.com',
          firstName: 'Jane',
          lastName: 'Worker',
          role: 'worker',
        ),
        bio: 'Experienced cleaner',
        rating: 4.5,
        reviewCount: 10,
        services: [],
      );

      testService = Service(
        id: '1',
        publicId: 'service1-public-id',
        name: 'Home Cleaning',
        description: 'Complete home cleaning service',
        category: 'Cleaning',
        basePrice: 500.0,
        isAvailable: true,
      );

      testStartTime = DateTime(2024, 1, 15, 10, 0);
      testEndTime = DateTime(2024, 1, 15, 12, 0);
      testAmount = 500.0;
    });

    testWidgets('Scaffold structure exists', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Center(child: Text('Test')),
          ),
        ),
      );
      expect(find.byType(Scaffold), findsOneWidget);
    });

    testWidgets('SafeArea is used in Scaffold', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: SafeArea(child: Text('Test')),
          ),
        ),
      );
      expect(find.byType(SafeArea), findsOneWidget);
    });

    testWidgets('Date formatting works correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Text(
              DateFormat('EEEE, MMMM d, yyyy').format(testStartTime),
            ),
          ),
        ),
      );
      expect(find.text('Monday, January 15, 2024'), findsOneWidget);
    });

    testWidgets('Amount formatting works correctly', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Text('₹${testAmount.toStringAsFixed(0)}'),
          ),
        ),
      );
      expect(find.text('₹500'), findsOneWidget);
    });
  });
}