# Complete Oracle Cloud Deployment Guide for SEVAQ Backend

This is a comprehensive, step-by-step guide to deploy your NestJS backend to Oracle Cloud Infrastructure (OCI). This guide covers everything from account creation to production deployment.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Part 1: Oracle Cloud Account Setup](#part-1-oracle-cloud-account-setup)
3. [Part 2: Database Setup](#part-2-database-setup)
4. [Part 3: Container Apps Deployment](#part-3-container-apps-deployment)
5. [Part 4: VM Deployment (Alternative)](#part-4-vm-deployment-alternative)
6. [Part 5: Docker Image Creation](#part-5-docker-image-creation)
7. [Part 6: Environment Configuration](#part-6-environment-configuration)
8. [Part 7: SSL/HTTPS Setup](#part-7-sslhttps-setup)
9. [Part 8: CI/CD Pipeline](#part-8-cicd-pipeline)
10. [Part 9: Monitoring & Troubleshooting](#part-9-monitoring--troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Oracle Cloud account (free at [cloud.oracle.com](https://cloud.oracle.com))
- [ ] GitHub repository with your code pushed
- [ ] SSH key pair (for VM deployment)
- [ ] Domain name (optional, for HTTPS)

---

## Part 1: Oracle Cloud Account Setup

### Step 1.1: Create Oracle Cloud Account

1. **Navigate to Oracle Cloud**: Open [cloud.oracle.com](https://cloud.oracle.com) in your browser

2. **Click "Sign Up"**: Located in the top-right corner

3. **Fill Registration Form**:
   - Enter your email address
   - Enter your name
   - Select your country
   - Click "Next"

4. **Verify Email**:
   - Check your email inbox for verification code
   - Enter the 6-digit code
   - Click "Verify"

5. **Create Cloud Account**:
   - Enter a unique cloud account name (e.g., `sevaq-backend`)
   - This will be your tenant name
   - Click "Create Cloud Account"

6. **Complete Profile**:
   - Enter your phone number
   - Select "Individual" for account type
   - Accept terms and conditions
   - Click "Complete Registration"

### Step 1.2: Sign In to OCI Console

1. **Access Console**: Go to [cloud.oracle.com](https://cloud.oracle.com)

2. **Enter Credentials**:
   - Cloud Account Name: `sevaq-backend` (or your chosen name)
   - Click "Next"
   - Enter your email and password
   - Click "Sign In"

3. **Multi-Factor Authentication** (if enabled):
   - Set up 2FA using the Oracle Cloud mobile app or SMS

### Step 1.3: Navigate OCI Console

Once logged in, you'll see the OCI Console. Here's what you need to know:

```
┌─────────────────────────────────────────────────────────────┐
│  Oracle Cloud Infrastructure                                │
├─────────────────────────────────────────────────────────────┤
│  [☰ Menu]  [Region: India (Hyderabad)]    [User: ●●●●]    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Dashboard                                                  │
│  └─ Quick Actions                                           │
│  └─ Recent Resources                                        │
│                                                             │
│  Core Services                                              │
│  ├─ Compute                                                 │
│  │   └─ Instances                                           │
│  │   └─ Instance Pools                                      │
│  ├─ Networking                                              │
│  │   └─ Virtual Cloud Networks                              │
│  │   └─ Load Balancers                                      │
│  ├─ Storage                                                 │
│  │   └─ Object Storage                                      │
│  │   └─ Block Volumes                                       │
│  └─ Database                                                │
│      └─ Autonomous Database                                │
│      └─ Oracle Cloud SQL                                    │
│                                                             │
│  Developer Services                                         │
│  ├─ Container Apps                                          │
│  ├─ Container Registry (OCIR)                              │
│  ├─ Kubernetes Cluster (OKE)                               │
│  └─ Functions                                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Step 1.4: Select Compartment

1. Click the **Compartment** dropdown (usually in the left sidebar)
2. Select **root** compartment (or create a new one)
3. All resources will be created in this compartment

### Step 1.5: Generate Auth Token (For Container Registry)

1. **Navigate to Identity > Users**: Click the profile icon → "User Settings"

2. **Click "Auth Tokens"**: Under "Resources" section

3. **Create New Token**:
   - Click "Create Token"
   - Description: `sevaq-docker-access`
   - Click "Create Token"

4. **Copy and Save Token**:
   ```
   Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
   ```
   ⚠️ **Important**: This token is shown only once. Save it securely.

---

## Part 2: Database Setup

You have multiple database options. Choose one:

### Option A: Neon PostgreSQL (Recommended - Free)

Neon offers a generous free tier with PostgreSQL.

#### Step 2A.1: Create Neon Account

1. Go to [neon.tech](https://neon.tech)
2. Click "Sign Up" → "GitHub"
3. Authorize Neon to access your GitHub account

#### Step 2A.2: Create Project

1. Click "New Project"
2. Project Name: `sevaq-backend`
3. Region: Select closest to your users (e.g., `EU (Frankfurt)` or `Asia (Singapore)`)
4. Click "Create Project"

#### Step 2A.3: Get Connection String

1. Once created, click "Connection Details"
2. Select "Pooled" connection
3. Copy the connection string:
   ```
   postgresql://username:password@ep-xyz.eu-central-1.aws.neon.tech/sevaq?sslmode=require
   ```
4. Save these details:
   - Host: `ep-xyz.eu-central-1.aws.neon.tech`
   - Port: `5432`
   - Database: `sevaq`
   - Username: `your-username`
   - Password: `your-password`

### Option B: Supabase (Free Alternative)

1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" → Sign in with GitHub
3. Click "New Project"
4. Enter:
   - Name: `sevaq`
   - Database Password: `your-secure-password`
   - Region: `Asia (Singapore)`
5. Wait for setup (~2 minutes)
6. Go to Settings → Database
7. Copy Connection String:
   ```
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```

### Option C: Oracle Cloud Autonomous Database (Always Free)

#### Step 2C.1: Create Autonomous Database

1. In OCI Console, go to **Oracle Database** → **Autonomous Database**
2. Click **Create Autonomous Database**
3. Configure:
   - **Display Name**: `sevaq-db`
   - **Database Name**: `sevaq`
   - **Workload Type**: **Transaction Processing** (for general workloads)
   - **Deployment Type**: **Shared Infrastructure** (Always Free)
   - **License Type**: **Bring Your Own License (BYOL)**
4. Under **Always Free**:
   - Enable "Always Free" toggle
5. Under **Admin Credentials**:
   - Create admin password (min 12 chars, includes uppercase, lowercase, numbers, symbols)
6. Under **Network Access**:
   - Select "Allow secure access from everywhere"
7. Click **Create Autonomous Database**
8. Wait 5-10 minutes for provisioning

#### Step 2C.2: Get Connection String

1. Once status shows "Available", click the database
2. Click **DB Connection** (blue button)
3. Under **Connection Strings**:
   - Select "TLS" (not mTLS for simplicity)
   - Copy the "Medium" connection string
4. Format will be:
   ```
   (description=(address=(protocol=tcps)(port=1522)(host=adb.region.oraclecloud.com))(connect_data=(service_name=adb_xxx_high)))
   ```

#### Step 2C.3: Configure Network Access

1. Go to **Network** → **Network Security Groups**
2. Click **Create Network Security Group**
3. Name: `sevaq-nsg`
4. Create rules to allow PostgreSQL port 1522

---

## Part 3: Container Apps Deployment

This is the easiest way to deploy your NestJS backend on Oracle Cloud.

### Step 3.1: Create Docker Image

First, create a Dockerfile in your backend directory:

```dockerfile
# flutter-nest-househelp-master/Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY package-lock.json* ./

# Install dependencies
RUN npm ci --legacy-peer-deps

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine AS production

WORKDIR /app

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Copy built artifacts
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./
COPY --from=builder --chown=nodejs:nodejs /app/tsconfig.json ./

# Set environment
ENV NODE_ENV=production
ENV PORT=3000

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Start the application
CMD ["node", "dist/main.js"]
```

### Step 3.2: Build and Push Image to OCIR

#### Step 3.2.1: Install Docker (if not installed)

**On Windows/Mac**: Install Docker Desktop from [docker.com](https://docker.com)

**On Linux (VM)**:
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install -y docker.io
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

#### Step 3.2.2: Login to Oracle Container Registry

```bash
# Login to OCIR (Oracle Cloud Infrastructure Registry)
docker login -u '<tenancy-namespace>/<username>' nova.ocir.io

# Example:
docker login -u 'mycompany/your.email@example.com' nova.ocir.io
# Password: Use the Auth Token you generated in Step 1.5
```

#### Step 3.2.3: Build the Image

```bash
cd flutter-nest-househelp-master

# Build the Docker image
docker build -t nova.ocir.io/<tenancy-namespace>/sevaq-backend:latest .

# Example with full path:
docker build -t nova.ocir.io/axexamplecom/sevaq-backend:latest .
```

#### Step 3.2.4: Tag and Push

```bash
# Tag for Oracle Container Registry
docker tag nova.ocir.io/<tenancy-namespace>/sevaq-backend:latest \
    nova.ocir.io/<tenancy-namespace>/sevaq-backend:v1.0.0

# Push to registry
docker push nova.ocir.io/<tenancy-namespace>/sevaq-backend:latest
docker push nova.ocir.io/<tenancy-namespace>/sevaq-backend:v1.0.0
```

**Note**: Replace `<tenancy-namespace>` with your Oracle Cloud tenancy namespace. Find it at:
- OCI Console → Profile → Tenancy Details → Object Storage Namespace

### Step 3.3: Create Container App

#### Step 3.3.1: Navigate to Container Apps

In OCI Console:
1. Click **Developer Services** → **Container Apps**
2. Ensure correct compartment is selected
3. Click **Create Container App**

#### Step 3.3.2: Basic Information

```
┌─────────────────────────────────────────────────────────────┐
│  Create Container App                                       │
├─────────────────────────────────────────────────────────────┤
│  Name*: [sevaq-backend                                    ] │
│  Compartment: [root                                      ▼] │
│  Description: [NestJS backend for SEVAQ app              ] │
│                                                             │
│  [▼] Show advanced options                                 │
│                                                             │
│  [Cancel                              Create Container App] │
└─────────────────────────────────────────────────────────────┘
```

- **Name**: `sevaq-backend`
- **Compartment**: Select your compartment
- **Description**: Optional

Click **Create Container App** (not "Create Container App with Revisions")

#### Step 3.3.3: Configure First Revision

After creating the app, you'll be redirected to create the first revision:

```
┌─────────────────────────────────────────────────────────────┐
│  Create Revision                                            │
├─────────────────────────────────────────────────────────────┤
│  Container App: sev aq-backend                              │
├─────────────────────────────────────────────────────────────┤
│  Revision name: [rev-001                                   ] │
│                                                             │
│  [▼] Image                                                  │
│  Image source: ● Container Registry                         │
│  Container Registry: [nova.ocir.io                        ▼] │
│  Repository: [axexamplecom/sevaq-backend                  ] │
│  Tag: [latest                                            ▼] │
│                                                             │
│  [▼] Environment Variables                                  │
│  [+ Add Variable]                                           │
│                                                             │
│  [▼] Resources                                              │
│  Memory: [1    ▼] GB                                        │
│  CPU:    [0.5  ▼] vCPU                                      │
│                                                             │
│  [▼] Health Check                                           │
│  Port: [3000                                              ] │
│  Path: [/health                                           ] │
│  Initial delay: [5] seconds                                │
│  Interval:   [10] seconds                                  │
│                                                             │
│  [Cancel                                      Create Revision]│
└─────────────────────────────────────────────────────────────┘
```

**Fill in the details:**

1. **Image Source**:
   - Select "Container Registry"
   - Repository: `<your-tenancy>/sevaq-backend`
   - Tag: `latest`

2. **Environment Variables** (click "+ Add Variable"):
   ```
   DATABASE_HOST=your-db-host.neon.tech
   DATABASE_PORT=5432
   DATABASE_USER=your-username
   DATABASE_PASSWORD=your-password
   DATABASE_NAME=sevaq
   JWT_SECRET=generate-a-secure-random-string-here
   PORT=3000
   NODE_ENV=production
   ```

3. **Resources**:
   - Memory: 1 GB
   - CPU: 0.5 vCPU

4. **Health Check**:
   - Port: 3000
   - Path: /health
   - Initial delay: 5 seconds
   - Interval: 10 seconds

5. Click **Create Revision**

#### Step 3.3.4: Wait for Deployment

1. Status will show "Creating"
2. Wait 2-5 minutes
3. Status changes to "Active"
4. Click on the revision to see details

#### Step 3.3.5: Configure Ingress (HTTP Endpoint)

1. In your Container App, go to **Ingress** tab
2. Click **Configure Ingress**
3. Configure:
   ```
   Type: ● HTTP
   Port: 3000
   Path prefix: /
   ```
4. Click **Save**
5. The endpoint URL will be shown:
   ```
   https://sevaq-backend-[random-id].containerapp.[region].oraclecloud.com
   ```

### Step 3.4: Test Your Deployment

```bash
# Test health endpoint
curl https://your-endpoint.containerapp.region.oraclecloud.com/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-24T..."}
```

---

## Part 4: VM Deployment (Alternative)

If you prefer traditional VM deployment, here's the complete process.

### Step 4.1: Create Compute Instance

#### Step 4.1.1: Navigate to Compute

In OCI Console:
1. Click **Compute** → **Instances**
2. Click **Create Instance**

#### Step 4.1.2: Configure Instance

```
┌─────────────────────────────────────────────────────────────┐
│  Create Instance                                            │
├─────────────────────────────────────────────────────────────┤
│  Name*: [sevaq-backend-vm                                  ] │
│                                                             │
│  [▼] Placement                                              │
│  Availability Domain: [AD 1                              ▼] │
│                                                             │
│  [▼] Image and shape                                        │
│  Image: [Oracle Linux 8                                  ▼] │
│  Shape: [VM.Standard.E2.1.Micro                          ▼] │
│  (Always Free)                                              │
│                                                             │
│  [▼] Networking                                             │
│  Primary VNIC:                                              │
│    Subnet: [Default VCN in ... (Regional)               ▼] │
│    Assign public IP: ☑ Yes                                 │
│    Hostname: [sevaq-backend                               ] │
│                                                             │
│  [▼] Add SSH keys                                           │
│  ☑ Paste public key                                         │
│  SSH Key: [ssh-rsa AAAAB3... your-email@example.com      ] │
│                                                             │
│  [▼] Boot volume                                            │
│  ☑ Specify a custom boot volume size                       │
│  Boot volume size (GB): [50                               ] │
│                                                             │
│  [Create Instance]                                          │
└─────────────────────────────────────────────────────────────┘
```

**Configuration:**
- **Name**: `sevaq-backend-vm`
- **Image**: Oracle Linux 8 (or Ubuntu 22.04)
- **Shape**: VM.Standard.E2.1.Micro (Always Free)
- **Assign Public IP**: Yes (required for SSH)
- **SSH Keys**: Add your public SSH key

#### Step 4.1.3: Note Instance Details

After creation, note these details from the instance page:
- **Public IP Address**: e.g., `129.213.45.67`
- **Private IP**: e.g., `10.0.0.5`

### Step 4.2: Connect to VM

#### Step 4.2.1: Generate SSH Key (if needed)

```bash
# On your local machine
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"

# Save to: ~/.ssh/id_rsa (private key)
# Save to: ~/.ssh/id_rsa.pub (public key)
```

#### Step 4.2.2: Connect via SSH

```bash
# For Oracle Linux
ssh opc@<your-public-ip>

# Example:
ssh opc@129.213.45.67

# If using Ubuntu
ssh ubuntu@<your-public-ip>
```

### Step 4.3: Install Dependencies

#### Step 4.3.1: Update System

```bash
# For Oracle Linux
sudo yum update -y

# For Ubuntu
sudo apt update && sudo apt upgrade -y
```

#### Step 4.3.2: Install Node.js

```bash
# For Oracle Linux
curl -fsSL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install -y nodejs

# For Ubuntu
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x or higher
```

#### Step 4.3.3: Install Git

```bash
# Oracle Linux
sudo yum install -y git

# Ubuntu
sudo apt install -y git
```

#### Step 4.3.4: Install PM2

```bash
sudo npm install -g pm2

# Verify
pm2 --version
```

#### Step 4.3.5: Install Nginx (for reverse proxy)

```bash
# Oracle Linux
sudo yum install -y nginx

# Ubuntu
sudo apt install -y nginx
```

### Step 4.4: Deploy Application

#### Step 4.4.1: Clone Repository

```bash
# Navigate to home directory
cd ~

# Clone your repository
git clone https://github.com/yourusername/SEVAQ.git

# Navigate to backend directory
cd SEVAQ/flutter-nest-househelp-master
```

#### Step 4.4.2: Install Dependencies

```bash
# Install npm dependencies
npm install --legacy-peer-deps
```

#### Step 4.4.3: Build Application

```bash
# Build the NestJS application
npm run build

# Verify build output
ls -la dist/
```

#### Step 4.4.4: Create Environment File

```bash
# Create .env file
cat > .env << 'EOF'
# Database Configuration
DATABASE_HOST=your-db-host.neon.tech
DATABASE_PORT=5432
DATABASE_USER=your-username
DATABASE_PASSWORD=your-password
DATABASE_NAME=sevaq

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-min-32-chars

# Server Configuration
PORT=3000
NODE_ENV=production
EOF

# Verify .env was created
cat .env
```

#### Step 4.4.5: Start Application with PM2

```bash
# Start the application
pm2 start dist/main.js --name sevdaq-backend

# Check status
pm2 status

# View logs
pm2 logs sevdaq-backend

# Save PM2 configuration
pm2 save
```

#### Step 4.4.6: Configure PM2 Startup

```bash
# Generate startup script
pm2 startup

# This will output a command like:
# sudo env PATH=$PATH:/usr/local/bin pm2 startup ... -u opc

# Run the generated command
sudo env PATH=$PATH:/usr/local/bin pm2 startup systemd -u opc --hp /home/opc
```

### Step 4.5: Configure Nginx Reverse Proxy

#### Step 4.5.1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/conf.d/sevaq-backend.conf
```

Add the following:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or public IP

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
```

#### Step 4.5.2: Test and Restart Nginx

```bash
# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx

# Enable Nginx on boot
sudo systemctl enable nginx
```

### Step 4.6: Configure Firewall

```bash
# For Oracle Linux (firewalld)
sudo firewall-cmd --permanent --add-port=80/tcp
sudo firewall-cmd --permanent --add-port=443/tcp
sudo firewall-cmd --permanent --add-port=3000/tcp
sudo firewall-cmd --reload

# For Ubuntu (ufw)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3000/tcp
sudo ufw enable
```

### Step 4.7: Test Deployment

```bash
# Test locally on VM
curl http://localhost:3000/health

# Test via public IP
curl http://your-public-ip/health

# Test via domain (if configured)
curl http://your-domain.com/health
```

---

## Part 5: Environment Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_HOST` | PostgreSQL host | `ep-xyz.eu-central-1.aws.neon.tech` |
| `DATABASE_PORT` | PostgreSQL port | `5432` |
| `DATABASE_USER` | Database username | `your-username` |
| `DATABASE_PASSWORD` | Database password | `your-password` |
| `DATABASE_NAME` | Database name | `sevaq` |
| `JWT_SECRET` | JWT signing secret | `your-secure-random-string` |
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `production` |

### Generating Secure JWT Secret

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Using OpenSSL
openssl rand -hex 32
```

---

## Part 6: SSL/HTTPS Setup

### Option A: Let's Encrypt (Free - Recommended)

#### Step 6A.1: Install Certbot

```bash
# Oracle Linux
sudo yum install -y certbot python3-certbot-nginx

# Ubuntu
sudo apt install -y certbot python3-certbot-nginx
```

#### Step 6A.2: Obtain SSL Certificate

```bash
# With domain
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Without domain (self-signed)
sudo certbot certonly --standalone -d your-domain.com
```

#### Step 6A.3: Auto-renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
sudo crontab -e

# Add this line (runs twice daily)
0 0,12 * * * certbot renew --quiet
```

### Option B: Oracle Load Balancer (Built-in SSL)

1. Go to **Networking** → **Load Balancers**
2. Click **Create Load Balancer**
3. Configure:
   - Type: **Application**
   - Shape: **100Mbps**
4. Add backend: Your Container App or VM
5. Add SSL certificate in listener configuration

---

## Part 7: CI/CD Pipeline

### GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Oracle Cloud

on:
  push:
    branches:
      - main
      - SEVAQNEW

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v2
      
      - name: Login to OCIR
        uses: docker/login-action@v2
        with:
          registry: nova.ocir.io
          username: ${{ secrets.OCIR_USERNAME }}
          password: ${{ secrets.OCIR_PASSWORD }}
      
      - name: Build and push image
        uses: docker/build-push-action@v4
        with:
          context: ./flutter-nest-househelp-master
          push: true
          tags: |
            nova.ocir.io/${{ secrets.OCIR_NAMESPACE }}/sevaq-backend:latest
            nova.ocir.io/${{ secrets.OCIR_NAMESPACE }}/sevaq-backend:${{ github.sha }}
      
      - name: Deploy to Oracle Container Apps
        run: |
          # Update container app with new image
          oci container-apps container-app revision create \
            --container-app-id ${{ secrets.CONTAINER_APP_OCID }} \
            --image-uri nova.ocir.io/${{ secrets.OCIR_NAMESPACE }}/sevaq-backend:latest \
            --environment-variables "DATABASE_HOST=${{ secrets.DATABASE_HOST }},DATABASE_PORT=5432,DATABASE_USER=${{ secrets.DATABASE_USER }},DATABASE_PASSWORD=${{ secrets.DATABASE_PASSWORD }},DATABASE_NAME=${{ secrets.DATABASE_NAME }},JWT_SECRET=${{ secrets.JWT_SECRET }},PORT=3000,NODE_ENV=production"
```

### Add GitHub Secrets

In your GitHub repository:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add these secrets:
   - `OCIR_USERNAME`: `<tenancy-namespace>/<username>`
   - `OCIR_PASSWORD`: Your auth token
   - `OCIR_NAMESPACE`: Your tenancy namespace
   - `CONTAINER_APP_OCID`: Found in OCI Console
   - `DATABASE_HOST`: Your database host
   - `DATABASE_USER`: Your database user
   - `DATABASE_PASSWORD`: Your database password
   - `DATABASE_NAME`: `sevaq`
   - `JWT_SECRET`: Your JWT secret

---

## Part 8: Monitoring & Troubleshooting

### View Container App Logs

1. In OCI Console, go to your Container App
2. Click **Logs** tab
3. Select "Application logs"
4. Use filters to narrow down logs

### View VM Logs

```bash
# PM2 logs
pm2 logs sevdaq-backend

# System logs
sudo journalctl -u pm2-sevdaq-backend -f

# Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Common Issues and Solutions

#### Issue 1: Container App Fails to Start

**Symptoms**: Revision shows "Failed" status

**Solution**:
1. Check logs for error messages
2. Verify environment variables are correct
3. Ensure database connection string is valid
4. Check image was pushed successfully

#### Issue 2: Database Connection Error

**Symptoms**: `ECONNREFUSED` or `Authentication failed`

**Solution**:
1. Verify DATABASE_HOST is correct
2. Check DATABASE_USER and DATABASE_PASSWORD
3. Ensure database allows external connections
4. Check firewall rules

#### Issue 3: Out of Memory

**Symptoms**: Container killed, OOM errors

**Solution**:
1. Increase memory in Container App settings
2. Optimize application memory usage
3. Check for memory leaks in code

#### Issue 4: Health Check Failing

**Symptoms**: Health check returns 404 or timeout

**Solution**:
1. Verify /health endpoint exists in your app
2. Check health check path in Container App settings
3. Ensure application starts within initial delay period

### Monitoring Commands

```bash
# On VM - Check system resources
free -h           # Memory usage
df -h             # Disk usage
top               # Process monitor
htop              # Enhanced process monitor (if installed)

# On VM - Network connections
netstat -tlnp     # Listening ports
ss -tlnp          # Socket statistics

# On VM - Application performance
pm2 monit         # Real-time monitoring
pm2 list          # Process list
```

---

## Quick Reference Commands

### Docker Commands

```bash
# Build image
docker build -t nova.ocir.io/<namespace>/sevaq-backend:latest .

# Login to registry
docker login -u '<namespace>/<username>' nova.ocir.io

# Push image
docker push nova.ocir.io/<namespace>/sevaq-backend:latest

# Pull and test locally
docker pull nova.ocir.io/<namespace>/sevaq-backend:latest
docker run -p 3000:3000 -e DATABASE_HOST=... nova.ocir.io/<namespace>/sevaq-backend:latest
```

### PM2 Commands

```bash
# Start application
pm2 start dist/main.js --name sevdaq-backend

# Stop application
pm2 stop sevdaq-backend

# Restart application
pm2 restart sevdaq-backend

# View logs
pm2 logs sevdaq-backend

# Monitor
pm2 monit

# Save configuration
pm2 save

# Startup script
pm2 startup
```

### OCI CLI Commands (Optional)

```bash
# Install OCI CLI
bash -c "$(curl -L https://raw.githubusercontent.com/oracle/oci-cli/master/scripts/install/install.sh)"

# Configure OCI CLI
oci setup config

# List container apps
oci container-apps container-app list --compartment-id $COMPARTMENT_ID

# Get container app details
oci container-apps container-app get --container-app-id $APP_OCID
```

---

## Summary

You now have a complete deployment setup for your SEVAQ backend on Oracle Cloud!

### What's Next?

1. ✅ Set up Oracle Cloud account
2. ✅ Configure database (Neon/Supabase recommended)
3. ✅ Deploy using Container Apps (easiest) or VM (full control)
4. ✅ Configure SSL/HTTPS
5. ✅ Set up CI/CD (optional)
6. ✅ Monitor and maintain

### Need Help?

If you encounter any issues, check:
1. Container App logs in OCI Console
2. PM2 logs on VM
3. Database connection settings
4. Network/firewall rules

---

**Document Version**: 1.0  
**Last Updated**: March 2026  
**Author**: SEVAQ Development Team
