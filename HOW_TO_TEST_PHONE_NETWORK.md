# How to Test the API URL on Your Phone

## The Problem

Your phone cannot resolve the hostname `sevaq-production.up.railway.app`. This is a DNS issue specific to your mobile network.

## How to Test

### Step 1: Open Your Phone's Browser

1. Unlock your phone
2. Open Chrome (or any web browser)
3. Type this URL in the address bar:

```
https://sevaq-production.up.railway.app/api/health
```

### Step 2: What to Expect

**If it works, you should see:**
```json
{"status":"ok","info":{"database":{"status":"up"},...}}
```

**If it shows "Site cannot be reached" or DNS error**, the issue is with your phone's DNS resolution.

---

## Solutions

### Option 1: Wait and Retry (Simplest)

Sometimes mobile networks have temporary DNS issues. Wait 5-10 minutes and try again.

### Option 2: Switch WiFi/Mobile Data

- If on WiFi, try switching to mobile data
- If on mobile data, try switching to WiFi
- This forces your phone to use different DNS servers

### Option 3: Use Custom Domain (Best Long-term Fix)

Set up a custom domain that points to your Railway app. This solves DNS issues permanently.

### Option 4: Use IP Address (Quick Fix)

Instead of the domain name, you could configure the app to use the direct Railway IP (not recommended as IPs can change).

---

## If the URL Works in Browser But App Still Fails

If the browser test works but the app still shows network errors, the issue might be:

1. **App network permissions** - Check that your app has INTERNET permission
2. **Certificate issues** - The app might not trust Railway's SSL certificate
3. **HTTP vs HTTPS** - Make sure the URL uses HTTPS

---

## Test These URLs in Your Phone Browser

| Endpoint | URL |
|----------|-----|
| Health Check | `https://sevaq-production.up.railway.app/api/health` |
| All Services | `https://sevaq-production.up.railway.app/api/services` |
| All Workers | `https://sevaq-production.up.railway.app/api/workers` |

If these all load in your browser, the network is working and we can look at other issues.
