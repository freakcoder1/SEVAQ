// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../lib/main.dart';
import '../lib/providers/theme_provider.dart';
import '../lib/providers/auth_provider.dart';
import '../lib/providers/location_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('App launches and shows splash screen', (
    WidgetTester tester,
  ) async {
    // Mock SharedPreferences
    SharedPreferences.setMockInitialValues({});

    // Get the mocked SharedPreferences instance
    final prefs = await SharedPreferences.getInstance();

    // Build our app and trigger a frame with all required providers
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => LocationProvider(prefs: prefs)),
        ],
        child: SevaqApp(prefs: prefs),
      ),
    );

    // Wait for the splash screen to load
    await tester.pumpAndSettle();

    // Verify that the splash screen is displayed
    expect(find.text('Welcome to Sevaq'), findsOneWidget);
    expect(find.text('Your trusted home service partner'), findsOneWidget);
  });
}
