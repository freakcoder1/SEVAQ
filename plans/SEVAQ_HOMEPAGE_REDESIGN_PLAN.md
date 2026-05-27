# Sevaq Homepage Redesign Plan

## Overview

This document outlines the complete redesign of the Sevaq mobile app homepage to transform it from a "quick-commerce marketplace" feel to an "AI-managed premium household infrastructure" experience.

## Design Philosophy

**Target Feel:**
- Calm, trustworthy, intelligent, premium
- Operationally reliable, minimal, human, elegant

**Reference Inspirations:**
- Apple Home
- Linear
- Airbnb
- Uber Reserve
- Notion

---

## Current Issues (To Fix)

| Problem | Current State | Target State |
|---------|---------------|--------------|
| Hero card | Too large, too loud, 180px height | 150-170px max, operational status surface |
| Gradients | Saturated, bright teal | Subtle, deep, calm emerald |
| Typography | Broken hierarchy, oversized | Premium hierarchy, 30-32px hero title |
| CTA | Full-width, awkward | Hug content, 46px height |
| Layout | Poor depth, no rhythm | Layered surfaces, depth hierarchy |
| Navigation | Outdated, basic | Floating glass, iOS-like |

---

## Screen Structure (Top to Bottom)

```
┌─────────────────────────────────────┐
│ 1. Compact Header                   │
├─────────────────────────────────────┤
│ 2. Operational Hero Surface         │
├─────────────────────────────────────┤
│ 3. Active Household Operations      │
├─────────────────────────────────────┤
│ 4. Upcoming Household Schedule      │
├─────────────────────────────────────┤
│ 5. Reliability & Trust Layer        │
├─────────────────────────────────────┤
│ 6. Society Intelligence Layer       │
├─────────────────────────────────────┤
│ 7. Household Support Options        │
├─────────────────────────────────────┤
│ 8. Floating Navigation              │
└─────────────────────────────────────┘
```

---

## 1. HEADER (Compact & Elegant)

### Layout
```
┌─────────────────────────────────────┐
│ Good evening, [Name]'s Home    🔔 👤 │
└─────────────────────────────────────┘
```

### Specifications
- **Height:** 56px (compact)
- **Left:** "Good evening" + Household name
- **Right:** Notification + Profile icons
- **Icon containers:** 44x44px, soft white surfaces, light shadow
- **No outlined circles** - filled surfaces only
- **Spacing:** Tight and intentional

### Implementation
```dart
// Header container
Container(
  height: 56,
  padding: EdgeInsets.symmetric(horizontal: 24),
  child: Row(
    mainAxisAlignment: MainAxisAlignment.spaceBetween,
    children: [
      // Left: Greeting
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Good evening', style: TextStyle(fontSize: 13, color: onSurfaceVariant)),
          Text('Name\'s Home', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
        ],
      ),
      // Right: Icons
      Row(
        children: [
          _buildIconButton(Icons.notifications_outlined),
          SizedBox(width: 12),
          _buildIconButton(Icons.person_outline),
        ],
      ),
    ],
  ),
)
```

---

## 2. HERO SECTION (Operational Status Surface)

### Key Changes
- **Height:** 150-170px MAX (reduced from 180px)
- **Radius:** 28px
- **Gradient:** Subtle premium emerald (NOT saturated)
- **NOT a marketing banner** - operational status

### Gradient Colors
```dart
// Current (too saturated):
Color(0xFF1F6B5F) → Color(0xFF2A8072)

// Target (subtle, deep, calm):
Color(0xFF1A4D42) → Color(0xFF1F6B5F)
// Or use a single emerald with subtle opacity variation
```

### Content Structure
```
┌─────────────────────────────────────┐
│ [Reliable household support]        │
│                                     │
│ Managed support for your home.        │
│ Assigned, monitored, supported.       │
│                                     │
│ [Get household support]             │
└─────────────────────────────────────┘
```

### Hero Layout
- **LEFT SIDE:** Main operational message
- **RIGHT SIDE:** Subtle ambient orchestration visual
  - Soft operational nodes
  - Abstract household activity pattern
  - Calm intelligent motion
- **DO NOT use:** Stock illustrations, giant graphics, workers smiling, promotional imagery

### Typography
- **Pill:** 13px, medium weight
- **Headline:** 30-32px, w600
- **Subheading:** 16px, regular
- **CTA:** 14px, w500, 46px height, hug content

### Implementation
```dart
Container(
  height: 160,
  padding: EdgeInsets.all(20),
  decoration: BoxDecoration(
    gradient: LinearGradient(
      colors: [Color(0xFF1A4D42), Color(0xFF1F6B5F)],
      begin: Alignment.topLeft,
      end: Alignment.bottomRight,
    ),
    borderRadius: BorderRadius.circular(28),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.04),
        blurRadius: 16,
        offset: Offset(0, 4),
      ),
    ],
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      // Small pill
      Container(
        padding: EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Text('Reliable household support', style: TextStyle(fontSize: 13)),
      ),
      SizedBox(height: 12),
      // Headline
      Text('Managed support for your home.', style: TextStyle(fontSize: 30, fontWeight: FontWeight.w600)),
      SizedBox(height: 4),
      // Subheading
      Text('Sevaq assigns and monitors every service professionally.', style: TextStyle(fontSize: 16)),
      Spacer(),
      // CTA - NOT full width
      ElevatedButton(
        onPressed: () {},
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.white,
          foregroundColor: emeraldGreen,
          padding: EdgeInsets.symmetric(horizontal: 20, vertical: 12),
          minimumSize: Size(0, 46), // Height only
        ),
        child: Text('Request support'),
      ),
    ],
  ),
)
```

---

## 3. ACTIVE HOUSEHOLD OPERATIONS (Primary Product Layer)

### Purpose
This is the PRIMARY product layer - NOT service marketplace cards.

### Example Display
```
┌─────────────────────────────────────┐
│ Active household operations         │
│                                     │
│ Cooking Assistance                  │
│ Assigned to Ritu Sharma             │
│ Arriving in 24 mins                 │
└─────────────────────────────────────┘
```

### Implementation
```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Text('Active household operations', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
    SizedBox(height: 12),
    // Operation card
    Container(
      padding: EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: surface,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 12,
            offset: Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Cooking Assistance', style: TextStyle(fontSize: 18, fontWeight: FontWeight.w600)),
          SizedBox(height: 4),
          Text('Assigned to Ritu Sharma', style: TextStyle(fontSize: 14, color: onSurfaceVariant)),
          SizedBox(height: 2),
          Text('Arriving in 24 mins', style: TextStyle(fontSize: 14, color: primaryColor)),
        ],
      ),
    ),
  ],
)
```

---
 
## 4. UPCOMING HOUSEHOLD SCHEDULE
 
### Purpose
Creates household continuity feeling - shows planned support.
 
 ### Example Display
 ```
 ┌─────────────────────────────────────┐
 │ Upcoming household schedule           │
 │                                     │
 │ Tomorrow: Cleaning support          │
 │ 10:00 AM - 12:00 PM                 │
 │                                     │
 │ Evening: Cooking at 7:00 PM         │
 │ Thursday: Weekly housekeeping       │
 └─────────────────────────────────────┘
 ```
 
### Implementation
 ```dart
 Column(
   crossAxisAlignment: CrossAxisAlignment.start,
   children: [
     Text('Upcoming household schedule', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
     SizedBox(height: 12),
     // Schedule items
     _buildScheduleItem('Tomorrow', 'Cleaning support', '10:00 AM - 12:00 PM'),
     _buildScheduleItem('Evening', 'Cooking', '7:00 PM'),
     _buildScheduleItem('Thursday', 'Weekly housekeeping', '9:00 AM - 11:00 AM'),
   ],
 )
 ```
 
---
 
## 5. RELIABILITY & TRUST LAYER

### Purpose
Communicate trust, orchestration, operational intelligence.

### Elements
- Reliability score
- System status
- Past performance metrics
- Support availability

### Implementation
```dart
Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: primaryContainer,
    borderRadius: BorderRadius.circular(20),
  ),
  child: Row(
    children: [
      Icon(Icons.verified, color: primaryColor),
      SizedBox(width: 12),
      Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('98% reliability', style: TextStyle(fontWeight: FontWeight.w600)),
          Text('All systems operational', style: TextStyle(fontSize: 13, color: onSurfaceVariant)),
        ],
      ),
    ],
  ),
)
```

---
 
## 6. SOCIETY INTELLIGENCE LAYER
 
### Purpose
Creates network-effect perception - shows system activity in the area.
 
### Example Display
```
┌─────────────────────────────────────┐
│ Society intelligence                │
│                                     │
│ 12 professionals active nearby      │
│ Avg response time: 14 mins          │
│ Support active in your society      │
└─────────────────────────────────────┘
```
 
### Implementation
```dart
Container(
  padding: EdgeInsets.all(16),
  decoration: BoxDecoration(
    color: surface,
    borderRadius: BorderRadius.circular(20),
    boxShadow: [
      BoxShadow(
        color: Colors.black.withOpacity(0.04),
        blurRadius: 12,
        offset: Offset(0, 2),
      ),
    ],
  ),
  child: Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      Text('Society intelligence', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
      SizedBox(height: 12),
      Row(
        children: [
          Icon(Icons.people, color: primaryColor, size: 20),
          SizedBox(width: 8),
          Text('12 professionals active nearby', style: TextStyle(fontSize: 14)),
        ],
      ),
      SizedBox(height: 8),
      Row(
        children: [
          Icon(Icons.timer, color: primaryColor, size: 20),
          SizedBox(width: 8),
          Text('Avg response time: 14 mins', style: TextStyle(fontSize: 14)),
        ],
      ),
    ],
  ),
)
```
 
---
 
## 7. HOUSEHOLD SUPPORT OPTIONS
 
### Purpose
DO NOT call this "Services" - that feels marketplace-like.
 
### Name Options
- Household support
- Everyday assistance
- Managed support options
 
### Design
- SECONDARY section
- Smaller elegant surfaces
- NOT giant service cards
 
### Services List
- Cooking Support
- Housekeeping
- Laundry
- Elderly Assistance
 
### Implementation
```dart
Column(
  crossAxisAlignment: CrossAxisAlignment.start,
  children: [
    Text('Household support', style: TextStyle(fontSize: 22, fontWeight: FontWeight.w600)),
    SizedBox(height: 12),
    // Smaller, more elegant cards
    Wrap(
      spacing: 12,
      runSpacing: 12,
      children: [
        _buildSupportChip('Cooking Support'),
        _buildSupportChip('Housekeeping'),
        _buildSupportChip('Laundry'),
        _buildSupportChip('Elderly Assistance'),
      ],
    ),
  ],
)
```
 
---
 
## 8. FLOATING NAVIGATION

### Specifications
- **Type:** Floating glass navigation
- **Shape:** Rounded 28px
- **Effect:** Subtle blur, soft shadow
- **Style:** Premium iOS-like feel

### Implementation
```dart
// Positioned at bottom
Positioned(
  bottom: 24,
  left: 24,
  right: 24,
  child: ClipRRect(
    borderRadius: BorderRadius.circular(28),
    child: BackdropFilter(
      filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
      child: Container(
        height: 64,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.8),
          borderRadius: BorderRadius.circular(28),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.08),
              blurRadius: 20,
              offset: Offset(0, 4),
            ),
          ],
        ),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceEvenly,
          children: [
            _buildNavItem(Icons.home, 'Home', true),
            _buildNavItem(Icons.calendar_today, 'Bookings', false),
            _buildNavItem(Icons.person, 'Profile', false),
          ],
        ),
      ),
    ),
  ),
)
```

---

## COLORS

### Background
- `#F7F8F7` (fogWhite)

### Primary Green
- Deep muted emerald: `#1F6B5F`
- Pressed state: `#18554B`
- Soft background: `#EAF4F1`

### Avoid
- Neon green
- Teal gradients
- Flashy colors

---

## TYPOGRAPHY

| Element | Size | Weight |
|---------|------|--------|
| Hero title | 30-32px | w600 |
| Section titles | 22px | w600 |
| Body | 16px | w400 |
| Labels | 13-14px | w500 |

---

## DEPTH & SURFACES

### Current: Too flat
### Target: Layered surfaces

```
Background layer (fogWhite)
  ↓
Surface layer (white cards)
  ↓
Floating operational layer (hero, active ops)
```

### Shadow System
- **Level 1 (Cards):** Y:4, Blur:18, Spread:-4, Opacity:6%
- **Level 2 (Floating):** Y:12, Blur:32, Spread:-6, Opacity:10%

---

## FILES TO MODIFY

| File | Changes |
|------|---------|
| `lib/theme.dart` | Update colors, typography, shadows |
| `lib/screens/trust_first_home_screen.dart` | Complete restructure |
| `lib/widgets/trust_first_header.dart` | New compact header |
| `lib/widgets/trust_first_recommendation.dart` | Update hero card |
| `lib/widgets/service_card.dart` | Smaller, more elegant |

---

## IMPLEMENTATION ORDER

1. Update `theme.dart` with new design tokens
2. Create new header widget
3. Create new hero/operational status widget
4. Create active operations widget
5. Create trust/reliability widget
6. Update services section
7. Implement floating navigation
8. Integrate all into `trust_first_home_screen.dart`

---

## SUCCESS CRITERIA

The homepage should feel like:
> "Sevaq intelligently manages my household."

NOT:
> "I'm browsing service providers."

The experience should communicate:
- Trust
- Orchestration
- Operational intelligence
- Premium reliability
- Calm infrastructure