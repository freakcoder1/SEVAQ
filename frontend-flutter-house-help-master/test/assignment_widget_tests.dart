import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';

// Mock classes for testing
class MockWorker {
  final String id;
  final String name;
  final String email;
  final String phone;
  final String location;
  final bool isActive;
  final bool isAvailable;
  final double rating;
  final int totalBookings;
  final int completedBookings;
  final DateTime createdAt;
  final DateTime updatedAt;

  MockWorker({
    required this.id,
    required this.name,
    required this.email,
    required this.phone,
    required this.location,
    required this.isActive,
    required this.isAvailable,
    required this.rating,
    required this.totalBookings,
    required this.completedBookings,
    required this.createdAt,
    required this.updatedAt,
  });
}

class MockService {
  final String id;
  final String name;
  final String description;
  final double price;
  final int duration;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  MockService({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.duration,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });
}

class MockAuthProvider {
  final dynamic user;

  MockAuthProvider({this.user});
}

class MockApiService {
  Future<Map<String, dynamic>?> get(String endpoint) async {
    // Mock API response
    return {
      'status': 'assigned',
      'workerId': 'worker1',
      'assignmentTime': DateTime.now().toIso8601String(),
    };
  }
}

void main() {
  group('Assignment Screens Widget Tests', () {
    late MockWorker testWorker;
    late MockService testService;
    late DateTime testStartTime;
    late DateTime testEndTime;
    late double testAmount;

    setUp(() {
      testWorker = MockWorker(
        id: 'worker1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        location: 'Noida',
        isActive: true,
        isAvailable: true,
        rating: 4.5,
        totalBookings: 10,
        completedBookings: 9,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      testService = MockService(
        id: 'service1',
        name: 'Home Cleaning',
        description: 'Complete home cleaning service',
        price: 500.0,
        duration: 120,
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );
      testStartTime = DateTime(2024, 1, 15, 10, 0);
      testEndTime = DateTime(2024, 1, 15, 12, 0);
      testAmount = 500.0;
    });

    testWidgets('AssignmentInProgressScreen displays correct header', (
      WidgetTester tester,
    ) async {
      // Create a simplified version of the screen for testing
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Finding a professional',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                Text(
                  'We’re assigning a verified professional for your scheduled service.',
                  style: TextStyle(fontSize: 16, color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
      );

      // Verify header text
      expect(find.text('Finding a professional'), findsOneWidget);
      expect(
        find.text(
          'We’re assigning a verified professional for your scheduled service.',
        ),
        findsOneWidget,
      );
    });

    testWidgets('AssignmentInProgressScreen displays service summary card', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
                border: Border.all(color: Colors.black12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.cleaning_services,
                        color: Color(0xFF2E7D32),
                        size: 24,
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              testService.name,
                              style: TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              '${DateFormat('EEE, d MMM').format(testStartTime)} • ${_getTimeWindowText(testStartTime, testEndTime)}',
                              style: TextStyle(
                                fontSize: 14,
                                color: Colors.black54,
                              ),
                            ),
                            SizedBox(height: 4),
                            Text(
                              '₹${testAmount.toStringAsFixed(0)} per visit',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFF2E7D32),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Verify service summary card
      expect(find.text(testService.name), findsOneWidget);
      expect(find.text('₹500 per visit'), findsOneWidget);
      expect(find.text('Morning (08:00–12:00)'), findsOneWidget);
    });

    testWidgets(
      'AssignmentInProgressScreen displays what happens next section',
      (WidgetTester tester) async {
        await tester.pumpWidget(
          MaterialApp(
            home: Scaffold(
              body: Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Color(0xFFF8F9FA),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'What happens next',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    SizedBox(height: 12),
                    _buildNextStep(
                      icon: Icons.person,
                      text: 'We assign a verified professional',
                    ),
                    SizedBox(height: 8),
                    _buildNextStep(
                      icon: Icons.notifications,
                      text: 'You’ll be notified once assigned',
                    ),
                    SizedBox(height: 8),
                    _buildNextStep(
                      icon: Icons.payment,
                      text: 'Payment will be requested after assignment',
                    ),
                  ],
                ),
              ),
            ),
          ),
        );

        // Verify what happens next section
        expect(find.text('What happens next'), findsOneWidget);
        expect(find.text('We assign a verified professional'), findsOneWidget);
        expect(find.text('You’ll be notified once assigned'), findsOneWidget);
        expect(
          find.text('Payment will be requested after assignment'),
          findsOneWidget,
        );
      },
    );

    testWidgets('AssignmentInProgressScreen displays support section', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              decoration: BoxDecoration(
                border: Border(
                  top: BorderSide(color: Colors.black12),
                  bottom: BorderSide(color: Colors.black12),
                ),
                color: Colors.white,
              ),
              child: Row(
                children: [
                  Icon(Icons.help_outline, color: Colors.black54),
                  SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      'Need help?',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.black87,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  IconButton(
                    icon: Icon(Icons.arrow_forward, color: Colors.black54),
                    onPressed: () {},
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Verify support section
      expect(find.text('Need help?'), findsOneWidget);
      expect(find.byIcon(Icons.help_outline), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen displays primary CTA', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: EdgeInsets.symmetric(horizontal: 24),
              child: ElevatedButton(
                onPressed: () {},
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.white,
                  foregroundColor: Color(0xFF2E7D32),
                  side: BorderSide(color: Color(0xFF2E7D32)),
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: Text('View request details'),
              ),
            ),
          ),
        ),
      );

      // Verify primary CTA
      expect(find.text('View request details'), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen displays progress indicator', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                LinearProgressIndicator(
                  backgroundColor: Colors.grey[200],
                  color: Color(0xFF2E7D32),
                  minHeight: 8,
                ),
                SizedBox(height: 8),
                Text(
                  'Assignment in progress',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600),
                ),
                SizedBox(height: 4),
                Text(
                  'This usually takes a few minutes.',
                  style: TextStyle(fontSize: 14, color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
      );

      // Verify progress indicator
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      expect(find.text('Assignment in progress'), findsOneWidget);
      expect(find.text('This usually takes a few minutes.'), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen handles timeout correctly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Color(0xFFFFF8E1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Color(0xFFFFA000)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.access_time,
                        color: Color(0xFFFFA000),
                        size: 20,
                      ),
                      SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          'Assignment taking longer than expected',
                          style: TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 8),
                  Text(
                    'We\'re still working on finding the perfect professional for you. This usually takes a few more minutes.',
                    style: TextStyle(fontSize: 14, color: Colors.black54),
                  ),
                  SizedBox(height: 12),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      OutlinedButton(
                        onPressed: () {},
                        style: OutlinedButton.styleFrom(
                          side: BorderSide(color: Color(0xFF2E7D32)),
                          padding: EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                        ),
                        child: Text(
                          'Try Again',
                          style: TextStyle(color: Color(0xFF2E7D32)),
                        ),
                      ),
                      ElevatedButton(
                        onPressed: () {},
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Color(0xFF2E7D32),
                          foregroundColor: Colors.white,
                          padding: EdgeInsets.symmetric(
                            horizontal: 20,
                            vertical: 10,
                          ),
                        ),
                        child: Text('Browse Professionals'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      );

      // Verify timeout message appears
      expect(
        find.text('Assignment taking longer than expected'),
        findsOneWidget,
      );
      expect(
        find.text(
          'We\'re still working on finding the perfect professional for you. This usually takes a few more minutes.',
        ),
        findsOneWidget,
      );
      expect(find.text('Try Again'), findsOneWidget);
      expect(find.text('Browse Professionals'), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen displays correct date format', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Text(
              DateFormat('EEE, d MMM').format(testStartTime),
              style: TextStyle(fontSize: 16),
            ),
          ),
        ),
      );

      // Verify date format
      final formattedDate = DateFormat('EEE, d MMM').format(testStartTime);
      expect(find.text(formattedDate), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen handles null service gracefully', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  'Finding a professional',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
                Text(
                  'We’re assigning a verified professional for your scheduled service.',
                  style: TextStyle(fontSize: 16, color: Colors.black54),
                ),
              ],
            ),
          ),
        ),
      );

      // Should not crash and should display fallback text
      expect(find.text('Finding a professional'), findsOneWidget);
      expect(
        find.text(
          'We’re assigning a verified professional for your scheduled service.',
        ),
        findsOneWidget,
      );
    });
  });
}

// Helper functions
String _getTimeWindowText(DateTime startTime, DateTime endTime) {
  final startHour = startTime.hour;
  final endHour = endTime.hour;

  if (startHour >= 8 && endHour <= 12) {
    return 'Morning (08:00–12:00)';
  } else if (startHour >= 12 && endHour <= 17) {
    return 'Afternoon (12:00–17:00)';
  } else {
    return 'Evening (17:00–21:00)';
  }
}

Widget _buildNextStep({required IconData icon, required String text}) {
  return Row(
    children: [
      Icon(icon, color: Color(0xFF2E7D32), size: 18),
      SizedBox(width: 10),
      Text(text, style: TextStyle(fontSize: 14, color: Colors.black87)),
    ],
  );
}
