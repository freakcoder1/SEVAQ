import 'package:flutter/material.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/category_availability.dart';
import 'package:flutter_house_help/providers/location_provider.dart';
import 'package:flutter_house_help/providers/theme_provider.dart';
import 'package:flutter_house_help/providers/user_provider.dart';
import 'package:flutter_house_help/providers/provider_manager.dart';
import 'package:flutter_house_help/screens/category_screen.dart';
import 'package:flutter_house_help/screens/service_details_screen.dart';
import 'package:flutter_house_help/services/api_service.dart';
import 'package:flutter_house_help/widgets/category_card.dart';
import 'package:flutter_house_help/widgets/search_bar.dart' as CustomSearchBar;
import 'package:flutter_house_help/widgets/service_card.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final themeProvider = Provider.of<ThemeProvider>(context);
    final locationProvider = Provider.of<LocationProvider>(context);

    return _HomeScreenContent(
      themeProvider: themeProvider,
      locationProvider: locationProvider,
    );
  }
}

class _HomeScreenContent extends StatefulWidget {
  final ThemeProvider themeProvider;
  final LocationProvider locationProvider;

  const _HomeScreenContent({
    Key? key,
    required this.themeProvider,
    required this.locationProvider,
  }) : super(key: key);

  @override
  _HomeScreenState createState() => _HomeScreenState();
}

class _HomeScreenState extends State<_HomeScreenContent> {
  late ApiService apiService;
  List<Service> services = [];
  List<Service> filteredServices = [];
  List<CategoryAvailability> categoryAvailability = [];
  bool _hasLoadedCategories = false;
  String searchQuery = '';
  bool isLoading = true;
  String errorMessage = '';

  @override
  void initState() {
    super.initState();
    apiService = ApiService();
    _loadHomeData();
  }

  Future<void> _loadHomeData() async {
    setState(() {
      isLoading = true;
      errorMessage = '';
    });

    try {
      // Load services
      final response = await apiService.get('services');

      setState(() {
        services = (response as List)
            .map((item) => Service.fromJson(item))
            .toList();
        filteredServices = services;
        isLoading = false;
      });

      // Note: We'll check location availability in build() method where context is available
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = e.toString();
      });
    }
  }

  Future<void> _loadCategoryAvailability(
    LocationProvider locationProvider,
  ) async {
    try {
      // Try to load category availability from API
      final response = await apiService.get('categories/availability');
      if (response is List) {
        setState(() {
          categoryAvailability = response
              .map((item) => CategoryAvailability.fromJson(item))
              .toList();
          _hasLoadedCategories = true;
        });
      }
    } catch (e) {
      // If API endpoint doesn't exist or fails, use fallback categories
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

  void _navigateToServiceDetails(Service service) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ServiceDetailsScreen(service: service),
      ),
    );
  }

  void _navigateToCategory(String category) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CategoryScreen(category: category),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final locationProvider = widget.locationProvider;
    final themeProvider = widget.themeProvider;

    final isDarkMode = themeProvider.isDarkMode;

    return Scaffold(
      appBar: AppBar(
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'House Help',
              style: TextStyle(
                color: isDarkMode ? Colors.white : Colors.black,
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            if (locationProvider.currentLocationData != null)
              Text(
                locationProvider.currentLocationData!.address,
                style: TextStyle(
                  color: isDarkMode ? Colors.grey[300] : Colors.grey[600],
                  fontSize: 12,
                ),
              )
            else if (!locationProvider.isLoading)
              Text(
                'Location not set',
                style: TextStyle(color: Colors.orange, fontSize: 12),
              ),
          ],
        ),
        backgroundColor: isDarkMode ? Colors.black : Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(
              Icons.location_on,
              color: locationProvider.currentLocationData != null
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
          : _buildHomeContent(locationProvider),
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

  Widget _buildHomeContent(LocationProvider locationProvider) {
    // Check if we need to load category availability
    if (locationProvider.currentLocationData != null && !_hasLoadedCategories) {
      _loadCategoryAvailability(locationProvider);
    }

    return RefreshIndicator(
      onRefresh: _loadHomeData,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Location Status Section
            _buildLocationStatus(locationProvider),
            SizedBox(height: 16),

            // Search Bar
            CustomSearchBar.SearchBar(
              onSearch: _filterServices,
              hintText: 'Search services...',
            ),
            SizedBox(height: 16),

            // "Book in 15-30 mins" Badge
            _buildFastBookingBadge(locationProvider),

            // Service Availability Status
            if (locationProvider.availabilityStatus != null)
              _buildServiceAvailabilityStatus(locationProvider),

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
        ),
      ),
    );
  }

  Widget _buildLocationStatus(LocationProvider locationProvider) {
    if (locationProvider.isLoading) {
      return Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Theme.of(
            context,
          ).colorScheme.secondary.withAlpha((0.1 * 255).round()),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            CircularProgressIndicator(
              strokeWidth: 2,
              color: Theme.of(context).primaryColor,
            ),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Setting up your location...',
                style: TextStyle(
                  fontSize: 14,
                  color: Theme.of(context).textTheme.bodyMedium?.color,
                ),
              ),
            ),
          ],
        ),
      );
    }

    if (locationProvider.currentLocationData == null) {
      return Container(
        padding: EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange.withAlpha((0.1 * 255).round()),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: Colors.orange, width: 1),
        ),
        child: Row(
          children: [
            Icon(Icons.location_off, color: Colors.orange, size: 20),
            SizedBox(width: 12),
            Expanded(
              child: Text(
                'Please set your location to find services near you',
                style: TextStyle(fontSize: 14, color: Colors.orange[800]),
              ),
            ),
            SizedBox(width: 8),
            ElevatedButton(
              onPressed: () => _showLocationDialog(context, locationProvider),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange,
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(20),
                ),
              ),
              child: Text(
                'Set Location',
                style: TextStyle(fontSize: 12, color: Colors.white),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      padding: EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.green.withAlpha((0.1 * 255).round()),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.green, width: 1),
      ),
      child: Row(
        children: [
          Icon(Icons.location_on, color: Colors.green, size: 20),
          SizedBox(width: 12),
          Expanded(
            child: Text(
              'Location: ${locationProvider.currentLocationData!.address}',
              style: TextStyle(
                fontSize: 14,
                color: Colors.green[800],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          if (locationProvider.availabilityStatus != null)
            _buildAvailabilityIndicator(locationProvider),
        ],
      ),
    );
  }

  Widget _buildAvailabilityIndicator(LocationProvider locationProvider) {
    final availability = locationProvider.availabilityStatus;
    if (availability == null) return SizedBox();

    Color indicatorColor = availability.isAvailable ? Colors.green : Colors.red;
    String statusText = availability.isAvailable
        ? 'Available'
        : 'Not Available';

    return Container(
      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: indicatorColor.withOpacity(0.2),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: BoxDecoration(
              color: indicatorColor,
              shape: BoxShape.circle,
            ),
          ),
          SizedBox(width: 6),
          Text(
            statusText,
            style: TextStyle(
              fontSize: 12,
              color: indicatorColor,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildServiceAvailabilityStatus(LocationProvider locationProvider) {
    final availability = locationProvider.availabilityStatus;
    if (availability == null) return SizedBox();

    return Container(
      margin: EdgeInsets.symmetric(vertical: 12),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: availability.isAvailable
            ? Colors.green.withAlpha((0.1 * 255).round())
            : Colors.red.withAlpha((0.1 * 255).round()),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: availability.isAvailable ? Colors.green : Colors.red,
          width: 1,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                availability.isAvailable ? Icons.check_circle : Icons.cancel,
                color: availability.isAvailable ? Colors.green : Colors.red,
                size: 20,
              ),
              SizedBox(width: 8),
              Text(
                availability.isAvailable
                    ? 'Services Available'
                    : 'No Services Available',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: availability.isAvailable
                      ? Colors.green[800]
                      : Colors.red[800],
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          if (availability.isAvailable)
            Text(
              'Workers: ${availability.workerCount} • Wait Time: ${availability.estimatedWaitTime} mins',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            )
          else
            Text(
              'No service providers available in your area. Try adjusting your location.',
              style: TextStyle(
                fontSize: 12,
                color: Theme.of(context).textTheme.bodyMedium?.color,
              ),
            ),
        ],
      ),
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
    LocationProvider locationProvider,
  ) {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: Text('Location Settings'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text('Current Location:'),
              SizedBox(height: 8),
              Text(
                locationProvider.currentLocationData != null
                    ? locationProvider.currentLocationData!.address
                    : 'Not set',
                style: TextStyle(
                  fontWeight: FontWeight.bold,
                  color: locationProvider.currentLocationData != null
                      ? Colors.green[800]
                      : Colors.orange,
                ),
              ),
              SizedBox(height: 16),
              Text('Would you like to change your location?'),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(context).pop();
              },
              child: Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(context).pop();
                // Navigate to location selection screen
                // This would typically navigate to a location picker screen
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('Location selection feature would open here'),
                  ),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
              ),
              child: Text(
                'Change Location',
                style: TextStyle(color: Colors.white),
              ),
            ),
          ],
        );
      },
    );
  }

  Widget _buildCategories(LocationProvider locationProvider) {
    // Filter categories based on availability
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
          onTap: () => _navigateToCategory(availableCategories[index]),
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
}
