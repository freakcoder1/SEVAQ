import 'package:flutter/material.dart';
import '../providers/service_provider.dart';
import '../providers/worker_provider.dart';
import '../models/service.dart';
import '../widgets/service_card.dart';
import 'service_details_screen.dart';

class CategoryScreen extends StatelessWidget {
  final String category;
  final ServiceProvider serviceProvider;
  final WorkerProvider workerProvider;
  final dynamic userId; // Accept both int and String (UUID)

  const CategoryScreen({
    Key? key,
    required this.category,
    required this.serviceProvider,
    required this.workerProvider,
    required this.userId,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    // Use the passed serviceProvider instead of Consumer
    final provider = serviceProvider;
    final categoryServices = provider.services
        .where((service) => service.category == category)
        .toList();

    return Scaffold(
      appBar: AppBar(title: Text(category)),
      body: provider.isLoading
          ? Center(child: CircularProgressIndicator())
          : categoryServices.isEmpty
          ? Center(child: Text('No services in this category.'))
          : GridView.builder(
              padding: EdgeInsets.all(16),
              gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
                childAspectRatio: 0.8,
              ),
              itemCount: categoryServices.length,
              itemBuilder: (context, index) {
                return ServiceCard(
                  service: categoryServices[index],
                  onTap: () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (_) => ServiceDetailsScreen(
                          service: categoryServices[index],
                          userId: userId,
                        ),
                      ),
                    );
                  },
                );
              },
            ),
    );
  }
}
