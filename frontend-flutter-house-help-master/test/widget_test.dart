import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../lib/screens/splash_screen.dart';
import '../lib/providers/theme_provider.dart';
import '../lib/providers/auth_provider.dart';
import '../lib/providers/location_provider.dart';

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();

  testWidgets('Splash screen widget displays correct content', (
    WidgetTester tester,
  ) async {
    // Mock SharedPreferences
    SharedPreferences.setMockInitialValues({});

    // Get the mocked SharedPreferences instance
    final prefs = await SharedPreferences.getInstance();

    // Build the splash screen directly with required providers
    await tester.pumpWidget(
      MultiProvider(
        providers: [
          ChangeNotifierProvider(create: (_) => ThemeProvider()),
          ChangeNotifierProvider(create: (_) => AuthProvider()),
          ChangeNotifierProvider(create: (_) => LocationProvider()),
        ],
        child: MaterialApp(
          home: const SplashScreen(),
          onGenerateRoute: (settings) {
            // Mock route generator to prevent navigation errors
            return MaterialPageRoute(builder: (_) => Container());
          },
        ),
      ),
    );

    // Wait for the text animation to reach a value > 10
    await tester.pump(const Duration(milliseconds: 500));

    // Verify that the splash screen content is displayed
    expect(find.text('Sevaq'), findsOneWidget);
    expect(find.text('Your trusted home services partner'), findsOneWidget);
  });
}
