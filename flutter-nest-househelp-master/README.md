# 🚀 SEVAQ House Help Backend API

[![NestJS](https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![TypeORM](https://img.shields.io/badge/TypeORM-262627?style=for-the-badge&logo=typeorm&logoColor=white)](https://typeorm.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io/)

A comprehensive backend API for the SEVAQ house help platform, built with NestJS and TypeORM. This system provides a trust-first infrastructure for connecting customers with verified professional service providers.

## 📋 Table of Contents

- [Features](#-features)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Environment Configuration](#-environment-configuration)
- [API Documentation](#-api-documentation)
- [Database Setup](#-database-setup)
- [Deployment](#-deployment)
- [Testing](#-testing)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication with role-based access control
- Admin panel with protected endpoints
- Secure user registration and login
- Password hashing and validation

### 👥 User Management
- User profiles with role-based permissions
- Admin user management capabilities
- Profile updates and preferences

### 🏠 Service Management
- Dynamic service catalog (cleaning, cooking, etc.)
- Service pricing and availability management
- Category-based service organization
- Admin-controlled service creation and updates

### 👷 Worker Management
- Professional worker profiles with ratings and reviews
- Location-based worker search and matching
- Availability and scheduling management
- Worker verification and trust metrics

### 📅 Booking & Assignment System
- Intelligent worker assignment algorithm
- Real-time availability checking
- Automated slot management
- Booking status tracking and notifications

### 💳 Payment Integration
- Razorpay payment gateway integration
- Secure payment processing
- Transaction tracking and history

### ⭐ Review System
- Customer reviews and ratings
- Worker reputation management
- Review moderation and analytics

### 📊 Admin Panel
- System monitoring and health checks
- User and worker management
- Service and booking oversight
- Analytics and reporting

### 🏙️ Location Services
- City and location management
- Geolocation-based service matching
- Address validation and geocoding

## 🛠 Prerequisites

- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+
- **PostgreSQL**: v13+
- **Redis**: v7+ (optional, for caching)

## 🚀 Quick Start

1. **Clone and Install**:
   ```bash
   git clone <repository-url>
   cd flutter-nest-househelp-master
   npm install
   ```

2. **Environment Setup**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup**:
    ```bash
    # Create PostgreSQL database
    createdb sevaq_db
    npm run migration:run
    ```

4. **Seed Data** (Optional):
   ```bash
   node create-workers-sql.js
   node run-worker-seed.js
   ```

5. **Start Development Server**:
   ```bash
   npm run start:dev
   ```

The API will be available at `http://localhost:3000`

## ⚙️ Environment Configuration

Create a `.env` file in the root directory:

```env
# Application
NODE_ENV=development
PORT=3000

# Database
DATABASE_TYPE=postgres
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_NAME=sevaq_db
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
DATABASE_SSL=false

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# External Services
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret

# Frontend
FRONTEND_URL=http://localhost:3001

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

## 📚 API Documentation

### Authentication Endpoints

#### POST `/auth/signup`
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "customer"
  }
}
```

#### POST `/auth/login`
Authenticate user and return JWT token.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

### Service Endpoints

#### GET `/services`
Retrieve available services.

**Response:**
```json
[
  {
    "id": "cleaning",
    "name": "Home Cleaning",
    "description": "Professional home cleaning services",
    "basePrice": 500,
    "category": "cleaning",
    "isActive": true
  }
]
```

#### POST `/services` (Admin Only)
Create a new service.

### Worker Endpoints

#### GET `/workers/search`
Search for available workers by location.

**Query Parameters:**
- `lat`: Latitude
- `lng`: Longitude
- `radius`: Search radius in km (default: 15)
- `serviceId`: Filter by service

**Example:**
```
GET /workers/search?lat=28.6139&lng=77.2090&radius=20&serviceId=cleaning
```

#### GET `/workers/:id`
Get detailed worker information.

### Booking Endpoints

#### POST `/bookings`
Create a new service booking.

**Request Body:**
```json
{
  "userId": "user-uuid",
  "serviceId": "cleaning",
  "date": "2024-01-15",
  "timeWindow": "morning",
  "priceSnapshot": 500,
  "location": {
    "lat": 28.6139,
    "lng": 77.2090,
    "address": "Connaught Place, New Delhi"
  }
}
```

#### GET `/assignments/:bookingId`
Get assignment status for a booking.

### Admin Endpoints

#### GET `/admin/users` (Admin Only)
List all users with pagination.

#### GET `/system/health`
System health check.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "redis": "connected"
}
```

### Payment Endpoints

#### POST `/payments/create-order`
Create a Razorpay payment order.

#### POST `/payments/verify`
Verify payment completion.

## 🗄️ Database Setup

### PostgreSQL Setup

1. **Install PostgreSQL**:
   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql postgresql-contrib

   # macOS
   brew install postgresql
   ```

2. **Create Database**:
   ```sql
   CREATE DATABASE sevaq_db;
   CREATE USER sevaq_user WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE sevaq_db TO sevaq_user;
   ```

3. **Run Migrations**:
    ```bash
    npm run migration:run
    ```

## 🚢 Deployment

### Docker Deployment

1. **Build Image**:
   ```bash
   docker build -t sevaq-backend .
   ```

2. **Run Container**:
   ```bash
   docker run -d \
     --name sevaq-api \
     -p 3000:3000 \
     --env-file .env \
     sevaq-backend
   ```

### Docker Compose

```yaml
version: '3.8'
services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    env_file:
      - .env
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: sevaq_db
      POSTGRES_USER: sevaq_user
      POSTGRES_PASSWORD: your_password
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Cloud Platforms

#### Heroku
```bash
heroku create sevaq-backend
heroku config:set NODE_ENV=production
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Set environment variables
3. Deploy automatically

#### Render
1. Create Web Service
2. Connect repository
3. Configure build and start commands

## 🧪 Testing

### Unit Tests
```bash
npm run test
```

### E2E Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running and credentials are correct.

#### JWT Token Issues
```
Error: Invalid signature
```
**Solution**: Check JWT_SECRET environment variable consistency.

#### Worker Assignment Failures
```
"No professional available"
```
**Solution**:
- Verify worker data exists: `SELECT COUNT(*) FROM worker WHERE is_active = 1;`
- Check slot availability: `SELECT COUNT(*) FROM slot WHERE is_booked = 0;`
- Ensure worker-service relationships are set up

#### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
**Solution**: Kill process using port 3000 or change PORT in .env

### Health Checks

- **API Health**: `GET /health`
- **Database**: Check logs for connection errors
- **Redis**: Verify cache operations

### Logs

View application logs:
```bash
# Development
npm run start:dev

# Production (with PM2)
pm2 logs sevaq-api
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit changes: `git commit -am 'Add your feature'`
4. Push to branch: `git push origin feature/your-feature`
5. Submit a pull request

### Development Guidelines

- Follow NestJS best practices
- Write tests for new features
- Update documentation for API changes
- Use conventional commits

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the troubleshooting section above

---

**Recent Updates:**
- ✅ Admin panel validation and security
- ✅ Authentication system fixes (loop prevention)
- ✅ Assignment system improvements
- ✅ Payment integration with Razorpay
- ✅ Review and rating system
- ✅ Location-based services
- ✅ System monitoring and health checks
