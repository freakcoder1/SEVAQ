import 'package:flutter/material.dart';

class TrustFirstHeader extends StatelessWidget {
  final String location;
  final String systemMessage;

  const TrustFirstHeader({
    Key? key,
    required this.location,
    required this.systemMessage,
  }) : super(key: key);

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).scaffoldBackgroundColor,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.green[100]!),
        boxShadow: [
          BoxShadow(
            color: Colors.green.withOpacity(0.1),
            blurRadius: 8,
            offset: Offset(0, 4),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Location and System Message Row
          Row(
            children: [
              // Location Icon and Text
              Expanded(
                child: Row(
                  children: [
                    Icon(Icons.location_on, color: Colors.green[600], size: 20),
                    SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            location,
                            style: TextStyle(
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                              color: Colors.black87,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                          SizedBox(height: 2),
                          Text(
                            systemMessage,
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.green[600],
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          SizedBox(height: 8),
          // Support Signal (Subtle)
          Container(
            alignment: Alignment.centerRight,
            child: Text(
              'Support is live',
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[500],
                fontWeight: FontWeight.w400,
                letterSpacing: 0.2,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
