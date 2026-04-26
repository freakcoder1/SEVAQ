import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:flutter_house_help/screens/history_screen.dart';
import 'package:flutter_house_help/providers/booking_provider.dart';
import 'package:flutter_house_help/providers/auth_provider.dart';
import 'package:flutter_house_help/models/booking.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/user.dart';
import 'package:flutter_house_help/models/worker.dart';

// Mock AuthProvider for testing
class MockAuthProvider extends AuthProvider {
  @override
  bool get isAuthenticated => true;

  @override
  User? get currentUser => User(
    id: 1,
    publicId: 'test-user-1',
    email: 'test@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: 'user',
  );
}

// Mock BookingProvider for testing
class MockBookingProvider extends BookingProvider {
  @override
  bool get isLoading => false;

  @override
  List<Booking> get bookings => _testBookings;

  List<Booking> _testBookings;

  MockBookingProvider(this._testBookings);
}

// Booking provider that shows loading state
class LoadingBookingProvider extends BookingProvider {
  @override
  bool get isLoading => true;

  @override
  List<Booking> get bookings => [];
}

void main() {
  group('HistoryScreen Tests', () {
    // Test data
    final testUser = User(
      id: 1,
      publicId: 'test-user-1',
      email: 'test@example.com',
      firstName: 'John',
      lastName: 'Doe',
      role: 'user',
    );

    final testWorker = Worker(
      id: 1,
      publicId: 'test-worker-1',
      user: User(
        id: 2,
        publicId: 'test-worker-user-1',
        email: 'worker@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        role: 'worker',
      ),
      bio: 'Professional cleaner with 5+ years experience',
      rating: 4.8,
      reviewCount: 120,
      services: [],
    );

    final testService = Service(
      id: 1,
      publicId: 'test-service-1',
      name: 'Home Cleaning',
      description: 'Professional home cleaning service',
      category: 'Cleaning',
      basePrice: 500,
    );

    final testBookings = [
      Booking(
        id: '1',
        publicId: 'test-booking-1',
        startTime: DateTime.now().add(Duration(days: -1)),
        endTime: DateTime.now().add(Duration(days: -1, hours: 2)),
        status: BookingStatus.completed,
        amount: 500,
        isPaid: true,
        service: testService,
        user: testUser,
        worker: testWorker,
      ),
      Booking(
        id: '2',
        publicId: 'test-booking-2',
        startTime: DateTime.now().add(Duration(days: -1)),
        endTime: DateTime.now().add(Duration(days: -1, hours: 3)),
        status: BookingStatus.cancelled,
        amount: 0,
        isPaid: false,
        service: testService,
        user: testUser,
        worker: testWorker,
      ),
    ];

    testWidgets('HistoryScreen initializes correctly', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>(
              create: (_) => MockAuthProvider(),
            ),
            ChangeNotifierProvider<BookingProvider>(
              create: (_) => MockBookingProvider([]),
            ),
          ],
          child: MaterialApp(home: HistoryScreen()),
        ),
      );

      // Verify the screen is visible
      expect(find.byType(HistoryScreen), findsOneWidget);
      expect(find.text('Your services'), findsOneWidget);
    });

    testWidgets('HistoryScreen displays empty state when no bookings', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>(
              create: (_) => MockAuthProvider(),
            ),
            ChangeNotifierProvider<BookingProvider>(
              create: (_) => MockBookingProvider([]),
            ),
          ],
          child: MaterialApp(home: HistoryScreen()),
        ),
      );

      // Verify empty state
      expect(find.text('No services found.'), findsOneWidget);
    });

    testWidgets('HistoryScreen displays bookings grouped by date', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>(
              create: (_) => MockAuthProvider(),
            ),
            ChangeNotifierProvider<BookingProvider>(
              create: (_) => MockBookingProvider(testBookings),
            ),
          ],
          child: MaterialApp(home: HistoryScreen()),
        ),
      );

      // Verify bookings are displayed
      expect(find.text('Home Cleaning'), findsNWidgets(2));

      // Verify status labels
      expect(find.text('Completed'), findsOneWidget);
      expect(find.text('Cancelled'), findsOneWidget);

      // Verify price labels
      expect(find.text('₹500 paid'), findsOneWidget);
      expect(find.text('Price pending'), findsOneWidget);
    });

    testWidgets('HistoryScreen opens BookingDetailsScreen on booking tap', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>(
              create: (_) => MockAuthProvider(),
            ),
            ChangeNotifierProvider<BookingProvider>(
              create: (_) => MockBookingProvider(testBookings),
            ),
          ],
          child: MaterialApp(
            home: HistoryScreen(),
            routes: {
              '/booking-details': (context) =>
                  Scaffold(body: Text('Booking Details')),
            },
          ),
        ),
      );

      // Tap on the first booking
      await tester.tap(find.text('Home Cleaning').first);
      await tester.pumpAndSettle();

      // Verify we navigated to the details screen
      expect(find.text('Booking Details'), findsOneWidget);
    });

    testWidgets('HistoryScreen displays loading indicator when loading', (
      WidgetTester tester,
    ) async {
      await tester.pumpWidget(
        MultiProvider(
          providers: [
            ChangeNotifierProvider<AuthProvider>(
              create: (_) => MockAuthProvider(),
            ),
            ChangeNotifierProvider<BookingProvider>(
              create: (_) => LoadingBookingProvider(),
            ),
          ],
          child: MaterialApp(home: HistoryScreen()),
        ),
      );

      // Verify loading indicator is shown
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}
