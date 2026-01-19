# Sevaq Deployment Guide

This guide provides instructions for deploying Sevaq in production environments.

## Architecture Overview

Sevaq uses a microservices architecture with the following components:

- **Frontend**: Flutter Web application (Docker container)
- **Backend**: NestJS API server (Docker container)
- **Database**: PostgreSQL with TypeORM
- **Cache**: Redis for session storage and caching
- **Load Balancer**: Nginx (optional)

## Prerequisites

- Docker and Docker Compose
- SSL certificates (for production)
- Environment variables configured

## Quick Start

### 1. Environment Configuration

Copy the example environment file and configure your settings:

```bash
cp .env.example .env
```

Required environment variables:

```bash
# Backend
NODE_ENV=production
DATABASE_URL=postgresql://user:password@postgres:5432/sevaq
JWT_SECRET=your-super-secret-jwt-key
REDIS_URL=redis://redis:6379

# Frontend
FLUTTER_WEB_CANVASKIT_URL=/flutter/canvaskit/

# SSL (optional)
SSL_CERT_PATH=/path/to/your/cert.pem
SSL_KEY_PATH=/path/to/your/key.pem
```

### 2. Build and Deploy

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# Check service health
docker-compose ps
```

### 3. Production Deployment

For production, ensure:

- SSL certificates are configured
- Database backups are scheduled
- Monitoring is set up
- Environment variables are secure

## Service Details

### Frontend Service

- **Port**: 8080 (mapped to 80 in container)
- **Health Check**: `/health`
- **Build Process**: Multi-stage Docker build with Flutter Web

### Backend Service

- **Port**: 3000
- **Health Check**: `/health`
- **Database**: PostgreSQL with migrations
- **Cache**: Redis for sessions and caching

### Database Service

- **Port**: 5432
- **Health Check**: PostgreSQL ready check
- **Data Persistence**: Docker volume `postgres_data`

### Redis Service

- **Port**: 6379
- **Health Check**: Redis ping
- **Data Persistence**: Docker volume `redis_data`

## Monitoring and Maintenance

### Health Checks

All services include health checks:

```bash
# Check frontend health
curl http://localhost:8080/health

# Check backend health
curl http://localhost:3000/health

# Check database health
docker-compose exec postgres pg_isready -U postgres
```

### Logs

```bash
# View all service logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Database Management

```bash
# Access PostgreSQL
docker-compose exec postgres psql -U postgres -d sevaq

# Run migrations
docker-compose exec backend npm run typeorm:migration:run

# Backup database
docker-compose exec postgres pg_dump -U postgres sevaq > backup.sql
```

## SSL Configuration

For HTTPS in production:

1. Place SSL certificates in `deployment/ssl/`
2. Update `docker-compose.yml` with certificate paths
3. Configure Nginx proxy settings

## Scaling

### Horizontal Scaling

To scale services:

```bash
# Scale backend to 3 instances
docker-compose up -d --scale backend=3

# Scale frontend to 2 instances
docker-compose up -d --scale frontend=2
```

### Load Balancing

The Nginx service provides load balancing. Configure upstream servers in `nginx-proxy.conf`.

## Security

### Best Practices

1. **Environment Variables**: Use Docker secrets or external secret management
2. **SSL/TLS**: Always use HTTPS in production
3. **Database Security**: Use strong passwords and limit network access
4. **Container Security**: Keep base images updated
5. **Monitoring**: Set up alerts for security events

### Firewall Configuration

Ensure only necessary ports are exposed:

- Port 80 (HTTP redirect to HTTPS)
- Port 443 (HTTPS)
- Port 22 (SSH for administration)

## Troubleshooting

### Common Issues

1. **Database Connection**: Check `DATABASE_URL` and network connectivity
2. **SSL Errors**: Verify certificate paths and permissions
3. **Health Check Failures**: Check service logs for specific errors
4. **Performance Issues**: Monitor resource usage and scale accordingly

### Debug Commands

```bash
# Check container status
docker-compose ps

# View container resource usage
docker stats

# Check network connectivity
docker-compose exec backend ping postgres

# Test API endpoints
curl http://localhost:3000/api/health
```

## Backup and Recovery

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres sevaq > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U postgres -d sevaq < backup.sql
```

### Application Backup

```bash
# Backup application data
docker save frontend backend | gzip > sevaq-app-backup.tar.gz

# Restore application
docker load < sevaq-app-backup.tar.gz
```

## Performance Optimization

### Frontend Optimization

- Enable gzip compression (configured)
- Use CDN for static assets
- Optimize image sizes
- Implement caching strategies

### Backend Optimization

- Use connection pooling
- Implement query optimization
- Enable Redis caching
- Monitor API response times

### Database Optimization

- Create appropriate indexes
- Monitor slow queries
- Use connection pooling
- Regular maintenance tasks

## Support

For deployment issues or questions:

1. Check the logs: `docker-compose logs -f`
2. Verify health checks: `curl http://localhost:3000/health`
3. Review configuration files
4. Check system resources

This deployment setup provides a production-ready, scalable infrastructure for Sevaq with proper monitoring, security, and maintenance procedures.