import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/booking_provider.dart';
import '../models/booking.dart';
import '../constants/app_colors.dart';
import '../constants/app_spacing.dart';
import '../constants/app_radius.dart';
import '../constants/app_elevation.dart';
import '../widgets/status_chip.dart';
import 'booking_detail_screen.dart';

class WorkerBookingsScreen extends StatefulWidget {
  const WorkerBookingsScreen({super.key});

  @override
  State<WorkerBookingsScreen> createState() => _WorkerBookingsScreenState();
}

class _WorkerBookingsScreenState extends State<WorkerBookingsScreen>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _statusFilter = 'all';
  String _bookingTypeFilter = 'all'; // 'all', 'subscription', 'on-demand'

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'My Jobs',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.w600,
          ),
        ),
        backgroundColor: AppColors.primaryDark,
        bottom: TabBar(
          controller: _tabController,
          labelColor: Colors.white,
          unselectedLabelColor: Colors.white70,
          indicatorColor: Colors.white,
          indicatorWeight: 3,
          labelStyle: Theme.of(context).textTheme.labelLarge?.copyWith(
                fontWeight: FontWeight.w600,
              ),
          unselectedLabelStyle: Theme.of(context).textTheme.labelLarge,
          tabs: const [
            Tab(text: 'New', icon: Icon(Icons.fiber_new, size: 18)),
            Tab(text: 'In Progress', icon: Icon(Icons.play_circle, size: 18)),
            Tab(text: 'Completed', icon: Icon(Icons.check_circle, size: 18)),
          ],
        ),
      ),
      body: Column(
        children: [
          _buildBookingTypeFilter(),
          _buildStatusFilter(),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                _buildBookingList('new'),
                _buildBookingList('in_progress'),
                _buildBookingList('completed'),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBookingTypeFilter() {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      color: AppColors.surface,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildBookingTypeChip('All', 'all'),
            const SizedBox(width: AppSpacing.xs),
            _buildBookingTypeChip('🔄 Subscription', 'subscription'),
            const SizedBox(width: AppSpacing.xs),
            _buildBookingTypeChip('⚡ One-Time', 'on-demand'),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingTypeChip(String label, String value) {
    final isSelected = _bookingTypeFilter == value;
    Color chipColor;
    Color textColor;

    if (value == 'subscription') {
      chipColor =
          isSelected ? const Color(0xFF3F51B5) : const Color(0xFFE8EAF6);
      textColor = isSelected ? Colors.white : const Color(0xFF3F51B5);
    } else if (value == 'on-demand') {
      chipColor =
          isSelected ? const Color(0xFFFF9800) : const Color(0xFFFFF3E0);
      textColor = isSelected ? Colors.white : const Color(0xFFFF9800);
    } else {
      chipColor = isSelected ? AppColors.primary : AppColors.surfaceVariant;
      textColor = isSelected ? Colors.white : AppColors.textPrimary;
    }

    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          color: textColor,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
      selected: isSelected,
      onSelected: (_) {
        setState(() {
          _bookingTypeFilter = value;
        });
      },
      backgroundColor: chipColor.withOpacity(0.3),
      selectedColor: chipColor,
      checkmarkColor: Colors.white,
      elevation: isSelected ? 2 : 0,
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xxs),
    );
  }

  Widget _buildStatusFilter() {
    return Container(
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md, vertical: AppSpacing.sm),
      color: AppColors.surface,
      child: SingleChildScrollView(
        scrollDirection: Axis.horizontal,
        child: Row(
          children: [
            _buildFilterChip('All', 'all'),
            const SizedBox(width: AppSpacing.xs),
            _buildFilterChip('Pending', 'pending'),
            const SizedBox(width: AppSpacing.xs),
            _buildFilterChip('Confirmed', 'confirmed'),
            const SizedBox(width: AppSpacing.xs),
            _buildFilterChip('Completed', 'completed'),
          ],
        ),
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _statusFilter == value;
    return FilterChip(
      label: Text(
        label,
        style: TextStyle(
          color: isSelected ? Colors.white : AppColors.textPrimary,
          fontWeight: FontWeight.w600,
          fontSize: 13,
        ),
      ),
      selected: isSelected,
      onSelected: (_) {
        setState(() {
          _statusFilter = value;
        });
      },
      backgroundColor: AppColors.surfaceVariant,
      selectedColor: AppColors.primary,
      checkmarkColor: Colors.white,
      elevation: isSelected ? 2 : 0,
      padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.sm, vertical: AppSpacing.xxs),
    );
  }

  List<Booking> _applyFilter(List<Booking> bookings) {
    var filtered = bookings;

    // Apply booking type filter
    if (_bookingTypeFilter == 'subscription') {
      filtered = filtered.where((b) => b.isSubscription).toList();
    } else if (_bookingTypeFilter == 'on-demand') {
      filtered = filtered.where((b) => b.isOnDemand).toList();
    }

    // Apply status filter
    if (_statusFilter == 'all') return filtered;
    return filtered.where((booking) {
      switch (_statusFilter) {
        case 'pending':
          return booking.isPending;
        case 'confirmed':
          return booking.isConfirmed;
        case 'completed':
          return booking.isCompleted;
        default:
          return true;
      }
    }).toList();
  }

  Widget _buildBookingList(String type) {
    return Consumer<BookingProvider>(
      builder: (context, provider, _) {
        List<Booking> bookings;
        String emptyMessage;
        IconData emptyIcon;

        switch (type) {
          case 'new':
            bookings = provider.newBookings;
            emptyMessage = 'No new jobs available';
            emptyIcon = Icons.fiber_new_outlined;
            // Debug: log what's in the New tab
            print('📋 New tab: showing ${bookings.length} bookings');
            for (final b in bookings) {
              print(
                  '  ✅ New: Booking ${b.id} - status=${b.status}, type=${b.bookingType}, isNew=${b.isNewBooking}');
            }
            break;
          case 'in_progress':
            bookings = provider.inProgressBookings;
            emptyMessage = 'No jobs in progress';
            emptyIcon = Icons.play_circle_outline;
            break;
          case 'completed':
            bookings = provider.completedBookings;
            emptyMessage = 'No completed jobs yet';
            emptyIcon = Icons.check_circle_outline;
            break;
          default:
            bookings = [];
            emptyMessage = 'No jobs';
            emptyIcon = Icons.work_outline;
        }

        // Apply status filter
        bookings = _applyFilter(bookings);

        // Sort by scheduled date (newest first for new jobs, oldest first for completed)
        bookings.sort((a, b) {
          final dateA = DateTime.tryParse(a.scheduledDate);
          final dateB = DateTime.tryParse(b.scheduledDate);
          if (dateA == null || dateB == null) return 0;
          return type == 'completed'
              ? dateB.compareTo(dateA)
              : dateA.compareTo(dateB);
        });

        if (provider.isLoading && bookings.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (bookings.isEmpty) {
          return _buildEmptyState(emptyMessage, emptyIcon);
        }

        return RefreshIndicator(
          onRefresh: () => provider.fetchBookings(),
          color: AppColors.primary,
          child: ListView.builder(
            padding: const EdgeInsets.all(AppSpacing.md),
            itemCount: bookings.length,
            itemBuilder: (context, index) {
              return Padding(
                padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                child: _buildBookingCard(bookings[index]),
              );
            },
          ),
        );
      },
    );
  }

  Widget _buildEmptyState(String message, IconData icon) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.xxl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(AppSpacing.xxl),
              decoration: BoxDecoration(
                color: AppColors.surfaceVariant,
                shape: BoxShape.circle,
              ),
              child: Icon(
                icon,
                size: 64,
                color: AppColors.textDisabled,
              ),
            ),
            const SizedBox(height: AppSpacing.lg),
            Text(
              message,
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: AppColors.textSecondary,
                    fontWeight: FontWeight.w500,
                  ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              'Jobs will appear here when assigned',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textHint,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingCard(Booking booking) {
    final statusColor = booking.statusColor;
    final statusSurfaceColor = booking.statusSurfaceColor;
    final bookingTypeColor = booking.bookingTypeColor;
    final bookingTypeSurfaceColor = booking.bookingTypeSurfaceColor;

    return Card(
      elevation: AppElevation.sm,
      color: AppColors.surface,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(AppRadius.md),
        side: BorderSide(
          color: AppColors.border,
          width: 1,
        ),
      ),
      child: InkWell(
        onTap: () {
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => WorkerBookingDetailScreen(booking: booking),
            ),
          );
        },
        borderRadius: BorderRadius.circular(AppRadius.md),
        child: Padding(
          padding: const EdgeInsets.all(AppSpacing.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Booking type badge row
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xxs,
                    ),
                    decoration: BoxDecoration(
                      color: bookingTypeSurfaceColor,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(
                        color: bookingTypeColor.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          booking.isSubscription ? Icons.autorenew : Icons.bolt,
                          size: 12,
                          color: bookingTypeColor,
                        ),
                        const SizedBox(width: AppSpacing.xxs),
                        Text(
                          booking.bookingTypeLabel,
                          style: TextStyle(
                            fontSize: 11,
                            color: bookingTypeColor,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Spacer(),
                  StatusChip.fromBookingStatus(booking.status, isCompact: true),
                ],
              ),
              const SizedBox(height: AppSpacing.sm),
              Row(
                children: [
                  Container(
                    width: 48,
                    height: 48,
                    decoration: BoxDecoration(
                      color: statusSurfaceColor,
                      borderRadius: BorderRadius.circular(AppRadius.sm),
                      border: Border.all(
                        color: statusColor.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Icon(
                      booking.isPending
                          ? Icons.fiber_new
                          : booking.isInProgress
                              ? Icons.play_circle
                              : Icons.check_circle,
                      color: statusColor,
                      size: 24,
                    ),
                  ),
                  const SizedBox(width: AppSpacing.md),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          booking.serviceName,
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: AppColors.textPrimary,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: AppSpacing.xxs),
                        Row(
                          children: [
                            const Icon(
                              Icons.person_outline,
                              size: 14,
                              color: AppColors.textSecondary,
                            ),
                            const SizedBox(width: AppSpacing.xxs),
                            Expanded(
                              child: Text(
                                booking.customerName,
                                style: const TextStyle(
                                  fontSize: 13,
                                  color: AppColors.textSecondary,
                                  fontWeight: FontWeight.w500,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: AppSpacing.md),
              Container(
                padding: const EdgeInsets.all(AppSpacing.sm),
                decoration: BoxDecoration(
                  color: AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(AppRadius.sm),
                  border: Border.all(
                    color: AppColors.border,
                    width: 0.5,
                  ),
                ),
                child: Column(
                  children: [
                    Row(
                      children: [
                        const Icon(
                          Icons.calendar_today_outlined,
                          size: 14,
                          color: AppColors.textSecondary,
                        ),
                        const SizedBox(width: AppSpacing.sm),
                        Text(
                          '${booking.scheduledDate} at ${booking.startTime}',
                          style: const TextStyle(
                            fontSize: 13,
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    if (booking.customerAddress != null &&
                        booking.customerAddress!.isNotEmpty) ...[
                      const SizedBox(height: AppSpacing.sm),
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Icon(
                            Icons.location_on_outlined,
                            size: 14,
                            color: AppColors.textSecondary,
                          ),
                          const SizedBox(width: AppSpacing.sm),
                          Expanded(
                            child: Text(
                              booking.customerAddress!,
                              style: const TextStyle(
                                fontSize: 13,
                                color: AppColors.textPrimary,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: AppSpacing.md),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(
                        Icons.currency_rupee,
                        size: 18,
                        color: AppColors.success,
                      ),
                      const SizedBox(width: AppSpacing.xxs),
                      Text(
                        '\u20B9${booking.price.toStringAsFixed(0)}',
                        style: const TextStyle(
                          fontSize: 16,
                          color: AppColors.success,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: AppSpacing.sm,
                      vertical: AppSpacing.xxs,
                    ),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(AppRadius.full),
                      border: Border.all(
                        color: AppColors.primary.withOpacity(0.3),
                        width: 1,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Text(
                          'View Details',
                          style: TextStyle(
                            fontSize: 12,
                            color: AppColors.primary,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                        const SizedBox(width: AppSpacing.xxs),
                        Icon(
                          Icons.chevron_right,
                          size: 14,
                          color: AppColors.primary,
                        ),
                      ],
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
