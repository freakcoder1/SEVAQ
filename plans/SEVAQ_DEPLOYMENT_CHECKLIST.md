# SEVAQ Deployment Checklist — Everything You Need Before Going Live

## 1. API Keys & Credentials You Must Obtain

### 1.1 Razorpay (Payment Gateway) — REQUIRED
| What | Where to Get | What You Get |
|------|-------------|-------------|
| Live Key ID | [Razorpay Dashboard](https://dashboard.razorpay.com) → Settings → API Keys → Generate Live Key | `rzp_live_XXXXXXXXXXXX` |
| Live Key Secret | Same page as above | `XXXXXXXXXXXXXXXXXXXXXXXX` |

**Steps:**
1. Go to https://dashboard.razorpay.com
2. Complete KYC verification (PAN, Aadhaar, bank account)
3. Go to Settings → API Keys
4. Switch to "Live Mode" (top toggle)
5. Click "Generate Key" → Save both Key ID and Key Secret

**Where to put them:**
- Backend: [`flutter-nest-househelp-master/.env`](flutter-nest-househelp-master/.env) → `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`
- Frontend: Build with `--dart-define=RAZORPAY_KEY=rzp_live_XXXXXXXXXXXX`

---

### 1.2 Firebase (Phone OTP Authentication) — REQUIRED
| What | Where to Get | What You Get |
|------|-------------|-------------|
| Firebase Service Account JSON | Firebase Console → Project Settings → Service Accounts | JSON file with private key |
| Firebase Project ID | Firebase Console → Project Settings → General | `your-project-id` |

**Steps:**
1. Go to https://console.firebase.google.com
2. Create a project (or use existing one)
3. Enable **Authentication** → Sign-in method → **Phone**
4. Go to Project Settings → Service Accounts
5. Click "Generate new private key" → Download JSON file
6. Copy the entire JSON content

**Where to put them in [`flutter-nest-househelp-master/.env`](flutter-nest-househelp-master/.env):**
```env
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token"}
```

**Flutter side** — already configured via:
- [`frontend-flutter-house-help-master/lib/firebase_options.dart`](frontend-flutter-house-help-master/lib/firebase_options.dart)
- [`frontend-flutter-house-help-master/android/app/google-services.json`](frontend-flutter-house-help-master/android/app/google-services.json)

You need to download `google-services.json` from Firebase Console → Project Settings → Your Apps → Android app → Download `google-services.json`

---

### 1.3 PostgreSQL Database — REQUIRED
| What | Value for Production |
|------|---------------------|
| DB_HOST | Your production database server IP/hostname |
| DB_PORT | `5432` (default) |
| DB_USERNAME | Create a dedicated user (NOT `postgres`) |
| DB_PASSWORD | Strong password (32+ chars, mixed case, numbers, symbols) |
| DB_NAME | `sevaq_db` |

**Options for hosting:**
- **AWS RDS** — Managed PostgreSQL
- **DigitalOcean Managed Database** — Simpler, cheaper
- **Railway.app** — Easiest for startups
- **Supabase** — Free tier available
- **Self-hosted** — On your own VPS

**Where to put them in [`flutter-nest-househelp-master/.env`](flutter-nest-househelp-master/.env):**
```env
DB_HOST=your-db-host.com
DB_PORT=5432
DB_USERNAME=sevaq_prod_user
DB_PASSWORD=YourStrongPassword123!@#
DB_NAME=sevaq_db
```

---

### 1.4 SMTP Email Service — RECOMMENDED (for notifications)
| What | Where to Get | What You Get |
|------|-------------|-------------|
| SMTP Host | Your email provider | e.g., `smtp.gmail.com` or `email-smtp.ap-south-1.amazonaws.com` |
| SMTP Port | Your email provider | `587` (TLS) or `465` (SSL) |
| SMTP User | Your email provider | Email address or API key |
| SMTP Pass | Your email provider | Password or API secret |

**Options:**
- **Amazon SES** — Cheapest for bulk (₹0.07/email)
- **SendGrid** — Free tier: 100 emails/day
- **Gmail SMTP** — Free but limited to 500/day
- **Mailgun** — Free tier: 5,000 emails/month

**Where to put them in [`flutter-nest-househelp-master/.env`](flutter-nest-househelp-master/.env):**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

---

### 1.5 Twilio (SMS Notifications) — OPTIONAL
| What | Where to Get | What You Get |
|------|-------------|-------------|
| Account SID | [Twilio Console](https://console.twilio.com) | `ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| Auth Token | Same page | `XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX` |
| Phone Number | Twilio Console → Phone Numbers → Buy | `+1XXXXXXXXXX` |

**Where to put them in [`flutter-nest-househelp-master/.env`](flutter-nest-househelp-master/.env):**
```env
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+1XXXXXXXXXX
```

**Note:** Twilio is optional if you rely on Firebase push notifications instead of SMS.

---

### 1.6 FCM Push Notifications — RECOMMENDED
Already configured via Firebase. Just ensure:
- `google-services.json` is in `frontend-flutter-house-help-master/android/app/`
- `GoogleService-Info.plist` is in `frontend-flutter-house-help-master/ios/Runner/`

---

## 2. Server/Hosting Setup

### 2.1 Production Server Options

| Option | Cost | Difficulty | Recommended For |
|--------|------|-----------|----------------|
| **Railway.app** | ~$5-20/mo | Easy | Quick launch, startups |
| **DigitalOcean Droplet** | ~$12-24/mo | Medium | More control |
| **AWS EC2 + RDS** | ~$30-50/mo | Hard | Scale-ready |
| **Render.com** | ~$7-25/mo | Easy | Auto-deploy from Git |
| **Heroku** | ~$7-25/mo | Easy | Familiar to many devs |

### 2.2 Domain & SSL

| What | Where to Get | Cost |
|------|-------------|------|
| Domain name | GoDaddy, Namecheap, Google Domains | ~₹800-1500/year |
| SSL Certificate | Let's Encrypt (FREE) via Certbot | Free |

**You need:**
- `api.sevaq.com` (or similar) pointing to your server IP
- SSL certificate for HTTPS

### 2.3 Minimum Server Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 1 vCPU | 2 vCPU |
| RAM | 1 GB | 2 GB |
| Storage | 20 GB SSD | 40 GB SSD |
| OS | Ubuntu 22.04 LTS | Ubuntu 22.04 LTS |

---

## 3. Complete Production .env File Template

Create this file at `flutter-nest-househelp-master/.env` on your production server:

```env
# ============================================
# SEVAQ PRODUCTION ENVIRONMENT CONFIGURATION
# ============================================

# Application
NODE_ENV=production
PORT=3000

# Database (REQUIRED - get from your DB provider)
DB_HOST=your-production-db-host.com
DB_PORT=5432
DB_USERNAME=sevaq_prod_user
DB_PASSWORD=CHANGE_THIS_TO_STRONG_PASSWORD
DB_NAME=sevaq_db

# JWT Authentication (REQUIRED - already set, DO NOT CHANGE)
JWT_SECRET=<keep the current 256-bit secret from .env>
JWT_EXPIRY=24h

# Razorpay Payment Gateway (REQUIRED - get from Razorpay Dashboard)
RAZORPAY_KEY_ID=rzp_live_XXXXXXXXXXXX
RAZORPAY_KEY_SECRET=XXXXXXXXXXXXXXXXXXXXXXXX

# Firebase Admin SDK (REQUIRED - get from Firebase Console)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account","project_id":"...","private_key":"...","client_email":"..."}

# CORS - Frontend Domain (REQUIRED)
CORS_ORIGINS=https://your-frontend-domain.com,https://www.your-frontend-domain.com

# Email Notifications (RECOMMENDED)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=notifications@sevaq.com
SMTP_PASS=your-email-app-password

# SMS Notifications (OPTIONAL)
TWILIO_ACCOUNT_SID=ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_AUTH_TOKEN=XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
TWILIO_PHONE_NUMBER=+91XXXXXXXXXX

# Firebase Push Notifications (uses same Firebase config above)
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY\n-----END PRIVATE KEY-----"
```

---

## 4. Flutter App Build for Production

### 4.1 Update Configuration First

Before building, edit [`frontend-flutter-house-help-master/lib/config/app_config.dart`](frontend-flutter-house-help-master/lib/config/app_config.dart):

1. Set your production API URL:
```dart
static const String _productionApiBaseUrl =
    'https://api.yourdomain.com/api'; // replace with your actual domain
```

2. Set your Razorpay live key:
```dart
static const String razorpayLiveKey = String.fromEnvironment(
  'RAZORPAY_LIVE_KEY',
  defaultValue: 'rzp_live_XXXXXXXXXXXX', // your live key from Razorpay
);
static const bool isRazorpayTestMode = false; // Changed to FALSE for production
```

### 4.2 Android APK/AAB Build

```bash
cd frontend-flutter-house-help-master

# Build release APK (for direct download/testing)
flutter build apk --release

# OR build App Bundle (for Google Play Store)
flutter build appbundle --release
```

**Note:** The app is now configured to use production settings by default in release mode. Just make sure to:
1. Replace `https://api.yourdomain.com/api` with your actual production API domain
2. Replace `rzp_live_XXXXXXXXXXXX` with your actual Razorpay live key ID

### 4.2 Google Play Store Requirements
| What | Where to Get |
|------|-------------|
| Google Play Developer Account | https://play.google.com/console — $25 one-time fee |
| App signing key | Generated during first upload |
| Privacy Policy URL | Host on your website |
| App screenshots | Take from your app |
| App icon (512x512) | Design or use existing |

### 4.3 Apple App Store Requirements (if iOS)
| What | Where to Get |
|------|-------------|
| Apple Developer Account | https://developer.apple.com — $99/year |
| App Store Connect | https://appstoreconnect.apple.com |
| Provisioning profiles | Xcode → Signing & Capabilities |

---

## 5. Database Migration Before Launch

### 5.1 Clean Up Phantom Bookings
Run this SQL on your database to delete the duplicate bookings created by the old scheduler:

```sql
-- First, check how many phantom bookings exist
SELECT COUNT(*) FROM booking 
WHERE notes LIKE 'Initial booking for subscription%';

-- Delete duplicates, keeping only the first booking per subscription per date
DELETE FROM booking 
WHERE id NOT IN (
    SELECT MIN(id) 
    FROM booking 
    WHERE notes LIKE 'Initial booking for subscription%' 
    GROUP BY notes, date
)
AND notes LIKE 'Initial booking for subscription%';

-- Verify cleanup
SELECT COUNT(*) FROM booking 
WHERE notes LIKE 'Initial booking for subscription%';
```

### 5.2 Reset Test Data
Before going live with real users, you should:
```sql
-- Remove test users (keep only admin)
DELETE FROM "user" WHERE email LIKE '%@example.com' OR email LIKE '%@phone.auth';

-- Remove test bookings
DELETE FROM booking WHERE notes LIKE 'Initial booking%' OR notes LIKE 'Test%';

-- Remove test subscriptions
DELETE FROM subscriptions WHERE "userId" IN (
    SELECT "publicId" FROM "user" WHERE email LIKE '%@example.com'
);
```

---

## 6. Deployment Steps (In Order)

### Step 1: Set Up Production Database
- [ ] Create PostgreSQL database on your chosen provider
- [ ] Note down host, port, username, password, database name
- [ ] Run the schema migration (the app will create tables on first start if `synchronize: true`, but for production use migrations)

### Step 2: Set Up Production Server
- [ ] Provision a server (DigitalOcean, AWS, Railway, etc.)
- [ ] Install Node.js 18+ and npm
- [ ] Clone your repository
- [ ] Copy production `.env` file with all credentials filled in

### Step 3: Configure Firebase
- [ ] Create Firebase project
- [ ] Enable Phone Authentication
- [ ] Download service account JSON
- [ ] Download `google-services.json` for Android
- [ ] Add to `.env` as `FIREBASE_SERVICE_ACCOUNT`

### Step 4: Configure Razorpay
- [ ] Complete Razorpay KYC
- [ ] Generate Live API keys
- [ ] Add to `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### Step 5: Set Up Domain & SSL
- [ ] Purchase domain (e.g., `sevaq.com`)
- [ ] Point `api.sevaq.com` to your server IP (A record)
- [ ] Install Nginx as reverse proxy
- [ ] Install SSL certificate via Certbot/Let's Encrypt

### Step 6: Deploy Backend
```bash
cd flutter-nest-househelp-master
npm install --production
npm run build
npm run start:prod
```

Or with Docker:
```bash
docker-compose up -d
```

### Step 7: Clean Database
- [ ] Run phantom booking cleanup SQL
- [ ] Remove test users and data
- [ ] Seed real service data if needed

### Step 8: Build & Deploy Flutter App
- [ ] Build APK/AAB with production API URL
- [ ] Test on a real device
- [ ] Upload to Google Play Store / Apple App Store

### Step 9: Post-Launch Monitoring
- [ ] Check server logs for errors
- [ ] Monitor database connection pool
- [ ] Verify scheduler runs correctly (every 10 min)
- [ ] Test a real booking flow end-to-end
- [ ] Test OTP login with a real phone number

---

## 7. Quick Reference — All Environment Variables

| Variable | Required | Current Status | Action Needed |
|----------|----------|---------------|---------------|
| `DB_HOST` | ✅ | `localhost` | Change to production DB host |
| `DB_PORT` | ✅ | `5432` | Usually keep as-is |
| `DB_USERNAME` | ✅ | `postgres` | Create dedicated prod user |
| `DB_PASSWORD` | ✅ | `admin` | Set strong password |
| `DB_NAME` | ✅ | `sevaq_db` | Keep or rename |
| `JWT_SECRET` | ✅ | ✅ Set (256-bit) | Already fixed — keep it |
| `JWT_EXPIRY` | ✅ | `24h` | Already set |
| `PORT` | ✅ | `45357` | Change to `3000` for production |
| `NODE_ENV` | ✅ | Not set | Set to `production` |
| `RAZORPAY_KEY_ID` | ✅ | Test key | Replace with live key |
| `RAZORPAY_KEY_SECRET` | ✅ | Test secret | Replace with live secret |
| `FIREBASE_SERVICE_ACCOUNT` | ✅ | Not set | Add Firebase JSON |
| `CORS_ORIGINS` | ✅ | Not set | Set to frontend domain |
| `SMTP_HOST` | 📋 | Not set | Add for email notifications |
| `SMTP_PORT` | 📋 | Not set | Add for email notifications |
| `SMTP_USER` | 📋 | Not set | Add for email notifications |
| `SMTP_PASS` | 📋 | Not set | Add for email notifications |
| `TWILIO_ACCOUNT_SID` | ⭕ | Not set | Optional — for SMS |
| `TWILIO_AUTH_TOKEN` | ⭕ | Not set | Optional — for SMS |
| `TWILIO_PHONE_NUMBER` | ⭕ | Not set | Optional — for SMS |

**Legend:** ✅ = Required, 📋 = Recommended, ⭕ = Optional
