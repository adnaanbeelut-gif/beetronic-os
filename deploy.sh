#!/bin/bash

# BEETRONIC OS - Production Deployment Script
# Run this on your server as root: sudo bash deploy.sh

set -e

echo "🚀 BEETRONIC OS Production Deployment"
echo "======================================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo -e "${RED}This script must be run as root (use: sudo bash deploy.sh)${NC}"
   exit 1
fi

# Configuration
APP_DIR="/opt/beetronic-os"
APP_USER="beetronic"
DB_NAME="beetronic_os"
DB_USER="beetronic_user"
DOMAIN="${1:-your-domain.com}"

echo -e "${YELLOW}Configuration:${NC}"
echo "App Directory: $APP_DIR"
echo "App User: $APP_USER"
echo "Database: $DB_NAME"
echo "Domain: $DOMAIN"
echo ""

# Step 1: System updates
echo -e "${YELLOW}[1/8] Updating system packages...${NC}"
apt update && apt upgrade -y > /dev/null 2>&1
echo -e "${GREEN}✓ System updated${NC}"

# Step 2: Install dependencies
echo -e "${YELLOW}[2/8] Installing dependencies...${NC}"
apt install -y nodejs postgresql postgresql-contrib nginx git curl > /dev/null 2>&1
echo -e "${GREEN}✓ Dependencies installed${NC}"

# Step 3: Create application user
echo -e "${YELLOW}[3/8] Creating application user...${NC}"
if ! id "$APP_USER" &>/dev/null; then
    useradd -m -s /bin/bash $APP_USER
    echo -e "${GREEN}✓ User '$APP_USER' created${NC}"
else
    echo -e "${GREEN}✓ User '$APP_USER' already exists${NC}"
fi

# Step 4: Create app directory
echo -e "${YELLOW}[4/8] Setting up application directory...${NC}"
mkdir -p $APP_DIR
chown -R $APP_USER:$APP_USER $APP_DIR
echo -e "${GREEN}✓ Application directory ready${NC}"

# Step 5: Database setup
echo -e "${YELLOW}[5/8] Setting up PostgreSQL database...${NC}"
read -sp "Enter PostgreSQL password for $DB_USER: " DB_PASS
echo ""

sudo -u postgres psql << EOF > /dev/null 2>&1
DROP USER IF EXISTS $DB_USER;
DROP DATABASE IF EXISTS $DB_NAME;
CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';
CREATE DATABASE $DB_NAME OWNER $DB_USER;
GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;
EOF

echo -e "${GREEN}✓ Database created${NC}"

# Step 6: Copy environment file
echo -e "${YELLOW}[6/8] Configuring environment...${NC}"
if [ -f "$APP_DIR/.env.production" ]; then
    echo -e "${YELLOW}⚠ .env.production already exists, skipping...${NC}"
else
    cat > $APP_DIR/.env.production << EOF
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
REFRESH_TOKEN_EXPIRY=7d
TOTP_WINDOW=2
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
FRONTEND_URL=https://$DOMAIN
LOG_LEVEL=info
EOF
    chown $APP_USER:$APP_USER $APP_DIR/.env.production
    chmod 600 $APP_DIR/.env.production
    echo -e "${GREEN}✓ Environment configured${NC}"
fi

# Step 7: Setup Systemd service
echo -e "${YELLOW}[7/8] Setting up systemd service...${NC}"
cat > /etc/systemd/system/beetronic-os.service << EOF
[Unit]
Description=BEETRONIC OS Backend
After=network.target postgresql.service

[Service]
Type=simple
User=$APP_USER
WorkingDirectory=$APP_DIR/backend
EnvironmentFile=$APP_DIR/.env.production
ExecStart=/usr/bin/node $APP_DIR/backend/dist/index.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=beetronic-os

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable beetronic-os
echo -e "${GREEN}✓ Systemd service configured${NC}"

# Step 8: Nginx setup
echo -e "${YELLOW}[8/8] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/beetronic-os << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name DOMAIN_PLACEHOLDER;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name DOMAIN_PLACEHOLDER;

    ssl_certificate /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/DOMAIN_PLACEHOLDER/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;

    gzip on;
    gzip_types text/plain text/css text/javascript application/json application/javascript;

    location / {
        root APP_DIR_PLACEHOLDER/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /health {
        proxy_pass http://localhost:3000;
    }
}
EOF

# Replace placeholders
sed -i "s|DOMAIN_PLACEHOLDER|$DOMAIN|g" /etc/nginx/sites-available/beetronic-os
sed -i "s|APP_DIR_PLACEHOLDER|$APP_DIR|g" /etc/nginx/sites-available/beetronic-os

ln -sf /etc/nginx/sites-available/beetronic-os /etc/nginx/sites-enabled/
nginx -t > /dev/null 2>&1 && systemctl restart nginx
echo -e "${GREEN}✓ Nginx configured${NC}"

# Summary
echo ""
echo -e "${GREEN}======================================"
echo "✅ BEETRONIC OS Deployment Complete!"
echo "=====================================${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Upload application files to: $APP_DIR"
echo "2. Install dependencies: cd $APP_DIR/backend && npm ci --production"
echo "3. Initialize database: psql -U $DB_USER -d $DB_NAME -f backend/src/config/schema.sql"
echo "4. Set up SSL: sudo certbot certonly --nginx -d $DOMAIN"
echo "5. Start service: sudo systemctl start beetronic-os"
echo "6. Check status: sudo systemctl status beetronic-os"
echo "7. View logs: sudo journalctl -u beetronic-os -f"
echo ""
echo -e "${YELLOW}Database credentials saved in:${NC}"
echo "$APP_DIR/.env.production"
echo ""
echo "🎉 Application will be available at: https://$DOMAIN"
