class Booking {
  final String id;
  final String serviceName;
  final String? serviceCategory;
  final String customerName;
  final String? customerPhone;
  final String? customerAddress;
  final String scheduledDate;
  final String startTime;
  final String? endTime;
  final String
  status; // PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, REJECTED
  final double price;
  final String? paymentStatus;
  final String? notes;
  final String? bookingType; // ONE_TIME, SUBSCRIPTION
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Booking({
    required this.id,
    required this.serviceName,
    this.serviceCategory,
    required this.customerName,
    this.customerPhone,
    this.customerAddress,
    required this.scheduledDate,
    required this.startTime,
    this.endTime,
    required this.status,
    required this.price,
    this.paymentStatus,
    this.notes,
    this.bookingType,
    this.createdAt,
    this.updatedAt,
  });

  factory Booking.fromJson(Map<String, dynamic> json) {
    return Booking(
      id: json['id']?.toString() ?? json['bookingId']?.toString() ?? '',
      serviceName:
          json['serviceName'] ??
          json['service'] ??
          json['serviceType'] ??
          'Service',
      serviceCategory: json['serviceCategory'] ?? json['category'],
      customerName:
          json['customerName'] ??
          json['userName'] ??
          json['customer'] ??
          'Customer',
      customerPhone:
          json['customerPhone'] ?? json['phone'] ?? json['customerPhone'],
      customerAddress:
          json['customerAddress'] ?? json['address'] ?? json['location'],
      scheduledDate:
          json['scheduledDate'] ?? json['date'] ?? json['bookingDate'] ?? '',
      startTime: json['startTime'] ?? json['time'] ?? json['startTime'] ?? '',
      endTime: json['endTime'],
      status: json['status'] ?? json['bookingStatus'] ?? 'PENDING',
      price: (json['price'] ?? json['amount'] ?? json['totalPrice'] ?? 0)
          .toDouble(),
      paymentStatus: json['paymentStatus'] ?? json['payment'],
      notes: json['notes'] ?? json['description'],
      bookingType: json['bookingType'] ?? json['type'],
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt'])
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.tryParse(json['updatedAt'])
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'serviceName': serviceName,
      'serviceCategory': serviceCategory,
      'customerName': customerName,
      'customerPhone': customerPhone,
      'customerAddress': customerAddress,
      'scheduledDate': scheduledDate,
      'startTime': startTime,
      'endTime': endTime,
      'status': status,
      'price': price,
      'paymentStatus': paymentStatus,
      'notes': notes,
      'bookingType': bookingType,
    };
  }

  bool get isPending => status == 'PENDING';
  bool get isConfirmed => status == 'CONFIRMED';
  bool get isInProgress => status == 'IN_PROGRESS';
  bool get isCompleted => status == 'COMPLETED';
  bool get isCancelled => status == 'CANCELLED';
  bool get isRejected => status == 'REJECTED';
}
