// Hot reload triggered - Flutter app is running on Motorola Edge 60 Fusion
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'theme.dart';
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
import 'screens/login_screen.dart';
import 'screens/location_first_splash_screen.dart';
import 'screens/admin/admin_login_screen.dart';
import 'screens/admin/admin_main_screen.dart';
import 'services/firebase_messaging_service.dart';
import 'services/navigation_service.dart';

void main() async {
  // Preload SharedPreferences synchronously to prevent navigation loop
  // This ensures location state is available immediately on app start/resume
  WidgetsFlutterBinding.ensureInitialized();
  final prefs = await SharedPreferences.getInstance();

  // Initialize Firebase Messaging
  await FirebaseMessagingService.initialize();

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
        ChangeNotifierProvider<AuthProvider>(
          create: (_) {
            final authProvider = AuthProvider();
            // Set static instance so screens can access AuthProvider.instance directly
            AuthProvider.instance = authProvider;
            debugPrint('main.dart: AuthProvider static instance set');
            return authProvider;
          },
        ),
        ChangeNotifierProvider(create: (_) => LocationProvider()),
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

    // Use singleton NavigationService's navigatorKey
    final navigationService = NavigationService();

    return MaterialApp(
      title: 'Sevaq - House Help Services',
      themeMode: isDarkMode ? ThemeMode.dark : ThemeMode.light,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      debugShowCheckedModeBanner: false,
      navigatorKey: navigationService.navigatorKey,
      home: const AuthWrapper(),
      routes: {
        '/auth': (_) => const AuthWrapper(),
        '/home': (_) => const MainNavigation(),
        '/splash': (_) => const SplashScreen(),
        '/login': (_) => LoginScreen(),
        '/location-setup': (_) => LocationFirstSplashScreen(),
        // Admin Routes
        '/admin/login': (_) => const AdminLoginScreen(),
        '/admin/home': (_) => const AdminMainScreen(),
      },
    );
  }
}
