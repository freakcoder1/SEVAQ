import 'package:flutter/material.dart';
import '../../services/admin_api_service.dart';

class AdminWorkersScreen extends StatefulWidget {
  const AdminWorkersScreen({super.key});

  @override
  State<AdminWorkersScreen> createState() => _AdminWorkersScreenState();
}

class _AdminWorkersScreenState extends State<AdminWorkersScreen> {
  final AdminApiService _adminService = AdminApiService();
  List<AdminWorker> _workers = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Filters
  String _searchQuery = '';
  bool? _isAvailableFilter;
  double? _minRatingFilter;

  // Sorting
  String _sortBy = 'name';
  bool _sortAscending = true;

  @override
  void initState() {
    super.initState();
    _loadWorkers();
  }

  Future<void> _loadWorkers() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final workers = await _adminService.getWorkers(
        isAvailable: _isAvailableFilter,
        minRating: _minRatingFilter,
      );
      setState(() {
        _workers = workers;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Failed to load workers: $e';
        _isLoading = false;
      });
    }
  }

  List<AdminWorker> get _filteredWorkers {
    var filtered = _workers.where((worker) {
      if (_searchQuery.isNotEmpty) {
        final query = _searchQuery.toLowerCase();
        return worker.name.toLowerCase().contains(query) ||
            worker.email.toLowerCase().contains(query);
      }
      return true;
    }).toList();

    // Sort
    filtered.sort((a, b) {
      int compare;
      switch (_sortBy) {
        case 'name':
          compare = a.name.compareTo(b.name);
          break;
        case 'rating':
          compare = a.rating.compareTo(b.rating);
          break;
        case 'status':
          compare = a.isAvailable.toString().compareTo(
            b.isAvailable.toString(),
          );
          break;
        case 'created':
          compare = (a.createdAt ?? DateTime.now()).compareTo(
            b.createdAt ?? DateTime.now(),
          );
          break;
        default:
          compare = 0;
      }
      return _sortAscending ? compare : -compare;
    });

    return filtered;
  }

  Future<void> _toggleAvailability(AdminWorker worker) async {
    try {
      await _adminService.toggleWorkerAvailability(
        worker.id,
        !worker.isAvailable,
      );
      _loadWorkers();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Worker availability toggled'),
            backgroundColor: Colors.green,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to toggle availability: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    }
  }

  void _showWorkerDetails(AdminWorker worker) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(worker.name),
        content: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              _buildDetailRow('Email', worker.email),
              _buildDetailRow('Phone', worker.phone),
              _buildDetailRow('Rating', worker.rating.toStringAsFixed(1)),
              _buildDetailRow(
                'Status',
                worker.isAvailable ? 'Available' : 'Unavailable',
              ),
              _buildDetailRow('Services', worker.servicesList),
              _buildDetailRow('Bio', worker.bio ?? 'Not provided'),
              if (worker.createdAt != null)
                _buildDetailRow(
                  'Created',
                  worker.createdAt!.toString().split(' ')[0],
                ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _toggleAvailability(worker);
            },
            child: Text(
              worker.isAvailable ? 'Make Unavailable' : 'Make Available',
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(
              '$label:',
              style: const TextStyle(fontWeight: FontWeight.bold),
            ),
          ),
          Expanded(child: Text(value)),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: AppBar(
        title: const Text('Workers Management'),
        backgroundColor: Theme.of(context).primaryColor,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filters
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Column(
              children: [
                Row(
                  children: [
                    Expanded(
                      flex: 2,
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Search by name or email',
                          prefixIcon: const Icon(Icons.search),
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                          ),
                        ),
                        onChanged: (value) {
                          setState(() {
                            _searchQuery = value;
                          });
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<bool?>(
                        value: _isAvailableFilter,
                        decoration: InputDecoration(
                          labelText: 'Availability',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(value: null, child: Text('All')),
                          DropdownMenuItem(
                            value: true,
                            child: Text('Available'),
                          ),
                          DropdownMenuItem(
                            value: false,
                            child: Text('Unavailable'),
                          ),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _isAvailableFilter = value;
                          });
                          _loadWorkers();
                        },
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: DropdownButtonFormField<double?>(
                        value: _minRatingFilter,
                        decoration: InputDecoration(
                          labelText: 'Min Rating',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                          ),
                        ),
                        items: const [
                          DropdownMenuItem(value: null, child: Text('Any')),
                          DropdownMenuItem(value: 4.0, child: Text('4.0+')),
                          DropdownMenuItem(value: 4.5, child: Text('4.5+')),
                          DropdownMenuItem(value: 4.8, child: Text('4.8+')),
                        ],
                        onChanged: (value) {
                          setState(() {
                            _minRatingFilter = value;
                          });
                          _loadWorkers();
                        },
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Row(
                  children: [
                    const Text('Sort by: '),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Name'),
                      selected: _sortBy == 'name',
                      onSelected: (selected) {
                        setState(() {
                          _sortBy = 'name';
                          _sortAscending = true;
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Rating'),
                      selected: _sortBy == 'rating',
                      onSelected: (selected) {
                        setState(() {
                          _sortBy = 'rating';
                          _sortAscending = false;
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Status'),
                      selected: _sortBy == 'status',
                      onSelected: (selected) {
                        setState(() {
                          _sortBy = 'status';
                          _sortAscending = true;
                        });
                      },
                    ),
                    const SizedBox(width: 8),
                    ChoiceChip(
                      label: const Text('Created'),
                      selected: _sortBy == 'created',
                      onSelected: (selected) {
                        setState(() {
                          _sortBy = 'created';
                          _sortAscending = false;
                        });
                      },
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Table
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _errorMessage != null
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.error_outline,
                          size: 48,
                          color: Colors.red[400],
                        ),
                        const SizedBox(height: 16),
                        Text(_errorMessage!),
                        const SizedBox(height: 16),
                        ElevatedButton(
                          onPressed: _loadWorkers,
                          child: const Text('Retry'),
                        ),
                      ],
                    ),
                  )
                : _filteredWorkers.isEmpty
                ? const Center(child: Text('No workers found'))
                : SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowColor: WidgetStateProperty.all(
                        Colors.grey[200],
                      ),
                      columns: const [
                        DataColumn(label: Text('Name')),
                        DataColumn(label: Text('Email')),
                        DataColumn(label: Text('Rating')),
                        DataColumn(label: Text('Services')),
                        DataColumn(label: Text('Status')),
                        DataColumn(label: Text('Created')),
                        DataColumn(label: Text('Actions')),
                      ],
                      rows: _filteredWorkers.map((worker) {
                        return DataRow(
                          cells: [
                            DataCell(
                              Row(
                                children: [
                                  CircleAvatar(
                                    radius: 16,
                                    backgroundColor: Theme.of(
                                      context,
                                    ).primaryColor.withOpacity(0.1),
                                    child: Text(
                                      worker.name.isNotEmpty
                                          ? worker.name[0].toUpperCase()
                                          : '?',
                                      style: TextStyle(
                                        color: Theme.of(context).primaryColor,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  const SizedBox(width: 8),
                                  Text(worker.name),
                                ],
                              ),
                            ),
                            DataCell(Text(worker.email)),
                            DataCell(
                              Row(
                                children: [
                                  const Icon(
                                    Icons.star,
                                    color: Colors.amber,
                                    size: 16,
                                  ),
                                  const SizedBox(width: 4),
                                  Text(worker.rating.toStringAsFixed(1)),
                                ],
                              ),
                            ),
                            DataCell(
                              SizedBox(
                                width: 150,
                                child: Text(
                                  worker.servicesList,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ),
                            ),
                            DataCell(
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 4,
                                ),
                                decoration: BoxDecoration(
                                  color: worker.isAvailable
                                      ? Colors.green.withOpacity(0.1)
                                      : Colors.red.withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  worker.isAvailable
                                      ? 'Available'
                                      : 'Unavailable',
                                  style: TextStyle(
                                    color: worker.isAvailable
                                        ? Colors.green
                                        : Colors.red,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            ),
                            DataCell(
                              Text(
                                worker.createdAt != null
                                    ? worker.createdAt!.toString().split(' ')[0]
                                    : 'N/A',
                              ),
                            ),
                            DataCell(
                              Row(
                                children: [
                                  IconButton(
                                    icon: const Icon(
                                      Icons.visibility,
                                      color: Colors.blue,
                                    ),
                                    onPressed: () => _showWorkerDetails(worker),
                                    tooltip: 'View Details',
                                  ),
                                  IconButton(
                                    icon: Icon(
                                      worker.isAvailable
                                          ? Icons.block
                                          : Icons.check_circle,
                                      color: worker.isAvailable
                                          ? Colors.red
                                          : Colors.green,
                                    ),
                                    onPressed: () =>
                                        _toggleAvailability(worker),
                                    tooltip: worker.isAvailable
                                        ? 'Make Unavailable'
                                        : 'Make Available',
                                  ),
                                ],
                              ),
                            ),
                          ],
                        );
                      }).toList(),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
