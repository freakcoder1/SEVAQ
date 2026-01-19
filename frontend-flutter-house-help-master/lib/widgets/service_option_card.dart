import 'package:flutter/material.dart';
import '../models/service_option.dart';

/// Service option card for the Service Clarification Page
/// Displays individual service options in a clean, selectable format
class ServiceOptionCard extends StatelessWidget {
  final ServiceOption service;
  final bool isSelected;
  final VoidCallback onTap;

  const ServiceOptionCard({
    Key? key,
    required this.service,
    required this.isSelected,
    required this.onTap,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: isSelected ? 2 : 0,
      margin: const EdgeInsets.only(bottom: 16),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(
          color: isSelected ? const Color(0xFF81C784) : Colors.transparent,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: Row(
            children: [
              // Leading icon with subtle styling
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: isSelected
                      ? const Color(0xFFE8F5E9)
                      : Colors.grey[100],
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(
                  service.icon,
                  size: 24,
                  color: isSelected
                      ? const Color(0xFF2E7D32)
                      : Colors.grey[600],
                ),
              ),

              const SizedBox(width: 16),

              // Service content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Service name
                    Text(
                      service.name,
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Service description
                    Text(
                      service.description,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: Colors.black54,
                        height: 1.4,
                      ),
                    ),

                    const SizedBox(height: 8),

                    // Reassurance badge - only show green for Maid/House Help
                    if (service.type == ServiceType.maid)
                      Text(
                        service.getReassuranceBadge(),
                        style: TextStyle(
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFF2E7D32),
                        ),
                      ),
                  ],
                ),
              ),

              // Selection indicator
              if (isSelected)
                Container(
                  width: 24,
                  height: 24,
                  decoration: const BoxDecoration(
                    color: Color(0xFF2E7D32),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.check, size: 16, color: Colors.white),
                ),
            ],
          ),
        ),
      ),
    );
  }
}
