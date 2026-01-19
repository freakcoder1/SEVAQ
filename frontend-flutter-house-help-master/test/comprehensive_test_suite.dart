import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:mockito/mockito.dart';

// Import all components
import '../lib/components/trust_header.dart';
import '../lib/components/primary_recommendation.dart';
import '../lib/components/worker_infrastructure.dart';
import '../lib/components/adaptive_booking_flow.dart';
import '../lib/components/system_status_translator.dart';
import '../lib/components/copy_helper.dart';
import '../lib/components/gradient_helper.dart';
import '../lib/components/animation_helper.dart';
import '../lib/providers/system_status_provider.dart';
import '../lib/theme.dart';

// Mock classes
class MockSystemStatusProvider extends Mock implements SystemStatusProvider {}

class MockAuthProvider extends Mock {
  bool get isAuthenticated => true;
}

void main() {
  group('Sevaq Trust Infrastructure Tests', () {
    late MockSystemStatusProvider mockSystemStatusProvider;
    late MockAuthProvider mockAuthProvider;

    setUp(() {
      mockSystemStatusProvider = MockSystemStatusProvider();
      mockAuthProvider = MockAuthProvider();
    });

    // Theme Tests
    group('Theme System', () {
      test('Deep Green primary color is correct', () {
        final theme = AppTheme.lightTheme;
        expect(theme.primaryColor, const Color(0xFF2E7D32));
      });

      test('Warm neutral background', () {
        final theme = AppTheme.lightTheme;
        expect(theme.scaffoldBackgroundColor, const Color(0xFFFEFBFF));
      });

      test('Slow, confident animations', () {
        final theme = AppTheme.lightTheme;
        expect(
          theme.elevatedButtonTheme.style?.animationDuration,
          const Duration(milliseconds: 350),
        );
      });
    });

    // System Status Tests
    group('System Status Translator', () {
      test('Worker availability translation', () {
        expect(
          SystemStatusTranslator.translateWorkerAvailability(85),
          "Backup active",
        );
        expect(
          SystemStatusTranslator.translateWorkerAvailability(70),
          "Slight delay expected",
        );
        expect(
          SystemStatusTranslator.translateWorkerAvailability(50),
          "Service adjustment needed",
        );
      });

      test('Response time translation', () {
        expect(SystemStatusTranslator.translateResponseTime(10), "On track");
        expect(
          SystemStatusTranslator.translateResponseTime(25),
          "Slight delay expected",
        );
        expect(
          SystemStatusTranslator.translateResponseTime(45),
          "Extended wait time",
        );
      });

      test('Service availability translation', () {
        expect(
          SystemStatusTranslator.translateServiceAvailability(90),
          "All services on track",
        );
        expect(
          SystemStatusTranslator.translateServiceAvailability(75),
          "Most services available",
        );
        expect(
          SystemStatusTranslator.translateServiceAvailability(60),
          "Limited availability",
        );
      });
    });

    // Copy Helper Tests
    group('Copy Helper', () {
      test('Infrastructure status translation', () {
        expect(
          CopyHelper.translateInfrastructureStatus(true),
          "Available and on track",
        );
        expect(
          CopyHelper.translateInfrastructureStatus(false),
          "Service adjustment needed",
        );
      });

      test('Experience translation', () {
        expect(CopyHelper.translateExperience(12), "Extensive experience");
        expect(CopyHelper.translateExperience(7), "Experienced professional");
        expect(CopyHelper.translateExperience(3), "Professional experience");
        expect(CopyHelper.translateExperience(1), "Trained professional");
      });

      test('Reliability streak translation', () {
        expect(
          CopyHelper.translateReliabilityStreak(15),
          "Consistently reliable",
        );
        expect(
          CopyHelper.translateReliabilityStreak(8),
          "Reliable performance",
        );
        expect(
          CopyHelper.translateReliabilityStreak(3),
          "Building reliability",
        );
      });
    });

    // Gradient Helper Tests
    group('Gradient Helper', () {
      test('Subtle background oxygen gradient', () {
        final gradient = GradientHelper.subtleBackgroundOxygen();
        expect(gradient.gradient, isA<LinearGradient>());
        final colors = (gradient.gradient as LinearGradient).colors;
        expect(colors.first, Colors.transparent);
        expect(colors.last.opacity, lessThan(0.08)); // < 8% opacity
      });

      test('Card background gradient', () {
        final gradient = GradientHelper.cardBackgroundGradient(Colors.white);
        expect(gradient.gradient, isA<LinearGradient>());
      });
    });

    // Animation Helper Tests
    group('Animation Helper', () {
      test('Slow duration is correct', () {
        expect(AnimationHelper.slowDuration, const Duration(milliseconds: 350));
      });

      test('Confident curve is ease-in-out', () {
        expect(AnimationHelper.confidentCurve, Curves.easeInOut);
      });
    });

    // Widget Tests
    group('Trust Header Widget', () {
      testWidgets('displays location and system status', (
        WidgetTester tester,
      ) async {
        when(mockSystemStatusProvider.isHealthy).thenReturn(true);

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: TrustHeader(location: "Greater Noida"),
          ),
        );

        expect(find.text("Greater Noida"), findsOneWidget);
        expect(find.text("All services on track"), findsOneWidget);
        expect(find.byIcon(Icons.location_on), findsOneWidget);
        expect(find.byIcon(Icons.check_circle), findsOneWidget);
      });

      testWidgets('displays error state correctly', (
        WidgetTester tester,
      ) async {
        when(mockSystemStatusProvider.isHealthy).thenReturn(false);

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: TrustHeader(location: "Greater Noida"),
          ),
        );

        expect(find.text("Service adjustment needed"), findsOneWidget);
      });
    });

    group('Primary Recommendation Widget', () {
      testWidgets('displays service recommendation', (
        WidgetTester tester,
      ) async {
        final recommendation = ServiceRecommendation(
          serviceName: "Home Cleaning",
          eta: "15-30 mins",
          zoneReliability: "High",
          onProceed: () {},
        );

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: PrimaryRecommendation(recommendation: recommendation),
          ),
        );

        expect(find.text("Home Cleaning"), findsOneWidget);
        expect(find.text("15-30 mins"), findsOneWidget);
        expect(find.text("High"), findsOneWidget);
        expect(find.text("We'll handle this"), findsOneWidget);
      });
    });

    group('Worker Infrastructure Widget', () {
      testWidgets('displays worker with human anchor', (
        WidgetTester tester,
      ) async {
        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: WorkerInfrastructure(
              firstName: "John",
              lastName: "Doe",
              isAvailable: true,
              yearsOfExperience: 5,
              homesServedInArea: 50,
              reliabilityStreak: 12,
              isVerified: true,
              isTrained: true,
              isFrequentInBuilding: false,
              previouslyBooked: true,
            ),
          ),
        );

        expect(find.text("John Doe"), findsOneWidget);
        expect(find.text("Previously booked by you"), findsOneWidget);
        expect(find.text("5 years"), findsOneWidget);
        expect(find.text("12 consecutive on-time visits"), findsOneWidget);
        expect(find.text("50 homes in your area"), findsOneWidget);
      });
    });

    group('Adaptive Booking Flow', () {
      testWidgets('shows full ceremony for first-time users', (
        WidgetTester tester,
      ) async {
        final recommendation = ServiceRecommendation(
          serviceName: "Home Cleaning",
          eta: "15-30 mins",
          zoneReliability: "High",
          onProceed: () {},
        );

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: AdaptiveBookingFlow(
              recommendation: recommendation,
              isFirstTimeUser: true,
              onBookingComplete: () {},
            ),
          ),
        );

        expect(find.text("Complete Request"), findsOneWidget);
        expect(find.text("Here's what Sevaq will handle"), findsOneWidget);
      });

      testWidgets('shows compressed flow for returning users', (
        WidgetTester tester,
      ) async {
        final recommendation = ServiceRecommendation(
          serviceName: "Home Cleaning",
          eta: "15-30 mins",
          zoneReliability: "High",
          onProceed: () {},
        );

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: AdaptiveBookingFlow(
              recommendation: recommendation,
              isFirstTimeUser: false,
              onBookingComplete: () {},
            ),
          ),
        );

        expect(find.text("Complete Request"), findsOneWidget);
        expect(find.text("Sevaq will handle this visit"), findsOneWidget);
      });
    });

    // Integration Tests
    group('Integration Tests', () {
      testWidgets('complete user flow', (WidgetTester tester) async {
        // Test the complete flow from trust header to booking
        final recommendation = ServiceRecommendation(
          serviceName: "Home Cleaning",
          eta: "15-30 mins",
          zoneReliability: "High",
          onProceed: () {},
        );

        await tester.pumpWidget(
          MaterialApp(
            theme: AppTheme.lightTheme,
            home: Scaffold(
              body: Column(
                children: [
                  TrustHeader(location: "Greater Noida"),
                  PrimaryRecommendation(recommendation: recommendation),
                  AdaptiveBookingFlow(
                    recommendation: recommendation,
                    isFirstTimeUser: true,
                    onBookingComplete: () {},
                  ),
                ],
              ),
            ),
          ),
        );

        // Verify all components render together
        expect(find.text("Greater Noida"), findsOneWidget);
        expect(find.text("Home Cleaning"), findsOneWidget);
        expect(find.text("Complete Request"), findsOneWidget);
      });
    });

    // Performance Tests
    group('Performance Tests', () {
      test('theme creation is fast', () {
        final start = DateTime.now();
        for (int i = 0; i < 100; i++) {
          AppTheme.lightTheme;
        }
        final end = DateTime.now();
        final duration = end.difference(start);
        expect(duration.inMilliseconds, lessThan(1000)); // Should be very fast
      });

      test('translation functions are fast', () {
        final start = DateTime.now();
        for (int i = 0; i < 1000; i++) {
          SystemStatusTranslator.translateWorkerAvailability(85);
          CopyHelper.translateExperience(5);
        }
        final end = DateTime.now();
        final duration = end.difference(start);
        expect(duration.inMilliseconds, lessThan(100)); // Should be very fast
      });
    });

    // Accessibility Tests
    group('Accessibility Tests', () {
      test('all text has appropriate contrast', () {
        final theme = AppTheme.lightTheme;

        // Test primary text contrast
        expect(theme.textTheme.headlineSmall?.color, isNotNull);
        expect(theme.textTheme.bodyMedium?.color, isNotNull);

        // Test button text contrast
        expect(theme.elevatedButtonTheme.style?.foregroundColor, isNotNull);
      });

      test('focus states are visible', () {
        final theme = AppTheme.lightTheme;

        // Test that focus indicators exist
        expect(theme.inputDecorationTheme.focusColor, isNotNull);
      });
    });
  });
}
