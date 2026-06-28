import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';
import 'package:http/http.dart' as http;

import '../lib/screens/booking_screen.dart';
import '../lib/screens/assignment_confirmed_screen.dart';
import '../lib/screens/assignment_in_progress_screen.dart';
import '../lib/models/worker.dart';
import '../lib/models/service.dart';
import '../lib/models/slot.dart';
import '../lib/models/user.dart';
import '../lib/services/api_service.dart';
import '../lib/providers/auth_provider.dart';

// Mock classes
class MockApiService extends Mock implements ApiService {
  @override
  Future<Map<String, dynamic>> get(String endpoint) async {
    return {
      'status': 'assigned',
      'assignmentId': 'assignment123',
      'worker': {
        'id': 'worker123',
        'user': {'firstName': 'John', 'lastName': 'Doe'},
      },
    };
  }
}

class MockAuthProvider extends Mock implements AuthProvider {}

void main() {
  late MockApiService mockApiService;
  late MockAuthProvider mockAuthProvider;
  late Widget testWidget;

  setUp(() {
    mockApiService = MockApiService();
    mockAuthProvider = MockAuthProvider();

    // Create test data
    final testUser = User(
      id: '1',
      publicId: 'user123-public-id',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      role: 'customer',
    );

    final testWorker = Worker(
      id: '1',
      publicId: 'worker123-public-id',
      user: User(
        id: '2',
        publicId: 'workerUser123-public-id',
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        role: 'worker',
      ),
      bio: 'Experienced cleaner',
      rating: 4.5,
      reviewCount: 10,
      services: [],
    );

    final testService = Service(
      id: '1',
      publicId: 'service123-public-id',
      name: 'Home Cleaning',
      description: 'Complete home cleaning service',
      basePrice: 500.0,
      category: 'household',
    );

    final testSlot = Slot(
      id: 'slot123',
      workerId: 'worker123',
      startTime: DateTime.now().add(Duration(hours: 2)),
      endTime: DateTime.now().add(Duration(hours: 4)),
      isBooked: false,
    );

    testWidget = MultiProvider(
      providers: [
        Provider<ApiService>.value(value: mockApiService),
        ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
      ],
      child: MaterialApp(
        home: BookingScreen(
          slot: testSlot,
          service: testService,
        ),
      ),
    );
  });

  group('Assignment System Integration', () {
    testWidgets('Booking screen integrates with assignment system', (
      WidgetTester tester,
    ) async {
      // Setup mocks
      when(mockAuthProvider.user).thenReturn(
        User(
          id: '1',
          publicId: 'user123-public-id',
          firstName: 'Test',
          lastName: 'User',
          email: 'test@example.com',
          role: 'customer',
        ),
      );

      // Build the widget
      await tester.pumpWidget(testWidget);

      // Verify the booking screen is displayed
      expect(find.text('Confirm Booking'), findsOneWidget);
      expect(find.text('Booking Summary'), findsOneWidget);
    });
  });
}