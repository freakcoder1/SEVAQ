import 'package:flutter/material.dart';
import '../models/service.dart';
import '../models/category_availability.dart';
import '../models/worker.dart';
import '../models/user.dart';
import '../providers/provider_manager.dart';
import '../providers/location_provider.dart';
import '../providers/theme_provider.dart';
import '../providers/user_provider.dart';
import '../providers/service_provider.dart';
import '../providers/worker_provider.dart';
import '../providers/recommendation_provider.dart';
import '../models/recommendation.dart';
import 'category_screen.dart';
import 'service_details_screen.dart';
import '../services/api_service.dart';
import '../widgets/trust_header.dart';
import '../widgets/primary_recommendation.dart';
import '../widgets/smart_suggestions.dart';
import '../widgets/memory_section.dart';
import '../widgets/category_card.dart';
import '../widgets/service_card.dart';
import '../widgets/search_bar.dart' as CustomSearchBar;
import '../widgets/location_picker_dialog.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  HomeScreenState createState() => HomeScreenState();
}

class HomeScreenState extends State<HomeScreen> {
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

  // New state for the 5-section layout
  SystemStatusData? _systemStatus;
  Recommendation? _currentRecommendation;
  List<Suggestion> _suggestions = [];
  UserHistory? _userHistory;

  @override
  void initState() {
    super.initState();
    apiService = ApiService();
    _loadHomeData();
    // Defer recommendation loading to avoid setState() during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadRecommendations();
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
        services = (response as List)
            .map((item) => Service.fromJson(item))
            .toList();
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

      print('HomeScreen: Recommendations generated');
      print(
        'Current recommendation: ${recommendationProvider.currentRecommendation != null ? 'Available' : 'Null'}',
      );
      print('Suggestions count: ${recommendationProvider.suggestions.length}');
      print(
        'User history: ${recommendationProvider.userHistory != null ? 'Available' : 'Null'}',
      );

      setState(() {
        _currentRecommendation = recommendationProvider.currentRecommendation;
        _suggestions = recommendationProvider.suggestions;
        _userHistory = recommendationProvider.userHistory;
        _systemStatus = _generateSystemStatus(recommendationProvider);
      });
    } catch (e) {
      setState(() {
        errorMessage = 'Failed to load recommendations: $e';
      });
    }
  }

  SystemStatusData _generateSystemStatus(
    RecommendationProvider recommendationProvider,
  ) {
    // Generate system status based on available workers and recommendations
    final availableWorkers =
        recommendationProvider.currentRecommendation?.worker != null ? 1 : 0;

    if (availableWorkers > 0) {
      return SystemStatusData(
        status: SystemStatus.allOnTrack,
        availableWorkers: availableWorkers,
        estimatedWaitTime:
            recommendationProvider
                .currentRecommendation
                ?.estimatedArrivalTime ??
            30,
        message: 'All services on track',
      );
    } else {
      return SystemStatusData(
        status: SystemStatus.limitedAvailability,
        availableWorkers: 0,
        estimatedWaitTime: 60,
        message: 'Limited availability',
      );
    }
  }

  Future<void> _loadCategoryAvailability(BuildContext context) async {
    final locationProvider = ProviderManager.safeGetProvider<LocationProvider>(
      context,
    );

    if (locationProvider == null ||
        locationProvider.currentLocationData == null) {
      return;
    }

    try {
      final response = await apiService.get('services/categories/availability');
      if (response is List) {
        if (mounted) {
          setState(() {
            categoryAvailability = response
                .map((item) => CategoryAvailability.fromJson(item))
                .toList();
            _hasLoadedCategories = true;
          });
        }
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          categoryAvailability = [
            CategoryAvailability(
              name: 'Cleaning',
              isAvailable: true,
              availableServicesCount: 5,
              availableWorkersCount: 3,
            ),
            CategoryAvailability(
              name: 'Cooking',
              isAvailable: true,
              availableServicesCount: 3,
              availableWorkersCount: 2,
            ),
            CategoryAvailability(
              name: 'Electrician',
              isAvailable: true,
              availableServicesCount: 2,
              availableWorkersCount: 1,
            ),
            CategoryAvailability(
              name: 'Plumber',
              isAvailable: true,
              availableServicesCount: 2,
              availableWorkersCount: 1,
            ),
            CategoryAvailability(
              name: 'Caretaker',
              isAvailable: true,
              availableServicesCount: 4,
              availableWorkersCount: 2,
            ),
          ];
          _hasLoadedCategories = true;
        });
      }
    }
  }

  void _filterServices(String query) {
    setState(() {
      searchQuery = query;
      if (query.isEmpty) {
        filteredServices = services;
      } else {
        filteredServices = services.where((service) {
          return service.name.toLowerCase().contains(query.toLowerCase()) ||
              service.category.toLowerCase().contains(query.toLowerCase()) ||
              service.subcategory?.toLowerCase().contains(
                    query.toLowerCase(),
                  ) ==
                  true;
        }).toList();
      }
    });
  }

  void _handlePrimaryRecommendation() {
    if (_currentRecommendation != null) {
      _navigateToServiceDetails(_currentRecommendation!.service);
    }
  }

  void _handleSuggestionTap(Suggestion suggestion) {
    // Handle suggestion tap - navigate to appropriate screen
    if (suggestion.type == SuggestionType.repeatService) {
      // Navigate to repeat booking
      _handlePrimaryRecommendation();
    } else {
      // Navigate to service details or category
      _navigateToCategory(
        context,
        _currentRecommendation?.service.category ?? 'Cleaning',
      );
    }
  }

  void _handleRepeatBooking() {
    if (_userHistory?.hasFavoriteWorker == true) {
      // Navigate to book favorite worker
      _handlePrimaryRecommendation();
    } else {
      // Navigate to repeat last booking
      _handlePrimaryRecommendation();
    }
  }

  void _navigateToServiceDetails(Service service) {
    final workerProvider = _workerProvider;

    if (workerProvider != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => ServiceDetailsScreen(
            service: service,
            workerProvider: workerProvider,
          ),
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
            builder: (context) => ServiceDetailsScreen(
              service: service,
              workerProvider: fallbackProvider,
            ),
          ),
        );
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => ServiceDetailsScreen(
              service: service,
              workerProvider: WorkerProvider(),
            ),
          ),
        );
      }
    }
  }

  void _navigateToCategory(BuildContext context, String category) {
    final serviceProvider = _serviceProvider;
    final workerProvider = _workerProvider;

    if (serviceProvider != null && workerProvider != null) {
      Navigator.push(
        context,
        MaterialPageRoute(
          builder: (context) => CategoryScreen(
            category: category,
            serviceProvider: serviceProvider,
            workerProvider: workerProvider,
          ),
        ),
      );
    } else {
      final fallbackServiceProvider =
          ProviderManager.safeGetProvider<ServiceProvider>(context);
      final fallbackWorkerProvider =
          ProviderManager.safeGetProvider<WorkerProvider>(context);
      if (fallbackServiceProvider != null && fallbackWorkerProvider != null) {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CategoryScreen(
              category: category,
              serviceProvider: fallbackServiceProvider,
              workerProvider: fallbackWorkerProvider,
            ),
          ),
        );
      } else {
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CategoryScreen(
              category: category,
              serviceProvider: ServiceProvider(),
              workerProvider: WorkerProvider(),
            ),
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

    final isDarkMode = themeProvider?.isDarkMode ?? false;

    if (!_hasLoadedCategories &&
        locationProvider?.currentLocationData != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        _loadCategoryAvailability(context);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(
          'House Help',
          style: TextStyle(
            color: isDarkMode ? Colors.white : Colors.black,
            fontSize: 20,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              Icons.location_on,
              color: locationProvider?.currentLocationData != null
                  ? Colors.green
                  : Colors.red,
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
          : _buildNewHomeContent(locationProvider ?? LocationProvider()),
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

  Widget _buildNewHomeContent(LocationProvider locationProvider) {
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
            // Section 1: Trust Header (always show if location is available)
            if (locationProvider.currentLocationData != null)
              TrustHeader(
                location: locationProvider.currentLocationData!.address,
                systemStatus:
                    _systemStatus ??
                    SystemStatusData(
                      status: SystemStatus.allOnTrack,
                      availableWorkers: 0,
                      estimatedWaitTime: 30,
                      message: 'All services on track',
                    ),
                availableWorkers: _systemStatus?.availableWorkers ?? 0,
              ),

            SizedBox(height: 16),

            // Section 2: Primary Recommendation (show if available, otherwise show fallback)
            if (_currentRecommendation != null)
              PrimaryRecommendation(
                recommendation: _currentRecommendation!,
                onAccept: _handlePrimaryRecommendation,
              )
            else if (services.isNotEmpty)
              // Fallback primary recommendation using first available service
              PrimaryRecommendation(
                recommendation: Recommendation(
                  service: services.first,
                  worker: Worker(
                    id: 'fallback-worker-001',
                    user: User(
                      id: 'fallback-user-001',
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
                onAccept: () => _navigateToServiceDetails(services.first),
              ),

            // Section 3: Smart Suggestions (show if available, otherwise show fallback)
            if (_suggestions.isNotEmpty)
              SmartSuggestions(
                suggestions: _suggestions,
                onSuggestionTap: _handleSuggestionTap,
              )
            else if (services.isNotEmpty)
              // Fallback suggestions
              SmartSuggestions(
                suggestions: [
                  Suggestion.usuallyBooked(
                    serviceType: services.first.name,
                    onTap: () => _navigateToServiceDetails(services.first),
                  ),
                  Suggestion.safeOption(
                    serviceType: 'Professional service',
                    onTap: () => _navigateToServiceDetails(services.first),
                  ),
                ],
                onSuggestionTap: (suggestion) =>
                    _navigateToServiceDetails(services.first),
              ),

            // Section 4: Memory Section (show if available, otherwise show generic message)
            if (_userHistory != null &&
                (_userHistory!.hasFavoriteWorker ||
                    _userHistory!.hasRecentBooking))
              MemorySection(
                userHistory: _userHistory!,
                onRepeatBooking: _handleRepeatBooking,
              )
            else
              // Fallback memory section
              MemorySection(
                userHistory: UserHistory(
                  totalBookings: 0,
                  favoriteWorker: null,
                  lastBookedService: null,
                  lastBookingDate: null,
                ),
                onRepeatBooking: () {},
              ),

            // Section 5: Traditional services grid (always show as fallback)
            _buildTraditionalServicesSection(locationProvider),
          ],
        ),
      ),
    );
  }

  Widget _buildTraditionalServicesSection(LocationProvider locationProvider) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Search Bar
        CustomSearchBar.SearchBar(
          onSearch: _filterServices,
          hintText: 'Search services...',
        ),
        SizedBox(height: 16),

        // "Book in 15-30 mins" Badge
        _buildFastBookingBadge(locationProvider),

        // Core Categories
        Text(
          'Categories',
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
        ),
        SizedBox(height: 12),
        _buildCategories(locationProvider),

        // Available Services
        if (filteredServices.isNotEmpty)
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              SizedBox(height: 24),
              Text(
                'Available Services',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 12),
              _buildServicesGrid(),
            ],
          )
        else if (locationProvider.currentLocationData != null)
          _buildNoServicesFound(locationProvider),
      ],
    );
  }

  Widget _buildFastBookingBadge(LocationProvider locationProvider) {
    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green[100],
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green),
      ),
      child: Row(
        children: [
          Icon(Icons.timer, color: Colors.green),
          SizedBox(width: 8),
          Expanded(
            child: Text(
              'Book in 15-30 mins',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: Colors.green[800],
              ),
            ),
          ),
          Icon(Icons.arrow_forward_ios, size: 16, color: Colors.green),
        ],
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
        _loadCategoryAvailability(context);
        _loadRecommendations();
      }
    });
  }

  Widget _buildCategories(LocationProvider locationProvider) {
    final availableCategories =
        _hasLoadedCategories && categoryAvailability.isNotEmpty
        ? categoryAvailability
              .where((cat) => cat.isAvailable)
              .map((cat) => cat.name)
              .toList()
        : ['Cleaning', 'Cooking', 'Electrician', 'Plumber', 'Caretaker'];

    if (availableCategories.isEmpty &&
        locationProvider.currentLocationData != null) {
      return Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange.withOpacity(0.1),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange, width: 1),
        ),
        child: Row(
          children: [
            Icon(Icons.location_off, color: Colors.orange),
            SizedBox(width: 8),
            Expanded(
              child: Text(
                'No service providers available in your area. Try adjusting your location or check back later.',
                style: TextStyle(
                  color: Colors.orange[800],
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 16,
        mainAxisSpacing: 16,
        childAspectRatio: 1.2,
      ),
      itemCount: availableCategories.length,
      itemBuilder: (context, index) {
        return CategoryCard(
          category: availableCategories[index],
          onTap: () => _navigateToCategory(context, availableCategories[index]),
        );
      },
    );
  }

  Widget _buildServicesGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 0.8,
      ),
      itemCount: filteredServices.length,
      itemBuilder: (context, index) {
        final service = filteredServices[index];
        return ServiceCard(
          service: service,
          onTap: () => _navigateToServiceDetails(service),
        );
      },
    );
  }

  Widget _buildNoServicesFound(LocationProvider locationProvider) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 20),
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(
          context,
        ).colorScheme.secondary.withAlpha((0.1 * 255).round()),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(
        children: [
          Icon(Icons.search_off, size: 48, color: Colors.grey),
          SizedBox(height: 12),
          Text(
            'No services found',
            style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
          ),
          SizedBox(height: 8),
          Text(
            'Try searching for a different service or check back later.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Theme.of(context).textTheme.bodyMedium?.color,
            ),
          ),
          SizedBox(height: 16),
          ElevatedButton(
            onPressed: () => _showLocationDialog(context, locationProvider),
            style: ElevatedButton.styleFrom(
              backgroundColor: Theme.of(context).primaryColor,
              padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
            ),
            child: Text(
              'Change Location',
              style: TextStyle(color: Colors.white),
            ),
          ),
        ],
      ),
    );
  }
}
