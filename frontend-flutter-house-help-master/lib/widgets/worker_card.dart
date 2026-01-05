import 'package:flutter/material.dart';
import '../models/worker.dart';

class WorkerCard extends StatelessWidget {
  final Worker worker;
  final VoidCallback onTap;

  const WorkerCard({Key? key, required this.worker, required this.onTap})
    : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(
      label:
          '${worker.user.firstName} ${worker.user.lastName}, rating ${worker.rating} with ${worker.reviewCount} reviews, available',
      hint: 'Tap to view worker details',
      button: true,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          margin: EdgeInsets.only(bottom: 16),
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: [
                theme.colorScheme.surface,
                theme.colorScheme.surface.withAlpha((0.9 * 255).round()),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: theme.primaryColor.withAlpha((0.1 * 255).round()),
                blurRadius: 12,
                offset: Offset(0, 5),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  shape: BoxShape.circle,
                ),
                child: Semantics(
                  excludeSemantics: true,
                  child: Icon(Icons.person, color: Colors.grey),
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Semantics(
                      excludeSemantics: true,
                      child: Text(
                        '${worker.user.firstName} ${worker.user.lastName}',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    SizedBox(height: 4),
                    Row(
                      children: [
                        Semantics(
                          excludeSemantics: true,
                          child: Icon(
                            Icons.star,
                            color: theme.colorScheme.secondary,
                            size: 16,
                          ),
                        ),
                        SizedBox(width: 4),
                        Semantics(
                          excludeSemantics: true,
                          child: Text(
                            '${worker.rating} (${worker.reviewCount} reviews)',
                            style: theme.textTheme.bodyMedium,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Semantics(
                    excludeSemantics: true,
                    child: Text(
                      'Available', // Can be dynamic
                      style: TextStyle(
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
