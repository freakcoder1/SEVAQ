import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/location_provider.dart';
import 'login_screen.dart';
import 'location_first_splash_screen.dart';
import 'main_screen.dart';

class MainNavigation extends StatelessWidget {
  const MainNavigation({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthProvider>(
      builder: (context, auth, _) {
        if (auth.isLoading) {
          return _buildLoadingScreen();
        }
        
        if (auth.isAuthenticated) {
          // Check if location is set up
          final locationProvider = Provider.of<LocationProvider>(context, listen: false);
          if (locationProvider.needsLocationSetup()) {
            return LocationFirstSplashScreen();
          } else {
            return MainScreen();
          }
        } else {
          return LoginScreen();
        }
      },
    );
  }
  
  Widget _buildLoadingScreen() {
    return Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('Checking authentication...'),
          ],
        ),
      ),
    );
  }
}