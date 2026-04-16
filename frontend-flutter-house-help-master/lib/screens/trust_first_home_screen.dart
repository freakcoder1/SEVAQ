import 'package:flutter/material.dart';
import '../theme.dart';
import '../models/service.dart';
import '../models/booking.dart';
import '../models/category_availability.dart';
import '../models/worker.dart';
import '../models/user.dart';
import 'package:flutter_house_help/models/location.dart';
import '../providers/provider_manager.dart';
import '../providers/location_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/user_provider.dart';
import '../providers/service_provider.dart';
import '../providers/worker_provider.dart';
import '../providers/recommendation_provider.dart';
import '../providers/auth_provider.dart';
import '../models/recommendation.dart';
import '../services/api_service.dart';
import '../widgets/trust_first_header.dart';
import '../widgets/trust_first_recommendation.dart';
import '../widgets/trust_first_suggestions.dart';
import '../widgets/support_signal.dart';
import '../widgets/location_picker_dialog.dart';
import '../widgets/pre_service_reminder_banner.dart';
import '../widgets/booking_status_timeline.dart';
import '../widgets/compact_booking_status_indicator.dart';
import '../widgets/subscription_reminder_banner.dart';
import '../providers/booking_provider.dart';
import 'service_details_screen.dart';
import 'service_clarification_screen.dart';
import 'monitoring_dashboard_screen.dart';
import 'package:provider/provider.dart';

class TrustFirstHomeScreen extends StatefulWidget {
  const TrustFirstHomeScreen({Key? key}) : super(key: key);

  @override
  _TrustFirstHomeScreenState createState() => _TrustFirstHomeScreenState();
}

class _TrustFirstHomeScreenState extends State<TrustFirstHomeScreen> {
  late ApiService apiService;
  List<Service> services = [];
  List<Service> filteredServices = [];
  List<CategoryAvailability> categoryAvailability = [];
  bool _hasLoadedCategories = false;
  String searchQuery = '';
  bool isLoading = true;
  String errorMessage = '';
  ServiceProvider? _serviceProvider;
  WorkerProvider? _workerProvider;
  RecommendationProvider? _recommendationProvider;

  // New state for the trust-first layout
  String _locationText = 'Your Area';
  String _systemMessage = 'All services on track';
  Recommendation? _currentRecommendation;
  List<String> _suggestions = [];

  String _formatLocationText(dynamic locationData) {
    // Handle different location data formats
    if (locationData is Map) {
      // Handle Map format
      final address = locationData['address'] as String?;
      final latitude = locationData['latitude'] as double?;
      final longitude = locationData['longitude'] as double?;

      if (address != null && address.isNotEmpty) {
        // Check if address contains coordinates (fallback from location provider)
        if (address.contains('Lat:') && address.contains('Lng:')) {
          // Extract coordinates and format nicely
          return _formatCoordinatesFromAddress(address);
        }
        return address;
      } else if (latitude != null && longitude != null) {
        return 'Near coordinates (${latitude.toStringAsFixed(4)}, ${longitude.toStringAsFixed(4)})';
      }
    } else if (locationData != null) {
      // Handle object format with toString
      final address = locationData.address;
      final latitude = locationData.latitude;
      final longitude = locationData.longitude;

      if (address != null && address.isNotEmpty) {
        // Check if address contains coordinates (fallback from location provider)
        if (address.contains('Lat:') && address.contains('Lng:')) {
          // Extract coordinates and format nicely
          return _formatCoordinatesFromAddress(address);
        }
        return address;
      } else if (latitude != null && longitude != null) {
        return 'Near coordinates (${latitude.toStringAsFixed(4)}, ${longitude.toStringAsFixed(4)})';
      }
    }

    return 'Your Area';
  }

  String _formatCoordinatesFromAddress(String address) {
    // Extract coordinates from "Lat: X, Lng: Y" format
    final latMatch = RegExp(r'Lat:\s*([0-9.-]+)').firstMatch(address);
    final lngMatch = RegExp(r'Lng:\s*([0-9.-]+)').firstMatch(address);

    if (latMatch != null && lngMatch != null) {
      final lat = double.tryParse(latMatch.group(1)!);
      final lng = double.tryParse(lngMatch.group(1)!);

      if (lat != null && lng != null) {
        // Try to get a human-readable location name for these coordinates
        return _getHumanReadableLocation(lat, lng);
      }
    }

    // Fallback to original address
    return address;
  }

  String _getHumanReadableLocation(double latitude, double longitude) {
    // For Delhi/NCR area coordinates, return human-readable names
    if (latitude >= 28.4 &&
        latitude <= 28.9 &&
        longitude >= 76.8 &&
        longitude <= 77.5) {
      if (latitude >= 28.6 &&
          latitude <= 28.8 &&
          longitude >= 77.0 &&
          longitude <= 77.3) {
        return 'New Delhi';
      } else if (latitude >= 28.4 &&
          latitude <= 28.6 &&
          longitude >= 77.2 &&
          longitude <= 77.5) {
        return 'Greater Noida';
      } else if (latitude >= 28.5 &&
          latitude <= 28.7 &&
          longitude >= 77.0 &&
          longitude <= 77.2) {
        return 'Noida';
      } else if (latitude >= 28.7 &&
          latitude <= 28.9 &&
          longitude >= 77.0 &&
          longitude <= 77.3) {
        return 'North Delhi';
      }
    }

    // For other areas, return a general area name or coordinates
    return 'Near coordinates (${latitude.toStringAsFixed(4)}, ${longitude.toStringAsFixed(4)})';
  }

  @override
  void initState() {
    super.initState();
    apiService = ApiService();
    _loadHomeData();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRecommendations();
      // Fetch bookings to check for pre-service reminders
      final bookingProvider = ProviderManager.safeGetProvider<BookingProvider>(
        context,
        listen: false,
      );
      if (bookingProvider != null) {
        debugPrint('TrustFirstHomeScreen: Calling fetchBookings()');
        bookingProvider.fetchBookings();
      } else {
        debugPrint('TrustFirstHomeScreen: BookingProvider not available');
      }
    });
  }

  Future<void> _loadHomeData() async {
    if (!mounted) return;

    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      final response = await apiService.get('services');

      if (!mounted) return;

      setState(() {
        // Handle paginated response format: { data: [...], meta: {...} }
        final List<dynamic> servicesData = response['data'] ?? [];
        services = servicesData.map((item) => Service.fromJson(item)).toList();
        filteredServices = services;
        isLoading = false;
      });
    } catch (e) {
      if (!mounted) return;

      setState(() {
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  Future<void> _loadRecommendations() async {
    final locationProvider = ProviderManager.safeGetProvider<LocationProvider>(
      context,
    );
    final workerProvider = ProviderManager.safeGetProvider<WorkerProvider>(
      context,
    );
    final serviceProvider = ProviderManager.safeGetProvider<ServiceProvider>(
      context,
    );
    final userProvider = ProviderManager.safeGetProvider<UserProvider>(context);
    final recommendationProvider =
        ProviderManager.safeGetProvider<RecommendationProvider>(context);

    if (locationProvider == null ||
        workerProvider == null ||
        serviceProvider == null ||
        userProvider == null ||
        recommendationProvider == null) {
      return;
    }

    try {
      await recommendationProvider.generateRecommendations(
        workerProvider: workerProvider,
        serviceProvider: serviceProvider,
        locationProvider: locationProvider,
        userProvider: userProvider,
      );

      // Update location text with enhanced formatting
      if (locationProvider.currentLocationData != null) {
        final locationData = locationProvider.currentLocationData!;
        setState(() {
          _locationText = _formatLocationText(locationData);
        });
      }

      // Generate system message based on availability
      final hasWorkers =
          recommendationProvider.currentRecommendation?.worker != null;
      setState(() {
        _systemMessage = hasWorkers
            ? 'All services on track'
            : 'We’re monitoring availability in your area';

        _currentRecommendation = recommendationProvider.currentRecommendation;

        // Generate muted suggestions (max 2)
        if (services.isNotEmpty) {
          _suggestions = ['Usually booked at this time', 'Common in your area'];
        }
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load recommendations: $e';
      });
    }
  }

  void _handlePrimaryRecommendation() {
    print('🔍 DEBUG: _handlePrimaryRecommendation called');
    print('🔍 DEBUG: _currentRecommendation is: $_currentRecommendation');
    if (_currentRecommendation != null) {
      print('🔍 DEBUG: Navigating to Service Clarification Page');
      // Get userId from AuthProvider using the new getter (includes fallback to cached value)
      final authProvider = Provider.of<AuthProvider>(context, listen: false);
      final userId = authProvider.userId;

      // Get location from LocationProvider
      final locationProvider = Provider.of<LocationProvider>(
        context,
        listen: false,
      );
      final Location? initialLocation = locationProvider.currentLocationData;

      print('🔍 DEBUG: userId from AuthProvider: $userId');

      // Navigate to Service Clarification Page with userId and location
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => MultiProvider(
            providers: [
              ChangeNotifierProvider<AuthProvider>.value(value: authProvider),
              ChangeNotifierProvider<LocationProvider>.value(
                value: locationProvider,
              ),
            ],
            child: ServiceClarificationScreen(
              userId: userId,
              initialLocation: initialLocation,
            ),
          ),
        ),
      );
    } else {
      print('🔍 DEBUG: No recommendation available');
    }
  }

  void _navigateToServiceDetails(Service service) {
    final workerProvider = _workerProvider;

    // Get userId from AuthProvider using the new getter (includes fallback to cached value)
    final authProvider = Provider.of<AuthProvider>(context, listen: false);
    final userId = authProvider.userId;

    if (userId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('User not logged in'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (workerProvider != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) =>
              ServiceDetailsScreen(service: service, userId: userId),
        ),
      );
    } else {
      final fallbackProvider = ProviderManager.safeGetProvider<WorkerProvider>(
        context,
      );
      if (fallbackProvider != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                ServiceDetailsScreen(service: service, userId: userId),
          ),
        );
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) =>
                ServiceDetailsScreen(service: service, userId: userId),
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final themeProvider = ProviderManager.safeGetProvider<ThemeProvider>(
      context,
    );
    final locationProvider = ProviderManager.safeGetProvider<LocationProvider>(
      context,
    );
    _serviceProvider = ProviderManager.safeGetProvider<ServiceProvider>(
      context,
    );
    _workerProvider = ProviderManager.safeGetProvider<WorkerProvider>(context);
    _recommendationProvider =
        ProviderManager.safeGetProvider<RecommendationProvider>(context);
    final authProvider = ProviderManager.safeGetProvider<AuthProvider>(context);
    final userId = authProvider?.user?.id;
    final initialLocation = locationProvider?.currentLocationData;

    final isDarkMode = themeProvider?.isDarkMode ?? false;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'Sevaq',
          style: TextStyle(
            color: Theme.of(context).colorScheme.onSurface,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: Theme.of(context).scaffoldBackgroundColor,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              Icons.location_on,
              color: locationProvider?.currentLocationData != null
                  ? AppTheme.successColor
                  : AppTheme.errorColor,
              size: 24,
            ),
            onPressed: () {
              _showLocationDialog(context, locationProvider);
            },
            tooltip: 'Change Location',
          ),
        ],
      ),
      body: isLoading
          ? _buildLoadingIndicator()
          : errorMessage.isNotEmpty
          ? _buildErrorWidget()
          : _buildTrustFirstContent(
              locationProvider ?? LocationProvider(),
              userId: userId,
              initialLocation: initialLocation,
            ),
    );
  }

  Widget _buildLoadingIndicator() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(color: Theme.of(context).primaryColor),
          SizedBox(height: 16),
          Text(
            'Loading services...',
            style: TextStyle(
              fontSize: 16,
              color: Theme.of(context).textTheme.bodyMedium?.color,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildErrorWidget() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.error, size: 64, color: Colors.red),
          SizedBox(height: 16),
          Text(
            'Failed to load services',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(errorMessage),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadHomeData,
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text('Retry', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );
  }

  Widget _buildTrustFirstContent(
    LocationProvider locationProvider, {
    required dynamic userId,
    Location? initialLocation,
  }) {
    return RefreshIndicator(
      onRefresh: () async {
        await _loadHomeData();
        await _loadRecommendations();
      },
      child: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 1️⃣ TRUST HEADER (TOP)
            TrustFirstHeader(
              location: _locationText,
              systemMessage: _systemMessage,
            ),

            SizedBox(height: 16),

            // Compact booking status indicator - shows active booking progress
            Consumer<BookingProvider>(
              builder: (context, bookingProvider, child) {
                final activeBooking = bookingProvider.upcomingBooking;

                if (activeBooking == null) {
                  return const SizedBox.shrink();
                }

                return CompactBookingStatusIndicator(
                  bookingStatus: activeBooking.status,
                  onTap: () {
                    // Navigation will be implemented later, for now just log tap
                    debugPrint(
                      'Booking status indicator tapped for booking: ${activeBooking.publicId}',
                    );
                  },
                );
              },
            ),

            SizedBox(height: 16),

            // Pre-Service Reminder Banner
            PreServiceReminderBanner(
              authProvider: ProviderManager.safeGetProvider<AuthProvider>(
                context,
                listen: false,
              ),
              bookingProvider: ProviderManager.safeGetProvider<BookingProvider>(
                context,
                listen: false,
              ),
            ),

            SizedBox(height: 16),

            // Subscription Reminder Banner
            SubscriptionReminderBanner(
              authProvider: ProviderManager.safeGetProvider<AuthProvider>(
                context,
                listen: false,
              ),
              bookingProvider: ProviderManager.safeGetProvider<BookingProvider>(
                context,
                listen: false,
              ),
            ),

            SizedBox(height: 16),

            // 2️⃣ PRIMARY RECOMMENDATION (HERO CARD)
            _currentRecommendation != null
                ? TrustFirstRecommendation(
                    recommendation: _currentRecommendation!,
                    onAccept: _handlePrimaryRecommendation,
                  )
                : services.isNotEmpty
                ? TrustFirstRecommendation(
                    recommendation: Recommendation(
                      service: services.first,
                      worker: Worker(
                        id: 1,
                        publicId: 'fallback-worker-001',
                        user: User(
                          id: 1,
                          publicId: 'fallback-user-001',
                          email: 'fallback@example.com',
                          firstName: 'Available',
                          lastName: 'Professional',
                          role: 'worker',
                        ),
                        bio: 'Available professional',
                        rating: 4.5,
                        reviewCount: 10,
                        services: [],
                      ),
                      estimatedArrivalTime: 30,
                      reliabilityScore: 0.8,
                      reasoning: 'Popular service in your area',
                      title: 'Recommended service',
                    ),
                    onAccept: () {
                      print('🔍 DEBUG: Fallback recommendation CTA clicked');
                      // Get providers BEFORE navigation
                      final authProvider = Provider.of<AuthProvider>(
                        context,
                        listen: false,
                      );
                      final locationProvider = Provider.of<LocationProvider>(
                        context,
                        listen: false,
                      );

                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => MultiProvider(
                            providers: [
                              ChangeNotifierProvider<AuthProvider>.value(
                                value: authProvider,
                              ),
                              ChangeNotifierProvider<LocationProvider>.value(
                                value: locationProvider,
                              ),
                            ],
                            child: ServiceClarificationScreen(
                              userId: userId,
                              initialLocation: initialLocation,
                            ),
                          ),
                        ),
                      );
                    },
                  )
                : SizedBox.shrink(),

            SizedBox(height: 16),

            // 3️⃣ BRAND EXPLANATION (NEW)
            Container(
              margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: Text(
                'One request. We handle assignment, tracking, and support.',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.2,
                  height: 1.4,
                ),
                textAlign: TextAlign.center,
              ),
            ),

            // 4️⃣ SECONDARY CLARIFICATION CTA (EXISTING)
            Center(
              child: TextButton(
                onPressed: () {
                  print('🔍 DEBUG: Secondary CTA clicked - See all services');
                  // Get providers BEFORE navigation
                  final authProvider = Provider.of<AuthProvider>(
                    context,
                    listen: false,
                  );
                  final locationProvider = Provider.of<LocationProvider>(
                    context,
                    listen: false,
                  );

                  // Navigate to Service Clarification Page for exploration
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => MultiProvider(
                        providers: [
                          ChangeNotifierProvider<AuthProvider>.value(
                            value: authProvider,
                          ),
                          ChangeNotifierProvider<LocationProvider>.value(
                            value: locationProvider,
                          ),
                        ],
                        child: ServiceClarificationScreen(
                          userId: userId,
                          initialLocation: initialLocation,
                        ),
                      ),
                    ),
                  );
                },
                style: TextButton.styleFrom(
                  padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  tapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
                child: Text(
                  'Not sure what you need? See all services →',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                    letterSpacing: 0.2,
                  ),
                ),
              ),
            ),

            SizedBox(height: 8),

            // Support signal is now integrated into the header
          ],
        ),
      ),
    );
  }

  void _showLocationDialog(
    BuildContext context,
    LocationProvider? locationProvider,
  ) {
    final provider = locationProvider ?? LocationProvider();

    showDialog(
      context: context,
      builder: (BuildContext context) {
        return LocationPickerDialog(locationProvider: provider);
      },
    ).then((_) {
      if (provider.currentLocationData != null) {
        _loadRecommendations();
      }
    });
  }
}
