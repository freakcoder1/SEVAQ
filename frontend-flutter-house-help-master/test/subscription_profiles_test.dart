import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_house_help/screens/subscription_profiles_screen.dart';
import 'package:flutter/material.dart';

void main() {
  group('Subscription Profiles Widget Tests', () {
    testWidgets('SubscriptionProfilesScreen loads and displays profiles', (
      WidgetTester tester,
    ) async {
      // Build our app and trigger a frame
      await tester.pumpWidget(
        MaterialApp(
          home: SubscriptionProfilesScreen(
            serviceType: 'cooking',
            serviceName: 'Cooking Services',
            userId: 'test-user-123',
          ),
        ),
      );

      // Verify that the screen loads (loading indicator should be visible initially)
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // Wait for the mock data to load
      await tester.pump(Duration(seconds: 2));

      // Verify that we see the "Choose a plan" text
      expect(
        find.text(
          'Choose a plan based on your household needs. No daily decisions. No configuration.',
        ),
        findsOneWidget,
      );

      // Verify that we see all three profiles (Basic, Standard, Extended)
      expect(find.text('COOK_BASIC'), findsOneWidget);
      expect(find.text('COOK_STANDARD'), findsOneWidget);
      expect(find.text('COOK_EXTENDED'), findsOneWidget);

      // Verify that we see the monthly prices
      expect(find.text('₹3,500 / month'), findsOneWidget);
      expect(find.text('₹5,500 / month'), findsOneWidget);
      expect(find.text('₹8,000 / month'), findsOneWidget);
    });

    testWidgets(
      'SubscriptionProfilesScreen for cleaning service loads profiles correctly',
      (WidgetTester tester) async {
        // Build our app and trigger a frame
        await tester.pumpWidget(
          MaterialApp(
            home: SubscriptionProfilesScreen(
              serviceType: 'cleaning',
              serviceName: 'Cleaning Services',
              userId: 'test-user-456',
            ),
          ),
        );

        // Wait for the mock data to load
        await tester.pump(Duration(seconds: 2));

        // Verify that we see the cleaning service profiles
        expect(find.text('CLEAN_BASIC'), findsOneWidget);
        expect(find.text('CLEAN_STANDARD'), findsOneWidget);
        expect(find.text('CLEAN_PREMIUM'), findsOneWidget);

        // Verify that we see the monthly prices
        expect(find.text('₹1,999 / month'), findsOneWidget);
        expect(find.text('₹3,499 / month'), findsOneWidget);
        expect(find.text('₹5,999 / month'), findsOneWidget);
      },
    );

    testWidgets('Profile selection functionality works', (
      WidgetTester tester,
    ) async {
      // Build our app and trigger a frame
      await tester.pumpWidget(
        MaterialApp(
          home: SubscriptionProfilesScreen(
            serviceType: 'cooking',
            serviceName: 'Cooking Services',
            userId: 'test-user-789',
          ),
        ),
      );

      // Wait for the mock data to load
      await tester.pump(Duration(seconds: 2));

      // Initially, Standard plan should be selected
      final standardPlanFinder = find.ancestor(
        of: find.text('COOK_STANDARD'),
        matching: find.byType(InkWell),
      );

      expect(standardPlanFinder, findsOneWidget);

      // Tap on Basic plan to select it
      final basicPlanFinder = find.ancestor(
        of: find.text('COOK_BASIC'),
        matching: find.byType(InkWell),
      );

      await tester.tap(basicPlanFinder);
      await tester.pump();

      // Verify that Basic plan is now selected (check icon should be visible)
      expect(find.byIcon(Icons.check), findsOneWidget);
    });
  });
}
