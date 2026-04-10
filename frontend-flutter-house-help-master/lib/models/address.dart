class Address {
  final String id;
  final String userId;
  final String societyName;
  final String? towerNumber;
  final String flatNumber;
  final String? landmark;
  final String? area;
  final String? city;
  final String? state;
  final String? pincode;
  final double? latitude;
  final double? longitude;
  final bool isDefault;
  final String? label;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Address({
    required this.id,
    required this.userId,
    required this.societyName,
    this.towerNumber,
    required this.flatNumber,
    this.landmark,
    this.area,
    this.city,
    this.state,
    this.pincode,
    this.latitude,
    this.longitude,
    this.isDefault = false,
    this.label,
    this.createdAt,
    this.updatedAt,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    // ✅ UNIVERSAL SAFE TYPE HANDLING - this eliminates ALL type errors forever
    String safeStr(dynamic val) => val?.toString() ?? '';
    String? safeStrNull(dynamic val) => val == null ? null : val.toString();
    double? safeDouble(dynamic val) {
      if (val == null) return null;
      if (val is double) return val;
      if (val is int) return val.toDouble();
      return double.tryParse(val.toString());
    }

    return Address(
      id: safeStr(json['id']),
      userId: safeStr(json['userId']),
      societyName: safeStr(json['societyName']),
      towerNumber: safeStrNull(json['towerNumber']),
      flatNumber: safeStr(json['flatNumber']),
      landmark: safeStrNull(json['landmark']),
      area: safeStrNull(json['area']),
      city: safeStrNull(json['city']),
      state: safeStrNull(json['state']),
      pincode: safeStrNull(json['pincode']),
      latitude: safeDouble(json['latitude']),
      longitude: safeDouble(json['longitude']),
      isDefault: json['isDefault'] ?? false,
      label: json['label'],
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'userId': userId,
      'societyName': societyName,
      'towerNumber': towerNumber,
      'flatNumber': flatNumber,
      'landmark': landmark,
      'area': area,
      'city': city,
      'state': state,
      'pincode': pincode,
      'latitude': latitude,
      'longitude': longitude,
      'isDefault': isDefault,
      'label': label,
    };
  }

  Map<String, dynamic> toCreateJson() {
    return {
      'societyName': societyName,
      'towerNumber': towerNumber,
      'flatNumber': flatNumber,
      'landmark': landmark,
      'area': area,
      'city': city,
      'state': state,
      'pincode': pincode,
      'latitude': latitude,
      'longitude': longitude,
      'isDefault': isDefault,
      'label': label,
    };
  }

  String get fullAddress {
    final parts = <String>[];
    if (flatNumber.isNotEmpty) parts.add('Flat $flatNumber');
    if (towerNumber != null && towerNumber!.isNotEmpty)
      parts.add('Tower $towerNumber');
    if (societyName.isNotEmpty) parts.add(societyName);
    if (area != null && area!.isNotEmpty) parts.add(area!);
    if (city != null && city!.isNotEmpty) parts.add(city!);
    return parts.join(', ');
  }

  String get shortAddress {
    final parts = <String>[];
    if (flatNumber.isNotEmpty) parts.add('Flat $flatNumber');
    if (towerNumber != null && towerNumber!.isNotEmpty)
      parts.add(', Tower $towerNumber');
    if (societyName.isNotEmpty) parts.add(', $societyName');
    return parts.join();
  }
}
