import 'package:flutter/material.dart';
import 'home_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../widgets/location_selection_popup.dart';

/// MainScreen - A simple navigation wrapper that provides tab navigation.
///
/// This widget has been simplified to remove the unnecessary nested wrapper classes.
/// It should ONLY be used when the user is authenticated AND location is set.
///
/// All auth/location gating is handled by AuthWrapper.
class MainScreen extends StatefulWidget {
  final int initialIndex;

  const MainScreen({super.key, this.initialIndex = 0});

  @override
  State<MainScreen> createState() => _MainScreenState();
}

class _MainScreenState extends State<MainScreen> {
  int _currentIndex = 0;
  bool _hasCheckedLocation = false;
  bool _showingLocationPopup = false;

  List<Widget> get _screens => [HomeScreen(), HistoryScreen(), ProfileScreen()];

  List<NavigationDestination> get _destinations => [
    NavigationDestination(
      icon: Icon(Icons.home_outlined),
      selectedIcon: Icon(Icons.home),
      label: 'Home',
    ),
    NavigationDestination(
      icon: Icon(Icons.calendar_today_outlined),
      selectedIcon: Icon(Icons.calendar_today),
      label: 'Bookings',
    ),
    NavigationDestination(
      icon: Icon(Icons.person_outline),
      selectedIcon: Icon(Icons.person),
      label: 'Profile',
    ),
  ];

  /// Safely get a provider with error handling
  T? _safeGetProvider<T extends ChangeNotifier>(BuildContext context) {
    try {
      return Provider.of<T>(context, listen: false);
    } catch (e) {
      debugPrint('Failed to get provider $T: $e');
      return null;
    }
  }

  Widget _buildProviderErrorScreen(String errorMessage) {
    return Scaffold(
      appBar: AppBar(title: Text('Error'), backgroundColor: Colors.red),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error, size: 64, color: Colors.red),
            SizedBox(height: 16),
            Text(
              'Provider Error',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              errorMessage,
              textAlign: TextAlign.center,
              style: TextStyle(fontSize: 14),
            ),
            SizedBox(height: 16),
            ElevatedButton(
              onPressed: () {
                // Use pop() to return to AuthWrapper which will re-evaluate state
                // and handle navigation appropriately based on auth/location status.
                // Never push MainScreen directly - it bypasses AuthWrapper's provider scope
                if (mounted) {
                  Navigator.of(context).pop();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).primaryColor,
                padding: EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: Text('Restart App', style: TextStyle(color: Colors.white)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkLocationSetup();
    });
  }

  Future<void> _checkLocationSetup() async {
    if (_hasCheckedLocation || _showingLocationPopup) return;

    _hasCheckedLocation = true;
    final locationProvider = _safeGetProvider<LocationProvider>(context);

    if (locationProvider == null) {
      debugPrint('LocationProvider not available during location setup check');
      return;
    }

    // Check if location setup is needed
    if (locationProvider.needsLocationSetup()) {
      _showingLocationPopup = true;

      // Use Future.delayed to ensure the main screen is fully built
      await Future.delayed(const Duration(milliseconds: 500));

      if (mounted) {
        await showDialog(
          context: context,
          barrierDismissible: false,
          builder: (context) => LocationSelectionPopup(
            onLocationSelected: () {
              // Location was successfully set
              locationProvider.markPopupShown();
            },
            isNewUser: true,
          ),
        );

        _showingLocationPopup = false;
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: _destinations,
      ),
    );
  }
}
