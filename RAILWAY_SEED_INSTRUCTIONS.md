# How to Run Seeds on Railway

After your deployment is complete, follow these steps to run the database seed command:

---

## Option 1: Using Railway CLI (Recommended)

### Step 1: Install Railway CLI
```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway
```bash
railway login
```
Follow the browser authentication.

### Step 3: Link to Your Project
```bash
railway link
```
Select your project from the list.

### Step 4: Run the Seed Command
```bash
railway run npm run seed
```

---

## Option 2: Using Railway Dashboard

### Step 1: Go to Your Railway Dashboard
- Navigate to your deployed service

### Step 2: Open Terminal
- Click on the **"Terminal"** tab in your service

### Step 3: Run Seed
```bash
npm run seed
```

---

## Option 3: Using npx (Without Installing CLI)

```bash
npx -y @railway/cli run npm run seed
```

---

## What the Seed Command Does

The `npm run seed` command runs [`src/database/seed.ts`](flutter-nest-househelp-master/src/database/seed.ts) which:
- Creates test services (House Help, Cook, Driver, etc.)
- Creates worker users with availability slots
- Sets up initial locations (Greater Noida and nearby areas)

---

## Troubleshooting

### "Database not found" Error
- Make sure PostgreSQL is added to your Railway project
- Verify all `DB_*` environment variables are set

### "JWT_SECRET not found" Error
- Add `JWT_SECRET` to your environment variables

### Seed Already Ran
- Running seed multiple times is generally safe (it creates new records)
- Use the [database console](https://docs.railway.app/databases/postgresql#connecting-to-your-database) to check existing data
