import 'package:meta/meta.dart';

enum ServiceRequestStatus { requested, assigned, failed }

class ServiceRequest {
  final int id;
  final String publicId;
  final int userId;
  final int serviceId;
  final DateTime date;
  final String timeWindow;
  final double priceSnapshot;
  final ServiceRequestStatus status;
  final int? assignedWorkerId;
  final int? assignedSlotId;
  final String? failureReason;
  final Map<String, dynamic>? metadata;
  final String? source;

  ServiceRequest({
    required this.id,
    required this.publicId,
    required this.userId,
    required this.serviceId,
    required this.date,
    required this.timeWindow,
    required this.priceSnapshot,
    required this.status,
    this.assignedWorkerId,
    this.assignedSlotId,
    this.failureReason,
    this.metadata,
    this.source,
  });

  factory ServiceRequest.fromJson(Map<String, dynamic> json) {
    return ServiceRequest(
      id: json['id'],
      publicId: json['publicId'],
      userId: json['userId'],
      serviceId: json['serviceId'],
      date: DateTime.parse(json['date']),
      timeWindow: json['timeWindow'],
      priceSnapshot: json['priceSnapshot'].toDouble(),
      status: _parseStatus(json['status']),
      assignedWorkerId: json['assignedWorkerId'],
      assignedSlotId: json['assignedSlotId'],
      failureReason: json['failureReason'],
      metadata: json['metadata'],
      source: json['source'],
    );
  }

  static ServiceRequestStatus _parseStatus(String status) {
    switch (status.toLowerCase()) {
      case 'requested':
        return ServiceRequestStatus.requested;
      case 'assigned':
        return ServiceRequestStatus.assigned;
      case 'failed_to_assign':
        return ServiceRequestStatus.failed;
      default:
        return ServiceRequestStatus.requested;
    }
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'publicId': publicId,
      'userId': userId,
      'serviceId': serviceId,
      'date': date.toIso8601String(),
      'timeWindow': timeWindow,
      'priceSnapshot': priceSnapshot,
      'status': status.toString().split('.').last,
      'assignedWorkerId': assignedWorkerId,
      'assignedSlotId': assignedSlotId,
      'failureReason': failureReason,
      'metadata': metadata,
      'source': source,
    };
  }

  bool get isAssigned => status == ServiceRequestStatus.assigned;
  bool get isFailed => status == ServiceRequestStatus.failed;
  bool get isPending => status == ServiceRequestStatus.requested;

  String get statusText {
    switch (status) {
      case ServiceRequestStatus.requested:
        return 'Requested';
      case ServiceRequestStatus.assigned:
        return 'Assigned';
      case ServiceRequestStatus.failed:
        return 'Failed';
    }
  }
}
