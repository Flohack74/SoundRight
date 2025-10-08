#!/bin/bash

# SoundRight Deployment Script for Ubuntu 20.04
# This script automates the deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN=""
EMAIL=""
APP_DIR="/var/www/SoundRight"
BACKUP_DIR="/var/backups/soundright"

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "This script must be run as root (use sudo)"
        exit 1
    fi
}

get_user_input() {
    read -p "Enter your domain name (e.g., example.com): " DOMAIN
    read -p "Enter your email for SSL certificate: " EMAIL
    
    if [[ -z "$DOMAIN" || -z "$EMAIL" ]]; then
        print_error "Domain and email are required"
        exit 1
    fi
}

update_system() {
    print_status "Updating system packages..."
    apt update && apt upgrade -y
    print_success "System updated"
}

install_nodejs() {
    print_status "Installing Node.js 22..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installed: $(node --version)"
}

install_pm2() {
    print_status "Installing PM2..."
    npm install -g pm2
    print_success "PM2 installed"
}

install_apache() {
    print_status "Installing Apache..."
    apt install apache2 -y
    systemctl enable apache2
    systemctl start apache2
    print_success "Apache installed and started"
}

install_certbot() {
    print_status "Installing Certbot..."
    apt install certbot python3-certbot-apache -y
    print_success "Certbot installed"
}

setup_firewall() {
    print_status "Configuring firewall..."
    ufw --force enable
    ufw allow ssh
    ufw allow 'Apache Full'
    ufw allow 5000
    print_success "Firewall configured"
}

clone_application() {
    print_status "Setting up application directory..."
    
    if [[ -d "$APP_DIR" ]]; then
        print_warning "Application directory already exists. Creating backup..."
        cp -r "$APP_DIR" "${APP_DIR}.backup.$(date +%Y%m%d_%H%M%S)"
    fi
    
    # Create directory structure
    mkdir -p "$APP_DIR"
    cd "$APP_DIR"
    
    # If this is a git repository, pull latest changes
    if [[ -d ".git" ]]; then
        git pull origin main
    else
        print_warning "Not a git repository. Please ensure your application files are in $APP_DIR"
    fi
    
    print_success "Application directory setup complete"
}

install_dependencies() {
    print_status "Installing application dependencies..."
    cd "$APP_DIR"
    
    # Install root dependencies
    npm install
    
    # Install backend dependencies
    cd backend
    npm install
    npm run build
    
    # Install frontend dependencies
    cd ../frontend
    npm install
    npm run build
    
    cd "$APP_DIR"
    print_success "Dependencies installed and application built"
}

create_environment() {
    print_status "Creating production environment file..."
    
    # Generate a secure JWT secret
    JWT_SECRET=$(openssl rand -base64 32)
    
    cat > "$APP_DIR/backend/.env" << EOF
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_PATH=$APP_DIR/backend/data/soundright.db

# JWT Configuration
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=$APP_DIR/backend/uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=https://$DOMAIN

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
EOF
    
    print_success "Environment file created"
}

create_directories() {
    print_status "Creating required directories..."
    mkdir -p "$APP_DIR/backend/data"
    mkdir -p "$APP_DIR/backend/uploads"
    mkdir -p "$BACKUP_DIR"
    mkdir -p /var/log/pm2
    
    # Set proper permissions
    chown -R www-data:www-data "$APP_DIR/backend/data"
    chown -R www-data:www-data "$APP_DIR/backend/uploads"
    chown -R www-data:www-data "$APP_DIR/frontend/build"
    
    print_success "Directories created with proper permissions"
}

create_pm2_config() {
    print_status "Creating PM2 configuration..."
    
    cat > "$APP_DIR/ecosystem.config.js" << EOF
module.exports = {
  apps: [{
    name: 'soundright-backend',
    script: './backend/dist/index.js',
    cwd: '$APP_DIR',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: '/var/log/pm2/soundright-error.log',
    out_file: '/var/log/pm2/soundright-out.log',
    log_file: '/var/log/pm2/soundright-combined.log',
    time: true
  }]
};
EOF
    
    print_success "PM2 configuration created"
}

start_application() {
    print_status "Starting application with PM2..."
    cd "$APP_DIR"
    pm2 start ecosystem.config.js
    pm2 save
    pm2 startup
    print_success "Application started with PM2"
}

configure_apache() {
    print_status "Configuring Apache..."
    
    # Enable required modules
    a2enmod proxy
    a2enmod proxy_http
    a2enmod proxy_balancer
    a2enmod lbmethod_byrequests
    a2enmod rewrite
    a2enmod ssl
    a2enmod headers
    a2enmod deflate
    a2enmod expires
    
    # Disable default site
    a2dissite 000-default
    
    # Create virtual host configuration
    cat > /etc/apache2/sites-available/soundright.conf << EOF
<VirtualHost *:80>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot $APP_DIR/frontend/build
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName $DOMAIN
    ServerAlias www.$DOMAIN
    DocumentRoot $APP_DIR/frontend/build
    
    # SSL Configuration (will be updated by Certbot)
    SSLEngine on
    
    # Security Headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    
    # Serve React App
    <Directory "$APP_DIR/frontend/build">
        Options -Indexes
        AllowOverride All
        Require all granted
        
        # Handle React Router
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
    
    # Proxy API requests to Node.js backend
    ProxyPreserveHost On
    ProxyPass /api/ http://localhost:5000/api/
    ProxyPassReverse /api/ http://localhost:5000/api/
    
    # Enable compression
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI \.(?:gif|jpe?g|png)$ no-gzip dont-vary
        SetEnvIfNoCase Request_URI \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
    </Location>
    
    # Enable browser caching
    <IfModule mod_expires.c>
        ExpiresActive On
        ExpiresByType text/css "access plus 1 month"
        ExpiresByType application/javascript "access plus 1 month"
        ExpiresByType image/png "access plus 1 month"
        ExpiresByType image/jpg "access plus 1 month"
        ExpiresByType image/jpeg "access plus 1 month"
        ExpiresByType image/gif "access plus 1 month"
    </IfModule>
    
    # Logging
    ErrorLog \${APACHE_LOG_DIR}/soundright_error.log
    CustomLog \${APACHE_LOG_DIR}/soundright_access.log combined
</VirtualHost>
EOF
    
    # Enable site
    a2ensite soundright
    
    # Test configuration
    apache2ctl configtest
    
    # Restart Apache
    systemctl restart apache2
    
    print_success "Apache configured"
}

setup_ssl() {
    print_status "Setting up SSL certificate..."
    certbot --apache -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL"
    print_success "SSL certificate installed"
}

create_backup_script() {
    print_status "Creating backup script..."
    
    cat > "$APP_DIR/backup.sh" << 'EOF'
#!/bin/bash

# Backup script for SoundRight
BACKUP_DIR="/var/backups/soundright"
DATE=$(date +%Y%m%d_%H%M%S)
APP_DIR="/var/www/SoundRight"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
if [[ -f "$APP_DIR/backend/data/soundright.db" ]]; then
    cp "$APP_DIR/backend/data/soundright.db" "$BACKUP_DIR/soundright_$DATE.db"
fi

# Backup uploads
if [[ -d "$APP_DIR/backend/uploads" ]]; then
    tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C "$APP_DIR/backend" uploads
fi

# Backup application code
tar -czf "$BACKUP_DIR/code_$DATE.tar.gz" -C /var/www SoundRight

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x "$APP_DIR/backup.sh"
    
    # Add to crontab
    (crontab -l 2>/dev/null; echo "0 2 * * * $APP_DIR/backup.sh") | crontab -
    
    print_success "Backup script created and scheduled"
}

final_checks() {
    print_status "Performing final checks..."
    
    # Check if PM2 is running
    if pm2 list | grep -q "soundright-backend"; then
        print_success "PM2 application is running"
    else
        print_error "PM2 application is not running"
    fi
    
    # Check if Apache is running
    if systemctl is-active --quiet apache2; then
        print_success "Apache is running"
    else
        print_error "Apache is not running"
    fi
    
    # Check if SSL certificate is valid
    if certbot certificates | grep -q "$DOMAIN"; then
        print_success "SSL certificate is installed"
    else
        print_warning "SSL certificate might not be installed properly"
    fi
    
    # Test API endpoint
    if curl -s http://localhost:5000/api/health > /dev/null; then
        print_success "API is responding"
    else
        print_warning "API might not be responding"
    fi
}

show_completion_message() {
    print_success "Deployment completed successfully!"
    echo
    echo "Your SoundRight application is now available at:"
    echo "  https://$DOMAIN"
    echo
    echo "Useful commands:"
    echo "  pm2 status                    - Check application status"
    echo "  pm2 logs soundright-backend  - View application logs"
    echo "  pm2 restart soundright-backend - Restart application"
    echo "  sudo systemctl status apache2 - Check Apache status"
    echo "  sudo tail -f /var/log/apache2/soundright_error.log - View Apache errors"
    echo
    echo "Backup location: $BACKUP_DIR"
    echo "Application directory: $APP_DIR"
    echo
    print_warning "Remember to:"
    echo "  1. Create your first admin user account"
    echo "  2. Configure your DNS to point to this server"
    echo "  3. Set up monitoring and alerting"
    echo "  4. Review security settings"
}

# Main deployment process
main() {
    print_status "Starting SoundRight deployment on Ubuntu 20.04"
    echo
    
    check_root
    get_user_input
    
    print_status "Beginning deployment process..."
    echo
    
    update_system
    install_nodejs
    install_pm2
    install_apache
    install_certbot
    setup_firewall
    clone_application
    install_dependencies
    create_environment
    create_directories
    create_pm2_config
    start_application
    configure_apache
    setup_ssl
    create_backup_script
    final_checks
    show_completion_message
}

# Run main function
main "$@"
