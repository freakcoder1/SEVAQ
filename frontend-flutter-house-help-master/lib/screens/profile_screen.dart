import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../providers/theme_provider.dart';
import 'edit_profile_screen.dart';
import 'addresses_screen.dart';
import 'policy_screen.dart';
import '../policies/terms_of_use.dart';
import '../policies/refund_policy.dart';
import '../policies/privacy_policy.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = Provider.of<AuthProvider>(context).user;
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text('Profile')),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          children: [
            Center(
              child: CircleAvatar(
                radius: 50,
                backgroundColor: theme.primaryColor,
                child: Text(
                  user?.firstName?[0] ?? "U",
                  style: TextStyle(fontSize: 40, color: Colors.white),
                ),
              ),
            ),
            SizedBox(height: 16),
            Text(
              '${user?.firstName ?? ''} ${user?.lastName ?? ''}',
              style: theme.textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            Text(user?.email ?? '', style: theme.textTheme.bodyMedium),
            SizedBox(height: 40),
            ListTile(
              leading: Icon(Icons.person_outline),
              title: Text('Edit Profile'),
              trailing: Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => EditProfileScreen()),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.location_on_outlined),
              title: Text('Manage Addresses'),
              trailing: Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(builder: (context) => AddressesScreen()),
                );
              },
            ),
            Consumer<ThemeProvider>(
              builder: (context, themeProvider, _) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SwitchListTile(
                      secondary: Icon(
                        themeProvider.isDarkMode
                            ? Icons.dark_mode
                            : Icons.light_mode,
                      ),
                      title: Text('Dark Mode'),
                      value: themeProvider.isDarkMode,
                      onChanged: (value) {
                        themeProvider.toggleTheme();
                      },
                    ),
                    // Dark mode preview
                    if (themeProvider.isDarkMode)
                      Container(
                        height: 80,
                        margin: const EdgeInsets.symmetric(horizontal: 16),
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                            colors: [Color(0xFF0A1A15), Color(0xFF153028)],
                          ),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(
                              Icons.dark_mode,
                              color: const Color(0xFF2A7A6A),
                              size: 24,
                            ),
                            const SizedBox(width: 12),
                            Text(
                              'Premium dark theme active',
                              style: TextStyle(
                                color: Colors.white70,
                                fontSize: 12,
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                );
              },
            ),
            Divider(height: 40),
            ListTile(
              leading: Icon(Icons.description_outlined),
              title: Text('Terms of Use'),
              trailing: Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => PolicyScreen(
                      title: TermsOfUse.title,
                      content: TermsOfUse.content,
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.policy_outlined),
              title: Text('Refund Policy'),
              trailing: Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => PolicyScreen(
                      title: RefundPolicy.title,
                      content: RefundPolicy.content,
                    ),
                  ),
                );
              },
            ),
            ListTile(
              leading: Icon(Icons.privacy_tip_outlined),
              title: Text('Privacy Policy'),
              trailing: Icon(Icons.chevron_right),
              onTap: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (context) => PolicyScreen(
                      title: PrivacyPolicy.title,
                      content: PrivacyPolicy.content,
                    ),
                  ),
                );
              },
            ),
            Divider(height: 40),
            ListTile(
              leading: Icon(Icons.logout, color: theme.colorScheme.error),
              title: Text(
                'Log Out',
                style: TextStyle(color: theme.colorScheme.error),
              ),
              onTap: () {
                Provider.of<AuthProvider>(context, listen: false).logout();
              },
            ),
          ],
        ),
      ),
    );
  }
}
