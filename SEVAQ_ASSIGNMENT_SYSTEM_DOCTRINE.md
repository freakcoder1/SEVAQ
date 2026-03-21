# SEVAQ Assignment System Doctrine

**Status**: LOCKED - System Constraint  
**Last Updated**: 2026-01-30  
**Review Required For Changes**: Yes (Business Model Change Only)

---

## Core Doctrine Statement

> **SEVAQ assigns professionals early only when the commitment is short.  
> For long-term responsibility, assignment follows payment and happens just-in-time.**

This is not a policy preference. This is a system constraint that prevents:
- Unpaid worker blocking
- Reassignment churn on failed payments
- Availability lock-in on long-term obligations
- User expectation mismatches

---

## 1. ONE-TIME SERVICES (On-Demand)

### What "Assignment" Means Here
- **Availability reservation, not ownership**

### Timing
- **BEFORE payment (provisional)**

### Why This Is Correct
- Single visit (short horizon)
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
- ✅ **Allowed**: Showing the professional before payment
- ⚠️ **Language must imply availability, not continuity**

### Backend State
```typescript
Assignment.type = 'PROVISIONAL'
Assignment.expiresAt = paymentTimeout  // e.g., 15 minutes
```

---

## 2. SUBSCRIPTIONS (Monthly / Recurring)

### What "Assignment" Means Here
- **Operational responsibility ownership**

### Timing
- **AFTER payment, just-in-time (24–48h before start date)**

### Why This Is Mandatory
- Prevents unpaid worker blocking
- Reduces reassignment churn
- Keeps availability fresh
- Aligns with long-term obligation

### Canonical Flow
```
User selects plan + start date + time window
→ User pays
→ Subscription becomes ACTIVE
→ Assignment window opens (24-48h before start)
→ Primary professional assigned
→ Daily service begins
```

### UI Truth
- ❌ **DO NOT show a worker before payment**
- ✅ **Copy must say**: "We'll assign a verified professional before your service begins."

### Backend State
```typescript
Assignment.type = 'PRIMARY'
Assignment.startsAt = subscription.startDate  // 24-48h window
```

---

## 3. DAILY EXECUTION (Subscriptions)

### Principles
- **Same professional is preferred, not guaranteed**
- **System silently replaces if needed**
- **User is notified only if replacement happens**

### Implementation Notes
- Continuity is a **system responsibility**, not a promise to a person
- Replacement logic must be automatic and silent
- User notification only triggers on actual replacement

---

## 4. ABSOLUTE DO-NOTS (LOCKED)

These rules are **non-negotiable** and violate system integrity:

| Rule | Violation Consequence |
|------|----------------------|
| ❌ Never let users choose professionals | Undermines assignment algorithm, causes imbalance |
| ❌ Never assign subscription professionals before payment | Blocks workers on unpaid intent |
| ❌ Never guarantee a specific person long-term | Creates expectation mismatches |
| ❌ Never block workers on unpaid intent | Worker availability wasted |
| ❌ Never reuse one-time copy for subscriptions | User expectation confusion |

---

## 5. Assignment Timing Matrix

| Service Type | Commitment Length | Assignment Timing | State |
|--------------|-------------------|-------------------|-------|
| One-Time | Short (< 1 day) | Before payment | PROVISIONAL |
| Subscription | Long (Monthly+) | After payment, 24-48h |

---

## 6. Backend before start | PRIMARY Implementation Checklist

### For One-Time Services
- [ ] Assignment created with `type: 'PROVISIONAL'`
- [ ] `expiresAt` set to payment timeout (15 min recommended)
- [ ] On payment success → convert to CONFIRMED
- [ ] On payment timeout → auto-release with cleanup

### For Subscriptions
- [ ] No assignment on subscription creation
- [ ] Scheduler triggers 24-48h before `subscription.startDate`
- [ ] Assignment created with `type: 'PRIMARY'`
- [ ] Assignment `startsAt` = subscription start date

---

## 7. Frontend Implementation Checklist

### One-Time Service Screens
- [ ] Can show professional profile before payment
- [ ] Language: "Available professional" not "Your professional"
- [ ] Shows countdown to payment timeout

### Subscription Screens
- [ ] **NO** professional shown before payment
- [ ] Copy: "We'll assign a verified professional before your service begins."
- [ ] Subscription dashboard shows assignment only after 24h window opens

---

## 8. Violation Detection

Run these queries to detect violations:

### Detect Pre-Payment Subscription Assignments
```sql
SELECT * FROM assignments a
JOIN subscriptions s ON a.subscriptionId = s.id
WHERE a.type = 'PRIMARY'
  AND a.createdAt < s.paymentConfirmedAt;
```

### Detect Worker Lock-on Unpaid Intent
```sql
SELECT w.id, w.name, COUNT(a.id) as blocked_assignments
FROM workers w
LEFT JOIN assignments a ON a.workerId = w.id
  AND a.status = 'PROVISIONAL'
  AND a.expiresAt > NOW()
GROUP BY w.id
HAVING COUNT(a.id) > 3;
```

---

## 9. Review Process

To modify this doctrine:

1. **Submit Request**: Document proposed change with business justification
2. **Impact Analysis**: Assess worker availability, user experience, and revenue impact
3. **Review Board Approval**: Required for any rule modification
4. **Implementation**: Only after approval

**Exception**: No changes permitted unless the **business model changes**.

---

## Status Signoff

| Component | Status |
|-----------|--------|
| One-Time Flow | ✅ Correct |
| Subscription Flow | ✅ Correct |
| UX Language | ✅ Aligned |
| Backend Model | ✅ Scalable |
| Brand Promise | ✅ Protected |

**This is the right system. Lock it. Do not revisit unless you change the business model.**
