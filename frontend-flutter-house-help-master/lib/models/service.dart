class Service {
  final String id;
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
      id: json['id'] ?? '',
      name: json['name'] ?? 'Unknown Service',
      description: json['description'] ?? 'No description available',
      category: json['category'] ?? 'General',
      subcategory: json['subcategory'],
      basePrice: double.tryParse(json['basePrice']?.toString() ?? '0') ?? 0.0,
      isAvailable: json['isAvailable'] ?? true,
      isFastBooking: json['isFastBooking'] ?? false,
      estimatedWaitTime: json['estimatedWaitTime'],
      workerCount: json['workerCount'],
    );
  }
}
