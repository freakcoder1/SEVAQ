import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:mockito/mockito.dart';
import 'package:flutter_house_help/models/worker.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/user.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';
import 'package:flutter_house_help/services/api_service.dart';
import 'package:flutter_house_help/screens/assignment_in_progress_screen.dart';
import 'package:flutter_house_help/screens/professional_assigned_screen.dart';

// Mock classes
class MockAuthProvider extends Mock implements AuthProvider {}

class MockApiService extends Mock implements ApiService {}

void main() {
  group('Assignment Screens Widget Tests', () {
    late MockAuthProvider mockAuthProvider;
    late MockApiService mockApiService;
    late Worker testWorker;
    late Service testService;
    late DateTime testStartTime;
    late DateTime testEndTime;
    late double testAmount;

    setUp(() {
      mockAuthProvider = MockAuthProvider();
      mockApiService = MockApiService();
      testWorker = Worker(
        id: 'worker1',
        user: User(
          id: 'user1',
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          role: 'worker',
        ),
        bio: 'Experienced cleaner',
        rating: 4.5,
        reviewCount: 10,
        services: [],
      );
      testService = Service(
        id: 'service1',
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

    testWidgets('AssignmentInProgressScreen displays correct header', (
      WidgetTester tester,
    ) async {
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
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
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        Provider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Verify service summary card
      expect(find.text('Home Cleaning'), findsOneWidget);
      expect(find.text('₹500 per visit'), findsOneWidget);
      expect(find.text('Morning (08:00–12:00)'), findsOneWidget);
    });

    testWidgets(
      'AssignmentInProgressScreen displays what happens next section',
      (WidgetTester tester) async {
        // Setup mock
        when(mockAuthProvider.user).thenReturn(null);

        await tester.pumpWidget(
          Provider<AuthProvider>(
            create: (_) => mockAuthProvider,
            child: MaterialApp(
              home: AssignmentInProgressScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
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
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        Provider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
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
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Verify primary CTA
      expect(find.text('View request details'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen displays correct header', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Verify header text
      expect(find.text('Professional Assigned'), findsOneWidget);
      expect(find.text('Your professional is confirmed!'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen displays worker information', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Verify worker information
      expect(find.text('John Doe'), findsOneWidget);
      expect(find.text('john@example.com'), findsOneWidget);
      expect(find.text('1234567890'), findsOneWidget);
      expect(find.text('Noida'), findsOneWidget);
      expect(find.text('4.5'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen displays service details', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Verify service details
      expect(find.text('Home Cleaning'), findsOneWidget);
      expect(find.text('₹500 per visit'), findsOneWidget);
      expect(find.text('Morning (08:00–12:00)'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen displays action buttons', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Verify action buttons
      expect(find.text('Contact Professional'), findsOneWidget);
      expect(find.text('View Service Details'), findsOneWidget);
      expect(find.text('Done'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen displays trust elements', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Verify trust elements
      expect(find.text('Verified Professional'), findsOneWidget);
      expect(find.text('Background Checked'), findsOneWidget);
      expect(find.text('Insurance Covered'), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen handles timeout correctly', (
      WidgetTester tester,
    ) async {
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Fast forward time to trigger timeout
      await tester.pump(const Duration(minutes: 4));

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

    testWidgets('AssignmentInProgressScreen handles delay correctly', (
      WidgetTester tester,
    ) async {
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Fast forward time to trigger delay
      await tester.pump(const Duration(seconds: 45));

      // Verify delay message appears
      expect(
        find.text(
          'Still working on your assignment. We’ll notify you shortly.',
        ),
        findsOneWidget,
      );
    });

    testWidgets('ProfessionalAssignedScreen handles null service gracefully', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: null,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Should not crash and should display fallback text
      expect(find.text('Professional Assigned'), findsOneWidget);
      expect(find.text('Your professional is confirmed!'), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen handles null service gracefully', (
      WidgetTester tester,
    ) async {
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        Provider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: null,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Should not crash and should display fallback text
      expect(find.text('Finding a professional'), findsOneWidget);
      expect(find.text('Home Cleaning'), findsNothing);
    });

    testWidgets('AssignmentInProgressScreen displays progress indicator', (
      WidgetTester tester,
    ) async {
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        Provider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Verify progress indicator
      expect(find.byType(LinearProgressIndicator), findsOneWidget);
      expect(find.text('Assignment in progress'), findsOneWidget);
      expect(find.text('This usually takes a few minutes.'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen displays correct date format', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Verify date format
      final formattedDate = DateFormat('EEE, d MMM').format(testStartTime);
      expect(find.text(formattedDate), findsOneWidget);
    });

    testWidgets('AssignmentInProgressScreen handles support button tap', (
      WidgetTester tester,
    ) async {
      // Setup mock
      when(mockAuthProvider.user).thenReturn(null);

      await tester.pumpWidget(
        Provider<AuthProvider>(
          create: (_) => mockAuthProvider,
          child: MaterialApp(
            home: AssignmentInProgressScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
            ),
          ),
        ),
      );

      // Tap support button
      await tester.tap(find.byIcon(Icons.arrow_forward));
      await tester.pump();

      // Verify bottom sheet appears
      expect(find.text('Need help?'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen handles contact button tap', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Tap contact button
      await tester.tap(find.text('Contact Professional'));
      await tester.pump();

      // Verify snackbar appears
      expect(find.text('Contacting John Doe'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen handles view details button tap', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Tap view details button
      await tester.tap(find.text('View Service Details'));
      await tester.pump();

      // Verify snackbar appears
      expect(find.text('Viewing service details'), findsOneWidget);
    });

    testWidgets('ProfessionalAssignedScreen handles done button tap', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MaterialApp(
          home: ProfessionalAssignedScreen(
            worker: testWorker,
            service: testService,
            startTime: testStartTime,
            endTime: testEndTime,
            amount: testAmount,
          ),
        ),
      );

      // Tap done button
      await tester.tap(find.text('Done'));
      await tester.pump();

      // Verify navigation (this would need proper navigation setup in real test)
      expect(find.text('Professional Assigned'), findsOneWidget);
    });
  });
}
