# How to Set SYNCHRONIZE=true in Railway (Step by Step)

## Method 1: Via Railway Dashboard (Easiest)

### Step 1: Go to Railway Dashboard
1. Open [railway.app](https://railway.app) and sign in
2. Find your project that contains your NestJS backend

### Step 2: Add the Variable
1. Click on your backend service (the one that runs your NestJS app)
2. Go to the **"Variables"** tab
3. Click **"+ Add Variable"**
4. In the key field, type: `SYNCHRONIZE`
5. In the value field, type: `true`
6. Click **"Add"**

### Step 3: Redeploy
1. Go to the **"Deployments"** tab
2. Click the **"Redeploy"** button (or redeploy from the menu)

---

## Method 2: Via Railway CLI

If you have the Railway CLI installed:

```bash
# Login (if not already logged in)
railway login

# Link to your project
railway link

# Set the SYNCHRONIZE variable
railway variables set SYNCHRONIZE=true

# Redeploy
railway redeploy
```

---

## After Redeploying

### Step 4: Run Seed Command

Once the redeploy is complete (wait for it to show "Ready"), run:

```bash
# Via Railway CLI
railway run npm run seed

# Or via npx (if CLI not linked)
npx -y @railway/cli run npm run seed
```

---

## Verify It Worked

Check your logs. You should see:
- ✅ Tables being created (`CREATE TABLE` statements)
- ✅ Seed data being inserted (`INSERT INTO` statements)
- ✅ No more "relation does not exist" errors

---

## Important Notes

- **Keep SYNCHRONIZE=true** for development
- **For production**, you can keep it as `true` (easiest) or set up proper migrations
- The tables will only be created ONCE on first deploy with `SYNCHRONIZE=true`
- Subsequent deploys won't recreate existing tables
