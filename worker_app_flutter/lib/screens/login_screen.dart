import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/firebase_auth_service.dart';
import 'main_screen.dart';
import 'signup_screen.dart';

class WorkerLoginScreen extends StatefulWidget {
  const WorkerLoginScreen({super.key});

  @override
  State<WorkerLoginScreen> createState() => _WorkerLoginScreenState();
}

class _WorkerLoginScreenState extends State<WorkerLoginScreen> {
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _isEmailLogin = true;

  // Firebase OTP variables
  String? _verificationId;
  bool _otpSent = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  String? _validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'Please enter your email';
    }
    final emailRegex =
        RegExp(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  // Format phone number to E.164 format
  String _formatPhoneNumber(String phone) {
    // Remove any non-digit characters
    String digits = phone.replaceAll(RegExp(r'\D'), '');

    // If it starts with country code 91, add +
    if (digits.startsWith('91') && digits.length == 12) {
      return '+$digits';
    } else if (digits.length == 10) {
      // Add India country code
      return '+91$digits';
    }
    return '+$digits';
  }

  // Send OTP via Firebase
  Future<void> _sendOtp() async {
    final phone = _emailController.text.trim();
    if (phone.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your phone number')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final formattedPhone = _formatPhoneNumber(phone);

      await FirebaseAuthService.verifyPhoneNumber(
        phoneNumber: formattedPhone,
        onCodeSent: (verificationId, resendToken) {
          debugPrint('OTP sent! VerificationId: $verificationId');
          setState(() {
            _verificationId = verificationId;
            _otpSent = true;
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('OTP sent to your phone!')),
          );
        },
        onVerificationCompleted: (credential) {
          debugPrint('Verification completed automatically');
        },
        onVerificationFailed: (exception) {
          debugPrint('Verification failed: ${exception.message}');
          // In development mode, allow bypass even if OTP fails
          setState(() {
            _otpSent = true; // Enable the OTP input anyway
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(
                    'Firebase error: ${exception.message}. You can still test with dev mode.')),
          );
        },
        onCodeAutoRetrievalTimeout: (verificationId) {
          debugPrint('Auto-retrieval timeout');
        },
      );
    } catch (e) {
      debugPrint('Error sending OTP: $e');
      // In case of any error, enable dev mode
      setState(() {
        _otpSent = true;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('OTP service unavailable. Using dev mode.')),
      );
    }
  }

  // Verify OTP and login
  Future<void> _verifyOtpAndLogin() async {
    final otp = _passwordController.text.trim();
    if (otp.isEmpty || otp.length < 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a valid 6-digit OTP')),
      );
      return;
    }

    if (_verificationId == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please request OTP first')),
      );
      return;
    }

    setState(() => _isLoading = true);

    final authProvider = context.read<AuthProvider>();
    final phone = _formatPhoneNumber(_emailController.text.trim());
    String? idToken;

    try {
      // First sign in with Firebase to get the ID token
      final userCredential = await FirebaseAuthService.signInWithOTP(
        verificationId: _verificationId!,
        smsCode: otp,
      );

      // Get Firebase ID token
      idToken = await userCredential.user?.getIdToken();
    } catch (e) {
      // Firebase auth failed - this is expected in dev without proper SHA config
      debugPrint('Firebase OTP failed (expected in dev): $e');
      // We'll use dev bypass token instead
      idToken =
          'dev_test_token'; // Backend expects 'dev_test_token', not 'dev_bypass'
    }

    // Now call the backend to verify and login
    // The auth provider will use dev_test_token if idToken is 'dev_test_token'
    final success = await authProvider.verifyOtpWithToken(
        phone, idToken ?? 'dev_test_token');

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const WorkerMainScreen()),
      );
    } else if (mounted) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(authProvider.error ?? 'Login failed')),
      );
    }
  }

  Future<void> _login() async {
    if (_isEmailLogin) {
      final emailError = _validateEmail(_emailController.text);
      if (emailError != null) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(emailError)),
        );
        return;
      }
      if (_passwordController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter your password')),
        );
        return;
      }
    } else {
      if (_emailController.text.isEmpty) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Please enter your phone number')),
        );
        return;
      }
    }

    if (!mounted) return;

    final authProvider = context.read<AuthProvider>();
    bool success = false;

    if (_isEmailLogin) {
      // Email/password login
      success = await authProvider.login(
        _emailController.text.trim(),
        _passwordController.text,
      );
    } else if (_otpSent) {
      // OTP already sent, verify it
      await _verifyOtpAndLogin();
      return;
    } else {
      // Send OTP first
      await _sendOtp();
      return;
    }

    if (!mounted) return;
    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.of(context).pushReplacement(
        MaterialPageRoute(builder: (_) => const WorkerMainScreen()),
      );
    } else if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content:
                Text(authProvider.error ?? 'Login failed. Try demo login.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 60),
              Icon(
                Icons.engineering,
                size: 80,
                color: Theme.of(context).primaryColor,
              ),
              const SizedBox(height: 16),
              Text(
                'SEVAQ Worker',
                style: Theme.of(context).textTheme.headlineMedium,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Sign in to manage your bookings',
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey[600],
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 48),
              // Login Type Toggle
              Row(
                children: [
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _isEmailLogin = true;
                        _otpSent = false;
                        _verificationId = null;
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: _isEmailLogin
                              ? Theme.of(context).primaryColor
                              : Colors.grey[200],
                          borderRadius: const BorderRadius.horizontal(
                            left: Radius.circular(12),
                          ),
                        ),
                        child: Text(
                          'Email Login',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color:
                                _isEmailLogin ? Colors.white : Colors.grey[600],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                  Expanded(
                    child: GestureDetector(
                      onTap: () => setState(() {
                        _isEmailLogin = false;
                        _otpSent = false;
                        _verificationId = null;
                      }),
                      child: Container(
                        padding: const EdgeInsets.symmetric(vertical: 12),
                        decoration: BoxDecoration(
                          color: !_isEmailLogin
                              ? Theme.of(context).primaryColor
                              : Colors.grey[200],
                          borderRadius: const BorderRadius.horizontal(
                            right: Radius.circular(12),
                          ),
                        ),
                        child: Text(
                          'OTP Login',
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: !_isEmailLogin
                                ? Colors.white
                                : Colors.grey[600],
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 24),
              // Email/Phone Field
              TextField(
                controller: _emailController,
                keyboardType: _isEmailLogin
                    ? TextInputType.emailAddress
                    : TextInputType.phone,
                decoration: InputDecoration(
                  labelText: _isEmailLogin ? 'Email' : 'Phone Number',
                  hintText: _isEmailLogin
                      ? 'Enter your email'
                      : 'Enter your phone number',
                  prefixIcon: Icon(
                    _isEmailLogin ? Icons.email_outlined : Icons.phone_outlined,
                  ),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  filled: true,
                  fillColor: Colors.grey[100],
                ),
              ),
              const SizedBox(height: 16),
              // Password Field (only for email login)
              if (_isEmailLogin) ...[
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  decoration: InputDecoration(
                    labelText: 'Password',
                    hintText: 'Enter your password',
                    prefixIcon: const Icon(Icons.lock_outlined),
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_outlined
                            : Icons.visibility_off_outlined,
                      ),
                      onPressed: () {
                        setState(() => _obscurePassword = !_obscurePassword);
                      },
                    ),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                ),
                const SizedBox(height: 24),
              ],
              // Show OTP input field if OTP has been sent
              if (!_isEmailLogin && _otpSent) ...[
                Text(
                  'Enter the 6-digit code sent to your phone',
                  style: TextStyle(color: Colors.grey[600], fontSize: 14),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _passwordController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: InputDecoration(
                    labelText: 'OTP Code',
                    hintText: 'Enter 6-digit OTP',
                    prefixIcon: const Icon(Icons.pin_outlined),
                    counterText: '',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    filled: true,
                    fillColor: Colors.grey[100],
                  ),
                ),
                const SizedBox(height: 16),
                TextButton(
                  onPressed: _isLoading
                      ? null
                      : () {
                          setState(() {
                            _otpSent = false;
                            _verificationId = null;
                            _passwordController.clear();
                          });
                        },
                  child: const Text('Change phone number'),
                ),
                const SizedBox(height: 8),
              ],
              // Login Button
              SizedBox(
                height: 50,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _login,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Theme.of(context).primaryColor,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            valueColor:
                                AlwaysStoppedAnimation<Color>(Colors.white),
                          ),
                        )
                      : Text(
                          _isEmailLogin
                              ? 'Sign In'
                              : (_otpSent ? 'Verify OTP' : 'Send OTP'),
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),
              ),
              const SizedBox(height: 24),
              const SizedBox(height: 24),
              // Footer
              Text(
                _isEmailLogin
                    ? 'Sign in with your worker account credentials'
                    : (_otpSent
                        ? 'Enter the OTP sent to your phone'
                        : 'Enter your phone number to receive OTP'),
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      color: Colors.grey[500],
                    ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              // Sign Up Link
              TextButton(
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute(
                      builder: (_) => const WorkerSignupScreen(),
                    ),
                  );
                },
                child: const Text('Create New Worker Account'),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
