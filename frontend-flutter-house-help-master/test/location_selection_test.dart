import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:mockito/mockito.dart';
import '../lib/providers/location_provider.dart';
import '../lib/widgets/location_selection_popup.dart';
import '../lib/models/location.dart' as models;

// Mock classes for testing
class MockLocationProvider extends Mock implements LocationProvider {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  group('Location Selection Popup', () {
    late MockLocationProvider mockLocationProvider;
    late Widget testWidget;

    setUp(() {
      mockLocationProvider = MockLocationProvider();
      testWidget = MaterialApp(
        home: ChangeNotifierProvider.value(
          value: mockLocationProvider,
          child: Builder(
            builder: (context) => LocationSelectionPopup(
              onLocationSelected: () {},
              isNewUser: true,
            ),
          ),
        ),
      );
    });

    testWidgets('displays popup with correct title for new users', (
      WidgetTester tester,
    ) async {
      // Setup mock data
      when(mockLocationProvider.recentLocations).thenReturn([]);
      when(mockLocationProvider.currentLocationData).thenReturn(null);

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      // Verify popup title
      expect(find.text('Welcome!'), findsOneWidget);
      expect(
        find.text('Let\'s set your location to get started'),
        findsOneWidget,
      );
    });

    testWidgets('displays popup with correct title for returning users', (
      WidgetTester tester,
    ) async {
      // Setup mock data for returning user
      when(mockLocationProvider.recentLocations).thenReturn([]);
      when(mockLocationProvider.currentLocationData).thenReturn(null);

      await tester.pumpWidget(
        MaterialApp(
          home: ChangeNotifierProvider.value(
            value: mockLocationProvider,
            child: Builder(
              builder: (context) => LocationSelectionPopup(
                onLocationSelected: () {},
                isNewUser: false,
              ),
            ),
          ),
        ),
      );
      await tester.pumpAndSettle();

      // Verify popup title
      expect(find.text('Select Location'), findsOneWidget);
      expect(
        find.text('Choose how you\'d like to set your location'),
        findsOneWidget,
      );
    });

    testWidgets('displays location options', (WidgetTester tester) async {
      // Setup mock data
      when(mockLocationProvider.recentLocations).thenReturn([]);
      when(mockLocationProvider.currentLocationData).thenReturn(null);

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      // Verify location options are displayed
      expect(find.text('Use Current Location'), findsOneWidget);
      expect(find.text('Add New Address'), findsOneWidget);
      expect(
        find.text('Detect your location automatically using GPS'),
        findsOneWidget,
      );
      expect(
        find.text('Search for and select a specific address'),
        findsOneWidget,
      );
    });

    testWidgets('displays saved locations option when available', (
      WidgetTester tester,
    ) async {
      // Setup mock data with saved locations
      final mockLocation = models.Location(
        address: '123 Test Street, Test City',
        latitude: 12.34,
        longitude: 56.78,
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
      );
      when(mockLocationProvider.recentLocations).thenReturn([mockLocation]);
      when(mockLocationProvider.currentLocationData).thenReturn(null);

      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      // Verify saved locations option is displayed
      expect(find.text('Choose from Saved'), findsOneWidget);
      expect(
        find.text('Select from your previously saved locations'),
        findsOneWidget,
      );
    });

    testWidgets('handles close button tap', (WidgetTester tester) async {
      await tester.pumpWidget(testWidget);
      await tester.pumpAndSettle();

      // Tap close button
      await tester.tap(find.byIcon(Icons.close));
      await tester.pumpAndSettle();

      // Verify popup is dismissed (should not find the popup content anymore)
      expect(find.text('Welcome!'), findsNothing);
    });
  });

  group('Location Provider', () {
    late LocationProvider locationProvider;

    setUp(() {
      locationProvider = LocationProvider();
    });

    test('initializes with default values', () {
      expect(locationProvider.currentLocation, isNull);
      expect(locationProvider.isLoading, false);
      expect(locationProvider.recentLocations, []);
      expect(locationProvider.currentLocationData, isNull);
    });

    test('hasShownLocationPopup defaults to false', () {
      expect(locationProvider.hasShownLocationPopup, false);
    });

    test('needsLocationSetup returns true when no location is set', () {
      expect(locationProvider.needsLocationSetup(), true);
    });

    test('needsLocationSetup returns false when location is set', () {
      // Set a location to test the method
      final testLocation = models.Location(
        address: 'Test Address',
        latitude: 12.34,
        longitude: 56.78,
      );
      locationProvider.setManualLocation(testLocation);
      expect(locationProvider.needsLocationSetup(), false);
    });
  });
}
