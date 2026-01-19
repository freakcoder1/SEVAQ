# Sevaq Complete Design System - Trust Infrastructure & Calm Authority

## Executive Summary

This document provides the complete design system for Sevaq, transforming it from a traditional service booking app into a **real-time workforce logistics system** that prioritizes trust infrastructure over marketplace features. The design eliminates all marketplace patterns and creates a calm, authoritative experience where users feel protected and confident.

## Core Philosophy

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

## 1. Trust Infrastructure Architecture

### 1.1 System-Driven Categories
**Current Problem**: Categories displayed prominently create choice paralysis
**Solution**: Categories exist to help the system decide, not the user

```typescript
// Backend: Enhanced Category entity
interface Category {
  id: string;
  name: string;
  reassuranceText: string; // "A safe choice for most homes"
  typicalEta: string; // "15-30 mins"
  typicalUseCases: string[]; // ["Routine cleaning", "Urgent cleaning"]
  isSecondary: boolean; // true - not shown on primary home screen
  systemValidation: string; // "Commonly booked in your area"
}
```

**Access Pattern**:
- **Primary Access**: Via "All Services" secondary CTA
- **Secondary Access**: Via search functionality
- **Tertiary Access**: When recommendation doesn't fit user intent

### 1.2 Infrastructure-Focused Worker Profiles
**Current Problem**: Resume-style profiles create personal bias
**Solution**: Workers presented as system infrastructure, not marketplace sellers

```typescript
// Backend: Enhanced Worker entity
interface Worker {
  id: string;
  user: User;
  bio: string;
  rating: number;
  reviewCount: number;
  
  // NEW: Professional identity fields
  yearsOfExperience: number;
  homesServedInArea: number;
  reliabilityStreak: number; // Consecutive on-time jobs
  
  // NEW: System backing
  isVerified: boolean;
  isTrained: boolean;
  isMonitored: boolean;
  
  // REMOVED: Age, personal stories, detailed ratings
}
```

### 1.3 Regret Prevention Service Descriptions
**Current Problem**: Descriptions focus on features and inclusions
**Solution**: Descriptions exist to prevent regret, not explain scope

```typescript
// Backend: Enhanced Service entity
interface Service {
  id: string;
  name: string;
  
  // NEW: Regret prevention fields
  reassuranceText: string; // "A safe choice for most homes"
  whatWillHappen: string[]; // ["Helper will arrive and confirm task", "Work done with standard tools"]
  whatWillNotHappen: string[]; // ["No upselling without approval", "No extra work added silently"]
  ifSomethingGoesWrong: string; // "Sevaq will replace or refund immediately"
  
  // Existing fields
  basePrice: number;
  description: string;
  category: Category;
}
```

### 1.4 Responsibility Transfer Booking Flow
**Current Problem**: Transactional approach creates risk perception
**Solution**: Booking is a transfer of responsibility, not a transaction

```typescript
// Backend: Enhanced Booking entity
interface Booking {
  id: string;
  user: User;
  worker: Worker;
  service: Service;
  startTime: Date;
  endTime: Date;
  amount: number;
  status: BookingStatus;
  
  // NEW: Responsibility transfer fields
  responsibilityTransferred: boolean;
  systemMonitoring: boolean;
  protectionStatus: string;
}
```

## 2. Visual Design System

### 2.1 Color Palette - Warm Neutrals & Soft Authority

#### Primary Colors
- **Primary Blue**: `#0061A4` (Authority, Trust)
- **Secondary Grey**: `#535F70` (Support, Calm)
- **Tertiary Purple**: `#6B5778` (Premium, Sophistication)

#### Background & Surface Colors
- **Background**: `#FEFBFF` (Warm White)
- **Surface**: `#FEFBFF` (Soft White)
- **Surface Variant**: `#F5F7FA` (Subtle Depth)
- **Primary Container**: `#E6F0FF` (Soft Authority)

#### Semantic Colors
- **Success**: `#2E7D32` (Confident Green)
- **Error**: `#BA1A1A` (Clear Warning)
- **Warning**: `#EF6C00` (Attention)
- **Info**: `#0277BD` (Guidance)

#### Text Colors
- **On Primary**: `#FFFFFF` (White)
- **On Secondary**: `#FFFFFF` (White)
- **On Surface**: `#1A1C1E` (Dark Charcoal)
- **On Surface Variant**: `#41484D` (Medium Grey)
- **Secondary Text**: `#6B7280` (Soft Grey)

### 2.2 Typography - Neutral Sans-Serif Authority

#### Font Family
- **Primary**: Inter (Google Fonts)
- **Fallback**: System UI, -apple-system, Segoe UI, Roboto
- **No decorative or playful fonts**

#### Font Weights
- **Regular**: 400 (Body text)
- **Medium**: 500 (Emphasis, buttons)
- **Semi-Bold**: 600 (Headers)
- **Bold**: 700 (Important headings)

#### Font Sizes
- **Display Large**: 57px (Hero text)
- **Display Medium**: 45px (Section headers)
- **Display Small**: 36px (Sub headers)
- **Headline Large**: 32px (Page titles)
- **Headline Medium**: 28px (Section titles)
- **Headline Small**: 24px (Card titles)
- **Title Large**: 22px (Button text)
- **Title Medium**: 16px (List items)
- **Title Small**: 14px (Labels)
- **Body Large**: 16px (Primary content)
- **Body Medium**: 14px (Secondary content)
- **Body Small**: 12px (Helper text)
- **Label Large**: 14px (Form labels)
- **Label Medium**: 12px (Small labels)
- **Label Small**: 11px (Micro text)

### 2.3 Spacing & Layout - 8px Grid System

#### Base Unit
- **Base Unit**: 8px
- **Multiples**: 4px, 8px, 16px, 24px, 32px, 40px, 48px, 56px, 64px

#### Component Spacing
- **Card Padding**: 16px (2 units)
- **Section Padding**: 24px (3 units)
- **Button Padding**: 12px vertical, 24px horizontal
- **Input Padding**: 16px horizontal, 12px vertical
- **List Item Padding**: 16px horizontal, 12px vertical

#### Margins
- **Component Margin**: 16px (2 units)
- **Section Margin**: 24px (3 units)
- **Grid Gutter**: 16px (2 units)

### 2.4 Shadows & Depth - Subtle Authority

#### Shadow System
- **Surface Shadow**: `0px 2px 8px rgba(0,0,0,0.08)` (Cards)
- **Elevation Shadow**: `0px 4px 12px rgba(0,0,0,0.12)` (Floating elements)
- **Focus Shadow**: `0px 0px 0px 3px rgba(0,97,164,0.25)` (Interactive focus)

#### Border Radius
- **Small**: 8px (Buttons, inputs)
- **Medium**: 12px (Cards, containers)
- **Large**: 16px (Hero elements)
- **Full**: 999px (Pills, badges)

### 2.5 Icons - Clear Communication

#### Icon Style
- **Line Icons**: 24px, stroke 2px
- **Fill Icons**: 24px, solid
- **Weight**: Medium (not too thin, not too bold)
- **Style**: Material Icons or custom line icons

#### Icon Colors
- **Primary**: `#0061A4` (Action icons)
- **Secondary**: `#535F70` (Information icons)
- **Success**: `#2E7D32` (Confirmation icons)
- **Error**: `#BA1A1A` (Warning icons)
- **Disabled**: `#A1A5A8` (Inactive icons)

### 2.6 Animations - Slow & Confident

#### Animation Principles
- **Duration**: 300-500ms (Slow, deliberate)
- **Easing**: `ease-in-out` (Smooth, not bouncy)
- **No spring or bounce animations**
- **Motion should feel "settled", not energetic**

#### Animation Types

##### 1. Fade Transitions
```css
/* Component fade in/out */
opacity: 0 → 1
duration: 300ms
easing: ease-in-out
```

##### 2. Slide Transitions
```css
/* Modal slide up */
transform: translateY(20px) → translateY(0)
duration: 350ms
easing: ease-in-out
```

##### 3. Scale Transitions
```css
/* Button press feedback */
transform: scale(1) → scale(0.98)
duration: 150ms
easing: ease-in-out
```

##### 4. Loading States
```css
/* Skeleton loading */
background: linear-gradient(90deg, #F5F7FA 25%, #E6F0FF 50%, #F5F7FA 75%)
animation: shimmer 1.5s infinite
```

## 3. Component Architecture

### 3.1 Trust Header Component
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

### 3.2 Primary Recommendation Component
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

### 3.3 Worker Infrastructure Component
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

### 3.4 Booking Flow Component
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
            'Here's what Sevaq will handle',
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
                    'Sevaq takes full responsibility. If anything goes wrong, we'll replace or refund immediately.',
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
                  'You're protected. We're in charge.',
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
                  'Handled. We're monitoring this visit.',
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
            'This payment protects you. If the professional doesn\'t arrive, you get an instant refund.',
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

## 4. Implementation Roadmap

### Phase 1: Foundation & Core Infrastructure (Weeks 1-2)

#### Task 1.1: Update Backend Data Models
**Priority**: HIGH
**Estimated Time**: 2 days
**Dependencies**: None

**Backend Changes**:
- [ ] Update `Category` entity with safety fields
- [ ] Update `Service` entity with regret prevention fields
- [ ] Update `Worker` entity with infrastructure fields
- [ ] Update `Booking` entity with responsibility transfer
- [ ] Create database migration for new fields

#### Task 1.2: Create System Status Infrastructure
**Priority**: HIGH
**Estimated Time**: 3 days
**Dependencies**: Task 1.1

**Backend Implementation**:
- [ ] Create `SystemHealth` entity
- [ ] Create `SystemStatusService`
- [ ] Create `SystemStatusController`
- [ ] Create `SystemStatusProvider` (Flutter)

#### Task 1.3: Implement Enhanced Theme System
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: None

**Flutter Theme Updates**:
- [ ] Update `theme.dart` with new color palette
- [ ] Implement 8px grid system
- [ ] Add animation system

### Phase 2: Home Screen Transformation (Weeks 3-4)

#### Task 2.1: Build Trust Header Component
**Priority**: HIGH
**Estimated Time**: 2 days
**Dependencies**: Task 1.2, Task 1.3

**Flutter Implementation**:
- [ ] Create `TrustHeader.dart`
- [ ] Integrate with `SystemStatusProvider`
- [ ] Add accessibility support

#### Task 2.2: Create Primary Recommendation System
**Priority**: HIGH
**Estimated Time**: 3 days
**Dependencies**: Task 2.1

**Backend Implementation**:
- [ ] Create `RecommendationService`
- [ ] Create `RecommendationController`

**Flutter Implementation**:
- [ ] Create `PrimaryRecommendation.dart`
- [ ] Implement smooth animations

#### Task 2.3: Build Smart Suggestions
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 2.2

**Flutter Implementation**:
- [ ] Create `SmartSuggestions.dart`
- [ ] Horizontal scrolling list
- [ ] Memory/repeat behavior display

#### Task 2.4: Implement Home Screen Layout
**Priority**: HIGH
**Estimated Time**: 2 days
**Dependencies**: Task 2.1, Task 2.2, Task 2.3

**Flutter Implementation**:
- [ ] Create `HomeScreen.dart`
- [ ] Remove marketplace patterns
- [ ] Implement calm, authoritative layout

### Phase 3: Category System Redesign (Weeks 5-6)

#### Task 3.1: Create System-Driven Category Access
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 1.1

**Backend Implementation**:
- [ ] Update `CategoriesController`
- [ ] Create `CategoryRecommendationService`

#### Task 3.2: Build Category Access Interface
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 3.1

**Flutter Implementation**:
- [ ] Create `CategoryAccess.dart`
- [ ] Calm vertical list display
- [ ] Remove grid layouts

#### Task 3.3: Update Navigation Patterns
**Priority**: MEDIUM
**Estimated Time**: 1 day
**Dependencies**: Task 3.2

**Flutter Implementation**:
- [ ] Update navigation to use "All services" secondary CTA
- [ ] Remove primary category navigation

### Phase 4: Worker Profile Transformation (Weeks 7-8)

#### Task 4.1: Build Infrastructure-Focused Worker Profiles
**Priority**: HIGH
**Estimated Time**: 3 days
**Dependencies**: Task 1.1

**Flutter Implementation**:
- [ ] Create `WorkerInfrastructure.dart`
- [ ] Remove marketplace elements
- [ ] Add infrastructure status display

#### Task 4.2: Implement Worker Status Monitoring
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 4.1

**Backend Implementation**:
- [ ] Update `WorkersController`
- [ ] Create `WorkerStatusService`

**Flutter Implementation**:
- [ ] Add real-time status updates
- [ ] Implement availability indicators

#### Task 4.3: Update Worker Discovery
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 4.2

**Flutter Implementation**:
- [ ] Update worker search to focus on system metrics
- [ ] Remove personal preference filters

### Phase 5: Booking Flow Revolution (Weeks 9-10)

#### Task 5.1: Build Responsibility Transfer Flow
**Priority**: HIGH
**Estimated Time**: 4 days
**Dependencies**: Task 1.1, Task 2.2

**Flutter Implementation**:
- [ ] Create `BookingFlow.dart`
- [ ] Three-step responsibility transfer
- [ ] Remove transactional language

#### Task 5.2: Implement Payment as Protection
**Priority**: HIGH
**Estimated Time**: 3 days
**Dependencies**: Task 5.1

**Backend Implementation**:
- [ ] Update `PaymentsController`
- [ ] Create `PaymentProtectionService`

**Flutter Implementation**:
- [ ] Update payment flow to emphasize protection
- [ ] Add provider lock confirmation

#### Task 5.3: Create Post-Booking Reassurance
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 5.2

**Flutter Implementation**:
- [ ] Create `BookingConfirmationScreen.dart`
- [ ] "Handled. We're monitoring this visit." messaging

### Phase 6: System Integration & Polish (Weeks 11-12)

#### Task 6.1: Implement Real-Time Monitoring
**Priority**: HIGH
**Estimated Time**: 3 days
**Dependencies**: All previous tasks

**Backend Implementation**:
- [ ] Create WebSocket service for real-time updates
- [ ] Implement system health monitoring

**Flutter Implementation**:
- [ ] Add real-time status updates throughout app
- [ ] Implement push notifications for system status

#### Task 6.2: Accessibility & Performance Optimization
**Priority**: MEDIUM
**Estimated Time**: 3 days
**Dependencies**: All previous tasks

**Flutter Implementation**:
- [ ] Implement WCAG 2.1 AA accessibility standards
- [ ] Optimize animations for performance
- [ ] Add offline support for critical features

#### Task 6.3: Testing & Quality Assurance
**Priority**: HIGH
**Estimated Time**: 4 days
**Dependencies**: All previous tasks

**Testing Implementation**:
- [ ] Unit tests for all new components
- [ ] Integration tests for API endpoints
- [ ] E2E tests for user flows
- [ ] Performance testing
- [ ] Accessibility testing

#### Task 6.4: Documentation & Deployment
**Priority**: MEDIUM
**Estimated Time**: 2 days
**Dependencies**: Task 6.3

**Documentation**:
- [ ] Update API documentation
- [ ] Create developer guides
- [ ] Add user documentation

**Deployment**:
- [ ] Prepare production environment
- [ ] Create deployment pipeline
- [ ] Set up monitoring and logging

## 5. Quality Standards

### Development Workflow
1. **Follow the 8px grid system** for all layouts
2. **Use slow, confident animations** (300-500ms)
3. **Maintain calm, authoritative tone** in all copy
4. **Eliminate all marketplace patterns**
5. **Focus on system status visibility**
6. **Prioritize accessibility** (WCAG 2.1 AA)

### Code Quality Standards
- **Type safety**: Use TypeScript strictly
- **Component reusability**: Create reusable widgets
- **Performance**: Optimize for 60fps animations
- **Testing**: 80%+ test coverage required
- **Documentation**: Document all public APIs

### Success Metrics
- **User anxiety reduction**: Measured through interaction patterns
- **Conversion rate improvement**: Booking completion rates
- **Support ticket reduction**: Anxiety-related support requests
- **User satisfaction**: Post-booking survey scores

## 6. Core Design Principles

### 6.1 Calm Authority
- The system knows what to do
- Users don't need to think
- Authority is demonstrated, not claimed
- Confidence through consistency

### 6.2 Visible Responsibility
- Trust must be demonstrated, not assumed
- System status is always visible
- Responsibility transfer is explicit
- Protection is framed as safety, not risk

### 6.3 Infrastructure Focus
- Workers are system components, not marketplace sellers
- Performance metrics over personal details
- System backing over individual charisma
- Professional distance with human warmth

### 6.4 Protection Framing
- Payment is safety, not risk
- Backup systems are visible
- Instant refunds are guaranteed
- Monitoring is continuous

### 6.5 System Status
- Real-time visibility builds trust
- Health indicators are prominent
- Performance metrics are transparent
- Issues are communicated proactively

This complete design system transforms Sevaq from a traditional marketplace into a calm, authoritative trust infrastructure that eliminates user anxiety at every touchpoint. Every visual, interaction, and system decision supports the core promise of safety and reliability.