# Sevaq Assignment Flow - Deployment Guide

## Overview
This document provides comprehensive deployment instructions for the Sevaq assignment flow implementation across different environments.

## Environment Configuration

### 1. Environment Variables

#### Development Environment (.env.development)
```bash
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=sevaq_dev
DATABASE_USERNAME=sevaq_user
DATABASE_PASSWORD=sevaq_password
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=dev_user
DATABASE_PASSWORD=dev_password

# Authentication
JWT_SECRET=your-super-secret-jwt-key-for-development
JWT_EXPIRES_IN=7d

# External Services
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend
FRONTEND_URL=http://localhost:3001

# Monitoring
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

#### Staging Environment (.env.staging)
```bash
# Application
NODE_ENV=staging
PORT=3000

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=staging-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=sevaq_staging
DATABASE_USERNAME=staging_user
DATABASE_PASSWORD=staging_secure_password

# Authentication
JWT_SECRET=staging-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# External Services
RAZORPAY_KEY_ID=staging_razorpay_key_id
RAZORPAY_KEY_SECRET=staging_razorpay_key_secret

# Frontend
FRONTEND_URL=https://staging.sevaq.com

# Monitoring
LOG_LEVEL=info
ENABLE_REQUEST_LOGGING=true
SENTRY_DSN=https://your-sentry-dsn@sentry.io/staging-project-id
```

#### Production Environment (.env.production)
```bash
# Application
NODE_ENV=production
PORT=3000

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=prod-db.example.com
DATABASE_PORT=5432
DATABASE_NAME=sevaq_production
DATABASE_USERNAME=prod_user
DATABASE_PASSWORD=${DB_PASSWORD}  # Use environment variable

# Authentication
JWT_SECRET=${JWT_SECRET}  # Use environment variable
JWT_EXPIRES_IN=7d

# External Services
RAZORPAY_KEY_ID=${RAZORPAY_KEY_ID}  # Use environment variable
RAZORPAY_KEY_SECRET=${RAZORPAY_KEY_SECRET}  # Use environment variable

# Frontend
FRONTEND_URL=https://sevaq.com

# Monitoring
LOG_LEVEL=warn
ENABLE_REQUEST_LOGGING=false
SENTRY_DSN=${SENTRY_DSN}  # Use environment variable
NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}  # Use environment variable
```

### 2. Database Migration Scripts

#### AssignmentState Enum Migration
```sql
-- migration-assignment-state.sql
-- Add AssignmentState enum to existing bookings table

-- Step 1: Add new column for assignment state
ALTER TABLE booking ADD COLUMN assignment_state VARCHAR(50) DEFAULT 'PENDING';

-- Step 2: Add column for assigned worker
ALTER TABLE booking ADD COLUMN assigned_worker_id VARCHAR(255);

-- Step 3: Add column for assignment metadata
ALTER TABLE booking ADD COLUMN assignment_metadata TEXT;

-- Step 4: Add column for assignment timestamp
ALTER TABLE booking ADD COLUMN assignment_timestamp TIMESTAMP;

-- Step 5: Add column for assignment reason
ALTER TABLE booking ADD COLUMN assignment_reason TEXT;

-- Step 6: Add column for reassignment count
ALTER TABLE booking ADD COLUMN reassignment_count INTEGER DEFAULT 0;

-- Step 7: Add column for assignment timeout
ALTER TABLE booking ADD COLUMN assignment_timeout TIMESTAMP;

-- Step 8: Create indexes for performance
CREATE INDEX idx_booking_assignment_state ON booking(assignment_state);
CREATE INDEX idx_booking_assigned_worker ON booking(assigned_worker_id);
CREATE INDEX idx_booking_assignment_timestamp ON booking(assignment_timestamp);

-- Step 9: Update existing bookings to have PENDING state
UPDATE booking SET assignment_state = 'PENDING' WHERE assignment_state IS NULL;
```

#### Worker Service Relationship Migration
```sql
-- migration-worker-services.sql
-- Ensure worker-services many-to-many relationship is properly set up

-- Create junction table if it doesn't exist
CREATE TABLE IF NOT EXISTS worker_services_service (
    worker_id VARCHAR(255) NOT NULL,
    service_id VARCHAR(255) NOT NULL,
    PRIMARY KEY (worker_id, service_id),
    FOREIGN KEY (worker_id) REFERENCES worker(id) ON DELETE CASCADE,
    FOREIGN KEY (service_id) REFERENCES service(id) ON DELETE CASCADE
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_worker_services_worker ON worker_services_service(worker_id);
CREATE INDEX IF NOT EXISTS idx_worker_services_service ON worker_services_service(service_id);
```

### 3. Docker Configuration

#### Backend Dockerfile
```dockerfile
# Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nestjs -u 1001

# Change ownership of the app directory
RUN chown -R nestjs:nodejs /app

# Switch to non-root user
USER nestjs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# Start the application
CMD ["npm", "run", "start:prod"]
```

#### Frontend Dockerfile
```dockerfile
# Frontend Dockerfile
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Serve the application
FROM nginx:alpine
COPY --from=0 /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

#### Docker Compose for Development
```yaml
# docker-compose.yml
version: '3.8'

services:
  # Backend API
  api:
    build:
      context: ./flutter-nest-househelp-master
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - DATABASE_TYPE=postgres
      - DATABASE_HOST=localhost
      - DATABASE_PORT=5432
      - DATABASE_NAME=sevaq_dev
      - DATABASE_USERNAME=sevaq_user
      - DATABASE_PASSWORD=sevaq_password
    volumes:
      - ./flutter-nest-househelp-master:/app
      - /app/node_modules
    depends_on:
      - db
    restart: unless-stopped

  # Frontend
  frontend:
    build:
      context: ./frontend-flutter-house-help-master
      dockerfile: Dockerfile
    ports:
      - "3001:80"
    environment:
      - REACT_APP_API_URL=http://localhost:3000
    volumes:
      - ./frontend-flutter-house-help-master:/app
      - /app/node_modules
    depends_on:
      - api
    restart: unless-stopped

  # Database
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sevaq_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    restart: unless-stopped

  # Redis for caching
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

### 4. CI/CD Pipeline

#### GitHub Actions Workflow
```yaml
# .github/workflows/deploy.yml
name: Deploy Sevaq Assignment Flow

on:
  push:
    branches: [ main, staging ]
  pull_request:
    branches: [ main ]

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd flutter-nest-househelp-master
        npm ci

    - name: Run linting
      run: npm run lint

    - name: Run tests
      run: npm run test
      env:
        NODE_ENV: test
        DATABASE_TYPE: postgres
        DATABASE_HOST: localhost
        DATABASE_PORT: 5432
        DATABASE_NAME: sevaq_test
        DATABASE_USERNAME: sevaq_user
        DATABASE_PASSWORD: sevaq_password

    - name: Run e2e tests
      run: npm run test:e2e
      env:
        NODE_ENV: test
        DATABASE_TYPE: postgres
        DATABASE_HOST: localhost
        DATABASE_PORT: 5432
        DATABASE_NAME: test_db
        DATABASE_USERNAME: postgres
        DATABASE_PASSWORD: postgres

  build-and-push:
    needs: build-and-test
    runs-on: ubuntu-latest
    if: github.event_name == 'push'
    
    permissions:
      contents: read
      packages: write

    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v2

    - name: Log in to Container Registry
      uses: docker/login-action@v2
      with:
        registry: ${{ env.REGISTRY }}
        username: ${{ github.actor }}
        password: ${{ secrets.GITHUB_TOKEN }}

    - name: Extract metadata
      id: meta
      uses: docker/metadata-action@v4
      with:
        images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
        tags: |
          type=ref,event=branch
          type=ref,event=pr
          type=sha,prefix={{branch}}-
          type=raw,value=latest,enable={{is_default_branch}}

    - name: Build and push API image
      uses: docker/build-push-action@v4
      with:
        context: ./flutter-nest-househelp-master
        file: ./flutter-nest-househelp-master/Dockerfile
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
        cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

    - name: Build and push Frontend image
      uses: docker/build-push-action@v4
      with:
        context: ./frontend-flutter-house-help-master
        file: ./frontend-flutter-house-help-master/Dockerfile
        push: true
        tags: ${{ steps.meta.outputs.tags }}
        labels: ${{ steps.meta.outputs.labels }}
        cache-from: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache
        cache-to: type=registry,ref=${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}:buildcache,mode=max

  deploy-staging:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/staging'
    environment: staging

    steps:
    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment"
        # Add your staging deployment commands here
        # This could be kubectl apply, docker-compose up, etc.

  deploy-production:
    needs: build-and-push
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production

    steps:
    - name: Deploy to production
      run: |
        echo "Deploying to production environment"
        # Add your production deployment commands here
```

### 5. Kubernetes Deployment

#### Backend Deployment
```yaml
# k8s/backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sevaq-api
  labels:
    app: sevaq-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: sevaq-api
  template:
    metadata:
      labels:
        app: sevaq-api
    spec:
      containers:
      - name: api
        image: ghcr.io/your-org/sevaq-api:latest
        ports:
        - containerPort: 3000
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_HOST
          valueFrom:
            secretKeyRef:
              name: sevaq-secrets
              key: database-host
        - name: DATABASE_PASSWORD
          valueFrom:
            secretKeyRef:
              name: sevaq-secrets
              key: database-password
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: sevaq-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: sevaq-api-service
spec:
  selector:
    app: sevaq-api
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: ClusterIP
```

#### Frontend Deployment
```yaml
# k8s/frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: sevaq-frontend
  labels:
    app: sevaq-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: sevaq-frontend
  template:
    metadata:
      labels:
        app: sevaq-frontend
    spec:
      containers:
      - name: frontend
        image: ghcr.io/your-org/sevaq-frontend:latest
        ports:
        - containerPort: 80
        env:
        - name: REACT_APP_API_URL
          value: "https://api.sevaq.com"
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: sevaq-frontend-service
spec:
  selector:
    app: sevaq-frontend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

### 6. Monitoring and Logging

#### Prometheus Configuration
```yaml
# monitoring/prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
    
    scrape_configs:
    - job_name: 'sevaq-api'
      static_configs:
      - targets: ['sevaq-api-service:3000']
    
    - job_name: 'sevaq-frontend'
      static_configs:
      - targets: ['sevaq-frontend-service:80']
```

#### Grafana Dashboard
```json
{
  "dashboard": {
    "title": "Sevaq Assignment Flow Monitoring",
    "panels": [
      {
        "title": "API Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      },
      {
        "title": "Assignment Success Rate",
        "type": "stat",
        "targets": [
          {
            "expr": "rate(assignment_requests_total{status=\"success\"}[5m]) / rate(assignment_requests_total[5m]) * 100",
            "legendFormat": "Success Rate"
          }
        ]
      },
      {
        "title": "Database Connection Pool",
        "type": "graph",
        "targets": [
          {
            "expr": "typeorm_connection_pool_size",
            "legendFormat": "Pool Size"
          }
        ]
      }
    ]
  }
}
```

### 7. Rollback Procedures

#### Database Rollback
```bash
# Rollback assignment state changes
psql -h $DB_HOST -U $DB_USER -d $DB_NAME -c "
  ALTER TABLE booking DROP COLUMN IF EXISTS assignment_state;
  ALTER TABLE booking DROP COLUMN IF EXISTS assigned_worker_id;
  ALTER TABLE booking DROP COLUMN IF EXISTS assignment_metadata;
  ALTER TABLE booking DROP COLUMN IF EXISTS assignment_timestamp;
  ALTER TABLE booking DROP COLUMN IF EXISTS assignment_reason;
  ALTER TABLE booking DROP COLUMN IF EXISTS reassignment_count;
  ALTER TABLE booking DROP COLUMN IF EXISTS assignment_timeout;
  
  DROP INDEX IF EXISTS idx_booking_assignment_state;
  DROP INDEX IF EXISTS idx_booking_assigned_worker;
  DROP INDEX IF EXISTS idx_booking_assignment_timestamp;
"
```

#### Application Rollback
```bash
# Kubernetes rollback
kubectl rollout undo deployment/sevaq-api
kubectl rollout undo deployment/sevaq-frontend

# Docker Compose rollback
docker-compose down
git checkout HEAD~1
docker-compose up -d
```

### 8. Troubleshooting Guide

#### Common Issues

1. **Assignment API Timeout**
   - Check database connection pool size
   - Verify worker availability in the service area
   - Monitor memory usage during worker matching

2. **Frontend Polling Issues**
   - Check network connectivity between frontend and backend
   - Verify CORS configuration
   - Monitor browser memory usage

3. **Database Performance**
   - Ensure proper indexing on assignment-related columns
   - Monitor query execution times
   - Consider connection pooling optimization

4. **Authentication Issues**
   - Verify JWT secret consistency across services
   - Check token expiration settings
   - Monitor authentication service health

#### Health Check Endpoints
- Backend: `GET /health`
- Frontend: `GET /`
- Database: Connection test via application logs
- Redis: `GET /api/redis/health`

#### Log Analysis
```bash
# View application logs
kubectl logs -f deployment/sevaq-api
kubectl logs -f deployment/sevaq-frontend

# Filter assignment-related logs
kubectl logs -f deployment/sevaq-api | grep -i assignment

# View error logs
kubectl logs -f deployment/sevaq-api --tail=100 | grep ERROR
```

## Deployment Checklist

### Pre-Deployment
- [ ] Environment variables configured
- [ ] Database migrations tested
- [ ] Docker images built and pushed
- [ ] CI/CD pipeline configured
- [ ] Monitoring setup complete
- [ ] Rollback procedures documented

### During Deployment
- [ ] Deploy to staging first
- [ ] Run smoke tests
- [ ] Monitor application health
- [ ] Verify assignment flow functionality
- [ ] Check performance metrics

### Post-Deployment
- [ ] Monitor for errors
- [ ] Verify assignment success rates
- [ ] Check resource utilization
- [ ] Update documentation
- [ ] Notify stakeholders

### Rollback Triggers
- [ ] Assignment success rate drops below 80%
- [ ] API response time exceeds 1 second (p95)
- [ ] Database connection errors increase
- [ ] Frontend polling failures exceed 5%
- [ ] Critical security vulnerabilities discovered