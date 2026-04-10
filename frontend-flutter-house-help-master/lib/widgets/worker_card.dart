import 'package:flutter/material.dart';
import '../models/worker.dart';

class WorkerCard extends StatelessWidget {
  final Worker worker;
  final VoidCallback? onTap; // Made optional for informational use
  final bool isSelectable; // New parameter to control selection behavior
  final bool
  isPostAssignment; // New parameter to indicate post-assignment state

  const WorkerCard({
    Key? key,
    required this.worker,
    this.onTap,
    this.isSelectable = true,
    this.isPostAssignment = false,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Semantics(
      label:
          '${worker.user.firstName} ${worker.user.lastName}, rating ${worker.rating} with ${worker.reviewCount} reviews',
      hint: isSelectable ? 'Tap to view worker details' : null,
      button: isSelectable,
      child: GestureDetector(
        onTap: isSelectable ? onTap : null,
        child: Container(
          margin: EdgeInsets.only(bottom: 16),
          padding: EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: isSelectable
                ? theme.colorScheme.surface
                : theme.colorScheme.surface.withValues(alpha: 0.6),
            borderRadius: BorderRadius.circular(16),
            boxShadow: isSelectable
                ? [
                    BoxShadow(
                      color: theme.primaryColor.withAlpha((0.1 * 255).round()),
                      blurRadius: 12,
                      offset: Offset(0, 5),
                    ),
                  ]
                : [],
            border: isSelectable
                ? Border.all(color: Colors.transparent)
                : Border.all(color: Colors.grey[400]!),
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
                    Row(
                      children: [
                        Expanded(
                          child: Semantics(
                            excludeSemantics: true,
                            child: Text(
                              '${worker.user.firstName} ${worker.user.lastName}',
                              style: theme.textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        if (worker.isVerified)
                          Container(
                            padding: EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: Colors.green.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.verified, color: Colors.green, size: 14),
                                SizedBox(width: 2),
                                Text(
                                  'Verified',
                                  style: TextStyle(
                                    color: Colors.green,
                                    fontSize: 10,
                                    fontWeight: FontWeight.bold,
                                  ),
                                ),
                              ],
                            ),
                          ),
                      ],
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
                    SizedBox(height: 4),
                    Row(
                      children: [
                        if (worker.homesServedInArea > 0) ...[
                          Icon(Icons.home, size: 12, color: Colors.grey[600]),
                          SizedBox(width: 2),
                          Text(
                            '${worker.homesServedInArea}+ homes served',
                            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                          ),
                          SizedBox(width: 8),
                        ],
                        if (worker.yearsOfExperience > 0) ...[
                          Icon(Icons.work, size: 12, color: Colors.grey[600]),
                          SizedBox(width: 2),
                          Text(
                            '${worker.yearsOfExperience} years',
                            style: TextStyle(fontSize: 11, color: Colors.grey[600]),
                          ),
                        ],
                      ],
                    ),
                    if (!isSelectable) SizedBox(height: 4),
                    if (!isSelectable)
                      Text(
                        isPostAssignment
                            ? 'Your assigned professional'
                            : 'Informational only',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                          fontStyle: FontStyle.italic,
                        ),
                      ),
                  ],
                ),
              ),
              if (isSelectable)
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Semantics(
                      excludeSemantics: true,
                      child: Text(
                        'View Details',
                        style: TextStyle(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
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
