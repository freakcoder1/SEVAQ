import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../widgets/floating_navigation.dart';
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
      bottomNavigationBar: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: FloatingNavigation(
            currentIndex: _currentIndex,
            onTap: (index) {
              setState(() {
                _currentIndex = index;
              });
            },
          ),
        ),
      ),
    );
  }
}
