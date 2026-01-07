# Sevaq Trust Infrastructure Design - Revised Implementation Plan

## Executive Summary

This revised plan transforms Sevaq from a traditional service booking app into a **real-time workforce logistics system** that prioritizes trust infrastructure over marketplace features. The design eliminates all marketplace patterns and focuses on creating a calm, responsible system that users can trust implicitly.

## Core Philosophy Shift

### Before (Marketplace Pattern)
- Category grids
- Worker ratings and reviews
- Price comparisons
- Multiple choices
- Transactional booking

### After (Trust Infrastructure Pattern)
- System-driven recommendations
- Infrastructure status monitoring
- Responsibility transfer
- Single, confident actions
- Calm, authoritative guidance

## 1. Home Screen Redesign - Eliminating Marketplace Feel

### Current Problem
- Traditional category grids create choice paralysis
- Worker cards feel like marketplace listings
- No system status visibility
- Transactional rather than trust-building

### New Architecture

#### 1.1 Trust Header Component
```dart
// TrustHeader.dart - System status and calm authority
class TrustHeader extends StatelessWidget {
  final SystemStatus systemStatus;
  final String location;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Location with subtle verification
          Row(
            children: [
              Icon(Icons.location_on, color: Theme.of(context).colorScheme.secondary, size: 16),
              SizedBox(width: 8),
              Text(
                location,
                style: TextStyle(
                  color: Theme.of(context).colorScheme.onSurfaceVariant,
                  fontSize: 12,
                ),
              ),
              SizedBox(width: 8),
              Icon(Icons.check_circle, color: Colors.green, size: 16),
            ],
          ),
          
          SizedBox(height: 8),
          
          // System status - CRITICAL
          Container(
            padding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(
              color: systemStatus.isHealthy 
                ? Theme.of(context).colorScheme.successContainer ?? Colors.green[50]
                : Theme.of(context).colorScheme.errorContainer ?? Colors.red[50],
              borderRadius: BorderRadius.circular(20),
            ),
            child: Row(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(
                  systemStatus.isHealthy ? Icons.check_circle : Icons.warning,
                  color: systemStatus.isHealthy ? Colors.green[800] : Colors.red[800],
                  size: 16,
                ),
                SizedBox(width: 8),
                Text(
                  systemStatus.isHealthy ? "All services on track" : "Service adjustment needed",
                  style: TextStyle(
                    color: systemStatus.isHealthy ? Colors.green[800] : Colors.red[800],
                    fontWeight: FontWeight.w500,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

#### 1.2 Primary Recommendation (Hero Card)
```dart
// PrimaryRecommendation.dart - System-driven choice
class PrimaryRecommendation extends StatelessWidget {
  final ServiceRecommendation recommendation;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      height: 200,
      margin: EdgeInsets.symmetric(horizontal: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 12,
            offset: Offset(0, 6),
          )
        ],
      ),
      child: Stack(
        children: [
          // Background gradient for depth
          Positioned.fill(
            child: Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [
                    Theme.of(context).colorScheme.primary.withOpacity(0.1),
                    Colors.transparent,
                  ],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
            ),
          ),
          
          // Content
          Padding(
            padding: EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Reassurance badge
                Container(
                  padding: EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Theme.of(context).colorScheme.secondaryContainer,
                    borderRadius: BorderRadius.circular(16),
                  ),
                  child: Text(
                    "Most reliable right now",
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSecondaryContainer,
                      fontSize: 12,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
                
                SizedBox(height: 16),
                
                // Service name
                Text(
                  recommendation.service.name,
                  style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                SizedBox(height: 8),
                
                // ETA with reassurance
                Row(
                  children: [
                    Icon(Icons.timer, color: Theme.of(context).colorScheme.secondary, size: 20),
                    SizedBox(width: 8),
                    Text(
                      "${recommendation.eta} • ${recommendation.zoneReliability}",
                      style: TextStyle(
                        color: Theme.of(context).colorScheme.onSurfaceVariant,
                        fontSize: 14,
                      ),
                    ),
                  ],
                ),
                
                Spacer(),
                
                // Primary CTA - ONLY ONE
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: recommendation.onProceed,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Theme.of(context).colorScheme.primary,
                      foregroundColor: Colors.white,
                      padding: EdgeInsets.symmetric(vertical: 16),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(12),
                      ),
                    ),
                    child: Text(
                      "We'll handle this",
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
```

#### 1.3 Smart Suggestions (Horizontal, Not Grid)
```dart
// SmartSuggestions.dart - Minimal, system-driven
class SmartSuggestions extends StatelessWidget {
  final List<ServiceSuggestion> suggestions;
  
  @override
  Widget build(BuildContext context) {
    if (suggestions.isEmpty) return SizedBox.shrink();
    
    return Container(
      height: 120,
      padding: EdgeInsets.symmetric(horizontal: 16),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: suggestions.length,
        itemBuilder: (context, index) {
          final suggestion = suggestions[index];
          return Container(
            width: 200,
            margin: EdgeInsets.only(right: 12),
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceVariant,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  suggestion.title,
                  style: Theme.of(context).textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 8),
                Text(
                  suggestion.description,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

## 2. Category System - System-Driven, Not User-Driven

### Current Problem
- Categories displayed prominently create choice anxiety
- Users feel responsible for selecting wrong category
- No system validation of choice

### New Architecture

#### 2.1 System-Driven Category Access
```dart
// CategoriesController.dart - Backend logic
@Controller('categories')
export class CategoriesController {
  @Get('system-recommendation')
  getSystemRecommendation(@Query('userIntent') userIntent: string) {
    // System analyzes user intent and recommends category
    return this.categoriesService.getSystemRecommendation(userIntent);
  }
  
  @Get('all')
  getAllCategories() {
    // Only accessible via "All services" secondary CTA
    return this.categoriesService.getAllCategories();
  }
}
```

#### 2.2 Category Access Pattern
```dart
// CategoryAccess.dart - Calm vertical list
class CategoryAccess extends StatelessWidget {
  final List<Category> categories;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text("All Services"),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
      ),
      body: ListView.builder(
        itemCount: categories.length,
        itemBuilder: (context, index) {
          final category = categories[index];
          return Container(
            margin: EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surface,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 4,
                  offset: Offset(0, 2),
                )
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // System validation
                Text(
                  category.systemValidation,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.secondary,
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                ),
                
                SizedBox(height: 8),
                
                // Category name
                Text(
                  category.name,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                ),
                
                SizedBox(height: 4),
                
                // Typical ETA
                Text(
                  category.typicalEta,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                    fontSize: 12,
                  ),
                ),
                
                // Use cases
                Wrap(
                  children: category.typicalUseCases.map((useCase) => 
                    Chip(
                      label: Text(useCase),
                      backgroundColor: Theme.of(context).colorScheme.surfaceVariant,
                      padding: EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    )
                  ).toList(),
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}
```

## 3. Worker Profiles - Infrastructure Status

### Current Problem
- Resume-style profiles create personal bias
- Star ratings feel marketplace-like
- No system monitoring visibility

### New Architecture

#### 3.1 Worker as Infrastructure
```dart
// WorkerInfrastructure.dart - System status focus
class WorkerInfrastructure extends StatelessWidget {
  final Worker worker;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Infrastructure status
          Row(
            children: [
              Container(
                width: 60,
                height: 60,
                decoration: BoxDecoration(
                  color: worker.isAvailable 
                    ? Colors.green.withOpacity(0.1) 
                    : Colors.grey.withOpacity(0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: worker.isAvailable 
                      ? Colors.green 
                      : Colors.grey,
                    width: 2,
                  ),
                ),
                child: Icon(
                  worker.isAvailable ? Icons.check_circle : Icons.hourglass_empty,
                  color: worker.isAvailable ? Colors.green : Colors.grey,
                  size: 32,
                ),
              ),
              SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '${worker.user.firstName} ${worker.user.lastName}',
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    SizedBox(height: 4),
                    Text(
                      'Infrastructure Status: ${worker.isAvailable ? 'Active' : 'Unavailable'}',
                      style: TextStyle(
                        color: worker.isAvailable ? Colors.green : Colors.grey,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          
          SizedBox(height: 16),
          
          // System metrics
          _buildMetricRow(
            context,
            'Experience',
            '${worker.yearsOfExperience} years',
          ),
          _buildMetricRow(
            context,
            'Reliability',
            '${worker.reliabilityStreak} consecutive on-time visits',
          ),
          _buildMetricRow(
            context,
            'Coverage',
            '${worker.homesServedInArea} homes in your area',
          ),
          
          SizedBox(height: 16),
          
          // System backing
          Container(
            padding: EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                Icon(Icons.verified, color: Theme.of(context).colorScheme.primary),
                SizedBox(width: 8),
                Text(
                  'Verified & trained by Sevaq • Continuously monitored',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                    fontSize: 12,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildMetricRow(BuildContext context, String label, String value) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
          Spacer(),
          Text(
            value,
            style: TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
```

## 4. Booking Flow - Responsibility Transfer

### Current Problem
- Transactional approach creates risk perception
- No clear responsibility handoff
- Payment feels like gamble, not protection

### New Architecture

#### 4.1 Three-Step Responsibility Transfer
```dart
// BookingFlow.dart - Authority and calm
class BookingFlow extends StatefulWidget {
  final ServiceRecommendation recommendation;
  
  @override
  _BookingFlowState createState() => _BookingFlowState();
}

class _BookingFlowState extends State<BookingFlow> {
  int _currentStep = 0;
  
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Complete Request'),
        backgroundColor: Theme.of(context).colorScheme.surface,
        elevation: 0,
        leading: _currentStep > 0 ? BackButton() : null,
      ),
      body: _buildStepContent(),
      bottomNavigationBar: _buildBottomNavigation(),
    );
  }
  
  Widget _buildStepContent() {
    switch (_currentStep) {
      case 0:
        return _buildSystemConfirmationStep();
      case 1:
        return _buildResponsibilityTransferStep();
      case 2:
        return _buildProtectionConfirmationStep();
      default:
        return _buildSystemConfirmationStep();
    }
  }
  
  Widget _buildSystemConfirmationStep() {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Here’s what Sevaq will handle',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          SizedBox(height: 24),
          
          // Service confirmation
          _buildConfirmationCard(
            icon: Icons.work,
            title: 'Service',
            value: widget.recommendation.service.name,
          ),
          
          // Professional assignment
          _buildConfirmationCard(
            icon: Icons.person,
            title: 'Professional',
            value: 'Assigned by system',
          ),
          
          // Time confirmation
          _buildConfirmationCard(
            icon: Icons.calendar_today,
            title: 'When',
            value: widget.recommendation.eta,
          ),
          
          // System guarantee
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.secondaryContainer,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.shield, color: Theme.of(context).colorScheme.secondary),
                SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Sevaq takes full responsibility. If anything goes wrong, we’ll replace or refund immediately.',
                    style: TextStyle(
                      color: Theme.of(context).colorScheme.onSecondaryContainer,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildResponsibilityTransferStep() {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Text(
            'Responsibility Transfer',
            style: Theme.of(context).textTheme.headlineSmall,
            textAlign: TextAlign.center,
          ),
          SizedBox(height: 32),
          
          Container(
            padding: EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.primaryContainer,
              borderRadius: BorderRadius.circular(16),
            ),
            child: Column(
              children: [
                Icon(Icons.handshake, size: 64, color: Theme.of(context).colorScheme.primary),
                SizedBox(height: 24),
                Text(
                  'Once you proceed, Sevaq takes responsibility for this visit.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
                SizedBox(height: 16),
                Text(
                  'You’re protected. We’re in charge.',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.onPrimaryContainer,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildProtectionConfirmationStep() {
    return Padding(
      padding: EdgeInsets.all(24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Payment as Protection',
            style: Theme.of(context).textTheme.headlineSmall,
          ),
          SizedBox(height: 24),
          
          // Payment summary
          _buildPaymentSummary(),
          
          SizedBox(height: 24),
          
          // Protection features
          Column(
            children: [
              _buildProtectionItem(Icons.lock, 'Professional locked'),
              _buildProtectionItem(Icons.refresh, 'Backup ready'),
              _buildProtectionItem(Icons.payment, 'Instant refund if no-show'),
            ],
          ),
          
          SizedBox(height: 32),
          
          // Final reassurance
          Container(
            padding: EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.successContainer ?? Colors.green[50],
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              children: [
                Icon(Icons.check_circle, color: Colors.green[800]),
                SizedBox(width: 12),
                Text(
                  'Handled. We’re monitoring this visit.',
                  style: TextStyle(
                    color: Colors.green[800],
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildConfirmationCard({required IconData icon, required String title, required String value}) {
    return Container(
      padding: EdgeInsets.all(16),
      margin: EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceVariant,
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: TextStyle(fontSize: 12)),
              Text(value, style: Theme.of(context).textTheme.bodyMedium),
            ],
          ),
        ],
      ),
    );
  }
  
  Widget _buildPaymentSummary() {
    final amount = widget.recommendation.service.basePrice;
    return Container(
      padding: EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: Offset(0, 4),
          )
        ],
      ),
      child: Column(
        children: [
          Text('Total Amount', style: Theme.of(context).textTheme.titleLarge),
          SizedBox(height: 8),
          Text('₹${amount.toStringAsFixed(0)}', style: Theme.of(context).textTheme.displayLarge),
          SizedBox(height: 16),
          Text(
            'This payment protects you. If the professional doesn’t arrive, you get an instant refund.',
            textAlign: TextAlign.center,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
  
  Widget _buildProtectionItem(IconData icon, String text) {
    return Container(
      padding: EdgeInsets.symmetric(vertical: 12, horizontal: 16),
      margin: EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        children: [
          Icon(icon, color: Theme.of(context).colorScheme.primary),
          SizedBox(width: 12),
          Text(text, style: Theme.of(context).textTheme.bodyMedium),
        ],
      ),
    );
  }
  
  Widget _buildBottomNavigation() {
    return Container(
      padding: EdgeInsets.all(16),
      child: Row(
        children: [
          if (_currentStep > 0)
            Expanded(
              child: OutlinedButton(
                onPressed: () => setState(() => _currentStep--),
                child: Text('Back'),
              ),
            ),
          SizedBox(width: _currentStep > 0 ? 16 : 0),
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                if (_currentStep < 2) {
                  setState(() => _currentStep++);
                } else {
                  _completeRequest();
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Theme.of(context).colorScheme.primary,
                foregroundColor: Colors.white,
              ),
              child: Text(_currentStep == 2 ? 'Complete Request' : 'Next'),
            ),
          ),
        ],
      ),
    );
  }
  
  void _completeRequest() {
    // Complete the request process
    Navigator.pushReplacement(
      context,
      MaterialPageRoute(builder: (_) => RequestConfirmationScreen()),
    );
  }
}
```

## 5. System Status and Monitoring Features

### 5.1 Real-Time Infrastructure Monitoring
```dart
// SystemStatus.dart - Infrastructure visibility
class SystemStatus extends StatelessWidget {
  final SystemHealth systemHealth;
  
  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surface,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: Offset(0, 2),
          )
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.monitoring, color: Theme.of(context).colorScheme.secondary),
              SizedBox(width: 8),
              Text(
                'System Status',
                style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          
          SizedBox(height: 12),
          
          // Service availability
          _buildStatusRow(
            context,
            'Service Availability',
            systemHealth.serviceAvailability,
            systemHealth.serviceAvailability > 80 ? Colors.green : Colors.orange,
          ),
          
          // Worker availability
          _buildStatusRow(
            context,
            'Worker Availability',
            systemHealth.workerAvailability,
            systemHealth.workerAvailability > 70 ? Colors.green : Colors.orange,
          ),
          
          // Response time
          _buildStatusRow(
            context,
            'Average Response Time',
            systemHealth.averageResponseTime,
            systemHealth.averageResponseTime < 15 ? Colors.green : Colors.orange,
          ),
        ],
      ),
    );
  }
  
  Widget _buildStatusRow(BuildContext context, String label, int value, Color color) {
    return Container(
      margin: EdgeInsets.symmetric(vertical: 4),
      child: Row(
        children: [
          Icon(Icons.circle, color: color, size: 8),
          SizedBox(width: 8),
          Text(
            label,
            style: TextStyle(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontSize: 12,
            ),
          ),
          Spacer(),
          Text(
            '$value%',
            style: TextStyle(
              fontWeight: FontWeight.w500,
              fontSize: 12,
            ),
          ),
        ],
      ),
    );
  }
}
```

## 6. Trust Infrastructure Documentation

### 6.1 Core Principles
1. **Calm Authority**: The system knows what to do
2. **Visible Responsibility**: Trust must be demonstrated, not assumed
3. **Infrastructure Focus**: Workers are system components, not marketplace sellers
4. **Protection Framing**: Payment is safety, not risk
5. **System Status**: Real-time visibility builds trust

### 6.2 Implementation Checklist
- [ ] Remove all marketplace patterns (grids, comparisons)
- [ ] Implement system-driven recommendations
- [ ] Add infrastructure status visibility
- [ ] Frame all interactions as responsibility transfer
- [ ] Use calm, authoritative language
- [ ] Eliminate excitement, focus on calm
- [ ] Make trust visible through system status
- [ ] Remove personal worker details, focus on system metrics

This revised plan transforms Sevaq into a true trust infrastructure system that eliminates all marketplace anxiety and creates a calm, authoritative experience where users feel protected and confident in every interaction.