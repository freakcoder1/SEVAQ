import 'package:flutter/material.dart';
import '../models/service.dart';

class ServiceCard extends StatelessWidget {
  final Service service;
  final VoidCallback onTap;

  const ServiceCard({Key? key, required this.service, required this.onTap})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: EdgeInsets.all(12),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Service Image/Icon
              Container(
                height: 80,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Icon(
                    _getServiceIcon(service.category),
                    size: 36,
                    color: Colors.blue[600],
                  ),
                ),
              ),
              SizedBox(height: 8),

              // Service Name
              Text(
                service.name,
                style: TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.bold,
                  color: Colors.black87,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),

              SizedBox(height: 4),

              // Category
              Text(
                service.category,
                style: TextStyle(fontSize: 12, color: Colors.grey[600]),
              ),

              SizedBox(height: 8),

              // Price
              Row(
                children: [
                  Text(
                    '₹${service.basePrice}',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.green[600],
                    ),
                  ),
                  Spacer(),

                  // Fast booking badge
                  if (service.isFastBooking)
                    Container(
                      padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                      decoration: BoxDecoration(
                        color: Colors.green[100],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Row(
                        children: [
                          Icon(Icons.timer, size: 12, color: Colors.green[700]),
                          SizedBox(width: 2),
                          Text(
                            '15-30 min',
                            style: TextStyle(
                              fontSize: 10,
                              color: Colors.green[700],
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                    ),
                ],
              ),

              SizedBox(height: 4),

              // Availability indicator
              if (service.isAvailable)
                Row(
                  children: [
                    Icon(Icons.check_circle, size: 12, color: Colors.green),
                    SizedBox(width: 4),
                    Text(
                      'Available',
                      style: TextStyle(fontSize: 10, color: Colors.green),
                    ),
                  ],
                )
              else
                Row(
                  children: [
                    Icon(Icons.schedule, size: 12, color: Colors.orange),
                    SizedBox(width: 4),
                    Text(
                      'Waitlist',
                      style: TextStyle(fontSize: 10, color: Colors.orange),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  IconData _getServiceIcon(String category) {
    switch (category.toLowerCase()) {
      case 'cleaning':
        return Icons.cleaning_services;
      case 'cooking':
        return Icons.restaurant;
      case 'electrician':
        return Icons.electrical_services;
      case 'plumber':
        return Icons.plumbing;
      case 'caretaker':
        return Icons.person;
      default:
        return Icons.category;
    }
  }
}
