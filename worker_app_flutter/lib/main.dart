import 'dart:async';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:permission_handler/permission_handler.dart';

import 'config/app_config.dart';
import 'providers/auth_provider.dart';
import 'providers/booking_provider.dart';
import 'providers/earnings_provider.dart';
import 'screens/login_screen.dart';
import 'screens/main_screen.dart';
import 'screens/full_screen_booking_screen.dart';
import 'firebase_options.dart';
import 'firebase_messaging_background_handler.dart';
import 'services/notification_service.dart';
import 'services/sound_service.dart';
import 'services/localization_service.dart';
import 'widgets/new_booking_dialog.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(
    options: defaultFirebaseOptions.currentPlatform,
  );

  // Register background message handler (MUST be before runApp)
  await initializeBackgroundMessageHandler();

  // Request notification permission for Android 13+
  await _requestNotificationPermission();

  // Initialize services
  await _initializeServices();

  // Print API config for debugging
  debugPrint('=== Worker App Starting ===');
  debugPrint('API Base URL: ${AppConfig.apiBaseUrl}');

  runApp(const WorkerApp());
}

/// Request notification permission for Android 13+
Future<void> _requestNotificationPermission() async {
  try {
    if (Platform.isAndroid) {
      // Small delay to ensure Flutter binding is fully initialized
      await Future.delayed(const Duration(milliseconds: 500));

      final status = await Permission.notification.status;
      if (status.isDenied) {
        debugPrint('Requesting notification permission...');
        final result = await Permission.notification.request();
        debugPrint('Notification permission result: $result');
      } else if (status.isGranted) {
        debugPrint('Notification permission already granted');
      } else if (status.isPermanentlyDenied) {
        debugPrint('Notification permission permanently denied');
      }
    }
  } catch (e) {
    debugPrint('Error requesting notification permission: $e');
  }
}

/// Initialize all services
Future<void> _initializeServices() async {
  // Initialize notification service
  final notificationService = NotificationService();
  await notificationService.initialize();
  // Register FCM token with backend
  await notificationService.registerTokenWithBackend();

  // Initialize sound service
  final soundService = SoundService();
  await soundService.initialize();

  // Initialize localization (default to Hindi)
  final localizationService = LocalizationService();
  localizationService.setLocale(const Locale('hi', 'IN'));

  debugPrint('All services initialized');
}

class WorkerApp extends StatelessWidget {
  const WorkerApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => EarningsProvider()),
      ],
      child: MaterialApp(
        title: 'SEVAQ Worker',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
          cardTheme: CardThemeData(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(12),
              ),
            ),
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

/// AuthWrapper - handles authentication state and routes to appropriate screen
class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> with WidgetsBindingObserver {
  StreamSubscription<Map<String, dynamic>>? _newBookingSubscription;
  // Track recently shown booking IDs to prevent duplicate dialogs
  final Set<String> _recentlyShownBookingIds = {};
  static const Duration _dedupWindow = Duration(seconds: 30);

  // Store last received booking data for fallback dialog
  Map<String, dynamic>? _lastBookingData;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    // Check auth status on startup
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<AuthProvider>().checkAuth();
    });
    // Listen for real-time FCM booking notifications
    _listenForNewBookings();
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _newBookingSubscription?.cancel();
    super.dispose();
  }

  /// Listen to FCM new booking stream for real-time updates
  void _listenForNewBookings() {
    _newBookingSubscription = NotificationService.onNewBooking.listen((data) {
      debugPrint('=== FCM New Booking Received ===');
      debugPrint('Booking data: $data');

      // Store the booking data for fallback dialog
      _lastBookingData = data;

      // Check if this is a full-screen booking notification
      final isFullScreen = data['fullScreen'] == 'true' ||
          data['full_screen'] == 'true' ||
          data['type'] == 'full_screen_booking';

      if (isFullScreen) {
        // Show full-screen notification
        _showFullScreenBookingDialog(data);
        return;
      }

      // Show the new booking dialog with sound
      // This will also fetch bookings and update the UI
      final bookingId = data['bookingId']?.toString();
      if (bookingId != null) {
        // Deduplicate: skip if this booking was shown recently
        if (_recentlyShownBookingIds.contains(bookingId)) {
          debugPrint('Skipping duplicate notification for booking: $bookingId');
          return;
        }
        _showNewBookingDialog(bookingId);
      } else {
        // No booking ID - just refresh bookings
        context.read<BookingProvider>().fetchBookings();
      }
    });

    // Process any stored initial message (from notification tap when app was terminated)
    NotificationService().processInitialMessage();
  }

  /// Show full-screen booking dialog that takes over the entire screen
  void _showFullScreenBookingDialog(Map<String, dynamic> data) {
    final bookingId = data['bookingId']?.toString() ?? 'unknown';
    final serviceName = data['serviceName'] ?? 'Service';
    final serviceDate = data['serviceDate'] ?? '';
    final startTime = data['startTime'] ?? '';
    final customerName = data['customerName'] ?? 'Customer';
    final customerAddress = data['customerAddress'];
    final price = data['price'] ?? '0';

    // Mark this booking as recently shown to prevent duplicates
    _recentlyShownBookingIds.add(bookingId);
    Future.delayed(_dedupWindow, () {
      _recentlyShownBookingIds.remove(bookingId);
    });

    if (!mounted) return;

    // Navigate to full-screen booking screen
    Navigator.of(context).push(
      MaterialPageRoute(
        fullscreenDialog: true,
        builder: (context) => FullScreenBookingScreen(
          bookingId: bookingId,
          serviceName: serviceName,
          serviceDate: serviceDate,
          startTime: startTime,
          customerName: customerName,
          customerAddress: customerAddress,
          price: price,
        ),
      ),
    );
  }

  /// Show the new booking dialog with sound
  void _showNewBookingDialog(String bookingId) {
    // Fetch bookings and wait for completion before showing dialog
    _showNewBookingDialogAsync(bookingId);
  }

  Future<void> _showNewBookingDialogAsync(String bookingId) async {
    // Mark this booking as recently shown to prevent duplicates
    _recentlyShownBookingIds.add(bookingId);
    // Clean up old entries after the dedup window
    Future.delayed(_dedupWindow, () {
      _recentlyShownBookingIds.remove(bookingId);
    });

    // First, fetch the latest bookings
    final bookingProvider = context.read<BookingProvider>();
    await bookingProvider.fetchBookings();

    if (!mounted) return;

    // Find the new booking
    final newBooking = bookingProvider.bookings
        .where((b) => b.id.toString() == bookingId)
        .firstOrNull;

    if (newBooking != null) {
      // Build dialog data from booking
      final dialogData = NewBookingDialogData(
        bookingId: newBooking.id.toString(),
        serviceName: newBooking.serviceName.isNotEmpty
            ? newBooking.serviceName
            : 'Service',
        serviceDate: newBooking.scheduledDate,
        startTime: newBooking.startTime,
        customerName: newBooking.customerName.isNotEmpty
            ? newBooking.customerName
            : 'Customer',
        customerAddress: newBooking.customerAddress,
        price: '₹${newBooking.price.toStringAsFixed(0)}',
      );

      if (mounted) {
        showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => NewBookingDialog(
            data: dialogData,
            onViewDetails: () {
              // Dialog already dismisses itself in _viewDetails()
              // Navigate to booking details screen
              Navigator.of(context).pushNamed(
                '/booking-details',
                arguments: dialogData.bookingId,
              );
            },
          ),
        );
      }
    } else {
      // Show a generic new booking notification with dialog and sound
      _showNewBookingDialogWithData(_lastBookingData ?? {});
    }
  }

  /// Show a new booking dialog with data from FCM message
  void _showNewBookingDialogWithData(Map<String, dynamic> data) {
    if (!mounted) return;

    final bookingId = data['bookingId']?.toString() ?? 'unknown';
    final serviceName = data['serviceName'] ?? 'Service';
    final serviceDate = data['serviceDate'] ?? '';
    final startTime = data['startTime'] ?? '';

    // Mark this booking as recently shown to prevent duplicates
    _recentlyShownBookingIds.add(bookingId);
    Future.delayed(_dedupWindow, () {
      _recentlyShownBookingIds.remove(bookingId);
    });

    // Build dialog data from FCM payload
    final dialogData = NewBookingDialogData(
      bookingId: bookingId,
      serviceName: serviceName,
      serviceDate: serviceDate,
      startTime: startTime,
      customerName: 'Customer',
      price: '₹0',
    );

    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => NewBookingDialog(
        data: dialogData,
        onViewDetails: () {
          // Dialog already dismisses itself in _viewDetails()
          // Navigate to bookings screen
          context.read<BookingProvider>().fetchBookings();
        },
      ),
    );
  }

  /// Show a generic new booking notification if we can't find the specific booking
  void _showGenericNewBookingNotification() {
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: const Text('नया काम मिला! (New booking assigned!)'),
          backgroundColor: Colors.green,
          duration: const Duration(seconds: 5),
          action: SnackBarAction(
            label: 'View',
            textColor: Colors.white,
            onPressed: () {
              context.read<BookingProvider>().fetchBookings();
            },
          ),
        ),
      );
    }
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    super.didChangeAppLifecycleState(state);
    debugPrint('App lifecycle state: $state');

    // Notify booking provider of lifecycle changes
    context.read<BookingProvider>().handleAppLifecycleChanged(state);

    // Refresh auth and bookings when app resumes
    if (state == AppLifecycleState.resumed) {
      final auth = context.read<AuthProvider>();
      if (auth.isAuthenticated) {
        auth.fetchWorkerProfile();

        // BookingProvider lifecycle handler already does fetch silently
        // Removed duplicate fetch call - no double requests

        // Also try to register FCM token (in case it failed during login)
        _registerFcmTokenIfNeeded();
      }
    }
  }

  /// Register FCM token if not already registered
  void _registerFcmTokenIfNeeded() {
    final notificationService = NotificationService();
    final fcmToken = notificationService.fcmToken;
    if (fcmToken != null) {
      debugPrint('Attempting FCM token registration on app resume');
      notificationService.retryRegisterToken();
    } else {
      debugPrint(
          'FCM token is null, cannot register - re-initializing notifications');
      notificationService.initialize().then((_) {
        if (notificationService.fcmToken != null) {
          notificationService.retryRegisterToken();
        }
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        // Show loading while checking auth
        if (auth.isLoading) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('Loading...'),
                ],
              ),
            ),
          );
        }

        // Route based on auth status
        if (auth.isAuthenticated) {
          return const WorkerMainScreen();
        } else {
          return const WorkerLoginScreen();
        }
      },
    );
  }
}
