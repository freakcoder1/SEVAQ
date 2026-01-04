import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/service_provider.dart';
import '../models/service.dart';
import '../widgets/service_card.dart';
import 'service_details_screen.dart';

class CategoryScreen extends StatelessWidget {
  final String category;

  const CategoryScreen({Key? key, required this.category}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(category),
      ),
      body: Consumer<ServiceProvider>(
        builder: (context, provider, _) {
          final categoryServices = provider.services.where((service) => service.category == category).toList();
          if (provider.isLoading) {
            return Center(child: CircularProgressIndicator());
          }
          if (categoryServices.isEmpty) {
            return Center(child: Text('No services in this category.'));
          }
          return GridView.builder(
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
                      ),
                    ),
                  );
                },
              );
            },
          );
        },
      ),
    );
  }
}