import 'dart:async';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/firebase_auth_service.dart';
import '../providers/auth_provider.dart';
import '../services/navigation_service.dart';
import 'auth_wrapper.dart';
import 'profile_completion_screen.dart';

class OtpLoginScreen extends StatefulWidget {
  final String phoneNumber;
  final String? verificationId;
  final String? firstName;
  final String? lastName;

  const OtpLoginScreen({
    Key? key,
    required this.phoneNumber,
    this.verificationId,
    this.firstName,
    this.lastName,
  }) : super(key: key);

  @override
  State<OtpLoginScreen> createState() => _OtpLoginScreenState();
}

class _OtpLoginScreenState extends State<OtpLoginScreen> {
  final TextEditingController _otpController = TextEditingController();
  final _formKey = GlobalKey<FormState>();

  bool _isLoading = false;
  bool _isSendingOTP = false;
  String? _verificationId;
  String _errorMessage = '';
  int _resendToken = 0;

  @override
  void initState() {
    super.initState();
    if (widget.verificationId != null) {
      _verificationId = widget.verificationId;
    } else {
      _sendOTP();
    }
  }

  Future<void> _sendOTP() async {
    if (!mounted) return;

    setState(() {
      _isSendingOTP = true;
      _errorMessage = '';
    });

    try {
      await FirebaseAuthService.verifyPhoneNumber(
        phoneNumber: widget.phoneNumber,
        onCodeSent: (verificationId, resendToken) {
          if (!mounted) return;
          setState(() {
            _verificationId = verificationId;
            _resendToken = resendToken ?? 0;
            _isSendingOTP = false;
          });
          debugPrint('OTP sent, verificationId: $verificationId');
        },
        onVerificationCompleted: (credential) async {
          debugPrint('Verification completed automatically');
          await _handleVerificationSuccess();
        },
        onVerificationFailed: (exception) {
          if (!mounted) return;
          setState(() {
            _isSendingOTP = false;
            _errorMessage = exception.message ?? 'Verification failed';
          });
        },
        onCodeAutoRetrievalTimeout: (verificationId) {
          debugPrint('Auto-retrieval timeout for: $verificationId');
        },
      );
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isSendingOTP = false;
        _errorMessage = 'Failed to send OTP: $e';
      });
    }
  }

  Future<void> _verifyOTP() async {
    if (_verificationId == null) {
      setState(() {
        _errorMessage = 'Verification ID not received. Please resend OTP.';
      });
      return;
    }

    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = '';
    });

    try {
      // Sign in with Firebase using OTP
      await FirebaseAuthService.signInWithOTP(
        verificationId: _verificationId!,
        smsCode: _otpController.text,
      );

      await _handleVerificationSuccess();
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Invalid OTP. Please try again.';
      });
    }
  }

  Future<void> _handleVerificationSuccess() async {
    try {
      // Get Firebase ID token
      final idToken = await FirebaseAuthService.getIdToken();
      debugPrint('Got Firebase ID token');

      // Login with backend using Firebase credentials
      final success = await Provider.of<AuthProvider>(context, listen: false)
          .loginWithFirebase(
            phone: widget.phoneNumber,
            idToken: idToken,
            firstName: widget.firstName,
            lastName: widget.lastName,
          );

      if (!mounted) return;

      if (success) {
        // Check if profile needs completion
        final authProvider = Provider.of<AuthProvider>(context, listen: false);

        if (authProvider.needsProfileCompletion) {
          // Navigate to profile completion screen
          if (mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(
                builder: (context) => const ProfileCompletionScreen(),
              ),
              (route) => false,
            );
          }
        } else {
          // Navigate to home screen
          if (mounted) {
            Navigator.pushAndRemoveUntil(
              context,
              MaterialPageRoute(builder: (context) => const AuthWrapper()),
              (route) => false,
            );
          }
        }
      } else {
        setState(() {
          _isLoading = false;
          _errorMessage = 'Failed to login. Please try again.';
        });
      }
    } catch (e) {
      if (!mounted) return;
      setState(() {
        _isLoading = false;
        _errorMessage = 'Login failed: $e';
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: const Text('Verify Phone'), centerTitle: true),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 40),

                // Header
                Text(
                  'Enter OTP',
                  style: theme.textTheme.displaySmall?.copyWith(
                    fontSize: 32,
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 16),

                // Instructions
                Text(
                  'We sent a 6-digit OTP to',
                  style: theme.textTheme.bodyLarge?.copyWith(
                    color: Colors.grey[600],
                  ),
                ),
                Text(
                  widget.phoneNumber,
                  style: theme.textTheme.bodyLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),

                const SizedBox(height: 32),

                // OTP Input
                TextFormField(
                  controller: _otpController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 24, letterSpacing: 8),
                  decoration: const InputDecoration(
                    labelText: 'OTP',
                    hintText: '000000',
                    counterText: '',
                  ),
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter OTP';
                    }
                    if (value.length < 6) {
                      return 'OTP must be 6 digits';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                // Error Message
                if (_errorMessage.isNotEmpty)
                  Container(
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      _errorMessage,
                      style: TextStyle(color: Colors.red[700]),
                    ),
                  ),

                const SizedBox(height: 24),

                // Verify Button
                ElevatedButton(
                  onPressed: _isLoading ? null : _verifyOTP,
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('VERIFY & CONTINUE'),
                ),

                const SizedBox(height: 16),

                // Resend OTP
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      "Didn't receive OTP?",
                      style: theme.textTheme.bodyMedium,
                    ),
                    TextButton(
                      onPressed: _isSendingOTP ? null : _sendOTP,
                      child: _isSendingOTP
                          ? const SizedBox(
                              height: 16,
                              width: 16,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('Resend OTP'),
                    ),
                  ],
                ),

                const Spacer(),

                // Help text
                Text(
                  'By continuing, you agree to our Terms of Service and Privacy Policy.',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.grey[500],
                  ),
                  textAlign: TextAlign.center,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  @override
  void dispose() {
    _otpController.dispose();
    super.dispose();
  }
}
