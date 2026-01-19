# Sevaq Home Screen Fix Plan
## Trust-First, Non-Marketplace Implementation

### Current State Analysis

The current Home Screen violates multiple trust-first principles:

❌ **Category Grid** - Shows multiple competing categories
❌ **Prices** - Displayed in service cards and recommendations  
❌ **Ratings & Stars** - Worker ratings and review counts shown
❌ **Red Error Banners** - "Limited availability" messages
❌ **Multiple CTAs** - "We'll handle this", "View details", "Book [Name]"
❌ **Search as Primary** - Prominent search bar at top
❌ **"Book in 15-30 mins"** - Urgency-inducing messaging
❌ **Technical Data** - Coordinates, worker details, reliability scores

### Required Structure (Only These Sections)

#### 1️⃣ TRUST HEADER (TOP)
**Purpose**: Calm authority, not alerts
**Current Issues**: Shows technical data, worker counts, system status
**Fix Required**:
- Remove worker counts and technical metrics
- Remove red colors and error states
- Use soft green/neutral tones only
- Simplify copy to "All services on track" or "We're monitoring availability"

#### 2️⃣ PRIMARY RECOMMENDATION (HERO CARD)
**Purpose**: Decision already made by system
**Current Issues**: Shows ratings, prices, worker details, multiple metrics
**Fix Required**:
- Remove all ratings, stars, review counts
- Remove prices and base prices
- Remove worker names and personal details
- Remove reliability scores and percentages
- Keep only: reassurance badge, service name, confidence line, ONE CTA

#### 3️⃣ SECONDARY SUGGESTIONS (OPTIONAL, MUTED)
**Purpose**: Gentle alternatives, not choices
**Current Issues**: Smart suggestions with multiple CTAs and metrics
**Fix Required**:
- Remove if too prominent
- If kept: max 2 cards, muted background, no prices, no CTAs stronger than text-link
- Use copy like "Usually booked at this time" or "Common in your area"

#### 4️⃣ SUPPORT SIGNAL (VERY SUBTLE)
**Purpose**: Subconscious trust increase
**Current Issues**: Missing or too prominent
**Fix Required**:
- Add text-only footer: "Support is live" or "We're here if you need help"
- No buttons, very subtle

### Sections to REMOVE COMPLETELY

❌ **Category Grid** - No more cooking/cleaning categories on Home
❌ **Available Services** - No service cards with prices and ratings
❌ **Search Bar** - Not primary action on Home
❌ **Memory Section** - No booking history on Home
❌ **Smart Suggestions** - Remove if too prominent
❌ **"Book in 15-30 mins"** - Remove urgency messaging
❌ **Worker Details** - No names, ratings, photos
❌ **System Status Banners** - No red error states

### Visual Design Changes

**Layout**: Vertical, calm, spacious
- Use 8px grid system
- Large padding, fewer elements
- Soft shadows only
- No aggressive colors
- No gradients above 8% opacity

**Typography**:
- Larger font sizes for calm reading
- More line spacing
- Less information density

**Colors**:
- Soft green for trust (not bright green)
- Neutral backgrounds
- No reds or urgent colors
- Muted secondary elements

### Microcopy Changes

**Allowed Words**:
- handled
- monitoring
- reliable
- on track
- safe choice

**Forbidden Words**:
- hurry
- limited
- best deal
- cheap
- top rated

**Examples**:
- ✅ "All services on track"
- ✅ "We're monitoring availability in your area"
- ✅ "Most reliable right now"
- ✅ "Arrives in ~30 mins · Reliable in your area"
- ✅ "We'll handle this"

### Implementation Priority

1. **High Priority** (Trust violations):
   - Remove ratings and prices from hero card
   - Remove multiple CTAs
   - Simplify Trust Header
   - Remove red error states

2. **Medium Priority** (UX improvements):
   - Remove category grid
   - Remove search bar
   - Remove memory section
   - Add support signal

3. **Low Priority** (Polish):
   - Visual design refinements
   - Microcopy updates
   - Animation smoothness

### Success Criteria

✅ **Within 3 seconds, user feels**:
- "This app knows what to do"
- "I don't need to think"
- "I'm safe choosing this"

✅ **Screen feels**:
- Calm (not busy)
- Authoritative (not salesy)
- Simple (not choice-heavy)
- Trustworthy (not metric-heavy)

### Testing Checklist

- [ ] No category grid visible
- [ ] No prices on any Home elements
- [ ] No ratings, stars, or reviews
- [ ] No red error banners
- [ ] Only ONE primary CTA button
- [ ] No multiple competing actions
- [ ] Trust Header shows only location + calm message
- [ ] Hero card shows only service + confidence + CTA
- [ ] Screen looks calmer than Uber/Urban Company
- [ ] Cautious parent would trust this