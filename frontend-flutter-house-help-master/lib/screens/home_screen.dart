import 'package:flutter/material.dart';
import 'package:flutter_house_help/models/service.dart';
import 'package:flutter_house_help/models/category_availability.dart';
import 'package:flutter_house_help/providers/location_provider.dart';
import 'package:flutter_house_help/providers/theme_provider.dart';
import 'package:flutter_house_help/providers/user_provider.dart';
import 'package:flutter_house_help/screens/category_screen.dart';
import 'package:flutter_house_help/screens/service_details_screen.dart';
import 'package:flutter_house_help/services/api_service.dart';
import 'package:flutter_house_help/widgets/category_card.dart';
import 'package:flutter_house_help/widgets/search_bar.dart' as CustomSearchBar;
import 'package:flutter_house_help/widgets/service_card.dart';
import 'package:provider/provider.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({Key? key}) : super(key: key);

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  late ApiService apiService;
  List<Service> services = [];
  List<Service> filteredServices = [];
  List<CategoryAvailability> categoryAvailability = [];
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
      // Note: We can't use Provider.of() in initState because context isn't ready yet
      // We'll access providers in build() method instead
      
      // Load services
      final response = await apiService.get('services');
      
      setState(() {
        services = (response as List)
            .map((item) => Service.fromJson(item))
            .toList();
        filteredServices = services;
        isLoading = false;
      });
    } catch (e) {
      setState(() {
        isLoading = false;
        errorMessage = e.toString();
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
                 service.subcategory?.toLowerCase().contains(query.toLowerCase()) == true;
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
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'House Help',
          style: TextStyle(color: Theme.of(context).brightness == Brightness.dark ? Colors.white : Colors.black),
        ),
        backgroundColor: Theme.of(context).brightness == Brightness.dark ? Colors.black : Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: Icon(Icons.location_on, color: Colors.blue),
            onPressed: () {
              // Show current location - using context that has access to providers
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text('Location feature tapped'),
                ),
              );
            },
          ),
        ],
      ),
      body: isLoading
          ? _buildLoadingIndicator()
          : errorMessage.isNotEmpty
          ? _buildErrorWidget()
          : _buildHomeContent(),
    );
  }

  Widget _buildLoadingIndicator() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          CircularProgressIndicator(),
          SizedBox(height: 16),
          Text('Loading services...'),
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
            child: Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildHomeContent() {
    return RefreshIndicator(
      onRefresh: _loadHomeData,
      child: SingleChildScrollView(
        padding: EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Bar
            CustomSearchBar.SearchBar(
              onSearch: _filterServices,
              hintText: 'Search services...',
            ),
            SizedBox(height: 16),

            // "Book in 15-30 mins" Badge
            _buildFastBookingBadge(),


            // Core Categories
            Text(
              'Categories',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 12),
            _buildCategories(),

            // Available Services
            if (filteredServices.isNotEmpty)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(height: 16),
                  Text(
                    'Available Services',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  _buildServicesGrid(),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildFastBookingBadge() {
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


  Widget _buildCategories() {
    // Filter categories based on availability
    final availableCategories = categoryAvailability.isNotEmpty
      ? categoryAvailability.where((cat) => cat.isAvailable).map((cat) => cat.name).toList()
      : [
          'Cleaning',
          'Cooking',
          'Electrician',
          'Plumber',
          'Caretaker',
        ];

    if (availableCategories.isEmpty) {
      return Column(
        children: [
          Text(
            'Categories',
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          SizedBox(height: 16),
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.orange[100],
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: Colors.orange),
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
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Categories',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.bold,
          ),
        ),
        SizedBox(height: 12),
        GridView.builder(
          shrinkWrap: true,
          physics: NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 1.5,
          ),
          itemCount: availableCategories.length,
          itemBuilder: (context, index) {
            return CategoryCard(
              category: availableCategories[index],
              onTap: () => _navigateToCategory(availableCategories[index]),
            );
          },
        ),
      ],
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
  IconData _getCategoryIcon(String category) {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return Icons.cleaning_services;
      case 'cooking':
        return Icons.restaurant;
      case 'electrician':
        return Icons.electrical_services;
      case 'plumber':
        return Icons.plumbing;
      case 'caretaker':
        return Icons.person;
      default:
        return Icons.category;
    }
  }
}


