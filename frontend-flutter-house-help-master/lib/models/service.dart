class Service {
  // Backend uses UUID (String) for id, but we support both int and String for compatibility
  final dynamic id;
  final String publicId;
  final String name;
  final String description;
  final String category;
  final String? subcategory;
  final double basePrice;
  final bool isAvailable;
  final bool isFastBooking;
  final int? estimatedWaitTime;
  final int? workerCount;

  Service({
    required this.id,
    required this.publicId,
    required this.name,
    required this.description,
    required this.category,
    this.subcategory,
    required this.basePrice,
    this.isAvailable = true,
    this.isFastBooking = false,
    this.estimatedWaitTime,
    this.workerCount,
  });

  factory Service.fromJson(Map<String, dynamic> json) {
    return Service(
      id: _parseId(json['id']),
      publicId: json['publicId'] ?? '',
      name: json['name']?.toString() ?? 'Unknown Service',
      description:
          json['description']?.toString() ?? 'No description available',
      category: json['category']?.toString() ?? 'General',
      subcategory: json['subcategory']?.toString(),
      basePrice: double.tryParse(json['basePrice']?.toString() ?? '0') ?? 0.0,
      isAvailable: json['isAvailable'] ?? true,
      isFastBooking: json['isFastBooking'] ?? false,
      estimatedWaitTime: json['estimatedWaitTime'] != null
          ? int.tryParse(json['estimatedWaitTime'].toString())
          : null,
      workerCount: json['workerCount'] != null
          ? int.tryParse(json['workerCount'].toString())
          : null,
    );
  }

  /// Helper to parse id from various types (int or String UUID)
  static dynamic _parseId(dynamic value) {
    if (value == null) return 0;
    if (value is int) return value;
    if (value is String) return value;
    return 0;
  }
}
