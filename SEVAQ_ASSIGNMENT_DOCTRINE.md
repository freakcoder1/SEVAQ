# SEVAQ Assignment Doctrine

## Core Rule (Non-Negotiable)

> **Assignment timing depends on the type of commitment.**
> - Short-lived commitments → provisional assignment
> - Long-running commitments → just-in-time assignment
>
> **There is no single assignment rule across SEVAQ—and that is correct.**

---

## 1️⃣ ONE-TIME SERVICES (On-Demand)

### What "assignment" means here
**Availability reservation, not ownership.**

### Timing
**BEFORE payment (provisional)**

### Why this is correct
- Single visit
- Short horizon
- Low worker lock-in
- Easy rollback on payment failure

### Canonical Flow
```
User selects date & time
→ System finds available professional
→ Provisional assignment (soft hold)
→ User pays
→ Provisional assignment confirmed
→ Service delivered
```

### UI Truth
- ✅ **Showing the professional before payment: Allowed**
- Language must imply **availability, not continuity**

### Backend State
```
Assignment.type = PROVISIONAL
Assignment.expiresAt = paymentTimeout
```

---

## 2️⃣ SUBSCRIPTIONS (Monthly / Recurring)

### What "assignment" means here
**Operational responsibility ownership.**

### Timing
**AFTER payment, just-in-time (24–48h before start date)**

### Why this is mandatory
- Prevents unpaid worker blocking
- Reduces reassignment churn
- Keeps availability fresh
- Aligns with long-term obligation

### Canonical Flow
```
User selects plan + start date + time window
→ User pays
→ Subscription becomes ACTIVE
→ Assignment window opens
→ Primary professional assigned 24–48h before start
→ Daily service begins
```

### UI Truth
- ❌ **Do NOT show a worker before payment**
- Copy must say: **"We'll assign a verified professional before your service begins."**

### Backend State
```
Assignment.type = PRIMARY
Assignment.startsAt = subscription.startDate
```

---

## 3️⃣ DAILY EXECUTION (Subscriptions)

- Same professional is preferred, not guaranteed
- System silently replaces if needed
- User is notified only if replacement happens
- Continuity is a **system responsibility, not a promise to a person**

---

## 4️⃣ ABSOLUTE DO-NOTS (LOCK THESE)

| Rule | Description |
|------|-------------|
| ❌ | Never let users choose professionals |
| ❌ | Never assign subscription professionals before payment |
| ❌ | Never guarantee a specific person long-term |
| ❌ | Never block workers on unpaid intent |
| ❌ | Never reuse one-time copy for subscriptions |

---

## 5️⃣ SINGLE-SENTENCE LOCK (INTERNAL)

> **SEVAQ assigns professionals early only when the commitment is short. For long-term responsibility, assignment follows payment and happens just-in-time.**

---

## FINAL STATUS

| Component | Status |
|-----------|--------|
| One-time flow | ✅ Correct |
| Subscription flow | ✅ Correct |
| UX language | ✅ Aligned |
| Backend model | ✅ Scalable |
| Brand promise | ✅ Protected |

---

## ENFORCEMENT RULES

### Frontend Enforcement

#### ✅ DO
- Show worker profiles on one-time service booking screens (before payment)
- Use "Available" language: "An available professional will be assigned"
- Use provisional assignment state during checkout
- Show "Assigning..." state after payment for one-time services

#### ❌ DON'T
- Allow users to browse/select workers (no worker cards with selection)
- Show worker profiles on subscription booking screens before payment
- Use "Your professional" language before assignment is confirmed
- Block availability based on unpaid intent

### Backend Enforcement

#### ✅ DO
- Create PROVISIONAL assignments on service request creation (one-time)
- Create PRIMARY assignments 24-48h before subscription start date
- Expire provisional assignments on payment timeout
- Release worker capacity when provisional assignments expire

#### ❌ DON'T
- Create PRIMARY assignments before subscription payment
- Block workers based on unpaid service requests
- Return specific worker details in subscription booking responses
- Guarantee specific worker continuity in subscription responses

---

## SYSTEM MARKERS

### Code Annotations

```typescript
// ONE-TIME SERVICES: Provisional assignment allowed before payment
// @assignment_timing: provisional
// @payment_required: true

// SUBSCRIPTIONS: Primary assignment only after payment, just-in-time
// @assignment_timing: just_in_time
// @payment_required: true
// @offset_hours: 48
```

### Database States

```
Assignment Types:
├── PROVISIONAL  → One-time, expires on payment timeout
└── PRIMARY      → Subscription, assigned 24-48h before start

Subscription States:
├── PENDING      → Payment not received
├── ACTIVE       → Payment received, waiting for assignment
└── ASSIGNED     → Worker assigned, service begins
```

---

## LOCKED

This is the right system. **Do not revisit unless you change the business model.**

---

*Document Version: 1.0*
*Locked Date: 2026-01-30*
*Author: SEVAQ Architecture Team*
