// Hot reload triggered - Flutter app is running on Motorola Edge 60 Fusion
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'providers/theme_provider.dart';
import 'providers/auth_provider.dart';
import 'providers/location_provider.dart';
import 'providers/user_provider.dart';
import 'providers/booking_provider.dart';
import 'providers/review_provider.dart';
import 'providers/service_provider.dart';
import 'providers/worker_provider.dart';
import 'providers/slot_provider.dart';
import 'providers/recommendation_provider.dart';
import 'providers/monitoring_provider.dart';
import 'screens/auth_wrapper.dart';
import 'screens/main_navigation.dart';
import 'screens/home_screen.dart';
import 'screens/category_screen.dart';
import 'screens/service_details_screen.dart';
import 'screens/splash_screen.dart';

void main() async {
  // Preload SharedPreferences synchronously to prevent navigation loop
  // This ensures location state is available immediately on app start/resume
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  runApp(SevaqApp(prefs: prefs));
}

class SevaqApp extends StatelessWidget {
  final SharedPreferences prefs;
  const SevaqApp({super.key, required this.prefs});

  @override
  Widget build(BuildContext context) {
    // Pre-initialize AuthProvider's static prefs instance for synchronous auth restore
    AuthProvider.prefsInstance = prefs;

    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => LocationProvider(prefs: prefs)),
        ChangeNotifierProvider(create: (_) => UserProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => ReviewProvider()),
        ChangeNotifierProvider(create: (_) => ServiceProvider()),
        ChangeNotifierProvider(create: (_) => WorkerProvider()),
        ChangeNotifierProvider(create: (_) => SlotProvider()),
        ChangeNotifierProvider(create: (_) => RecommendationProvider()),
        ChangeNotifierProvider(create: (_) => MonitoringProvider()),
      ],
      child: const SevaqAppMaterial(),
    );
  }
}

class SevaqAppMaterial extends StatelessWidget {
  const SevaqAppMaterial({super.key});

  @override
  Widget build(BuildContext context) {
    // Get ThemeProvider from the existing MultiProvider (wrapped above)
    final isDarkMode = context.watch<ThemeProvider>().isDarkMode;

    return MaterialApp(
      title: 'Sevaq - House Help Services',
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: ThemeData.light(),
      darkTheme: ThemeData.dark(),
      debugShowCheckedModeBanner: false,
      // Use a Builder to capture the correct context with providers
      home: Builder(
        builder: (context) {
          // Store the context for route generation
          return WillPopScope(
            onWillPop: () async {
              // Prevent the app from closing when back button is pressed
              // This keeps the app running even when on the main navigation
              return false;
            },
            child: Navigator(
              onGenerateRoute: (settings) => _generateRoute(settings, context),
            ),
          );
        },
      ),
      initialRoute: '/',
    );
  }
}

Route<dynamic> _generateRoute(RouteSettings settings, BuildContext context) {
  switch (settings.name) {
    case '/':
      return MaterialPageRoute(builder: (_) => const SplashScreen());
    case '/home':
      return MaterialPageRoute(builder: (_) => const MainNavigation());
    case '/auth':
      return MaterialPageRoute(builder: (_) => const AuthWrapper());
    default:
      return MaterialPageRoute(builder: (_) => const SplashScreen());
  }
}
