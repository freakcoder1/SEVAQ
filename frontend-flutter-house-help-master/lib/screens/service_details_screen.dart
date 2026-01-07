import 'package:flutter/material.dart';
import '../models/service.dart';
import '../models/worker.dart';
import '../providers/worker_provider.dart';
import '../widgets/worker_card.dart';
import 'worker_details_screen.dart';

class ServiceDetailsScreen extends StatefulWidget {
  final Service service;
  final WorkerProvider workerProvider;

  const ServiceDetailsScreen({
    Key? key,
    required this.service,
    required this.workerProvider,
  }) : super(key: key);

  @override
  _ServiceDetailsScreenState createState() => _ServiceDetailsScreenState();
}

class _ServiceDetailsScreenState extends State<ServiceDetailsScreen> {
  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    // Use the passed workerProvider instead of Consumer
    final provider = widget.workerProvider;

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
            // Available Workers
            Text(
              'Available Workers',
              style: theme.textTheme.titleLarge?.copyWith(
                fontWeight: FontWeight.bold,
              ),
            ),
            SizedBox(height: 16),
            // Use the passed workerProvider directly instead of Consumer
            _buildWorkersList(provider),
          ],
        ),
      ),
    );
  }

  Widget _buildWorkersList(WorkerProvider provider) {
    if (provider.isLoading) {
      return Center(child: CircularProgressIndicator());
    }

    final availableWorkers = provider.workers
        .where(
          (worker) => worker.services.any((s) => s.id == widget.service.id),
        )
        .toList();

    if (availableWorkers.isEmpty) {
      return Text('No workers available for this service.');
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: NeverScrollableScrollPhysics(),
      itemCount: availableWorkers.length,
      itemBuilder: (context, index) {
        return WorkerCard(
          worker: availableWorkers[index],
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(
                builder: (_) => WorkerDetailsScreen(
                  worker: availableWorkers[index],
                  service: widget.service,
                ),
              ),
            );
          },
        );
      },
    );
  }
}
