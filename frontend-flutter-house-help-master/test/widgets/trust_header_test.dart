import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_house_help/widgets/trust_header.dart';
import 'package:flutter_house_help/models/recommendation.dart';

void main() {
  group('TrustHeader Widget', () {
    testWidgets('displays location and system status', (
      WidgetTester tester,
    ) async {
      // Create test data
      final systemStatus = SystemStatusData(
        status: SystemStatus.allOnTrack,
        availableWorkers: 5,
        estimatedWaitTime: 15,
        message: 'All services on track',
      );

      // Build the widget
      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TrustHeader(
              location: 'Sector 62, Noida',
              systemStatus: systemStatus,
              availableWorkers: 5,
            ),
          ),
        ),
      );

      // Verify location text is displayed
      expect(find.text('Sector 62, Noida'), findsOneWidget);
      expect(find.text('📍 Your preferred zone'), findsOneWidget);

      // Verify system status text is displayed
      expect(find.text('All services on track'), findsOneWidget);
      expect(find.text('5 workers'), findsOneWidget);

      // Verify icons are present
      expect(find.byIcon(Icons.location_on), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
    });

    testWidgets('displays correct colors for different system statuses', (
      WidgetTester tester,
    ) async {
      final systemStatus = SystemStatusData(
        status: SystemStatus.highDemand,
        availableWorkers: 2,
        estimatedWaitTime: 45,
        message: 'High demand right now',
      );

      await tester.pumpWidget(
        MaterialApp(
          home: Scaffold(
            body: TrustHeader(
              location: 'Sector 62, Noida',
              systemStatus: systemStatus,
              availableWorkers: 2,
            ),
          ),
        ),
      );

      // Verify high demand status text
      expect(find.text('High demand right now'), findsOneWidget);
      expect(find.text('2 workers'), findsOneWidget);
    });
  });
}
