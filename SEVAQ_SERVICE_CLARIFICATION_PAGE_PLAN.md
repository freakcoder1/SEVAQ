# SEVAQ SERVICE CLARIFICATION PAGE - ARCHITECTURAL PLAN

## 🎯 PURPOSE & PSYCHOLOGY

**This is the most important screen in your entire product.**
If this page is wrong, the beautiful Home screen becomes useless.

### Core Purpose (NON-NEGOTIABLE)
This page must do exactly 3 things:
1. **Confirm** what kind of help the user actually needs
2. **Clarify** scope so there is no regret later  
3. **Transition** from trust → execution

### User Psychology
- User already trusts Sevaq (came from Home screen)
- User already clicked CTA ("We'll take care of this")
- User is NOT exploring, they are confirming
- Tone: Calm, guided, reassuring — NOT salesy, NOT dense

### Product Truth
> Home screen makes the decision feel safe.
> This screen makes the decision feel correct.

---

## 📋 STRUCTURE (LOCKED)

### 1️⃣ HEADER (VERY SIMPLE)
```dart
Title: "Confirm what you need"
Subtext: "This helps us assign the right professional"
```

**Rules:**
- ❌ No backstory
- ❌ No branding fluff  
- ❌ No urgency

### 2️⃣ PRIMARY QUESTION (CORE OF THE PAGE)
```dart
Question: "What kind of help do you need today?"
```

**This is NOT:**
- "Choose a service"
- "Select a category" 
- "Explore services"

**This IS human language.**

### 3️⃣ SERVICE OPTIONS (CRITICAL DESIGN)

**Layout:**
- Vertical list (NOT grid)
- 3–5 options max
- Full-width cards
- One tap = select

**Each option card shows ONLY:**
- ✔ Service name
- ✔ One-line human explanation

**Example (EXACT):**
```
🧹 Home Cleaning
Regular home cleaning, floors, kitchen, bathroom

🍳 Cooking Help  
Daily meal preparation or kitchen assistance

🧺 Maid / House Help
Ongoing household assistance

⚡ Quick Tasks / Errands
Small tasks, pickups, basic help
```

**Rules:**
- ❌ No prices
- ❌ No duration
- ❌ No ratings
- ❌ No icons beyond subtle leading icon
- ❌ No "popular" / "best" tags

### 4️⃣ SELECTION BEHAVIOR (VERY IMPORTANT)

**Tapping an option:**
- Highlights it
- Shows a soft checkmark
- Scrolls slightly down (micro-feedback)
- Only one selection allowed

**This reinforces:**
> "We're focusing on one thing properly."

### 5️⃣ CONTEXTUAL FOLLOW-UP (SMART PART)

**After selection, show ONE contextual question, not many.**

**Example for Cleaning:**
```
Anything specific we should know? (Optional)

Options (chips, optional):
- Full home
- Kitchen focus  
- Bathroom focus
- Just a touch-up

OR a small text field:
"Tell us in your own words (optional)"
```

**Rules:**
- ❌ No long forms
- ❌ No mandatory typing

### 6️⃣ REASSURANCE STRIP (DO NOT SKIP)

**Below the options, subtle, muted:**
```
We'll assign the right professional and monitor the visit end-to-end.
```

**This line prevents anxiety right before pricing appears next.**

### 7️⃣ SINGLE CTA (MANDATORY)

**At bottom (sticky):**
```
Continue
```

**Subtext (very small, muted):**
```
You can review details before confirming
```

**Rules:**
- ❌ Do NOT say "Proceed to pay"
- ❌ Do NOT say "Next step"  
- ❌ Do NOT show price yet (unless unavoidable)

---

## 🎨 VISUAL RULES (IMPORTANT)

- **Background:** Same as Home (consistency = trust)
- **Spacing:** Generous
- **No illustrations**
- **No gradients**  
- **Soft dividers only**
- **Typography > icons**

**This page should feel like:**
> A calm conversation, not a form

---

## 🔄 FLOW LOGIC

```
Home 
→ Service Clarification Page (this page)
→ Service Detail & Pricing Page  
→ Assignment & payment
```

**This page is the bridge between intent and commitment.**

---

## 🚫 WHAT YOU MUST NOT ADD (EVEN IF TEMPTED)

- ❌ Category grids
- ❌ "View all services"
- ❌ Search bar
- ❌ Offers / coupons
- ❌ Testimonials
- ❌ Certifications
- ❌ Trust badges

**Trust was already earned on Home.**
**Here, we respect it.**

---

## 📱 IMPLEMENTATION REQUIREMENTS

### File Structure
```
frontend-flutter-house-help-master/
├── lib/
│   ├── screens/
│   │   └── service_clarification_screen.dart  # NEW
│   ├── widgets/
│   │   ├── service_option_card.dart           # NEW
│   │   ├── contextual_followup.dart           # NEW
│   │   └── reassurance_strip.dart             # NEW
│   └── models/
│       └── service_option.dart                # NEW
```

### Key Components to Build

1. **ServiceClarificationScreen** - Main page
2. **ServiceOptionCard** - Individual service option
3. **ContextualFollowup** - Smart follow-up question
4. **ReassuranceStrip** - Trust reinforcement
5. **ServiceOption** - Data model

### Navigation Integration
- Triggered from Home screen CTA
- Navigates to Service Detail & Pricing page
- Passes selected service data

### State Management
- Selected service tracking
- Follow-up question responses
- CTA enable/disable logic

---

## 🎯 SUCCESS CRITERIA

1. **User completes selection in < 15 seconds**
2. **No confusion about what to do next**
3. **Maintains trust from Home screen**
4. **Clear transition to pricing page**
5. **No back-and-forth navigation**

---

## ⚡ EXECUTION NOTES

**This page is SYSTEM, not UI.**
Every element serves the 3 core purposes.
No decoration, no exploration, no marketplace.

**Remember:**
- Home screen = "This feels safe"
- Service Clarification = "This feels correct"
- Service Detail = "This feels right"

**The magic is in the progression.**