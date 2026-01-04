import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'home_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'package:provider/provider.dart';
import '../providers/location_provider.dart';
import '../providers/theme_provider.dart';
import '../widgets/location_selection_popup.dart';

class MainScreen extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _MainScreenContent();
  }
}

class _MainScreenContent extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _MainScreenContentStatefulWidget();
  }
}

class _MainScreenContentStatefulWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return _MainScreenContentState();
  }
}

class _MainScreenContentState extends StatefulWidget {
  @override
  _MainScreenState createState() => _MainScreenState();
}

class _MainScreenState extends State<_MainScreenContentState> {
  int _currentIndex = 0;
  bool _hasCheckedLocation = false;
  bool _showingLocationPopup = false;

  List<Widget> get _screens => [
    Consumer<ThemeProvider>(
      builder: (context, themeProvider, child) {
        return HomeScreen();
      },
    ),
    HistoryScreen(),
    ProfileScreen(),
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _checkLocationSetup();
    });
  }

  Future<void> _checkLocationSetup() async {
    if (_hasCheckedLocation || _showingLocationPopup) return;
    
    _hasCheckedLocation = true;
    final locationProvider = Provider.of<LocationProvider>(context, listen: false);
    
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
      body: _screens[_currentIndex],
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: [
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
        ],
      ),
    );
  }
}
