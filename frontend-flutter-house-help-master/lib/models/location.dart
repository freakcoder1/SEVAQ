import 'dart:convert';
import 'package:geocoding/geocoding.dart' as geocoding;

typedef Placemark = geocoding.Placemark;

class Location {
  final String address;
  final double? latitude;
  final double? longitude;
  final String? city;
  final String? state;
  final String? country;

  Location({
    required this.address,
    this.latitude,
    this.longitude,
    this.city,
    this.state,
    this.country,
  });

  factory Location.fromPlacemark(
    Placemark placemark, {
    double? lat,
    double? lng,
  }) {
    return Location(
      address: [
        placemark.street,
        placemark.locality,
        placemark.administrativeArea,
        placemark.country,
      ].where((element) => element != null && element.isNotEmpty).join(', '),
      latitude: lat,
      longitude: lng,
      city: placemark.locality,
      state: placemark.administrativeArea,
      country: placemark.country,
    );
  }

  factory Location.fromGeocodingLocation(geocoding.Location location) {
    return Location(
      address: 'Lat: ${location.latitude}, Lng: ${location.longitude}',
      latitude: location.latitude,
      longitude: location.longitude,
      city: null,
      state: null,
      country: null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'address': address,
      'latitude': latitude,
      'longitude': longitude,
      'city': city,
      'state': state,
      'country': country,
    };
  }

  factory Location.fromJson(Map<String, dynamic> json) {
    return Location(
      address: json['address'],
      latitude: json['latitude'],
      longitude: json['longitude'],
      city: json['city'],
      state: json['state'],
      country: json['country'],
    );
  }

  @override
  String toString() {
    return address;
  }

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;
    return other is Location && other.address == address;
  }

  @override
  int get hashCode => address.hashCode;

  // Persistence methods
  String toJsonString() {
    return jsonEncode(toJson());
  }

  static Location? fromJsonString(String? jsonString) {
    if (jsonString == null || jsonString.isEmpty) return null;
    try {
      return Location.fromJson(jsonDecode(jsonString));
    } catch (e) {
      return null;
    }
  }
}
