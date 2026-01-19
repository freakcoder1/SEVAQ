import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'home_screen.dart';
import 'history_screen.dart';
import 'profile_screen.dart';
import 'monitoring_dashboard_screen.dart';

/// MainNavigation - A PURE navigation shell that handles tab navigation.
///
/// This widget is NOT responsible for auth/location gating logic.
/// It should ONLY be used when the user is authenticated AND location is set.
///
/// All auth/location gating is handled by AuthWrapper which creates this widget
/// under the provider scope.
class MainNavigation extends StatefulWidget {
  final int initialIndex;

  const MainNavigation({super.key, this.initialIndex = 0});

  @override
  State<MainNavigation> createState() => _MainNavigationState();
}

class _MainNavigationState extends State<MainNavigation> {
  int _currentIndex = 0;

  Widget _buildCurrentScreen(bool isAdmin) {
    if (isAdmin) {
      switch (_currentIndex) {
        case 0:
          return const HomeScreen();
        case 1:
          return HistoryScreen();
        case 2:
          return const MonitoringDashboardScreen();
        case 3:
          return ProfileScreen();
        default:
          return const HomeScreen();
      }
    } else {
      switch (_currentIndex) {
        case 0:
          return const HomeScreen();
        case 1:
          return HistoryScreen();
        case 2:
          return ProfileScreen();
        default:
          return const HomeScreen();
      }
    }
  }

  List<NavigationDestination> _getDestinations() {
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.currentUser?.role == 'admin';

    if (isAdmin) {
      return [
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
          icon: Icon(Icons.admin_panel_settings_outlined),
          selectedIcon: Icon(Icons.admin_panel_settings),
          label: 'Admin',
        ),
        NavigationDestination(
          icon: Icon(Icons.person_outline),
          selectedIcon: Icon(Icons.person),
          label: 'Profile',
        ),
      ];
    } else {
      return [
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
    }
  }

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    final isAdmin = auth.currentUser?.role == 'admin';

    return Scaffold(
      body: _buildCurrentScreen(isAdmin),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex,
        onDestinationSelected: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        destinations: _getDestinations(),
      ),
    );
  }
}
