# BEETRONIC OS - Production Deployment Guide

## Prerequisites

- Ubuntu/Debian Linux server
- Node.js v18+
- PostgreSQL 12+
- Nginx
- Git
- sudo access

## Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git

# Verify installations
node --version
npm --version
psql --version
nginx -v
```

## Step 2: Create Application User

```bash
# Create beetronic user
sudo useradd -m -s /bin/bash beetronic

# Create app directory
sudo mkdir -p /opt/beetronic-os
sudo chown -R beetronic:beetronic /opt/beetronic-os
```

## Step 3: Database Setup

```bash
# Connect to PostgreSQL
sudo -u postgres psql

# Run these commands in PostgreSQL:
CREATE USER beetronic_user WITH PASSWORD 'your_secure_password';
CREATE DATABASE beetronic_os OWNER beetronic_user;
GRANT ALL PRIVILEGES ON DATABASE beetronic_os TO beetronic_user;
\q

# Test connection
psql -U beetronic_user -d beetronic_os -h localhost
```

## Step 4: Deploy Application

```bash
# Clone/upload repository
cd /opt/beetronic-os
sudo -u beetronic git clone <your-repo> .

# Or if uploading files:
# sudo scp -r beetronic-os/* beetronic@your-server:/opt/beetronic-os/

# Install dependencies
sudo -u beetronic npm ci --production

# Copy environment file
sudo cp .env.production /opt/beetronic-os/.env.production
sudo chown beetronic:beetronic /opt/beetronic-os/.env.production
sudo chmod 600 /opt/beetronic-os/.env.production

# Edit with your values
sudo nano /opt/beetronic-os/.env.production
```

## Step 5: Initialize Database Schema

```bash
# Create database tables (copy schema.sql to server first)
sudo -u beetronic psql -U beetronic_user -d beetronic_os -f backend/src/config/schema.sql

# Optional: Add default roles
sudo -u beetronic psql -U beetronic_user -d beetronic_os << EOF
INSERT INTO roles (id, name, description) VALUES 
  ('00000000-0000-0000-0000-000000000001', 'admin', 'Administrator'),
  ('00000000-0000-0000-0000-000000000002', 'user', 'Regular User');
EOF
```

## Step 6: Set Up Systemd Service

```bash
# Copy service file
sudo cp beetronic-os.service /etc/systemd/system/

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable beetronic-os
sudo systemctl start beetronic-os

# Check status
sudo systemctl status beetronic-os

# View logs
sudo journalctl -u beetronic-os -f
```

## Step 7: Configure Nginx

```bash
# Copy and edit Nginx config
sudo cp nginx.conf /etc/nginx/sites-available/beetronic-os
sudo nano /etc/nginx/sites-available/beetronic-os

# Update: server_name, SSL paths, domain
# Line to update: server_name your-domain.com

# Enable site
sudo ln -s /etc/nginx/sites-available/beetronic-os /etc/nginx/sites-enabled/

# Test Nginx config
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 8: Set Up SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Update Nginx SSL paths in /etc/nginx/sites-available/beetronic-os
# Then restart: sudo systemctl restart nginx

# Auto-renewal (certbot handles this automatically)
sudo systemctl enable certbot.timer
```

## Step 9: Firewall Setup

```bash
# Enable UFW firewall
sudo ufw enable

# Allow SSH, HTTP, HTTPS
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verify
sudo ufw status
```

## Step 10: Monitoring & Logs

```bash
# Backend logs
sudo journalctl -u beetronic-os -f

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Application health check
curl https://your-domain.com/health
```

## Maintenance Commands

```bash
# Restart application
sudo systemctl restart beetronic-os

# Check application status
sudo systemctl status beetronic-os

# View recent logs
sudo journalctl -u beetronic-os -n 100

# Database backup
sudo -u postgres pg_dump -U beetronic_user beetronic_os > beetronic_backup.sql

# Database restore
sudo -u postgres psql -U beetronic_user beetronic_os < beetronic_backup.sql

# Update application
cd /opt/beetronic-os && sudo -u beetronic git pull
cd backend && sudo -u beetronic npm ci --production
sudo systemctl restart beetronic-os
```

## Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Generate new JWT secrets in .env.production
- [ ] Configure firewall rules
- [ ] Set up SSL certificates
- [ ] Enable Nginx security headers
- [ ] Disable root login via SSH
- [ ] Configure SSH key-based authentication
- [ ] Set up log rotation
- [ ] Enable PostgreSQL backups
- [ ] Test HTTPS functionality
- [ ] Verify rate limiting
- [ ] Test 2FA functionality

## Troubleshooting

### Application won't start
```bash
sudo journalctl -u beetronic-os -n 50
# Check .env.production for DATABASE_URL format
```

### Database connection refused
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database and user exist
sudo -u postgres psql -l
```

### Nginx proxy errors
```bash
# Check backend is running
sudo systemctl status beetronic-os

# Check port 3000 is listening
sudo netstat -tlnp | grep 3000
```

### SSL certificate issues
```bash
# Renew certificate
sudo certbot renew --force-renewal

# Check certificate status
sudo certbot certificates
```

## Performance Optimization

```bash
# PostgreSQL optimization
# Edit /etc/postgresql/XX/main/postgresql.conf:
shared_buffers = 256MB
effective_cache_size = 1GB
work_mem = 16MB
maintenance_work_mem = 64MB

# Restart PostgreSQL
sudo systemctl restart postgresql

# Monitor with htop
sudo apt install -y htop
htop
```

## Backup Strategy

```bash
# Daily backup script
sudo tee /etc/cron.daily/beetronic-backup << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/beetronic-os/backups
mkdir -p \$BACKUP_DIR
sudo -u postgres pg_dump -U beetronic_user beetronic_os | gzip > \$BACKUP_DIR/db_\$DATE.sql.gz
# Keep only last 30 days
find \$BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
EOF

sudo chmod +x /etc/cron.daily/beetronic-backup
```

---

**Status**: Production Ready ✅
**Version**: 1.0.0
**Last Updated**: 2026-09-05
