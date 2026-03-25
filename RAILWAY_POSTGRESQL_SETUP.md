# How to Add PostgreSQL on Railway

Follow these steps to add a PostgreSQL database to your Railway project:

---

## Step 1: Go to Railway Dashboard

1. Open [railway.app](https://railway.app)
2. Sign in to your account
3. Select your project (SEVAQ)

---

## Step 2: Add PostgreSQL Database

### Method A: Using the "New" Button
1. In your project dashboard, click the **"+"** button (or "New")
2. Select **"Database"** from the dropdown
3. Click **"PostgreSQL"**
4. Wait for it to provision (usually takes 10-30 seconds)

### Method B: From the Plugins Section
1. Go to your project settings
2. Click on **"Plugins"**
3. Find **PostgreSQL** and click **"Add plugin"**

---

## Step 3: Get Database Credentials

After PostgreSQL is provisioned:

1. Click on the PostgreSQL service in your project
2. Go to the **"Variables"** tab
3. You'll see these automatically generated variables:
   - `DATABASE_URL` - Full connection string
   - `POSTGRES_DB` - Database name
   - `POSTGRES_HOST` - Hostname
   - `POSTGRES_PASSWORD` - Password
   - `POSTGRES_PORT` - Port (usually 5432)
   - `POSTGRES_USER` - Username

---

## Step 4: Connect Backend to Database

In your backend service, add these environment variables:

| Variable | Value |
|----------|-------|
| `DB_HOST` | `{{Database.HOST}}` or use `POSTGRES_HOST` |
| `DB_PORT` | `5432` or use `{{Database.PORT}}` |
| `DB_USERNAME` | `{{Database.USERNAME}}` or use `POSTGRES_USER` |
| `DB_PASSWORD` | `{{Database.PASSWORD}}` or use `POSTGRES_PASSWORD` |
| `DB_NAME` | `{{Database.DATABASE}}` or use `POSTGRES_DB` |

> **Tip:** Railway provides template variables like `{{Database.HOST}}` that automatically reference your PostgreSQL service.

---

## Step 5: Verify Connection

1. Redeploy your backend after adding the variables
2. Check the logs for: `"Database connected successfully"` or similar

---

## Common Issues

### "Database connection refused"
- Make sure PostgreSQL is fully provisioned (wait for green status)
- Check that all DB_* variables are correctly set

### "Database does not exist"
- The database might need to be created manually
- Use Railway's database console to create it

---

## Useful Railway Commands

```bash
# Connect to database using Railway CLI
railway db:connect

# Open database console
railway db:open
```
