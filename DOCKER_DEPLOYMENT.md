# Docker Deployment Guide for gpt-hq.com

This guide provides instructions for deploying Night City 2088 using Docker containers.

## Prerequisites

- Docker and Docker Compose installed
- Domain pointing to your server (gpt-hq.com)
- Google Gemini API key

## Quick Start

### 1. Clone and Setup

```bash
git clone https://github.com/ConjureGanja/The-Night-City-2088-TextRPG_Repo.git
cd The-Night-City-2088-TextRPG_Repo
```

### 2. Configure Environment

Create `.env.production` file:

```env
# Production Configuration
NODE_ENV=production
PORT=3001

# Your Gemini API Key (REQUIRED)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Frontend URL
FRONTEND_URL=https://gpt-hq.com

# Database
DATABASE_URL=/app/data/nightcity.db

# Security
JWT_SECRET=your_very_secure_jwt_secret_here

# Optional: Stripe for payments
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
```

### 3. Build and Start

```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Check status
docker-compose ps
```

### 4. SSL Certificate (Production)

For production with SSL, you can use Let's Encrypt with a reverse proxy:

```bash
# Stop the containers
docker-compose down

# Use a production docker-compose with Certbot
cp docker-compose.yml docker-compose.prod.yml
```

Edit `docker-compose.prod.yml` to include Certbot:

```yaml
version: '3.8'

services:
  nightcity-app:
    build: .
    container_name: nightcity-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=3001
      - FRONTEND_URL=https://gpt-hq.com
      - DATABASE_URL=/app/data/nightcity.db
    env_file:
      - .env.production
    expose:
      - "3001"
    volumes:
      - nightcity-data:/app/data
      - nightcity-logs:/app/logs
    networks:
      - nightcity-network

  nginx:
    image: nginx:alpine
    container_name: nightcity-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.prod.conf:/etc/nginx/nginx.conf:ro
      - ./dist:/usr/share/nginx/html:ro
      - certbot-certs:/etc/letsencrypt:ro
      - certbot-www:/var/www/certbot:ro
    depends_on:
      - nightcity-app
    networks:
      - nightcity-network

  certbot:
    image: certbot/certbot:latest
    container_name: nightcity-certbot
    volumes:
      - certbot-certs:/etc/letsencrypt
      - certbot-www:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email your-email@example.com --agree-tos --no-eff-email -d gpt-hq.com -d www.gpt-hq.com

volumes:
  nightcity-data:
  nightcity-logs:
  certbot-certs:
  certbot-www:

networks:
  nightcity-network:
    driver: bridge
```

### 5. Management Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs nightcity-app
docker-compose logs nginx

# Update application
git pull origin main
docker-compose build
docker-compose up -d

# Backup database
docker exec nightcity-backend cp /app/data/nightcity.db /app/data/nightcity-backup-$(date +%Y%m%d).db

# Scale backend (if needed)
docker-compose up -d --scale nightcity-app=2
```

## Production Considerations

### Health Monitoring

The containers include health checks. Monitor with:

```bash
# Check container health
docker ps
docker inspect nightcity-backend | grep Health -A 10

# View detailed health status
docker-compose ps
```

### Resource Limits

Add resource limits to `docker-compose.yml`:

```yaml
services:
  nightcity-app:
    # ... other config
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: '0.5'
        reservations:
          memory: 256M
          cpus: '0.25'
```

### Persistence

Important data to persist:
- `nightcity-data`: SQLite database
- `nightcity-logs`: Application logs
- `certbot-certs`: SSL certificates

### Monitoring with Prometheus (Optional)

Add monitoring stack:

```yaml
  prometheus:
    image: prom/prometheus:latest
    container_name: nightcity-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml

  grafana:
    image: grafana/grafana:latest
    container_name: nightcity-grafana
    ports:
      - "3000:3000"
    volumes:
      - grafana-data:/var/lib/grafana
```

## Troubleshooting

### Common Issues

1. **Container won't start**: Check logs with `docker-compose logs [service-name]`
2. **API not accessible**: Verify nginx proxy configuration
3. **Database issues**: Check volume permissions and disk space
4. **SSL problems**: Verify domain DNS and Certbot configuration

### Useful Commands

```bash
# Enter container shell
docker exec -it nightcity-backend sh

# Check container resources
docker stats

# View container configuration
docker inspect nightcity-backend

# Restart specific service
docker-compose restart nightcity-app

# Force rebuild
docker-compose build --no-cache
```

### Performance Tuning

For high-traffic deployments:

```yaml
services:
  nightcity-app:
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
```

## Cleanup

To completely remove the deployment:

```bash
# Stop and remove containers
docker-compose down

# Remove volumes (WARNING: This deletes all data)
docker-compose down -v

# Remove images
docker rmi $(docker images "nightcity*" -q)
```

## Advanced Configuration

### Custom Build Args

```dockerfile
# In Dockerfile
ARG NODE_ENV=production
ARG API_VERSION=v1

# Build with custom args
docker build --build-arg NODE_ENV=staging .
```

### Multi-stage Production Build

The included Dockerfile uses multi-stage builds for optimization:
- Smaller final image size
- Security (no build tools in production)
- Faster deployments

## Support

For Docker-specific issues:
1. Check container logs: `docker-compose logs`
2. Verify network connectivity: `docker network ls`
3. Check resource usage: `docker stats`
4. Validate configuration: `docker-compose config`