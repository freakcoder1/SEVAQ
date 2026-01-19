import 'package:flutter/material.dart';
import '../models/service.dart';
import '../models/worker.dart';
import '../models/user.dart';
import 'schedule_pricing_screen.dart';

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

      // Primary CTA - Go to Schedule & Pricing
      bottomNavigationBar: Container(
        padding: EdgeInsets.symmetric(horizontal: 24, vertical: 16),
        decoration: BoxDecoration(
          color: Colors.white,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
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
                style: ElevatedButton.styleFrom(
                  backgroundColor: Color(0xFF2E7D32),
                  foregroundColor: Colors.white,
                  padding: EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                  textStyle: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                child: Text('Schedule & Get Price'),
              ),
            ),
            SizedBox(height: 8),
            Text(
              'We\'ll assign a professional and monitor your service',
              style: TextStyle(fontSize: 12, color: Colors.black54),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Worker _createPlaceholderWorker() {
    return Worker(
      id: 'placeholder-worker',
      user: User(
        id: 'placeholder-user',
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
