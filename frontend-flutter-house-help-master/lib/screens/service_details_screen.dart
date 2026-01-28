import 'package:flutter/material.dart';
import '../models/service.dart';
import '../models/worker.dart';
import '../models/user.dart';
import 'schedule_pricing_screen.dart';
import 'subscription_profiles_screen.dart';

class ServiceDetailsScreen extends StatefulWidget {
  final Service service;

  const ServiceDetailsScreen({Key? key, required this.service})
    : super(key: key);

  @override
  _ServiceDetailsScreenState createState() => _ServiceDetailsScreenState();
}

class _ServiceDetailsScreenState extends State<ServiceDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(title: Text(widget.service.name)),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Service Icon or Image
            Container(
              height: 150,
              decoration: BoxDecoration(
                color: theme.primaryColor.withAlpha((0.1 * 255).round()),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Center(
                child: Icon(
                  Icons.cleaning_services,
                  size: 80,
                  color: theme.primaryColor,
                ),
              ),
            ),
            SizedBox(height: 24),
            // Service Name
            Text(
              widget.service.name,
              style: theme.textTheme.displayMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            // Category
            Row(
              children: [
                Icon(Icons.category, color: theme.colorScheme.secondary),
                SizedBox(width: 8),
                Text(
                  'Category: ${widget.service.category}',
                  style: theme.textTheme.titleMedium,
                ),
              ],
            ),
            SizedBox(height: 12),
            // Base Price
            Row(
              children: [
                Icon(Icons.attach_money, color: theme.colorScheme.secondary),
                SizedBox(width: 8),
                Text(
                  'Base Price: \$${widget.service.basePrice.toStringAsFixed(2)}',
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            SizedBox(height: 24),
            // Description
            Text(
              'Description',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(widget.service.description, style: theme.textTheme.bodyLarge),
            SizedBox(height: 30),

            // Service Handling Section
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.primaryColor.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How would you like this service handled?',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 16),

                  // Monthly Service Option (Primary)
                  Container(
                    decoration: BoxDecoration(
                      color: theme.primaryColor.withOpacity(0.05),
                      border: Border.all(color: theme.primaryColor, width: 2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SubscriptionProfilesScreen(
                              serviceType: widget.service.category
                                  .toUpperCase(),
                              serviceName: widget.service.name,
                            ),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'Monthly service',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_forward,
                                  color: theme.primaryColor,
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Text(
                              'We handle this for you, every day',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.black54,
                              ),
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Includes scheduling, replacements, and service guarantee',
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.primaryColor,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),

                  SizedBox(height: 16),

                  // One-time Service Option (Secondary)
                  Container(
                    decoration: BoxDecoration(
                      color: Colors.white,
                      border: Border.all(color: Colors.grey[200]!, width: 1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: InkWell(
                      onTap: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (_) => SchedulePricingScreen(
                              worker: _createPlaceholderWorker(),
                              service: widget.service,
                            ),
                          ),
                        );
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Padding(
                        padding: EdgeInsets.all(20),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text(
                                  'One-time service',
                                  style: theme.textTheme.titleMedium?.copyWith(
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                                Icon(
                                  Icons.arrow_forward,
                                  color: Colors.grey[400],
                                ),
                              ],
                            ),
                            SizedBox(height: 8),
                            Text(
                              'Schedule once, pay per visit',
                              style: theme.textTheme.bodyMedium?.copyWith(
                                color: Colors.black54,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),

            SizedBox(height: 30),

            // Service Scope Section
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.primaryColor.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Service Scope',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'This service includes comprehensive cleaning of all rooms, kitchen areas, and common spaces. Our professionals use eco-friendly cleaning products and follow strict hygiene protocols.',
                    style: theme.textTheme.bodyLarge,
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'All rooms cleaned',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Kitchen deep cleaning',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Eco-friendly products',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            SizedBox(height: 24),

            // What's Included Section
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.primaryColor.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'What\'s Included',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Your service includes:',
                    style: theme.textTheme.bodyLarge,
                  ),
                  SizedBox(height: 12),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Professional assignment',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Service monitoring',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Quality guarantee',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Support throughout',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),

            SizedBox(height: 30),

            // Managed Service Explanation
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: theme.colorScheme.surface,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: theme.primaryColor.withOpacity(0.2)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'How SevaQ Works',
                    style: theme.textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'We handle the professional assignment for you. Once you schedule your service, SevaQ will assign the best available professional based on expertise and availability.',
                    style: theme.textTheme.bodyLarge,
                  ),
                  SizedBox(height: 16),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Verified professionals',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Assignment monitoring',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: theme.colorScheme.secondary,
                        size: 18,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Support throughout',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Worker _createPlaceholderWorker() {
    return Worker(
      id: 0,
      publicId: 'placeholder-worker',
      user: User(
        id: 0,
        publicId: 'placeholder-user',
        firstName: 'Sevaq',
        lastName: 'Professional',
        email: 'sevaq@sevaq.com',
        role: 'worker',
      ),
      bio:
          'Your assigned professional will be selected based on availability and expertise.',
      rating: 4.5,
      reviewCount: 100,
      services: [],
    );
  }
}
