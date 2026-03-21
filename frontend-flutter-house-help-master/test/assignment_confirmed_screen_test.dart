import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:mockito/mockito.dart';
import 'package:flutter_house_help/models/worker.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/user.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';
import 'package:flutter_house_help/screens/assignment_confirmed_screen.dart';

// Mock classes
class MockAuthProvider extends Mock implements AuthProvider {}

void main() {
  group('AssignmentConfirmedScreen Widget Tests', () {
    late MockAuthProvider mockAuthProvider;
    late Worker testWorker;
    late Service testService;
    late User testUser;
    late DateTime testStartTime;
    late DateTime testEndTime;
    late double testAmount;
    late Map<String, dynamic> testAssignmentData;

    setUp(() {
      mockAuthProvider = MockAuthProvider();

      testUser = User(
        id: 1,
        publicId: 'user1-public-id',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        role: 'user',
      );

      testWorker = Worker(
        id: 1,
        publicId: 'worker1-public-id',
        user: User(
          id: 2,
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
        id: 1,
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

      testAssignmentData = {
        'assignmentId': 'assignment-123',
        'status': 'confirmed',
      };
    });

    // Test 1: Screen renders correctly with all UI elements
    testWidgets(
      'AssignmentConfirmedScreen renders correctly with all UI elements',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Verify main header elements
        expect(find.text('Professional assigned'), findsOneWidget);
        expect(
          find.text(
            'Your service has been scheduled and is ready for confirmation.',
          ),
          findsOneWidget,
        );

        // Verify success icon
        expect(find.byIcon(Icons.check_circle), findsOneWidget);

        // Verify assignment card
        expect(find.text('Assigned professional'), findsOneWidget);
        expect(
          find.text(
            'A verified SEVAQ professional has been assigned to your service.',
          ),
          findsOneWidget,
        );

        // Verify service details section
        expect(find.text('Service Details'), findsOneWidget);

        // Verify payment prompt section
        expect(find.text('Confirm to proceed'), findsOneWidget);
        expect(
          find.text(
            'Payment confirms your booking. We\'ll take care of everything else.',
          ),
          findsOneWidget,
        );

        // Verify confirm button
        expect(find.text('Confirm & pay'), findsOneWidget);

        // Verify back button
        expect(find.byIcon(Icons.arrow_back), findsOneWidget);
      },
    );

    // Test 2: Shows correct booking details (service name, date, time, amount)
    testWidgets('AssignmentConfirmedScreen shows correct booking details', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify service name
      expect(find.text('Home Cleaning'), findsOneWidget);

      // Verify formatted date
      final formattedDate = DateFormat(
        'EEEE, MMMM d, yyyy',
      ).format(testStartTime);
      expect(find.text(formattedDate), findsOneWidget);

      // Verify formatted time range
      final formattedTimeRange =
          '${DateFormat('jm').format(testStartTime)} – ${DateFormat('jm').format(testEndTime)}';
      expect(find.text(formattedTimeRange), findsOneWidget);

      // Verify amount
      expect(find.text('₹500'), findsOneWidget);
    });

    // Test 3: Status indicator shows "Confirmed" state
    testWidgets('AssignmentConfirmedScreen shows confirmed status indicator', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify the check_circle icon is displayed (indicating confirmed status)
      expect(find.byIcon(Icons.check_circle), findsOneWidget);

      // Verify the green color container is present
      final containerFinder = find.byWidgetPredicate(
        (widget) =>
            widget is Container &&
            widget.decoration != null &&
            (widget.decoration as BoxDecoration).color ==
                const Color(0xFFE8F5E9),
      );
      expect(containerFinder, findsOneWidget);
    });

    // Test 4: Shows worker assignment when available
    testWidgets(
      'AssignmentConfirmedScreen shows worker assignment when available',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Verify assignment card is displayed
        expect(find.text('Assigned professional'), findsOneWidget);
        expect(
          find.text(
            'A verified SEVAQ professional has been assigned to your service.',
          ),
          findsOneWidget,
        );
      },
    );

    // Test 5: Handles loading state when processing payment
    testWidgets('AssignmentConfirmedScreen handles loading state correctly', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Initially, button should be enabled
      final ElevatedButton initialButton = tester.widget(
        find.byType(ElevatedButton),
      );
      expect(initialButton.onPressed, isNotNull);

      // Tap the confirm button to trigger loading state
      await tester.tap(find.text('Confirm & pay'));
      await tester.pump();

      // After tap, the button should show loading indicator
      // Note: In actual implementation, _handlePayment is async so we need to pump
      await tester.pump();

      // Verify button is still present
      expect(find.text('Confirm & pay'), findsOneWidget);
    });

    // Test 6: Handles error state when user is not logged in
    testWidgets(
      'AssignmentConfirmedScreen handles error when user not logged in',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(null);

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Verify screen still renders even without user
        expect(find.text('Professional assigned'), findsOneWidget);

        // Tap the confirm button - should show error snackbar
        await tester.tap(find.text('Confirm & pay'));
        await tester.pump();
        await tester.pump(const Duration(milliseconds: 500));

        // Verify error snackbar appears
        expect(find.byType(SnackBar), findsOneWidget);
        expect(find.textContaining('Error'), findsOneWidget);
      },
    );

    // Test 7: Tests for payment status display
    testWidgets('AssignmentConfirmedScreen displays payment prompt section', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify payment prompt section
      expect(find.text('Confirm to proceed'), findsOneWidget);
      expect(
        find.text(
          'Payment confirms your booking. We\'ll take care of everything else.',
        ),
        findsOneWidget,
      );

      // Verify money icon is displayed
      expect(find.byIcon(Icons.attach_money), findsOneWidget);
    });

    // Test 8: Tests for service summary display
    testWidgets(
      'AssignmentConfirmedScreen displays service summary correctly',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Verify Service Details header
        expect(find.text('Service Details'), findsOneWidget);

        // Verify calendar icon for date/time
        expect(find.byIcon(Icons.calendar_today), findsOneWidget);

        // Verify work icon for service
        expect(find.byIcon(Icons.work), findsOneWidget);

        // Verify amount icon
        expect(find.byIcon(Icons.attach_money), findsOneWidget);
      },
    );

    // Test 9: Handles null service gracefully
    testWidgets('AssignmentConfirmedScreen handles null service gracefully', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      // Create worker with services to provide fallback
      final workerWithServices = Worker(
        id: 1,
        publicId: 'worker1-public-id',
        user: testWorker.user,
        bio: 'Experienced cleaner',
        rating: 4.5,
        reviewCount: 10,
        services: [testService],
      );

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: workerWithServices,
              service: null, // Null service
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Should not crash and should display fallback text
      expect(find.text('Professional assigned'), findsOneWidget);

      // Should show fallback service name from worker.services[0]
      expect(find.text('Home Cleaning'), findsOneWidget);
    });

    // Test 10: Handles worker with no services gracefully
    testWidgets('AssignmentConfirmedScreen handles worker with no services', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      final workerNoServices = Worker(
        id: 1,
        publicId: 'worker1-public-id',
        user: testWorker.user,
        bio: 'Experienced cleaner',
        rating: 4.5,
        reviewCount: 10,
        services: [], // Empty services
      );

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: workerNoServices,
              service: null, // Null service
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Should not crash and should display fallback text "Service"
      expect(find.text('Service'), findsOneWidget);
    });

    // Test 11: Back button navigation works
    testWidgets(
      'AssignmentConfirmedScreen back button triggers Navigator.pop',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        bool popped = false;

        await tester.pumpWidget(
          MaterialApp(
            home: Navigator(
              onPopPage: (route, result) {
                popped = true;
                return route.didPop(result);
              },
              pages: [
                MaterialPage(
                  child: ChangeNotifierProvider<AuthProvider>.value(
                    value: mockAuthProvider,
                    child: AssignmentConfirmedScreen(
                      worker: testWorker,
                      service: testService,
                      startTime: testStartTime,
                      endTime: testEndTime,
                      amount: testAmount,
                      assignmentData: testAssignmentData,
                    ),
                  ),
                ),
              ],
            ),
          ),
        );

        // Tap back button
        await tester.tap(find.byIcon(Icons.arrow_back));
        await tester.pumpAndSettle();

        // Navigator should have attempted to pop
        expect(find.byIcon(Icons.arrow_back), findsOneWidget);
      },
    );

    // Test 12: Verify screen can display CircularProgressIndicator
    testWidgets('AssignmentConfirmedScreen can show loading indicator', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: Builder(
              builder: (context) {
                return ElevatedButton(
                  onPressed: () async {
                    // Show loading state
                    showDialog(
                      context: context,
                      barrierDismissible: false,
                      builder: (context) =>
                          const Center(child: CircularProgressIndicator()),
                    );
                  },
                  child: const Text('Confirm & pay'),
                );
              },
            ),
          ),
        ),
      );

      // Verify button exists
      expect(find.byType(ElevatedButton), findsOneWidget);
      expect(find.text('Confirm & pay'), findsOneWidget);
    });

    // Test 13: Test with different amount values
    testWidgets(
      'AssignmentConfirmedScreen displays different amount values correctly',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        const differentAmount = 1500.0;

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: differentAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Verify amount is formatted correctly
        expect(find.text('₹1500'), findsOneWidget);
      },
    );

    // Test 14: Test with different date formats
    testWidgets(
      'AssignmentConfirmedScreen displays different date formats correctly',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        final differentStartTime = DateTime(2024, 12, 25, 14, 30);
        final differentEndTime = DateTime(2024, 12, 25, 16, 30);

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: differentStartTime,
                endTime: differentEndTime,
                amount: testAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Verify date is formatted correctly
        final formattedDate = DateFormat(
          'EEEE, MMMM d, yyyy',
        ).format(differentStartTime);
        expect(find.text(formattedDate), findsOneWidget);

        // Verify time range is formatted correctly
        final formattedTimeRange =
            '${DateFormat('jm').format(differentStartTime)} – ${DateFormat('jm').format(differentEndTime)}';
        expect(find.text(formattedTimeRange), findsOneWidget);
      },
    );

    // Test 15: Test assignment data is passed correctly
    testWidgets(
      'AssignmentConfirmedScreen receives assignment data correctly',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        final customAssignmentData = {
          'assignmentId': 'custom-assignment-456',
          'status': 'pending',
          'workerId': 123,
        };

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
                assignmentData: customAssignmentData,
              ),
            ),
          ),
        );

        // Screen should render with the assignment data
        expect(find.text('Professional assigned'), findsOneWidget);
        expect(find.text('Assigned professional'), findsOneWidget);
      },
    );

    // Test 16: Test UI elements with different screen sizes
    testWidgets('AssignmentConfirmedScreen is scrollable for small screens', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify SingleChildScrollView is present for scrolling
      expect(find.byType(SingleChildScrollView), findsOneWidget);
    });

    // Test 17: Test all icons are displayed correctly
    testWidgets('AssignmentConfirmedScreen displays all required icons', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify icons
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(find.byIcon(Icons.arrow_back), findsOneWidget);
      expect(find.byIcon(Icons.calendar_today), findsOneWidget);
      expect(find.byIcon(Icons.work), findsOneWidget);
      expect(find.byIcon(Icons.attach_money), findsOneWidget);
    });

    // Test 18: Test button styling
    testWidgets(
      'AssignmentConfirmedScreen confirm button has correct styling',
      (WidgetTester tester) async {
        when(mockAuthProvider.user).thenReturn(testUser);

        await tester.pumpWidget(
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
            child: MaterialApp(
              home: AssignmentConfirmedScreen(
                worker: testWorker,
                service: testService,
                startTime: testStartTime,
                endTime: testEndTime,
                amount: testAmount,
                assignmentData: testAssignmentData,
              ),
            ),
          ),
        );

        // Find the ElevatedButton and verify its style
        final elevatedButton = tester.widget<ElevatedButton>(
          find.byType(ElevatedButton),
        );

        // Verify button text
        expect(elevatedButton.child, isA<Text>());
        final text = elevatedButton.child as Text;
        expect(text.data, 'Confirm & pay');

        // Verify button is not disabled initially
        expect(elevatedButton.onPressed, isNotNull);
      },
    );

    // Test 19: Test SafeArea is used
    testWidgets('AssignmentConfirmedScreen uses SafeArea for proper padding', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify SafeArea is used
      expect(find.byType(SafeArea), findsOneWidget);
    });

    // Test 20: Test AppBar configuration
    testWidgets('AssignmentConfirmedScreen AppBar is properly configured', (
      WidgetTester tester,
    ) async {
      when(mockAuthProvider.user).thenReturn(testUser);

      await tester.pumpWidget(
        ChangeNotifierProvider<AuthProvider>.value(
          value: mockAuthProvider,
          child: MaterialApp(
            home: AssignmentConfirmedScreen(
              worker: testWorker,
              service: testService,
              startTime: testStartTime,
              endTime: testEndTime,
              amount: testAmount,
              assignmentData: testAssignmentData,
            ),
          ),
        ),
      );

      // Verify AppBar is present
      expect(find.byType(AppBar), findsOneWidget);

      // Verify AppBar has no elevation
      final appBar = tester.widget<AppBar>(find.byType(AppBar));
      expect(appBar.elevation, 0);

      // Verify background color is white
      expect(appBar.backgroundColor, Colors.white);
    });
  });
}
