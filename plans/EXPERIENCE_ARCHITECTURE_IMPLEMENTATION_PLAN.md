# SevaQ Experience Architecture Implementation Plan

## Current State: UI Locked ✅

**UI Quality: 9.8/10** - Production-grade, investor-ready
**Product Sophistication: 9.6/10** - System confidence achieved

---

## Phase 1: Motion System (Week 1)

### 1.1 Hero Section Animations

#### Gradient Pulse Animation
- **File**: `lib/widgets/operational_hero.dart`
- **Duration**: 12 seconds
- **Effect**: Subtle gradient position shift (0.02 units)
- **Implementation**: Extend existing `_gradientController` to include opacity micro-variation

#### Grain Texture Drift
- **File**: `lib/widgets/operational_hero.dart`
- **Duration**: 8 seconds
- **Effect**: Noise pattern slow drift
- **Implementation**: Modify `_NoisePainter` to accept animation value for pattern offset

#### CTA Hover Lighting
- **File**: `lib/widgets/operational_hero.dart`
- **Duration**: 150ms
- **Effect**: Soft glow intensification on tap
- **Implementation**: Add `InkWell` with `highlightColor` and custom glow animation

#### Breathing Ambient Shadow
- **File**: `lib/widgets/operational_hero.dart`
- **Duration**: 6 seconds
- **Effect**: Shadow opacity 0.04 → 0.06 → 0.04
- **Implementation**: Animate `BoxShadow` color alpha

### 1.2 Active Operations Motion

#### Progress Line Animation
- **File**: `lib/widgets/active_operations.dart`
- **Duration**: 400ms
- **Effect**: Smooth width fill from 0 to target
- **Implementation**: Add `AnimatedContainer` for progress bar width

#### ETA Number Morph
- **File**: `lib/widgets/active_operations.dart`
- **Duration**: 300ms
- **Effect**: Smooth number transition
- **Implementation**: Use `TweenAnimationBuilder` for ETA value

#### Status Chip Crossfade
- **File**: `lib/widgets/active_operations.dart`
- **Duration**: 200ms
- **Effect**: Opacity crossfade between states
- **Implementation**: Add `AnimatedSwitcher` for status text

### 1.3 Bottom Navigation Motion

#### Active Pill Interpolation
- **File**: `lib/widgets/floating_navigation.dart`
- **Duration**: 200ms
- **Effect**: Smooth scale/opacity transition
- **Implementation**: Replace static container with `AnimatedContainer`

#### Icon Morph Scaling
- **File**: `lib/widgets/floating_navigation.dart`
- **Duration**: 180ms
- **Effect**: Scale 1.0 → 1.15 on selection
- **Implementation**: Add `AnimatedScale` to nav icons

---

## Phase 2: Operations Detail Screen (Week 2)

### 2.1 Screen Structure
- **File**: `lib/screens/operation_details_screen.dart`
- **Components**:
  - Timeline component with 5 states
  - Live support state panel
  - Professional card
  - Escalation path visualization

### 2.2 Timeline Component
- **File**: `lib/widgets/operation_timeline.dart`
- **States**: Assigned → On Route → Arrived → In Progress → Completed
- **Animation**: Progress indicator moves with status updates
- **Visual**: Horizontal stepper with icons and labels

### 2.3 Live Support State
- **File**: `lib/widgets/live_support_state.dart`
- **Data Points**:
  - ETA confidence percentage
  - Backup professional count
  - Escalation trigger conditions

### 2.4 Professional Card
- **File**: `lib/widgets/professional_card.dart`
- **Design**: Trust-focused, not marketplace
- **Elements**:
  - Operator photo with verification badge
  - Experience years
  - Household compatibility score
  - Arrival time window

---

## Phase 3: Live Operational Intelligence (Week 3)

### 3.1 Contextual Message Service
- **File**: `lib/core/intelligence/contextual_message_service.dart`
- **Logic**:
  - Time-based message selection
  - User schedule integration
  - Household pattern recognition
  - Backup availability calculation

### 3.2 Message Templates

#### Cooking Context
```
Current: "Cooking Assistance"
New: "Dinner prep support arriving before peak traffic"
```

#### Professional Availability
```
Current: "12 professionals nearby • 14 min avg response"
New: "Backup support available within 11 mins"
```

#### System Status
```
Current: "All services operating normally"
New: "Your household operations are stable today"
```

### 3.3 Intelligence Engine
- **File**: `lib/core/intelligence/household_awareness.dart`
- **Features**:
  - Daily pattern analysis
  - Traffic-aware scheduling
  - Workload optimization suggestions
  - Predictive messaging

---

## Phase 4: Dark Mode (Week 4)

### 4.1 Theme Definition
- **File**: `lib/core/theme/dark_theme.dart`
- **Colors**:
  - Deep green-black: `#0A1A15`
  - Fog gradients: `#153028` to `#0F251F`
  - Muted emerald: `#2A7A6A`
  - Atmospheric contrast: 0.85-0.95 opacity range

### 4.2 Component Adaptations
- **Files**: All widget files
- **Changes**:
  - Increase noise texture to 2% for OLED depth
  - Softer glow effects
  - Enhanced text contrast
  - Reduced shadow intensity

### 4.3 Cinematic Assets
- **Directory**: `assets/cinematic/`
- **Contents**:
  - Motion teaser video
  - Household intelligence story graphics
  - Ecosystem diagrams
  - Operational maps

---

## Technical Architecture

### Motion Controller
```
lib/
  core/
    animation/
      motion_controller.dart    # Central animation timing
      haptic_service.dart       # Haptic feedback abstraction
      transition_manager.dart   # Shared element transitions
```

### Intelligence Layer
```
lib/
  core/
    intelligence/
      contextual_message_service.dart
      household_awareness.dart
      predictive_engine.dart
      message_templates.dart
```

### Theme System
```
lib/
  core/
    theme/
      app_theme.dart
      dark_theme.dart
      theme_service.dart
      design_tokens.dart
```

---

## Implementation Order

### Day 1-2: Motion Foundation
- [ ] Create `motion_controller.dart`
- [ ] Add hero gradient pulse
- [ ] Add grain texture drift

### Day 3-4: Operations Motion
- [ ] Progress line animation
- [ ] ETA number morph
- [ ] Status chip crossfade

### Day 5-7: Navigation Motion
- [ ] Active pill interpolation
- [ ] Icon morph scaling
- [ ] Haptic integration

### Week 2: Detail Screen
- [ ] Create operations detail screen
- [ ] Build timeline component
- [ ] Implement professional card

### Week 3: Intelligence
- [ ] Create contextual message service
- [ ] Integrate with existing widgets
- [ ] Add predictive messaging

### Week 4: Dark Mode
- [ ] Create dark theme
- [ ] Adapt all components
- [ ] Create cinematic assets

---

## Success Metrics

- **Motion Performance**: 60fps on all transitions
- **Haptic Response**: <50ms latency
- **Intelligence Accuracy**: 85%+ relevant contextual messages
- **Dark Mode Quality**: WCAG AA compliance
- **User Perception**: "Feels alive" in user testing

---

## Strategic Positioning

**Current**: Service marketplace app
**Target**: Household operating system

The difference is:
- Static displays → Dynamic intelligence
- Generic UI → Owned ecosystem
- Transactional → Predictive
- App-like → Infrastructure-grade