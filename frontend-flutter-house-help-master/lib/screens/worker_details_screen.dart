import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../models/worker.dart';
import '../models/service.dart';

import '../providers/slot_provider.dart';
import 'booking_screen.dart';
import 'reviews_screen.dart';

class WorkerDetailsScreen extends StatefulWidget {
  final Worker worker;
  final Service? service;

  const WorkerDetailsScreen({Key? key, required this.worker, this.service}) : super(key: key);

  @override
  _WorkerDetailsScreenState createState() => _WorkerDetailsScreenState();
}

class _WorkerDetailsScreenState extends State<WorkerDetailsScreen> {
  DateTime _selectedDate = DateTime.now();

  @override
  void initState() {
    super.initState();
    // Use WidgetsBinding.instance.addPostFrameCallback to avoid setState during build
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<SlotProvider>(context, listen: false).fetchSlots();
    });
  }

  Future<void> _selectDate(BuildContext context) async {
    final DateTime? picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(Duration(days: 30)),
    );
    if (picked != null && picked != _selectedDate) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final allSlots = Provider.of<SlotProvider>(
      context,
    ).getSlotsForWorker(widget.worker.id);

    // Filter slots by selected date
    final slots = allSlots.where((slot) {
      return slot.startTime.year == _selectedDate.year &&
             slot.startTime.month == _selectedDate.month &&
             slot.startTime.day == _selectedDate.day;
    }).toList();

    return Scaffold(
      body: CustomScrollView(
        slivers: [
          SliverAppBar(
            expandedHeight: 250,
            pinned: true,
            flexibleSpace: FlexibleSpaceBar(
              background: Container(
                color: Colors.grey[300], // Placeholder for image
                child: Center(
                  child: Icon(Icons.person, size: 100, color: Colors.grey[600]),
                ),
              ),
            ),
          ),
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(24.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${widget.worker.user.firstName} ${widget.worker.user.lastName}',
                        style: theme.textTheme.displayMedium,
                      ),
                      Container(
                        padding: EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 6,
                        ),
                        decoration: BoxDecoration(
                          color: theme.colorScheme.secondary.withOpacity(0.2),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.star,
                              color: theme.colorScheme.secondary,
                              size: 20,
                            ),
                            SizedBox(width: 4),
                            Text(
                              widget.worker.rating.toString(),
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                          ],
                        ),
                      ),
                      TextButton(
                        onPressed: () {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ReviewsScreen(worker: widget.worker),
                            ),
                          );
                        },
                        child: Text(
                          'View Reviews (${widget.worker.reviewCount})',
                          style: TextStyle(
                            color: theme.colorScheme.primary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),
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
                        : 'No bio available.',
                    style: theme.textTheme.bodyLarge,
                  ),
                  SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'Available Slots',
                        style: theme.textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      TextButton.icon(
                        onPressed: () => _selectDate(context),
                        icon: Icon(Icons.calendar_today),
                        label: Text(DateFormat('MMM d').format(_selectedDate)),
                      ),
                    ],
                  ),
                  SizedBox(height: 16),
                  slots.isEmpty
                      ? Text('No slots available.')
                      : Wrap(
                          spacing: 12,
                          runSpacing: 12,
                          children: slots.map((slot) {
                            return ActionChip(
                              label: Text(
                                '${DateFormat('MMM d').format(slot.startTime)}\n${DateFormat('jm').format(slot.startTime)}',
                                textAlign: TextAlign.center,
                              ),
                              padding: EdgeInsets.symmetric(
                                horizontal: 12,
                                vertical: 8,
                              ),
                              backgroundColor: theme.colorScheme.surface,
                              side: BorderSide(
                                color: theme.colorScheme.primary.withOpacity(
                                  0.2,
                                ),
                              ),
                              onPressed: () {
                                 Navigator.push(
                                   context,
                                   MaterialPageRoute(
                                     builder: (_) => BookingScreen(
                                       worker: widget.worker,
                                       slot: slot,
                                       service: widget.service,
                                     ),
                                   ),
                                 );
                               },
                            );
                          }).toList(),
                        ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
