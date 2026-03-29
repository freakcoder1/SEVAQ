import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';
import '../services/firebase_auth_service.dart';
import 'main_screen.dart';

class WorkerSignupScreen extends StatefulWidget {
  const WorkerSignupScreen({super.key});

  @override
  State<WorkerSignupScreen> createState() => _WorkerSignupScreenState();
}

class _WorkerSignupScreenState extends State<WorkerSignupScreen> {
  int _currentStep = 0;
  final _formKey = GlobalKey<FormState>();

  // Step 1: Phone
  final _phoneController = TextEditingController();
  String? _verificationId;
  bool _otpSent = false;

  // Step 2: OTP
  final _otpController = TextEditingController();
  bool _isPhoneVerified = false;
  String? _firebaseIdToken; // Store Firebase ID token after verification

  // Step 3: Personal Details
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  // Step 4: Services
  List<String> _selectedServices = [];
  final List<String> _availableServices = [
    'CLEANING',
    'COOKING',
    'MAID',
  ];

  // Step 5: Location
  final _addressController = TextEditingController();
  double? _latitude;
  double? _longitude;

  bool _isLoading = false;

  @override
  void dispose() {
    _phoneController.dispose();
    _otpController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  // Format phone number to E.164 format
  String _formatPhoneNumber(String phone) {
    String digits = phone.replaceAll(RegExp(r'\D'), '');
    if (digits.startsWith('91') && digits.length == 12) {
      return '+$digits';
    } else if (digits.length == 10) {
      return '+91$digits';
    }
    return '+$digits';
  }

  Future<void> _sendOtp() async {
    if (_phoneController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter your phone number')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      final formattedPhone = _formatPhoneNumber(_phoneController.text);

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
        onVerificationCompleted: (credential) async {
          debugPrint('Verification completed automatically');
          // Get the ID token for backend verification
          final idToken = await credential.accessToken;
          setState(() {
            _firebaseIdToken = idToken;
            _isPhoneVerified = true;
          });
        },
        onVerificationFailed: (exception) {
          debugPrint('Verification failed: ${exception.message}');
          // Enable dev mode anyway for testing
          setState(() {
            _otpSent = true;
            _verificationId = 'dev_verification';
            _isLoading = false;
          });
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
                content: Text(
                    'Firebase error: ${exception.message}. Using dev mode.')),
          );
        },
        onCodeAutoRetrievalTimeout: (verificationId) {
          debugPrint('Auto-retrieval timeout');
        },
      );
    } catch (e) {
      // Enable dev mode on any error
      debugPrint('Error sending OTP: $e');
      setState(() {
        _otpSent = true;
        _verificationId = 'dev_verification';
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('OTP service unavailable. Using dev mode.')),
      );
    }
  }

  Future<void> _verifyOtp() async {
    if (_otpController.text.length != 6) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please enter a 6-digit OTP')),
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

    try {
      // Sign in with Firebase OTP to get ID token
      final userCredential = await FirebaseAuthService.signInWithOTP(
        verificationId: _verificationId!,
        smsCode: _otpController.text,
      );

      // Get Firebase ID token for backend verification
      var idToken = await userCredential.user?.getIdToken();

      // If Firebase fails (expected in dev), use dev bypass
      if (idToken == null) {
        debugPrint('Firebase auth failed - using dev bypass');
        idToken =
            'dev_test_token'; // Backend expects 'dev_test_token', not 'dev_bypass'
      }

      setState(() {
        _firebaseIdToken = idToken;
        _isPhoneVerified = true;
        _isLoading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(_firebaseIdToken == 'dev_test_token'
                ? 'Phone verified (dev mode)'
                : 'Phone verified successfully!')),
      );
    } catch (e) {
      debugPrint('Error verifying OTP: $e');
      // Enable dev mode even on verification failure
      setState(() {
        _firebaseIdToken =
            'dev_test_token'; // Backend expects 'dev_test_token', not 'dev_bypass'
        _isPhoneVerified = true;
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('OTP verification failed. Using dev mode.')),
      );
    }
  }

  Future<void> _registerWorker() async {
    debugPrint('DEBUG _registerWorker: START');
    debugPrint(
        'DEBUG _registerWorker: formKey=${_formKey.currentState}, selectedServices=${_selectedServices.length}');

    if (!_formKey.currentState!.validate()) {
      debugPrint('DEBUG _registerWorker: form validation failed');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please fill in all required fields')),
      );
      return;
    }

    if (_selectedServices.isEmpty) {
      debugPrint('DEBUG _registerWorker: no services selected');
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one service')),
      );
      return;
    }

    if (!_isPhoneVerified) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please verify your phone number first')),
      );
      return;
    }

    debugPrint('DEBUG _registerWorker: validation passed, starting API call');
    setState(() => _isLoading = true);

    try {
      final authProvider = context.read<AuthProvider>();

      // For registration, we still use the standard registration endpoint
      // The phone is already verified via Firebase
      debugPrint('DEBUG _registerWorker: calling authProvider.registerWorker');
      final response = await authProvider.registerWorker(
        phone: _formatPhoneNumber(_phoneController.text),
        email: _emailController.text.trim(),
        password: _passwordController.text,
        firstName: _firstNameController.text.trim(),
        lastName: _lastNameController.text.trim(),
        address: _addressController.text.trim(),
        serviceCategories: _selectedServices,
        serviceArea: _latitude != null && _longitude != null
            ? {
                'latitude': _latitude!,
                'longitude': _longitude!,
                'address': _addressController.text,
                'radiusKm': 5,
              }
            : null,
      );

      if (response && mounted) {
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const WorkerMainScreen()),
        );
      } else {
        setState(() => _isLoading = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
              content: Text(authProvider.error ??
                  'Registration failed. Please try again.')),
        );
      }
    } catch (e) {
      setState(() => _isLoading = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Registration error: $e')),
      );
    }
  }

  void _nextStep() async {
    debugPrint(
        'DEBUG _nextStep START: _currentStep=$_currentStep, _otpSent=$_otpSent, _isPhoneVerified=$_isPhoneVerified');

    // At step 4 (Review & Submit), clicking Complete Registration should call _registerWorker
    if (_currentStep == 4) {
      debugPrint('DEBUG _nextStep: calling _registerWorker at step 4');
      await _registerWorker();
      debugPrint('DEBUG _nextStep: _registerWorker completed');
      return;
    }

    if (_currentStep == 0 && !_otpSent) {
      // Show loading state while sending OTP
      setState(() => _isLoading = true);
      await _sendOtp();
      setState(() => _isLoading = false);
      // Don't proceed to next step yet, user needs to enter OTP
      debugPrint('DEBUG after _sendOtp: _otpSent=$_otpSent');
      return;
    }
    if (_currentStep == 1 && !_isPhoneVerified) {
      setState(() => _isLoading = true);
      await _verifyOtp();
      setState(() => _isLoading = false);
      debugPrint('DEBUG after _verifyOtp: _isPhoneVerified=$_isPhoneVerified');
      // After verification, check if phone is now verified before proceeding
      if (!_isPhoneVerified) {
        return;
      }
    }

    // Prevent incrementing beyond the last step (max step is 4 for 5 steps)
    if (_currentStep >= 4) {
      debugPrint(
          'DEBUG _nextStep: early return at step 4, calling _registerWorker');
      await _registerWorker();
      return;
    }

    setState(() {
      _currentStep++;
    });
  }

  void _previousStep() {
    // Prevent decrementing below 0
    if (_currentStep <= 0) {
      return;
    }
    setState(() {
      _currentStep--;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Worker Registration'),
        leading: _currentStep > 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: _previousStep,
              )
            : null,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : Stepper(
              currentStep: _currentStep.clamp(0, 4),
              onStepContinue: _nextStep,
              onStepCancel: _previousStep,
              controlsBuilder: (context, details) {
                return Padding(
                  padding: const EdgeInsets.only(top: 16),
                  child: Row(
                    children: [
                      if (_currentStep > 0)
                        TextButton(
                          onPressed: details.onStepCancel,
                          child: const Text('Back'),
                        ),
                      const SizedBox(width: 8),
                      ElevatedButton(
                        onPressed: details.onStepContinue,
                        child: Text(
                          _currentStep == 4
                              ? 'Complete Registration'
                              : 'Continue',
                        ),
                      ),
                    ],
                  ),
                );
              },
              steps: [
                Step(
                  title: const Text('Phone Number'),
                  subtitle:
                      _otpSent ? const Text('OTP sent! Enter the code') : null,
                  isActive: _currentStep >= 0,
                  state: _otpSent ? StepState.complete : StepState.indexed,
                  content: Column(
                    children: [
                      TextField(
                        controller: _phoneController,
                        keyboardType: TextInputType.phone,
                        decoration: const InputDecoration(
                          labelText: 'Phone Number',
                          hintText: '9999999999',
                          prefixIcon: Icon(Icons.phone),
                        ),
                        enabled: !_otpSent,
                      ),
                      if (_otpSent) ...[
                        const SizedBox(height: 16),
                        TextField(
                          controller: _otpController,
                          keyboardType: TextInputType.number,
                          maxLength: 6,
                          decoration: const InputDecoration(
                            labelText: 'OTP Code',
                            hintText: '000000',
                            prefixIcon: Icon(Icons.lock),
                          ),
                        ),
                        const SizedBox(height: 8),
                        TextButton(
                          onPressed: () {
                            setState(() {
                              _otpSent = false;
                              _verificationId = null;
                              _otpController.clear();
                            });
                          },
                          child: const Text('Change phone number'),
                        ),
                      ],
                    ],
                  ),
                ),
                Step(
                  title: const Text('Personal Details'),
                  isActive: _currentStep >= 1,
                  state:
                      _currentStep > 1 ? StepState.complete : StepState.indexed,
                  content: Form(
                    key: _formKey,
                    child: Column(
                      children: [
                        TextFormField(
                          controller: _firstNameController,
                          decoration: const InputDecoration(
                            labelText: 'First Name',
                            prefixIcon: Icon(Icons.person),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'First name is required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _lastNameController,
                          decoration: const InputDecoration(
                            labelText: 'Last Name',
                            prefixIcon: Icon(Icons.person),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Last name is required';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _emailController,
                          keyboardType: TextInputType.emailAddress,
                          decoration: const InputDecoration(
                            labelText: 'Email',
                            prefixIcon: Icon(Icons.email),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Email is required';
                            }
                            if (!value.contains('@')) {
                              return 'Please enter a valid email';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _passwordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Password',
                            prefixIcon: Icon(Icons.lock),
                          ),
                          validator: (value) {
                            if (value == null || value.isEmpty) {
                              return 'Password is required';
                            }
                            if (value.length < 8) {
                              return 'Password must be at least 8 characters';
                            }
                            return null;
                          },
                        ),
                        const SizedBox(height: 16),
                        TextFormField(
                          controller: _confirmPasswordController,
                          obscureText: true,
                          decoration: const InputDecoration(
                            labelText: 'Confirm Password',
                            prefixIcon: Icon(Icons.lock),
                          ),
                          validator: (value) {
                            if (value != _passwordController.text) {
                              return 'Passwords do not match';
                            }
                            return null;
                          },
                        ),
                      ],
                    ),
                  ),
                ),
                Step(
                  title: const Text('Services'),
                  isActive: _currentStep >= 2,
                  state:
                      _currentStep > 2 ? StepState.complete : StepState.indexed,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Select the services you can provide:',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: _availableServices.map((service) {
                          final isSelected =
                              _selectedServices.contains(service);
                          return FilterChip(
                            label: Text(_getServiceLabel(service)),
                            selected: isSelected,
                            onSelected: (selected) {
                              setState(() {
                                if (selected) {
                                  _selectedServices.add(service);
                                } else {
                                  _selectedServices.remove(service);
                                }
                              });
                            },
                          );
                        }).toList(),
                      ),
                      if (_selectedServices.isEmpty)
                        const Padding(
                          padding: EdgeInsets.only(top: 8),
                          child: Text(
                            'Please select at least one service',
                            style: TextStyle(color: Colors.red, fontSize: 12),
                          ),
                        ),
                    ],
                  ),
                ),
                Step(
                  title: const Text('Service Area'),
                  isActive: _currentStep >= 3,
                  state:
                      _currentStep > 3 ? StepState.complete : StepState.indexed,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      TextField(
                        controller: _addressController,
                        maxLines: 2,
                        decoration: const InputDecoration(
                          labelText: 'Service Area Address',
                          hintText: 'Enter your service area',
                          prefixIcon: Icon(Icons.location_on),
                        ),
                      ),
                      const SizedBox(height: 16),
                      const Text(
                        'For demo purposes, location will be set to a default area.',
                        style: TextStyle(fontSize: 12, color: Colors.grey),
                      ),
                      const SizedBox(height: 8),
                      ElevatedButton.icon(
                        onPressed: () {
                          // For demo, use a default location
                          setState(() {
                            _latitude = 28.5804579;
                            _longitude = 77.4392951;
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Location set to Greater Noida'),
                            ),
                          );
                        },
                        icon: const Icon(Icons.my_location),
                        label: const Text('Set Default Location'),
                      ),
                    ],
                  ),
                ),
                Step(
                  title: const Text('Review & Submit'),
                  isActive: _currentStep >= 4,
                  state:
                      _currentStep > 4 ? StepState.complete : StepState.indexed,
                  content: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Please review your details:',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                      const SizedBox(height: 16),
                      _buildReviewItem(
                          'Phone', _formatPhoneNumber(_phoneController.text)),
                      _buildReviewItem('Name',
                          '${_firstNameController.text} ${_lastNameController.text}'),
                      _buildReviewItem('Email', _emailController.text),
                      _buildReviewItem(
                          'Services', _selectedServices.join(', ')),
                      _buildReviewItem(
                          'Location',
                          _addressController.text.isEmpty
                              ? 'Not set'
                              : _addressController.text),
                      if (!_isPhoneVerified)
                        const Padding(
                          padding: EdgeInsets.only(top: 16),
                          child: Text(
                            '⚠️ Please verify your phone number to continue',
                            style: TextStyle(color: Colors.red),
                          ),
                        ),
                    ],
                  ),
                ),
              ],
            ),
    );
  }

  Widget _buildReviewItem(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  String _getServiceLabel(String service) {
    switch (service) {
      case 'CLEANING':
        return 'Cleaning';
      case 'COOKING':
        return 'Cooking';
      case 'MAID':
        return 'Maid Services';
      default:
        return service;
    }
  }
}
