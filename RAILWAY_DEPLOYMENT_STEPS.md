# Railway Deployment Step-by-Step Guide

Your NestJS backend is already configured for Railway deployment. Here's what you need to do:

---

## Step 1: Push Code to GitHub

Make sure your latest code is pushed to GitHub:

```bash
cd flutter-nest-househelp-master
git add .
git commit -m "Configure for Railway deployment"
git push origin SEVAQNEW
```

---

## Step 2: Connect Railway to GitHub

1. Go to [railway.app](https://railway.app) and sign in
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your repository (e.g., `your-username/your-repo`)
5. Select the `SEVAQNEW` branch

---

## Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"New"** → **"Database"** → **"PostgreSQL"**
2. Wait for the database to be provisioned
3. Click on the PostgreSQL service to see connection details

---

## Step 4: Configure Environment Variables

In your Railway project, go to the **Variables** tab of your backend service and add these variables:

### Required Database Variables
| Variable | Value | Notes |
|----------|-------|-------|
| `DB_HOST` | `{{Database.HOST}}` | Use Railway variable |
| `DB_PORT` | `{{Database.PORT}}` | Usually 5432 |
| `DB_USERNAME` | `{{Database.USERNAME}}` | |
| `DB_PASSWORD` | `{{Database.PASSWORD}}` | |
| `DB_NAME` | `{{Database.DATABASE}}` | |

### Required App Variables
| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | production | |
| `PORT` | 3000 | Railway will override this |
| `JWT_SECRET` | Generate a strong random string | Use a secure 32+ character string |
| `JWT_EXPIRY` | 24h | Token expiration time |

### Optional Variables
| Variable | Value | Notes |
|----------|-------|-------|
| `CORS_ORIGINS` | `https://your-app.up.railway.app` | Your Railway URL |
| `LOG_LEVEL` | info | For production logging |

---

## Step 5: Deploy

1. Click **"Deploy"** on your Railway dashboard
2. Watch the build logs - it should use the Dockerfile and complete in ~3-5 minutes
3. Once deployed, you'll see a URL like `https://your-app.up.railway.app`

---

## Step 6: Run Database Seeding (One Time)

After deployment, connect to your Railway app via Railway CLI to run seeds:

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Link to your project
railway link

# Run the seed command
railway run npm run seed
```

---

## Step 7: Update Frontend API URL

After deployment, update your Flutter frontend to point to the Railway URL:

1. Open `frontend-flutter-house-help-master/lib/core/api_config.dart`
2. Change the base URL:
   ```dart
   static const String baseUrl = 'https://your-app.up.railway.app';
   ```

---

## Troubleshooting

### Build Timeout
If the build times out, make sure:
- ✅ `railway.json` has `"builder": "DOCKERFILE"`
- ✅ `package.json` build script is `"build": "npm run build:ts"` (not recursive)

### Database Connection Error
- Verify all DATABASE_* environment variables are set
- Make sure PostgreSQL service is running
- Check that DATABASE_NAME matches the provisioned database

### 502 Bad Gateway
- Check that the PORT variable is set to 3000
- Ensure the Dockerfile exposes port 3000

---

## Files Already Configured

| File | Status |
|------|--------|
| `railway.json` | ✅ Configured to use Dockerfile |
| `Dockerfile` | ✅ Multi-stage build configured |
| `package.json` | ✅ Build script fixed |
