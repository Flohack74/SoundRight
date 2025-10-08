# SoundRight Deployment Guide - Ubuntu 20.04 with Apache

This guide will help you deploy the SoundRight application on Ubuntu 20.04 using Apache as the web server.

## Prerequisites

- Ubuntu 20.04 server
- Root or sudo access
- Domain name (optional, but recommended)
- SSL certificate (Let's Encrypt recommended)

## Step 1: Server Setup

### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

### Install Node.js and npm
```bash
# Install Node.js 18.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

### Install PM2 (Process Manager)
```bash
sudo npm install -g pm2
```

### Install Apache
```bash
sudo apt install apache2 -y
sudo systemctl enable apache2
sudo systemctl start apache2
```

## Step 2: Application Setup

### Clone and Build Application
```bash
# Navigate to web directory
cd /var/www

# Clone your repository (replace with your actual repo URL)
sudo git clone https://github.com/yourusername/SoundRight.git
sudo chown -R $USER:$USER /var/www/SoundRight
cd SoundRight

# Install dependencies
npm run install-all

# Build frontend
cd frontend
npm run build
cd ..

# Build backend
cd backend
npm run build
cd ..
```

### Create Production Environment
```bash
# Create production environment file
sudo nano /var/www/SoundRight/backend/.env
```

Add the following content:
```env
# Server Configuration
PORT=5000
NODE_ENV=production

# Database Configuration
DB_PATH=/var/www/SoundRight/backend/data/soundright.db

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# File Upload Configuration
UPLOAD_PATH=/var/www/SoundRight/backend/uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Create Required Directories
```bash
sudo mkdir -p /var/www/SoundRight/backend/data
sudo mkdir -p /var/www/SoundRight/backend/uploads
sudo chown -R www-data:www-data /var/www/SoundRight/backend/data
sudo chown -R www-data:www-data /var/www/SoundRight/backend/uploads
```

## Step 3: PM2 Configuration

### Create PM2 Ecosystem File
```bash
sudo nano /var/www/SoundRight/ecosystem.config.js
```

Add the following content:
```javascript
module.exports = {
  apps: [{
    name: 'soundright-backend',
    script: './backend/dist/index.js',
    cwd: '/var/www/SoundRight',
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
```

### Start Application with PM2
```bash
# Create log directory
sudo mkdir -p /var/log/pm2
sudo chown -R $USER:$USER /var/log/pm2

# Start the application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions provided by the command above
```

## Step 4: Apache Configuration

### Enable Required Modules
```bash
sudo a2enmod proxy
sudo a2enmod proxy_http
sudo a2enmod proxy_balancer
sudo a2enmod lbmethod_byrequests
sudo a2enmod rewrite
sudo a2enmod ssl
sudo a2enmod headers
```

### Create Virtual Host Configuration
```bash
sudo nano /etc/apache2/sites-available/soundright.conf
```

Add the following content (replace `yourdomain.com` with your actual domain):
```apache
<VirtualHost *:80>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/SoundRight/frontend/build
    
    # Redirect HTTP to HTTPS
    RewriteEngine On
    RewriteCond %{HTTPS} off
    RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
</VirtualHost>

<VirtualHost *:443>
    ServerName yourdomain.com
    ServerAlias www.yourdomain.com
    DocumentRoot /var/www/SoundRight/frontend/build
    
    # SSL Configuration
    SSLEngine on
    SSLCertificateFile /etc/letsencrypt/live/yourdomain.com/fullchain.pem
    SSLCertificateKeyFile /etc/letsencrypt/live/yourdomain.com/privkey.pem
    
    # Security Headers
    Header always set X-Content-Type-Options nosniff
    Header always set X-Frame-Options DENY
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Strict-Transport-Security "max-age=63072000; includeSubDomains; preload"
    Header always set Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://yourdomain.com;"
    
    # Serve React App
    <Directory "/var/www/SoundRight/frontend/build">
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
    
    # Proxy WebSocket connections (if needed)
    RewriteCond %{HTTP:Upgrade} websocket [NC]
    RewriteCond %{HTTP:Connection} upgrade [NC]
    RewriteRule ^/api/(.*)$ ws://localhost:5000/api/$1 [P,L]
    
    # Logging
    ErrorLog ${APACHE_LOG_DIR}/soundright_error.log
    CustomLog ${APACHE_LOG_DIR}/soundright_access.log combined
</VirtualHost>
```

### Enable Site and Restart Apache
```bash
# Disable default site
sudo a2dissite 000-default

# Enable SoundRight site
sudo a2ensite soundright

# Test Apache configuration
sudo apache2ctl configtest

# Restart Apache
sudo systemctl restart apache2
```

## Step 5: SSL Certificate (Let's Encrypt)

### Install Certbot
```bash
sudo apt install certbot python3-certbot-apache -y
```

### Obtain SSL Certificate
```bash
# Replace yourdomain.com with your actual domain
sudo certbot --apache -d yourdomain.com -d www.yourdomain.com
```

### Auto-renewal Setup
```bash
# Test renewal
sudo certbot renew --dry-run

# The certificate will auto-renew via cron job
```

## Step 6: Firewall Configuration

### Configure UFW
```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 'Apache Full'

# Allow Node.js port (for direct access if needed)
sudo ufw allow 5000

# Check status
sudo ufw status
```

## Step 7: Database Setup

### Initialize Database
```bash
# The database will be created automatically when the backend starts
# But you can verify it exists
ls -la /var/www/SoundRight/backend/data/
```

## Step 8: Monitoring and Maintenance

### PM2 Monitoring
```bash
# Check application status
pm2 status

# View logs
pm2 logs soundright-backend

# Restart application
pm2 restart soundright-backend

# Monitor in real-time
pm2 monit
```

### Apache Logs
```bash
# View Apache error logs
sudo tail -f /var/log/apache2/soundright_error.log

# View Apache access logs
sudo tail -f /var/log/apache2/soundright_access.log
```

### System Monitoring
```bash
# Check system resources
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

## Step 9: Backup Strategy

### Create Backup Script
```bash
sudo nano /var/www/SoundRight/backup.sh
```

Add the following content:
```bash
#!/bin/bash

# Backup script for SoundRight
BACKUP_DIR="/var/backups/soundright"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
cp /var/www/SoundRight/backend/data/soundright.db $BACKUP_DIR/soundright_$DATE.db

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz -C /var/www/SoundRight/backend uploads

# Backup application code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz -C /var/www SoundRight

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.db" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### Make Script Executable and Schedule
```bash
sudo chmod +x /var/www/SoundRight/backup.sh

# Add to crontab for daily backups at 2 AM
sudo crontab -e
# Add this line:
# 0 2 * * * /var/www/SoundRight/backup.sh
```

## Step 10: Performance Optimization

### Enable Apache Compression
```bash
sudo a2enmod deflate
```

Add to your virtual host configuration:
```apache
# Enable compression
<Location />
    SetOutputFilter DEFLATE
    SetEnvIfNoCase Request_URI \
        \.(?:gif|jpe?g|png)$ no-gzip dont-vary
    SetEnvIfNoCase Request_URI \
        \.(?:exe|t?gz|zip|bz2|sit|rar)$ no-gzip dont-vary
</Location>
```

### Enable Browser Caching
Add to your virtual host configuration:
```apache
# Enable browser caching
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 month"
    ExpiresByType image/jpg "access plus 1 month"
    ExpiresByType image/jpeg "access plus 1 month"
    ExpiresByType image/gif "access plus 1 month"
    ExpiresByType image/ico "access plus 1 month"
    ExpiresByType image/icon "access plus 1 month"
    ExpiresByType text/ico "access plus 1 month"
    ExpiresByType application/ico "access plus 1 month"
</IfModule>
```

## Troubleshooting

### Common Issues

1. **Application not starting**
   ```bash
   # Check PM2 logs
   pm2 logs soundright-backend
   
   # Check if port is in use
   sudo netstat -tlnp | grep :5000
   ```

2. **Apache not serving React app**
   ```bash
   # Check Apache error logs
   sudo tail -f /var/log/apache2/soundright_error.log
   
   # Verify file permissions
   ls -la /var/www/SoundRight/frontend/build/
   ```

3. **API requests failing**
   ```bash
   # Check if backend is running
   pm2 status
   
   # Test API directly
   curl http://localhost:5000/api/health
   ```

4. **SSL certificate issues**
   ```bash
   # Check certificate status
   sudo certbot certificates
   
   # Renew certificate manually
   sudo certbot renew
   ```

### Performance Monitoring

```bash
# Monitor system resources
sudo apt install htop
htop

# Monitor Apache performance
sudo apt install apache2-utils
ab -n 1000 -c 10 https://yourdomain.com/

# Monitor PM2
pm2 monit
```

## Security Considerations

1. **Keep system updated**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Regular security audits**
   ```bash
   sudo apt install unattended-upgrades
   sudo dpkg-reconfigure unattended-upgrades
   ```

3. **Monitor logs for suspicious activity**
   ```bash
   sudo tail -f /var/log/apache2/soundright_access.log | grep -E "(404|500|403)"
   ```

4. **Regular backups**
   - The backup script above should be sufficient for most cases
   - Consider off-site backups for critical data

## Conclusion

Your SoundRight application should now be successfully deployed on Ubuntu 20.04 with Apache. The application will be accessible via HTTPS at your domain, with automatic SSL certificate renewal and regular backups.

For additional security and performance, consider:
- Setting up a CDN for static assets
- Implementing database replication
- Adding monitoring tools like Nagios or Zabbix
- Setting up log aggregation with ELK stack
