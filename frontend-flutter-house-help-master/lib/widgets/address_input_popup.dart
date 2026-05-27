import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart' as geocoding;
import '../models/address.dart';

class AddressInputPopup extends StatefulWidget {
  final Function(Address) onAddressSaved;

  const AddressInputPopup({Key? key, required this.onAddressSaved})
    : super(key: key);

  @override
  State<AddressInputPopup> createState() => _AddressInputPopupState();
}

class _AddressInputPopupState extends State<AddressInputPopup> {
  final _formKey = GlobalKey<FormState>();
  final _societyController = TextEditingController();
  final _towerController = TextEditingController();
  final _flatController = TextEditingController();
  final _landmarkController = TextEditingController();
  final _areaController = TextEditingController();
  final _pincodeController = TextEditingController();

  bool _isSaving = false;
  bool _isFetchingLocation = false;
  double? _latitude;
  double? _longitude;
  String? _gpsAddress;

  @override
  void dispose() {
    _societyController.dispose();
    _towerController.dispose();
    _flatController.dispose();
    _landmarkController.dispose();
    _areaController.dispose();
    _pincodeController.dispose();
    super.dispose();
  }

  /// Fetch current GPS coordinates using device location services
  Future<void> _fetchCurrentLocation() async {
    setState(() {
      _isFetchingLocation = true;
    });

    try {
      // Check if location services are enabled
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Please enable GPS/location services on your device',
              ),
              backgroundColor: Colors.orange,
            ),
          );
        }
        setState(() => _isFetchingLocation = false);
        return;
      }

      // Check/request permission
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          if (mounted) {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text(
                  'Location permission denied. Please enable it in settings.',
                ),
                backgroundColor: Colors.orange,
              ),
            );
          }
          setState(() => _isFetchingLocation = false);
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              content: Text(
                'Location permission permanently denied. Please enable in app settings.',
              ),
              backgroundColor: Colors.red,
            ),
          );
        }
        setState(() => _isFetchingLocation = false);
        return;
      }

      // Get current position
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      );

      setState(() {
        _latitude = position.latitude;
        _longitude = position.longitude;
      });

      // Try to reverse geocode to get address
      try {
        List<geocoding.Placemark> placemarks = await geocoding
            .placemarkFromCoordinates(position.latitude, position.longitude);

        if (placemarks.isNotEmpty) {
          geocoding.Placemark place = placemarks.first;

          // Auto-fill address fields if they're empty
          if (_areaController.text.isEmpty && place.subLocality != null) {
            _areaController.text = place.subLocality!;
          }
          if (_pincodeController.text.isEmpty && place.postalCode != null) {
            _pincodeController.text = place.postalCode!;
          }
          if (_societyController.text.isEmpty && place.thoroughfare != null) {
            _societyController.text = place.thoroughfare!;
          }

          _gpsAddress = [
            place.street,
            place.subLocality,
            place.locality,
            place.administrativeArea,
            place.postalCode,
          ].where((e) => e != null && e.isNotEmpty).join(', ');
        }
      } catch (e) {
        debugPrint('Reverse geocoding failed: $e');
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(
              'GPS location captured: ${_latitude!.toStringAsFixed(4)}, ${_longitude!.toStringAsFixed(4)}',
            ),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      debugPrint('Error fetching location: $e');
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to get location: ${e.toString()}'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isFetchingLocation = false);
      }
    }
  }

  void _saveAddress() {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    final address = Address(
      id: '',
      userId: '',
      societyName: _societyController.text.trim(),
      towerNumber: _towerController.text.trim().isEmpty
          ? null
          : _towerController.text.trim(),
      flatNumber: _flatController.text.trim(),
      landmark: _landmarkController.text.trim().isEmpty
          ? null
          : _landmarkController.text.trim(),
      area: _areaController.text.trim().isEmpty
          ? null
          : _areaController.text.trim(),
      pincode: _pincodeController.text.trim().isEmpty
          ? null
          : _pincodeController.text.trim(),
      latitude: _latitude,
      longitude: _longitude,
      isDefault: true,
    );

    widget.onAddressSaved(address);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
      child: Container(
        constraints: BoxConstraints(
          maxWidth: 400,
          maxHeight: MediaQuery.of(context).size.height * 0.8,
        ),
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(
                        Icons.location_on,
                        color: theme.colorScheme.primary,
                        size: 24,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Save Your Address',
                            style: theme.textTheme.titleLarge?.copyWith(
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            'We\'ll use this for your bookings',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                    IconButton(
                      onPressed: () => Navigator.of(context).pop(),
                      icon: const Icon(Icons.close),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
                const SizedBox(height: 24),

                // GPS Location Button
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: _latitude != null
                        ? theme.colorScheme.tertiaryContainer
                        : theme.colorScheme.surfaceVariant,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: _latitude != null
                          ? theme.colorScheme.tertiary.withAlpha(
                              (0.3 * 255).round(),
                            )
                          : theme.colorScheme.outline,
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _latitude != null
                                ? Icons.check_circle
                                : Icons.my_location,
                            color: _latitude != null
                                ? theme.colorScheme.tertiary
                                : theme.colorScheme.primary,
                            size: 20,
                          ),
                          const SizedBox(width: 8),
                          Expanded(
                            child: Text(
                              _latitude != null
                                  ? 'GPS Location Captured'
                                  : 'Use Current GPS Location',
                              style: theme.textTheme.labelLarge?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: _latitude != null
                                    ? theme.colorScheme.tertiary
                                    : theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ),
                          ElevatedButton.icon(
                            onPressed: _isFetchingLocation
                                ? null
                                : _fetchCurrentLocation,
                            icon: _isFetchingLocation
                                ? const SizedBox(
                                    height: 16,
                                    width: 16,
                                    child: CircularProgressIndicator(
                                      strokeWidth: 2,
                                      valueColor: AlwaysStoppedAnimation<Color>(
                                        Colors.white,
                                      ),
                                    ),
                                  )
                                : const Icon(Icons.gps_fixed, size: 18),
                            label: Text(
                              _isFetchingLocation
                                  ? 'Fetching...'
                                  : 'Get Location',
                            ),
                            style: ElevatedButton.styleFrom(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              backgroundColor: Colors.blue[700],
                              foregroundColor: Colors.white,
                              textStyle: const TextStyle(
                                fontSize: 12,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ),
                        ],
                      ),
                      if (_latitude != null) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Lat: ${_latitude!.toStringAsFixed(6)}, Lng: ${_longitude!.toStringAsFixed(6)}',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: theme.colorScheme.tertiary,
                            fontFamily: 'monospace',
                          ),
                        ),
                        if (_gpsAddress != null) ...[
                          const SizedBox(height: 4),
                          Text(
                            'Address: $_gpsAddress',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ],
                    ],
                  ),
                ),
                const SizedBox(height: 24),

                // Society Name
                Text(
                  'Society / Building Name',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _societyController,
                  decoration: InputDecoration(
                    hintText: 'e.g., Green Valley Apartments',
                    prefixIcon: Icon(Icons.apartment, color: Colors.blue[300]),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: Colors.blue[700]!,
                        width: 2,
                      ),
                    ),
                  ),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Please enter society name';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 16),

                // Tower & Flat Row
                Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Tower / Wing',
                            style: theme.textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _towerController,
                            decoration: InputDecoration(
                              hintText: 'e.g., A',
                              prefixIcon: Icon(
                                Icons.business,
                                color: Colors.blue[300],
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.blue[700]!,
                                  width: 2,
                                ),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Flat / Unit No.',
                            style: theme.textTheme.labelLarge?.copyWith(
                              fontWeight: FontWeight.w600,
                              color: Colors.grey[700],
                            ),
                          ),
                          const SizedBox(height: 8),
                          TextFormField(
                            controller: _flatController,
                            decoration: InputDecoration(
                              hintText: 'e.g., 402',
                              prefixIcon: Icon(
                                Icons.door_front_door,
                                color: Colors.blue[300],
                              ),
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                              ),
                              focusedBorder: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide(
                                  color: Colors.blue[700]!,
                                  width: 2,
                                ),
                              ),
                            ),
                            validator: (value) {
                              if (value == null || value.trim().isEmpty) {
                                return 'Required';
                              }
                              return null;
                            },
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),

                // Area (Optional)
                Text(
                  'Area / Locality (Optional)',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _areaController,
                  decoration: InputDecoration(
                    hintText: 'e.g., Sector 62',
                    prefixIcon: Icon(Icons.map, color: Colors.blue[300]),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: Colors.blue[700]!,
                        width: 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),

                // Pincode (Optional)
                Text(
                  'Pincode (Optional)',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _pincodeController,
                  keyboardType: TextInputType.number,
                  maxLength: 6,
                  decoration: InputDecoration(
                    hintText: 'e.g., 110001',
                    prefixIcon: Icon(Icons.pin_drop, color: Colors.blue[300]),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: Colors.blue[700]!,
                        width: 2,
                      ),
                    ),
                    counterText: '',
                  ),
                ),
                const SizedBox(height: 16),

                // Landmark (Optional)
                Text(
                  'Landmark (Optional)',
                  style: theme.textTheme.labelLarge?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[700],
                  ),
                ),
                const SizedBox(height: 8),
                TextFormField(
                  controller: _landmarkController,
                  decoration: InputDecoration(
                    hintText: 'e.g., Near Metro Station',
                    prefixIcon: Icon(Icons.flag, color: Colors.blue[300]),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(
                        color: Colors.blue[700]!,
                        width: 2,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // Save Button
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _isSaving ? null : _saveAddress,
                    style: ElevatedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                      backgroundColor: Colors.blue[700],
                    ),
                    child: _isSaving
                        ? const SizedBox(
                            height: 20,
                            width: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              valueColor: AlwaysStoppedAnimation<Color>(
                                Colors.white,
                              ),
                            ),
                          )
                        : const Text(
                            'SAVE & CONTINUE',
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                  ),
                ),
              ],
            ), // Column
          ), // SingleChildScrollView
        ), // Form
      ), // Container
    ); // Dialog
  }
}
