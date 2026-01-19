import 'package:flutter/material.dart';
import '../models/worker.dart';
import '../models/service.dart';

class WorkerDetailsScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;

  const WorkerDetailsScreen({Key? key, required this.worker, this.service})
    : super(key: key);

  @override
  _WorkerDetailsScreenState createState() => _WorkerDetailsScreenState();
}

class _WorkerDetailsScreenState extends State<WorkerDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: Text('Professional Information'),
        backgroundColor: Colors.white,
        foregroundColor: Colors.black87,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Professional Header
            Row(
              children: [
                Container(
                  width: 80,
                  height: 80,
                  decoration: BoxDecoration(
                    color: Colors.grey[300],
                    shape: BoxShape.circle,
                  ),
                  child: Center(
                    child: Icon(
                      Icons.person,
                      size: 40,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
                SizedBox(width: 16),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        '${widget.worker.user.firstName} ${widget.worker.user.lastName}',
                        style: theme.textTheme.displayMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      SizedBox(height: 4),
                      Text(
                        'Verified Sevaq Professional',
                        style: theme.textTheme.bodyMedium?.copyWith(
                          color: Colors.black54,
                        ),
                      ),
                      SizedBox(height: 8),
                      Row(
                        children: [
                          Icon(
                            Icons.star,
                            color: theme.colorScheme.secondary,
                            size: 16,
                          ),
                          SizedBox(width: 4),
                          Text(
                            '${widget.worker.rating} (${widget.worker.reviewCount} reviews)',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),

            SizedBox(height: 24),

            // About Section
            Text(
              'About',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Text(
              widget.worker.bio.isNotEmpty
                  ? widget.worker.bio
                  : 'This professional is verified by Sevaq and has undergone our quality assurance process.',
              style: theme.textTheme.bodyLarge,
            ),

            SizedBox(height: 24),

            // Service Information
            if (widget.service != null) ...[
              Text(
                'Assigned Service',
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
              SizedBox(height: 8),
              Container(
                padding: EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: theme.colorScheme.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: theme.primaryColor.withOpacity(0.2),
                  ),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.service!.name,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      widget.service!.description,
                      style: theme.textTheme.bodyMedium,
                    ),
                    SizedBox(height: 8),
                    Row(
                      children: [
                        Icon(
                          Icons.attach_money,
                          color: theme.colorScheme.secondary,
                          size: 16,
                        ),
                        SizedBox(width: 4),
                        Text(
                          'Base Price: ₹${widget.service!.basePrice.toStringAsFixed(2)}',
                          style: theme.textTheme.bodyMedium,
                        ),
                      ],
                    ),
                  ],
                ),
              ),

              SizedBox(height: 24),
            ],

            // SevaQ Guarantee
            Text(
              'SevaQ Guarantee',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 8),
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFFF8F9FA),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: const Color(0xFF2E7D32),
                        size: 16,
                      ),
                      SizedBox(width: 8),
                      Text(
                        'Verified professional',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ],
                  ),
                  SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(
                        Icons.check_circle,
                        color: const Color(0xFF2E7D32),
                        size: 16,
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
                        color: const Color(0xFF2E7D32),
                        size: 16,
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
                        color: const Color(0xFF2E7D32),
                        size: 16,
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

            SizedBox(height: 32),

            // Contact Support
            Container(
              padding: EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 4,
                    offset: Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Need Assistance?',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'If you have any questions about your service or professional assignment, our support team is here to help.',
                    style: theme.textTheme.bodyMedium,
                  ),
                  SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton(
                          onPressed: () {
                            // Handle call support
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text(
                                  'Call support would be initiated',
                                ),
                              ),
                            );
                          },
                          style: OutlinedButton.styleFrom(
                            side: BorderSide(color: theme.primaryColor),
                            padding: EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.call, size: 16),
                              SizedBox(width: 8),
                              Text('Call Support'),
                            ],
                          ),
                        ),
                      ),
                      SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton(
                          onPressed: () {
                            // Handle chat support
                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(
                                content: Text('Chat support would be opened'),
                              ),
                            );
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: theme.primaryColor,
                            foregroundColor: Colors.white,
                            padding: EdgeInsets.symmetric(vertical: 12),
                          ),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.chat_bubble, size: 16),
                              SizedBox(width: 8),
                              Text('Chat Support'),
                            ],
                          ),
                        ),
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
}
