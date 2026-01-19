import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:fl_chart/fl_chart.dart';
import '../models/system_metrics.dart';
import '../models/database_metrics.dart';
import '../models/alert.dart';
import '../providers/monitoring_provider.dart';

class MonitoringDashboardScreen extends StatefulWidget {
  const MonitoringDashboardScreen({Key? key}) : super(key: key);

  @override
  _MonitoringDashboardScreenState createState() =>
      _MonitoringDashboardScreenState();
}

class _MonitoringDashboardScreenState extends State<MonitoringDashboardScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      Provider.of<MonitoringProvider>(
        context,
        listen: false,
      ).fetchMonitoringData();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Monitoring Dashboard')),
      body: Consumer<MonitoringProvider>(
        builder: (context, provider, _) {
          if (provider.isLoading) {
            return const Center(child: CircularProgressIndicator());
          }

          return RefreshIndicator(
            onRefresh: provider.fetchMonitoringData,
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(16.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'System Metrics',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  if (provider.systemMetrics != null)
                    _buildSystemMetricsChart(provider.systemMetrics!),
                  const SizedBox(height: 32),
                  const Text(
                    'Database Metrics',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  if (provider.databaseMetrics != null)
                    _buildDatabaseMetricsChart(provider.databaseMetrics!),
                  const SizedBox(height: 32),
                  const Text(
                    'Alerts',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 16),
                  _buildAlertsList(provider.alerts),
                ],
              ),
            ),
          );
        },
      ),
    );
  }

  Widget _buildSystemMetricsChart(SystemMetrics systemMetrics) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('CPU Usage Over Time'),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: LineChart(
                LineChartData(
                  gridData: FlGridData(show: true),
                  titlesData: FlTitlesData(show: true),
                  borderData: FlBorderData(show: true),
                  lineBarsData: [
                    LineChartBarData(
                      spots: systemMetrics.historicalData
                          .map(
                            (point) => FlSpot(
                              point.timestamp.millisecondsSinceEpoch.toDouble(),
                              point.cpuUsage,
                            ),
                          )
                          .toList(),
                      isCurved: true,
                      color: Colors.blue,
                      barWidth: 2,
                      belowBarData: BarAreaData(show: false),
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDatabaseMetricsChart(DatabaseMetrics databaseMetrics) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            const Text('Active Connections'),
            const SizedBox(height: 16),
            SizedBox(
              height: 200,
              child: BarChart(
                BarChartData(
                  barGroups: [
                    BarChartGroupData(
                      x: 0,
                      barRods: [
                        BarChartRodData(
                          toY: databaseMetrics.activeConnections.toDouble(),
                          color: Colors.green,
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildAlertsList(List<Alert> alerts) {
    if (alerts.isEmpty) {
      return const Center(child: Text('No alerts'));
    }

    return ListView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: alerts.length,
      itemBuilder: (context, index) {
        final alert = alerts[index];
        return Card(
          child: ListTile(
            leading: Icon(
              _getAlertIcon(alert.level),
              color: _getAlertColor(alert.level),
            ),
            title: Text(alert.message),
            subtitle: Text('${alert.source} • ${alert.timestamp}'),
            trailing: alert.resolved
                ? const Icon(Icons.check_circle, color: Colors.green)
                : const Icon(Icons.warning, color: Colors.orange),
          ),
        );
      },
    );
  }

  IconData _getAlertIcon(AlertLevel level) {
    switch (level) {
      case AlertLevel.info:
        return Icons.info;
      case AlertLevel.warning:
        return Icons.warning;
      case AlertLevel.error:
        return Icons.error;
      case AlertLevel.critical:
        return Icons.dangerous;
    }
  }

  Color _getAlertColor(AlertLevel level) {
    switch (level) {
      case AlertLevel.info:
        return Colors.blue;
      case AlertLevel.warning:
        return Colors.orange;
      case AlertLevel.error:
        return Colors.red;
      case AlertLevel.critical:
        return Colors.purple;
    }
  }
}
