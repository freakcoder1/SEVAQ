# SEVAQ FINAL POLISH PLAN

## 🎯 OBJECTIVE
Transform the Schedule & Pricing screen from "90% correct" to Snabbit-level production ready by fixing critical visual discipline and micro-consistency issues.

## 📋 CRITICAL ISSUES TO FIX

### 1. Date Selector Overflow (🔴 CRITICAL)
**Problem**: RenderFlex overflow errors visible in logs (BOTTOM OVERFLOWED BY 37 pixels)
**Impact**: Kills trust instantly - brain registers "broken UI"
**Solution**:
- Fix container height to prevent overflow
- Ensure no text clipping
- Remove any debug artifacts
- If layout cannot be guaranteed, use single-line date pills or calendar modal

### 2. Selection State Hierarchy (🔴 CRITICAL)
**Problem**: Inconsistent green usage across selection states
**Impact**: User subconsciously asks "Did I already confirm this or not?"
**Solution**:
- **ONLY ONE element gets solid green at a time**
- Date selection: Light green background only
- Time window selection: Green border + green text
- CTA: Solid green (strongest element)
- No other greens anywhere

### 3. Price Block Authority (🟡 HIGH)
**Problem**: Price feels informational, not decision anchor
**Solution**:
- Add "Service cost" label above price
- Make price block more prominent
- Keep "per visit" clarification

### 4. CTA Copy Polish (🟡 HIGH)
**Problem**: "Confirm schedule request" is bureaucratic
**Solution**:
- Change to "Confirm & request professional"
- Focus on outcome, not process
- Align with "payment after assignment"

### 5. Bottom Microcopy Simplification (🟡 HIGH)
**Problem**: Too much text at bottom creates cognitive load
**Solution**:
- Simplify to ONE line: "Payment requested only after a professional is assigned"
- Remove any additional system messages

## 🎨 FINAL SCREEN STRUCTURE (LOCK THIS)

```
Header
├── "Schedule your service"
└── Calm, confident subtitle

Date selector
├── Clean pills or modal
├── Zero layout glitches
└── Light green background for selected

Time window
├── Clear selection
├── ONE green highlight only (border + text)
└── No competing greens

Price block
├── "Service cost" label
├── ₹1500 per visit
└── Short inclusion line

What's included
├── Keep as-is (excellent)
└── No changes needed

Primary CTA
├── Solid green
├── "Confirm & request professional"
└── Single line microcopy below

Trust microcopy
└── "Payment requested only after a professional is assigned"
```

## 🛠️ IMPLEMENTATION PRIORITY

### Phase 1: CRITICAL (Must fix before beta)
1. Fix date selector overflow (remove debug text)
2. Fix selection state hierarchy (only ONE solid green)
3. Add "Service cost" label above price

### Phase 2: HIGH (Polish for production)
4. Change CTA to "Confirm & request professional"
5. Simplify bottom microcopy to single line

### Phase 3: VALIDATION
6. Test on device with real users
7. Verify no overflow errors
8. Confirm visual hierarchy is clear

## ✅ SUCCESS CRITERIA

### Before (❌ WRONG)
- Date selector has overflow errors
- Multiple green elements compete for attention
- Price feels informational
- CTA is bureaucratic
- Bottom has too much text

### After (✅ RIGHT)
- Date selector is pixel-perfect
- Only ONE solid green element (CTA)
- Price is decision anchor
- CTA focuses on outcome
- Bottom has single trust line

## ⚡ EXECUTION RULES

1. **Visual Discipline**: Every green pixel must have hierarchy
2. **No Debug Artifacts**: Zero overflow errors, zero debug text
3. **User Certainty**: User should never wonder "Did I confirm this?"
4. **Snabbit-Level**: Match the polish of top-tier scheduling apps

## 🎯 FINAL VERDICT

**Current State**: 90% correct conceptually, but feels "engineering-first"
**Target State**: Snabbit-level polish with user certainty
**Key**: Visual discipline and micro-consistency

Fix these issues and you are ready for real users.