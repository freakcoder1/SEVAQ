# 502 Bad Gateway - Port Binding Fix

## Problem Identified
The backend was returning **502 Bad Gateway** due to a **port mismatch** between the environment configuration and the Docker deployment setup.

## Root Cause
- Backend `.env` file specified `PORT=45357`
- Docker `docker-compose.yml` mapped host port `3000` → container port `3000`
- Dockerfile exposed port `3000`
- Backend [`main.ts`](flutter-nest-househelp-master/src/main.ts:225) used the PORT env var (45357) or default 45357
- Result: Backend listened on 45357, but Docker forwarded only port 3000 → **502 Bad Gateway**

## Files Fixed

### 1. Backend Environment Configuration
**File:** `flutter-nest-househelp-master/.env`
- Changed: `PORT=45357` → `PORT=3000`
- Now matches Docker compose mapping and Dockerfile EXPOSE directive

### 2. Frontend Flutter App Configuration
**File:** `frontend-flutter-house-help-master/lib/config/app_config.dart`
- Changed: `defaultValue: 45357` → `defaultValue: 3000`
- Updated comment to reflect correct port
- Ensures Flutter app connects to correct backend port in debug mode

### 3. Worker Flutter App Configuration
**File:** `worker_app_flutter/lib/config/app_config.dart`
- Changed: `defaultValue: 45357` → `defaultValue: 3000`
- Updated comment to reflect correct port
- Ensures worker app connects to correct backend port in debug mode

## Verification
- No remaining references to port 45357 in any source files
- All configuration now consistent: **Port 3000** throughout the stack
- Backend will now bind to `0.0.0.0:3000` as expected by Docker

## Next Steps to Apply Fix

1. **Stop any running backend instances**
2. **Restart the backend** with the updated `.env`:
   ```bash
   cd flutter-nest-househelp-master
   # If using Docker:
   docker-compose down
   docker-compose up --build
   
   # Or if running directly:
   npm run start:prod
   ```
3. **Verify backend is listening on port 3000:**
   ```bash
   curl http://localhost:3000/api/health
   ```
4. **Restart Flutter apps** (if running in debug mode) to pick up the new port configuration

## Expected Result
- Backend will successfully bind to port 3000
- Docker port mapping will work correctly
- 502 Bad Gateway error will be resolved
- API requests will succeed through the reverse proxy
