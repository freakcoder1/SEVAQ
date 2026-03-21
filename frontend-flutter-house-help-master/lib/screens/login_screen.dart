import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import 'auth_wrapper.dart';
import 'signup_screen.dart';
import 'otp_login_screen.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final auth = context.watch<AuthProvider>();

    // Debug: Check auth state
    debugPrint(
      'LoginScreen.build: isAuthenticated=${auth.isAuthenticated}, isLoading=${auth.isLoading}',
    );

    // Auto-navigate when authenticated (after successful login)
    if (auth.isFullyAuthenticated && !auth.isLoading) {
      debugPrint(
        'LoginScreen: User authenticated, triggering rebuild via AuthWrapper',
      );
      // AuthWrapper will automatically rebuild and show the appropriate screen
      // We don't need to navigate manually - just let the rebuild happen
    }

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                SizedBox(height: 60),
                Text(
                  'Welcome\nBack',
                  style: theme.textTheme.displayLarge?.copyWith(
                    fontSize: 48,
                    height: 1.1,
                  ),
                ),
                SizedBox(height: 40),
                TextFormField(
                  controller: _emailController,
                  decoration: InputDecoration(
                    labelText: 'Email',
                    hintText: 'hello@example.com',
                  ),
                  validator: (value) =>
                      value!.isEmpty ? 'Please enter email' : null,
                ),
                SizedBox(height: 16),
                TextFormField(
                  controller: _passwordController,
                  obscureText: true,
                  decoration: InputDecoration(labelText: 'Password'),
                  validator: (value) =>
                      value!.isEmpty ? 'Please enter password' : null,
                ),
                SizedBox(height: 24),
                ElevatedButton(
                  onPressed: () async {
                    if (_formKey.currentState!.validate()) {
                      final success =
                          await Provider.of<AuthProvider>(
                            context,
                            listen: false,
                          ).login(
                            _emailController.text,
                            _passwordController.text,
                            context: context,
                          );
                      debugPrint('LoginScreen: login result=$success');
                      if (!success && mounted) {
                        ScaffoldMessenger.of(
                          context,
                        ).showSnackBar(SnackBar(content: Text('Login failed')));
                      }
                    }
                  },
                  child: Text('LOG IN'),
                ),
                SizedBox(height: 16),
                // Phone Login Button
                OutlinedButton.icon(
                  onPressed: () => _showPhoneLoginDialog(context),
                  icon: Icon(Icons.phone, color: theme.primaryColor),
                  label: Text(
                    'Login with Phone',
                    style: TextStyle(color: theme.primaryColor),
                  ),
                  style: OutlinedButton.styleFrom(
                    padding: EdgeInsets.symmetric(vertical: 16),
                  ),
                ),
                SizedBox(height: 24),
                Divider(),
                SizedBox(height: 16),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text("Don't have an account?"),
                    TextButton(
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(builder: (_) => SignupScreen()),
                        );
                      },
                      child: Text(
                        'Sign Up',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showPhoneLoginDialog(BuildContext context) {
    final phoneController = TextEditingController();
    final _phoneFormKey = GlobalKey<FormState>();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Login with Phone'),
        content: Form(
          key: _phoneFormKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Enter your phone number to receive an OTP',
                style: TextStyle(fontSize: 14, color: Colors.grey[600]),
              ),
              SizedBox(height: 16),
              TextFormField(
                controller: phoneController,
                keyboardType: TextInputType.phone,
                decoration: InputDecoration(
                  labelText: 'Phone Number',
                  hintText: '+919876543210',
                  prefixText: '+',
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Please enter phone number';
                  }
                  // Remove the + prefix for validation
                  String phone = value.startsWith('+')
                      ? value.substring(1)
                      : value;
                  if (!RegExp(r'^[1-9]\d{1,14}$').hasMatch(phone)) {
                    return 'Please enter a valid phone number';
                  }
                  return null;
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              if (_phoneFormKey.currentState!.validate()) {
                String phone = phoneController.text;
                if (!phone.startsWith('+')) {
                  phone = '+$phone';
                }
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => OtpLoginScreen(phoneNumber: phone),
                  ),
                );
              }
            },
            child: Text('Send OTP'),
          ),
        ],
      ),
    );
  }
}
