# How to Check Firebase/Google Cloud FCM API Settings

## Step 1: Access Google Cloud Console

1. Go to: **https://console.cloud.google.com/**
2. Sign in with your Google account
3. Select your project: **sevaq-6fcc4** (from firebase_options.dart)

## Step 2: Check FCM API is Enabled

1. In the Cloud Console, navigate to:
   ```
   APIs & Services → Library
   ```

2. Search for: **Firebase Cloud Messaging API**

3. Click on it and verify:
   - If it shows **"API Enabled"** ✅
   - If it shows **"Enable"** button → Click to enable it

## Step 3: Verify Firebase Project Settings

1. Go to: **https://console.firebase.google.com/**
2. Select project: **sevaq-6fcc4**

3. Navigate to:
   ```
   Project Settings → Service Accounts
   ```

4. Verify:
   - **Firebase Admin SDK** should be configured
   - Click **"Generate new private key"** if needed
   - The private key JSON should be in your backend `.env` file

## Step 4: Check App ID Configuration

1. In Firebase Console, go to:
   ```
   Project Settings → General
   ```

2. Under **Your apps**, verify:
   - Android app: `com.sevaq.worker_app_flutter` exists
   - App ID: `1:787166049871:android:b2ef7882056f0f2cc81c3a`

## Step 5: Enable FCM in Firebase Console

1. Go to:
   ```
   Engage → Messaging
   ```

2. If prompted, enable FCM by creating your first campaign

## Quick Checklist

| Item | Where to Check | Status |
|------|----------------|--------|
| FCM API Enabled | Cloud Console → APIs | ☐ |
| Service Account | Firebase Console → Project Settings → Service Accounts | ☐ |
| Android App Config | Firebase Console → Project Settings → Your apps | ☐ |
| Cloud Messaging Permissions | Firebase Console → Messaging | ☐ |

## Common Issues

### If FCM not working:

1. **Check API Key restrictions:**
   - Go to: **APIs & Services → Credentials**
   - Select your API key
   - Ensure no improper key restrictions

2. **Check project ID matches:**
   - Your backend `.env` should have: `FIREBASE_PROJECT_ID=sevaq-6fcc4`
   - Your worker app uses: `projectId: 'sevaq-6fcc4'`

3. **Verify sender ID:**
   - Should be: `787166049871` (from messagingSenderId in firebase_options.dart)

## Files to Check

Worker app: [`worker_app_flutter/lib/firebase_options.dart`](worker_app_flutter/lib/firebase_options.dart)

Backend: [`flutter-nest-househelp-master/.env`](flutter-nest-househelp-master/.env)
