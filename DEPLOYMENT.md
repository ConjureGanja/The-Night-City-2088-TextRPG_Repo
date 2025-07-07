# Deployment Guide for gpt-hq.com

This guide provides step-by-step instructions for deploying the Night City 2088 TextRPG to your website at gpt-hq.com.

## Overview

The Night City 2088 project consists of two main components:
- **Frontend**: React application built with Vite (static files)
- **Backend**: Node.js Express server with SQLite database (optional for freemium features)

## Prerequisites

- A web server with Node.js 16+ support
- Domain access to gpt-hq.com
- SSL certificate for HTTPS
- Google Gemini API key

## Deployment Architecture

```
gpt-hq.com
├── Frontend (Static Files) - Served by web server
└── /api/* - Proxied to Node.js backend (Port 3001)
```

## Step 1: Server Setup

### 1.1 Install Node.js and Dependencies

```bash
# Install Node.js 18+ (recommended)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install other system dependencies
sudo apt-get update
sudo apt-get install -y nginx certbot python3-certbot-nginx git
```

### 1.2 Create Application Directory

```bash
# Create directory for the application
sudo mkdir -p /var/www/gpt-hq.com
sudo chown $USER:$USER /var/www/gpt-hq.com
cd /var/www/gpt-hq.com
```

## Step 2: Deploy the Application

### 2.1 Clone and Build Frontend

```bash
# Clone the repository
git clone https://github.com/ConjureGanja/The-Night-City-2088-TextRPG_Repo.git
cd The-Night-City-2088-TextRPG_Repo

# Install frontend dependencies
npm install

# Build for production
npm run build

# Copy built files to web directory
sudo cp -r dist/* /var/www/gpt-hq.com/html/
```

### 2.2 Setup Backend (Optional - for Freemium Features)

```bash
# Navigate to backend directory
cd backend

# Install backend dependencies
npm install

# Create production environment file
cp .env.example .env.production
```

### 2.3 Configure Environment Variables

Edit `/var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/backend/.env.production`:

```env
# Production Configuration
NODE_ENV=production
PORT=3001

# Your Gemini API Key
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Frontend URL
FRONTEND_URL=https://gpt-hq.com

# Database (SQLite file path)
DATABASE_URL=./nightcity.db

# Optional: Stripe for payments
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Security
JWT_SECRET=your_very_secure_jwt_secret_here
```

## Step 3: Configure Web Server (Nginx)

### 3.1 Create Nginx Configuration

Create `/etc/nginx/sites-available/gpt-hq.com`:

```nginx
server {
    listen 80;
    server_name gpt-hq.com www.gpt-hq.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gpt-hq.com www.gpt-hq.com;
    
    # SSL Configuration (will be configured by certbot)
    ssl_certificate /etc/letsencrypt/live/gpt-hq.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/gpt-hq.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'; frame-ancestors 'self';" always;
    
    # Root directory for static files
    root /var/www/gpt-hq.com/html;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API proxy to backend (optional for freemium features)
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # CORS headers
        add_header Access-Control-Allow-Origin "https://gpt-hq.com" always;
        add_header Access-Control-Allow-Methods "GET, POST, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Authorization, Content-Type" always;
        
        # Handle preflight requests
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://gpt-hq.com";
            add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
            add_header Access-Control-Allow-Headers "Authorization, Content-Type";
            add_header Access-Control-Max-Age 86400;
            add_header Content-Length 0;
            add_header Content-Type text/plain;
            return 204;
        }
    }
    
    # Single Page Application routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Security: Hide sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ ^/(\.env|package\.json|node_modules) {
        deny all;
    }
}
```

### 3.2 Enable Site and Test Configuration

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/gpt-hq.com /etc/nginx/sites-enabled/

# Test nginx configuration
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Step 4: SSL Certificate Setup

```bash
# Obtain SSL certificate with certbot
sudo certbot --nginx -d gpt-hq.com -d www.gpt-hq.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## Step 5: Start Backend Service (If Using Freemium Features)

### 5.1 Create PM2 Ecosystem File

Create `/var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'nightcity-backend',
    cwd: './backend',
    script: 'server.js',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: './backend/.env.production',
    instances: 1,
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 5.2 Start Backend with PM2

```bash
# Create logs directory
mkdir -p /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/logs

# Start the application
cd /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 6: Database Setup (If Using Freemium Features)

The SQLite database will be created automatically when the backend starts. To ensure proper permissions:

```bash
# Ensure backend can write to database directory
cd /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/backend
chmod 755 .
touch nightcity.db
chmod 644 nightcity.db
```

## Step 7: Frontend Configuration for Production

### 7.1 Update Frontend Environment Variables

If you want to use the freemium backend, ensure your built frontend includes the correct API URL. Before building, create `.env.production`:

```env
VITE_API_URL=https://gpt-hq.com/api
```

Then rebuild:

```bash
npm run build
sudo cp -r dist/* /var/www/gpt-hq.com/html/
```

## Step 8: Security Considerations

### 8.1 Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 8.2 Regular Updates

```bash
# Create update script
cat > /home/$USER/update-nightcity.sh << 'EOF'
#!/bin/bash
cd /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo

# Pull latest changes
git pull origin main

# Update frontend
npm install
npm run build
sudo cp -r dist/* /var/www/gpt-hq.com/html/

# Update backend
cd backend
npm install
cd ..

# Restart backend
pm2 restart nightcity-backend

echo "Update completed!"
EOF

chmod +x /home/$USER/update-nightcity.sh
```

## Step 9: Monitoring and Maintenance

### 9.1 Monitor Backend Logs

```bash
# View live logs
pm2 logs nightcity-backend

# Monitor process status
pm2 status

# Restart if needed
pm2 restart nightcity-backend
```

### 9.2 Monitor Nginx Logs

```bash
# Access logs
sudo tail -f /var/log/nginx/access.log

# Error logs
sudo tail -f /var/log/nginx/error.log
```

### 9.3 Database Backup (If Using Freemium Features)

```bash
# Create backup script
cat > /home/$USER/backup-nightcity.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/backend/nightcity.db $BACKUP_DIR/nightcity_$DATE.db

# Keep only last 7 days of backups
find $BACKUP_DIR -name "nightcity_*.db" -mtime +7 -delete

echo "Backup completed: nightcity_$DATE.db"
EOF

chmod +x /home/$USER/backup-nightcity.sh

# Add to crontab for daily backups
(crontab -l 2>/dev/null; echo "0 2 * * * /home/$USER/backup-nightcity.sh") | crontab -
```

## Step 10: Testing the Deployment

### 10.1 Frontend Testing

1. Visit `https://gpt-hq.com`
2. Verify the game loads correctly
3. Test character creation
4. Try sending a message (with your own API key)

### 10.2 Backend Testing (If Deployed)

```bash
# Test health endpoint
curl https://gpt-hq.com/api/health

# Should return: {"status":"OK","service":"Night City 2088 API"}
```

## Troubleshooting

### Common Issues

1. **Frontend not loading**: Check nginx error logs and verify file permissions
2. **API calls failing**: Verify backend is running and nginx proxy configuration
3. **SSL issues**: Ensure certbot renewal is working
4. **Backend crashes**: Check PM2 logs for error details

### Useful Commands

```bash
# Restart all services
sudo systemctl restart nginx
pm2 restart all

# Check service status
sudo systemctl status nginx
pm2 status

# View configuration
sudo nginx -T
pm2 show nightcity-backend
```

## Performance Optimization

### 10.1 Enable HTTP/2 and Gzip

Already configured in the nginx setup above.

### 10.2 CDN Integration (Optional)

Consider using Cloudflare or similar CDN service for better global performance:

1. Point your domain DNS to Cloudflare
2. Configure Cloudflare to proxy traffic
3. Enable caching for static assets
4. Use Cloudflare's SSL/TLS encryption

### 10.3 Database Optimization (If Using Backend)

For high-traffic deployments, consider:

1. Regular database maintenance
2. Implementing connection pooling
3. Adding database indexes for frequently queried data
4. Consider upgrading to PostgreSQL for production

## Scaling Considerations

For high-traffic scenarios:

1. **Load Balancing**: Use multiple backend instances behind a load balancer
2. **Database**: Migrate from SQLite to PostgreSQL or MySQL
3. **Caching**: Implement Redis for session storage and caching
4. **CDN**: Use a CDN for static asset delivery
5. **Monitoring**: Implement comprehensive monitoring with tools like Prometheus/Grafana

## Support

For deployment issues:
1. Check the GitHub repository issues
2. Review nginx and PM2 logs
3. Verify environment variables and API keys
4. Test individual components (frontend vs backend)

---

This deployment guide provides a complete production setup for gpt-hq.com. Adjust configurations based on your specific server setup and requirements.