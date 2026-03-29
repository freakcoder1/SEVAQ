import 'package:flutter/material.dart';
import '../../services/admin_api_service.dart';
import 'package:fl_chart/fl_chart.dart';

class AdminAnalyticsScreen extends StatefulWidget {
  const AdminAnalyticsScreen({super.key});

  @override
  State<AdminAnalyticsScreen> createState() => _AdminAnalyticsScreenState();
}

class _AdminAnalyticsScreenState extends State<AdminAnalyticsScreen> {
  final AdminApiService _adminService = AdminApiService();

  // Revenue Analytics
  AdminRevenueAnalytics? _revenueAnalytics;
  bool _revenueLoading = true;
  String? _revenueError;
  String _revenuePeriod = 'month';

  // Booking Analytics
  AdminBookingAnalytics? _bookingAnalytics;
  bool _bookingLoading = true;
  String? _bookingError;

  @override
  void initState() {
    super.initState();
    _loadAnalytics();
  }

  Future<void> _loadAnalytics() async {
    await Future.wait([_loadRevenueAnalytics(), _loadBookingAnalytics()]);
  }

  Future<void> _loadRevenueAnalytics() async {
    setState(() {
      _revenueLoading = true;
      _revenueError = null;
    });

    try {
      final analytics = await _adminService.getRevenueAnalytics(
        period: _revenuePeriod,
      );
      setState(() {
        _revenueAnalytics = analytics;
        _revenueLoading = false;
      });
    } catch (e) {
      setState(() {
        _revenueError = 'Failed to load revenue analytics: $e';
        _revenueLoading = false;
      });
    }
  }

  Future<void> _loadBookingAnalytics() async {
    setState(() {
      _bookingLoading = true;
      _bookingError = null;
    });

    try {
      final analytics = await _adminService.getBookingAnalytics();
      setState(() {
        _bookingAnalytics = analytics;
        _bookingLoading = false;
      });
    } catch (e) {
      setState(() {
        _bookingError = 'Failed to load booking analytics: $e';
        _bookingLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Analytics'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadAnalytics,
            tooltip: 'Refresh',
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: _loadAnalytics,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Revenue Section
              _buildSectionTitle('Revenue Analytics'),
              const SizedBox(height: 16),
              _buildRevenueStats(),
              const SizedBox(height: 24),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _buildRevenueTrendChart()),
                  const SizedBox(width: 16),
                  Expanded(child: _buildRevenueByServiceChart()),
                ],
              ),
              const SizedBox(height: 32),

              // Booking Analytics Section
              _buildSectionTitle('Booking Analytics'),
              const SizedBox(height: 16),
              _buildBookingStats(),
              const SizedBox(height: 24),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(child: _buildBookingsByServiceChart()),
                  const SizedBox(width: 16),
                  Expanded(child: _buildBookingsByStatusChart()),
                ],
              ),
              const SizedBox(height: 24),
              _buildBookingRates(),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
    );
  }

  Widget _buildRevenueStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: _revenueLoading
            ? const Center(child: CircularProgressIndicator())
            : _revenueError != null
            ? Center(child: Text(_revenueError!))
            : Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      'Total Revenue',
                      '₹${(_revenueAnalytics?.totalRevenue ?? 0).toStringAsFixed(0)}',
                      Icons.attach_money,
                      Colors.green,
                    ),
                  ),
                  Expanded(
                    child: _buildStatItem(
                      'Average per Booking',
                      '₹${(_revenueAnalytics?.averagePerBooking ?? 0).toStringAsFixed(0)}',
                      Icons.receipt,
                      Colors.blue,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: color.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(icon, color: color),
        ),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
        ),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }

  Widget _buildRevenueTrendChart() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Revenue Trend',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                ),
                DropdownButton<String>(
                  value: _revenuePeriod,
                  items: const [
                    DropdownMenuItem(value: 'day', child: Text('Daily')),
                    DropdownMenuItem(value: 'week', child: Text('Weekly')),
                    DropdownMenuItem(value: 'month', child: Text('Monthly')),
                    DropdownMenuItem(value: 'year', child: Text('Yearly')),
                  ],
                  onChanged: (value) {
                    setState(() {
                      _revenuePeriod = value!;
                    });
                    _loadRevenueAnalytics();
                  },
                ),
              ],
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _revenueLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _revenueAnalytics?.revenueByDate.isNotEmpty == true
                  ? LineChart(
                      LineChartData(
                        gridData: FlGridData(
                          show: true,
                          drawVerticalLine: false,
                          horizontalInterval:
                              _revenueAnalytics!.revenueByDate
                                  .map((e) => e.revenue)
                                  .reduce((a, b) => a > b ? a : b) /
                              4,
                        ),
                        titlesData: FlTitlesData(
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                if (value.toInt() <
                                    _revenueAnalytics!.revenueByDate.length) {
                                  final date = _revenueAnalytics!
                                      .revenueByDate[value.toInt()]
                                      .date;
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      date.length > 5
                                          ? date.substring(5)
                                          : date,
                                      style: const TextStyle(fontSize: 10),
                                    ),
                                  );
                                }
                                return const Text('');
                              },
                              reservedSize: 30,
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                return Text(
                                  '₹${value.toInt()}',
                                  style: const TextStyle(fontSize: 10),
                                );
                              },
                              reservedSize: 50,
                            ),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        lineBarsData: [
                          LineChartBarData(
                            spots: _revenueAnalytics!.revenueByDate
                                .asMap()
                                .entries
                                .map((entry) {
                                  return FlSpot(
                                    entry.key.toDouble(),
                                    entry.value.revenue,
                                  );
                                })
                                .toList(),
                            isCurved: true,
                            color: Theme.of(context).primaryColor,
                            barWidth: 3,
                            dotData: const FlDotData(show: false),
                            belowBarData: BarAreaData(
                              show: true,
                              color: Theme.of(
                                context,
                              ).primaryColor.withOpacity(0.1),
                            ),
                          ),
                        ],
                      ),
                    )
                  : const Center(child: Text('No data')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRevenueByServiceChart() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Revenue by Service',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _revenueLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _revenueAnalytics?.revenueByService.isNotEmpty == true
                  ? PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: 40,
                        sections: _revenueAnalytics!.revenueByService
                            .asMap()
                            .entries
                            .map((entry) {
                              return PieChartSectionData(
                                value: entry.value.revenue,
                                title: '₹${entry.value.revenue.toInt()}',
                                titleStyle: const TextStyle(
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                  color: Colors.white,
                                ),
                                color: _getServiceColor(entry.key),
                                radius: 50,
                              );
                            })
                            .toList(),
                      ),
                    )
                  : const Center(child: Text('No data')),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children:
                  _revenueAnalytics?.revenueByService.asMap().entries.map((
                    entry,
                  ) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: _getServiceColor(entry.key),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          entry.value.service,
                          style: const TextStyle(fontSize: 11),
                        ),
                      ],
                    );
                  }).toList() ??
                  [],
            ),
          ],
        ),
      ),
    );
  }

  Color _getServiceColor(int index) {
    final colors = [
      Colors.blue,
      Colors.green,
      Colors.orange,
      Colors.purple,
      Colors.red,
      Colors.teal,
      Colors.amber,
      Colors.indigo,
    ];
    return colors[index % colors.length];
  }

  Widget _buildBookingStats() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: _bookingLoading
            ? const Center(child: CircularProgressIndicator())
            : _bookingError != null
            ? Center(child: Text(_bookingError!))
            : Row(
                children: [
                  Expanded(
                    child: _buildStatItem(
                      'Total Bookings',
                      (_bookingAnalytics?.totalBookings ?? 0).toString(),
                      Icons.calendar_today,
                      Colors.blue,
                    ),
                  ),
                ],
              ),
      ),
    );
  }

  Widget _buildBookingsByServiceChart() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Bookings by Service',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _bookingLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _bookingAnalytics?.bookingsByService.isNotEmpty == true
                  ? BarChart(
                      BarChartData(
                        alignment: BarChartAlignment.spaceAround,
                        maxY:
                            _bookingAnalytics!.bookingsByService
                                .map((e) => e.count)
                                .reduce((a, b) => a > b ? a : b)
                                .toDouble() *
                            1.2,
                        barTouchData: BarTouchData(enabled: false),
                        titlesData: FlTitlesData(
                          show: true,
                          bottomTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                if (value.toInt() <
                                    _bookingAnalytics!
                                        .bookingsByService
                                        .length) {
                                  final service = _bookingAnalytics!
                                      .bookingsByService[value.toInt()]
                                      .service;
                                  return Padding(
                                    padding: const EdgeInsets.only(top: 8),
                                    child: Text(
                                      service.length > 8
                                          ? '${service.substring(0, 8)}...'
                                          : service,
                                      style: const TextStyle(fontSize: 10),
                                    ),
                                  );
                                }
                                return const Text('');
                              },
                              reservedSize: 30,
                            ),
                          ),
                          leftTitles: AxisTitles(
                            sideTitles: SideTitles(
                              showTitles: true,
                              getTitlesWidget: (value, meta) {
                                return Text(
                                  value.toInt().toString(),
                                  style: const TextStyle(fontSize: 10),
                                );
                              },
                              reservedSize: 30,
                            ),
                          ),
                          topTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                          rightTitles: const AxisTitles(
                            sideTitles: SideTitles(showTitles: false),
                          ),
                        ),
                        borderData: FlBorderData(show: false),
                        barGroups: _bookingAnalytics!.bookingsByService
                            .asMap()
                            .entries
                            .map((entry) {
                              return BarChartGroupData(
                                x: entry.key,
                                barRods: [
                                  BarChartRodData(
                                    toY: entry.value.count.toDouble(),
                                    color: _getServiceColor(entry.key),
                                    width: 20,
                                    borderRadius: const BorderRadius.only(
                                      topLeft: Radius.circular(4),
                                      topRight: Radius.circular(4),
                                    ),
                                  ),
                                ],
                              );
                            })
                            .toList(),
                      ),
                    )
                  : const Center(child: Text('No data')),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBookingsByStatusChart() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Bookings by Status',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: _bookingLoading
                  ? const Center(child: CircularProgressIndicator())
                  : _bookingAnalytics?.bookingsByStatus.isNotEmpty == true
                  ? PieChart(
                      PieChartData(
                        sectionsSpace: 2,
                        centerSpaceRadius: 40,
                        sections: _bookingAnalytics!.bookingsByStatus.map((
                          entry,
                        ) {
                          return PieChartSectionData(
                            value: entry.count.toDouble(),
                            title: '${entry.count}',
                            titleStyle: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            color: _getStatusColor(entry.status),
                            radius: 50,
                          );
                        }).toList(),
                      ),
                    )
                  : const Center(child: Text('No data')),
            ),
            const SizedBox(height: 16),
            Wrap(
              spacing: 16,
              runSpacing: 8,
              children:
                  _bookingAnalytics?.bookingsByStatus.map((entry) {
                    return Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: _getStatusColor(entry.status),
                            shape: BoxShape.circle,
                          ),
                        ),
                        const SizedBox(width: 4),
                        Text(
                          entry.status,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ],
                    );
                  }).toList() ??
                  [],
            ),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'PENDING':
        return Colors.orange;
      case 'CONFIRMED':
        return Colors.blue;
      case 'IN_PROGRESS':
        return Colors.cyan;
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Widget _buildBookingRates() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Completion & Cancellation Rates',
              style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            _bookingLoading
                ? const Center(child: CircularProgressIndicator())
                : Row(
                    children: [
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              '${_bookingAnalytics?.completionRate ?? 0}%',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.green,
                              ),
                            ),
                            const Text('Completion Rate'),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value:
                                  (_bookingAnalytics?.completionRate ?? 0) /
                                  100,
                              backgroundColor: Colors.grey[300],
                              valueColor: const AlwaysStoppedAnimation(
                                Colors.green,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(width: 32),
                      Expanded(
                        child: Column(
                          children: [
                            Text(
                              '${_bookingAnalytics?.cancellationRate ?? 0}%',
                              style: const TextStyle(
                                fontSize: 32,
                                fontWeight: FontWeight.bold,
                                color: Colors.red,
                              ),
                            ),
                            const Text('Cancellation Rate'),
                            const SizedBox(height: 8),
                            LinearProgressIndicator(
                              value:
                                  (_bookingAnalytics?.cancellationRate ?? 0) /
                                  100,
                              backgroundColor: Colors.grey[300],
                              valueColor: const AlwaysStoppedAnimation(
                                Colors.red,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
          ],
        ),
      ),
    );
  }
}
