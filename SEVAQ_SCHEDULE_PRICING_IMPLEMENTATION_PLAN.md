# Schedule & Pricing Screen Implementation Plan

## Overview
This document outlines the implementation plan for the new Schedule & Pricing screen that follows the exact specification provided for the "Confirm & proceed" action flow.

## Current State Analysis

### Existing Implementation
- **BookingScreen**: Currently handles date/time selection and immediate payment
- **ServiceClarificationScreen**: Handles service type selection with contextual follow-up
- **BookingConfirmationScreen**: Shows confirmation after payment

### Issues with Current Flow
1. Payment happens immediately on booking screen
2. No constrained date selection (calendar-style)
3. No time window selection (specific time slots)
4. No assignment workflow before payment
5. Missing "Assigning Professional" loading state

## New Flow Architecture

### Screen 1: Schedule & Pricing Screen
**Purpose**: Collect unavoidable inputs and prepare for real assignment

#### Components:
1. **Header** (Authority, not questioning)
   - Title: "Schedule your service"
   - Subtitle: "Choose a convenient time. We'll assign and monitor the service."

2. **Date Selection** (Snabbit-style, constrained)
   - Horizontal scroll pills (max 5-7 days)
   - Format: "Today", "Tomorrow", "Wed 18", "Thu 19", "Fri 20"
   - Auto-select earliest viable date
   - "Recommended" badge on earliest date
   - Soft-disable unavailable dates

3. **Time Window Selection** (Non-negotiable design)
   - Cards/pills (2-3 max): Morning (8-11 AM), Afternoon (12-3 PM), Evening (4-7 PM)
   - System-recommended window auto-selected
   - "Best availability" helper text
   - Microcopy: "We assign professionals within this window and monitor arrival."

4. **Price Display** (Mandatory, confident)
   - Shows after time window selection
   - Format: "₹749" or "₹699 - ₹799"
   - Text: "Includes assignment, monitoring, and support"
   - No "starting at", no hourly rates, no per-task breakdown

5. **What's Included** (Justification block)
   - Verified professional
   - Assigned & monitored by Sevaq
   - Replacement if required
   - Support throughout

6. **Primary CTA** (Only one)
   - Button: "Confirm & assign professional"
   - Payment requested once professional is assigned (below CTA)

### Screen 2: Assigning Professional Screen
**Purpose**: Immediate transition after CTA tap

#### Components:
- Full-screen loader (no skeleton lists, no provider browsing)
- Primary message: "We're assigning the right professional for your service"
- Secondary reassurance: "This usually takes a few moments"
- Micro-reinforcement: "Managed end-to-end by Sevaq"

#### System Actions:
- Lock time window
- Find best match based on skill, proximity, reliability score
- Start assignment timer

### Screen 3: Professional Assigned Screen
**Purpose**: Show once assignment is successful

#### Components:
- Professional first name
- Arrival ETA
- Service summary
- Support contact
- Payment prompt: "Please confirm payment to proceed"
- Button: "Pay & confirm service"

## Technical Implementation

### New Files to Create
1. `schedule_pricing_screen.dart` - Main schedule & pricing screen
2. `assigning_professional_screen.dart` - Assignment loading screen
3. `professional_assigned_screen.dart` - Professional assigned screen
4. `time_window.dart` - Time window model

### Backend API Changes Required
1. **New endpoint**: `POST /bookings/assign` - Creates assignment without payment
2. **Modified endpoint**: `POST /payments/verify` - Handles payment after assignment
3. **Assignment workflow**: Worker matching and assignment logic

### State Management
- Use existing `BookingProvider` for assignment state
- Add assignment-specific state management
- Handle assignment status transitions

### Navigation Flow
```
ServiceClarificationScreen 
  → SchedulePricingScreen 
    → AssigningProfessionalScreen 
      → ProfessionalAssignedScreen 
        → BookingConfirmationScreen
```

## Key Design Principles

### Authority & Confidence
- No "please select" language
- No uncertainty in messaging
- Confident price display
- System-recommended defaults

### Constrained Choice
- Limited date options (5-7 days)
- Limited time windows (2-3 options)
- Auto-selection of recommended options
- No calendar popups or monthly views

### Trust Building
- Clear what's included
- Professional monitoring promise
- Replacement guarantee
- Support throughout service

### Payment Flow
- Payment happens AFTER assignment
- Clear payment request timing
- No payment on schedule screen
- Payment only when professional is confirmed

## Implementation Priority

### Phase 1: Core Screens
1. Create SchedulePricingScreen with date/time selection
2. Create AssigningProfessionalScreen with loading state
3. Create ProfessionalAssignedScreen with payment prompt

### Phase 2: Backend Integration
1. Implement assignment API endpoint
2. Modify payment verification flow
3. Add assignment status tracking

### Phase 3: Polish & Testing
1. Add error handling for assignment failures
2. Test payment flow after assignment
3. Validate time window constraints
4. Test worker matching algorithm

## Success Criteria

### User Experience
- Users feel confident in selection process
- Clear understanding of what's included
- Trust in assignment process
- Smooth payment flow after assignment

### Business Metrics
- Reduced booking abandonment
- Increased assignment success rate
- Higher customer satisfaction
- Improved worker utilization

### Technical Metrics
- Fast assignment matching
- Reliable payment processing
- Proper error handling
- Smooth navigation flow

## Next Steps

1. **Create the SchedulePricingScreen** following the exact specification
2. **Implement backend assignment API** to support new flow
3. **Update existing screens** to integrate with new flow
4. **Test the complete flow** from service selection to payment
5. **Monitor and optimize** based on user feedback and metrics

This implementation will create a more trustworthy and streamlined booking experience that aligns with the Snabbit-style constrained choice model while maintaining Sevaq's managed service identity.