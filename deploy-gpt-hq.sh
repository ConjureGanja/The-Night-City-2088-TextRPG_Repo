#!/bin/bash

# Night City 2088 - gpt-hq.com Deployment Script
# This script automates the deployment process for gpt-hq.com

set -e  # Exit on any error

echo "🌃 Night City 2088 - Deployment Script for gpt-hq.com"
echo "================================================="

# Configuration
DOMAIN="gpt-hq.com"
APP_DIR="/var/www/gpt-hq.com"
REPO_URL="https://github.com/ConjureGanja/The-Night-City-2088-TextRPG_Repo.git"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_requirements() {
    log_info "Checking system requirements..."
    
    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        log_error "Please don't run this script as root. Use a regular user with sudo privileges."
        exit 1
    fi
    
    # Check for required commands
    commands=("node" "npm" "nginx" "git" "sudo")
    for cmd in "${commands[@]}"; do
        if ! command -v $cmd &> /dev/null; then
            log_error "$cmd is required but not installed. Please install it first."
            exit 1
        fi
    done
    
    # Check Node.js version
    node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$node_version" -lt 16 ]; then
        log_error "Node.js 16+ is required. Current version: $(node -v)"
        exit 1
    fi
    
    log_success "All requirements met!"
}

setup_directories() {
    log_info "Setting up directories..."
    
    sudo mkdir -p $APP_DIR/html
    sudo chown $USER:$USER $APP_DIR
    mkdir -p $APP_DIR/logs
    
    log_success "Directories created!"
}

clone_and_build() {
    log_info "Cloning repository and building application..."
    
    cd $APP_DIR
    
    # Clone if not exists, otherwise pull latest
    if [ ! -d "The-Night-City-2088-TextRPG_Repo" ]; then
        git clone $REPO_URL
    else
        cd The-Night-City-2088-TextRPG_Repo
        git pull origin main
        cd ..
    fi
    
    cd The-Night-City-2088-TextRPG_Repo
    
    # Install and build frontend
    log_info "Installing frontend dependencies..."
    npm install
    
    log_info "Building frontend for production..."
    npm run build
    
    # Copy built files
    sudo cp -r dist/* $APP_DIR/html/
    
    log_success "Frontend built and deployed!"
}

setup_backend() {
    log_info "Setting up backend..."
    
    cd $APP_DIR/The-Night-City-2088-TextRPG_Repo/backend
    
    # Install backend dependencies
    npm install
    
    # Create environment file if not exists
    if [ ! -f ".env.production" ]; then
        log_warning "Creating .env.production file. You'll need to edit it with your API keys!"
        cat > .env.production << EOF
# Production Configuration
NODE_ENV=production
PORT=3001

# Your Gemini API Key (REQUIRED - Replace with your actual key)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Frontend URL
FRONTEND_URL=https://$DOMAIN

# Database (SQLite file path)
DATABASE_URL=./nightcity.db

# Security (Generate a secure random string)
JWT_SECRET=$(openssl rand -base64 32)

# Optional: Stripe for payments
# STRIPE_SECRET_KEY=your_stripe_secret_key
# STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
EOF
        log_warning "⚠️  IMPORTANT: Edit $APP_DIR/The-Night-City-2088-TextRPG_Repo/backend/.env.production with your actual API keys!"
    fi
    
    # Create PM2 ecosystem file
    cd $APP_DIR/The-Night-City-2088-TextRPG_Repo
    cat > ecosystem.config.js << EOF
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
    time: true,
    watch: false,
    autorestart: true
  }]
};
EOF
    
    log_success "Backend setup complete!"
}

setup_nginx() {
    log_info "Setting up Nginx configuration..."
    
    # Create nginx config
    sudo tee /etc/nginx/sites-available/$DOMAIN > /dev/null << 'EOF'
server {
    listen 80;
    server_name gpt-hq.com www.gpt-hq.com;
    
    # Redirect HTTP to HTTPS (after SSL is setup)
    # return 301 https://$server_name$request_uri;
    
    # Temporary setup for initial testing
    root /var/www/gpt-hq.com/html;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Static files with caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # API proxy to backend
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
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
    
    # Test nginx config
    sudo nginx -t
    
    # Reload nginx
    sudo systemctl reload nginx
    
    log_success "Nginx configured!"
}

setup_pm2() {
    log_info "Setting up PM2 for backend process management..."
    
    # Install PM2 if not installed
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2..."
        sudo npm install -g pm2
    fi
    
    cd $APP_DIR/The-Night-City-2088-TextRPG_Repo
    
    # Start the application
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup (this will show a command to run)
    log_info "Setting up PM2 startup script..."
    pm2 startup | grep "sudo env" | bash
    
    log_success "PM2 configured!"
}

create_maintenance_scripts() {
    log_info "Creating maintenance scripts..."
    
    # Update script
    cat > /home/$USER/update-nightcity.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Updating Night City 2088..."

cd /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo

# Pull latest changes
git pull origin main

# Update frontend
echo "📦 Building frontend..."
npm install
npm run build
sudo cp -r dist/* /var/www/gpt-hq.com/html/

# Update backend
echo "🔧 Updating backend..."
cd backend
npm install
cd ..

# Restart backend
echo "🔄 Restarting backend..."
pm2 restart nightcity-backend

echo "✅ Update completed!"
EOF
    
    # Backup script
    cat > /home/$USER/backup-nightcity.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
if [ -f "/var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/backend/nightcity.db" ]; then
    cp /var/www/gpt-hq.com/The-Night-City-2088-TextRPG_Repo/backend/nightcity.db $BACKUP_DIR/nightcity_$DATE.db
    echo "✅ Database backup created: nightcity_$DATE.db"
else
    echo "ℹ️  No database file found to backup"
fi

# Keep only last 7 days of backups
find $BACKUP_DIR -name "nightcity_*.db" -mtime +7 -delete 2>/dev/null || true

echo "🗂️  Backup completed!"
EOF
    
    chmod +x /home/$USER/update-nightcity.sh
    chmod +x /home/$USER/backup-nightcity.sh
    
    log_success "Maintenance scripts created!"
}

final_instructions() {
    log_success "🎉 Deployment completed!"
    echo ""
    echo "Next steps:"
    echo "1. 🔑 Edit the API key in: $APP_DIR/The-Night-City-2088-TextRPG_Repo/backend/.env.production"
    echo "2. 🔒 Setup SSL certificate: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
    echo "3. 🔄 After SSL, uncomment HTTPS redirect in /etc/nginx/sites-available/$DOMAIN"
    echo "4. 🧪 Test your deployment: http://$DOMAIN"
    echo ""
    echo "Useful commands:"
    echo "- View backend logs: pm2 logs nightcity-backend"
    echo "- Restart backend: pm2 restart nightcity-backend"
    echo "- Update application: /home/$USER/update-nightcity.sh"
    echo "- Backup database: /home/$USER/backup-nightcity.sh"
    echo ""
    echo "🌃 Welcome to Night City 2088!"
}

# Main execution
main() {
    check_requirements
    setup_directories
    clone_and_build
    setup_backend
    setup_nginx
    setup_pm2
    create_maintenance_scripts
    final_instructions
}

# Run main function
main "$@"