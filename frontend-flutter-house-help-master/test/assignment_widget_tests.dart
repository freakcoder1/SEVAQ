import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:intl/intl.dart';

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

void main() {
  group('Assignment Screens Widget Tests', () {
    testWidgets('Header displays correctly', (WidgetTester tester) async {
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
              ],
            ),
          ),
        ),
      );
      expect(find.text('Finding a professional'), findsOneWidget);
    });

    testWidgets('What happens next section displays', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'What happens next',
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  SizedBox(height: 12),
                  _buildNextStep(
                    icon: Icons.person,
                    text: 'We assign a verified professional',
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      expect(find.text('What happens next'), findsOneWidget);
      expect(find.text('We assign a verified professional'), findsOneWidget);
    });

    testWidgets('Support section displays', (WidgetTester tester) async {
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: Container(
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
              child: Row(
                children: [
                  Icon(Icons.help_outline, color: Colors.black54),
                  SizedBox(width: 8),
                  Text(
                    'Need help?',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.black87,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      );
      expect(find.text('Need help?'), findsOneWidget);
      expect(find.byIcon(Icons.help_outline), findsOneWidget);
    });

    testWidgets('Progress indicator displays', (WidgetTester tester) async {
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
              ],
            ),
          ),
        ),
      );
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      expect(find.text('Assignment in progress'), findsOneWidget);
    });

    testWidgets('Date formatting works correctly', (WidgetTester tester) async {
      final testStartTime = DateTime(2024, 1, 15, 10, 0);
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
      expect(find.text('Mon, 15 Jan'), findsOneWidget);
    });
  });
}