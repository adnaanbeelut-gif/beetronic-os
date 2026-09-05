# 🚀 BEETRONIC OS - Quick Deployment Guide

## 30-Second Overview

Your application is production-ready! Follow these steps:

### On Your Server (Ubuntu/Debian)

```bash
# 1. Upload files to server
scp -r beetronic-os/* beetronic@your-server:/opt/beetronic-os/

# 2. Run automated setup (as root)
sudo bash /opt/beetronic-os/deploy.sh your-domain.com

# 3. Complete manual steps (see DEPLOYMENT.md)
# - Upload built files
# - Initialize database schema
# - Set up SSL certificate
```

## What's Included

✅ **Production builds** - Frontend & Backend compiled and optimized
✅ **Environment config** - .env.production template with secure defaults
✅ **Nginx setup** - Reverse proxy with SSL & security headers
✅ **Systemd service** - Auto-start, monitoring, logging
✅ **Database schema** - PostgreSQL production-ready
✅ **Deployment script** - Automates system setup
✅ **Complete guide** - DEPLOYMENT.md with 10-step walkthrough

## File Structure Created

```
beetronic-os/
├── .env.production          # Environment variables template
├── nginx.conf               # Nginx configuration
├── beetronic-os.service     # Systemd service file
├── deploy.sh                # Automated deployment script
├── DEPLOYMENT.md            # Detailed deployment guide
├── DEPLOY-QUICKSTART.md     # This file
│
├── frontend/
│   └── dist/                # ✅ Production build (built)
│       ├── index.html
│       └── assets/
│
└── backend/
    ├── dist/                # ✅ JavaScript build (compiled)
    │   └── index.js
    └── src/config/
        └── schema.sql       # Database schema
```

## Quick Setup (15 minutes)

### Step 1: Server Preparation
```bash
# SSH into your server
ssh root@your-server-ip

# Run deployment script
cd /tmp
curl -O https://your-repo/deploy.sh
bash deploy.sh your-domain.com

# This will:
# - Update system
# - Install Node.js, PostgreSQL, Nginx
# - Create database & user
# - Configure Systemd service
# - Setup Nginx
```

### Step 2: Upload Application Files
```bash
# From your computer
scp -r beetronic-os/frontend/dist/* \
  beetronic@your-server:/opt/beetronic-os/frontend/dist/

scp -r beetronic-os/backend/dist/* \
  beetronic@your-server:/opt/beetronic-os/backend/dist/
```

### Step 3: Initialize Database
```bash
# On server
cd /opt/beetronic-os
sudo -u postgres psql -U beetronic_user -d beetronic_os \
  -f backend/src/config/schema.sql
```

### Step 4: Start Application
```bash
# On server
sudo systemctl start beetronic-os
sudo systemctl status beetronic-os

# Check if running
curl http://localhost:3000/health
```

### Step 5: Setup SSL Certificate
```bash
# On server
sudo apt install -y certbot python3-certbot-nginx
sudo certbot certonly --nginx -d your-domain.com

# Nginx will auto-update
sudo systemctl restart nginx
```

### Step 6: Verify Everything
```bash
# Test HTTPS
curl https://your-domain.com/health

# Check backend logs
sudo journalctl -u beetronic-os -f

# Check Nginx logs
tail -f /var/log/nginx/access.log
```

## Configuration Checklist

Before going live, update `.env.production`:

- [ ] `DATABASE_URL` - PostgreSQL connection string
- [ ] `JWT_SECRET` - Random 64-char hex (already generated)
- [ ] `REFRESH_TOKEN_SECRET` - Random 64-char hex (already generated)
- [ ] `FRONTEND_URL` - Your domain
- [ ] Domain in `nginx.conf` (line: `server_name`)
- [ ] SSL paths in `nginx.conf` (Let's Encrypt will fill these)

## Monitoring

```bash
# View application logs
sudo journalctl -u beetronic-os -f

# Monitor resource usage
htop

# Check database
sudo -u postgres psql -U beetronic_user -d beetronic_os
# SELECT COUNT(*) FROM users;

# Test API
curl -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password"}' \
  https://your-domain.com/api/auth/login
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "502 Bad Gateway" | Backend not running: `sudo systemctl start beetronic-os` |
| "Connection refused" | PostgreSQL not running: `sudo systemctl start postgresql` |
| "SSL certificate error" | Run: `sudo certbot certonly --nginx -d your-domain.com` |
| "Cannot connect to DB" | Check `.env.production` DATABASE_URL format |
| "Port 3000 in use" | `sudo lsof -i :3000` then kill process |

## Backup Strategy

```bash
# Daily backup script
sudo tee /etc/cron.daily/beetronic-backup << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/opt/beetronic-os/backups
mkdir -p $BACKUP_DIR
sudo -u postgres pg_dump -U beetronic_user beetronic_os | \
  gzip > $BACKUP_DIR/db_$DATE.sql.gz
find $BACKUP_DIR -name "db_*.sql.gz" -mtime +30 -delete
EOF

sudo chmod +x /etc/cron.daily/beetronic-backup
```

## Security Checklist

- [ ] SSH key authentication enabled
- [ ] Firewall rules configured (allow 22, 80, 443)
- [ ] SSL certificate installed (HTTPS working)
- [ ] Rate limiting enabled
- [ ] Database backups scheduled
- [ ] Monitoring logs enabled
- [ ] Nginx security headers present
- [ ] .env.production permissions set to 600

## Performance Tips

1. **Enable gzip** in Nginx ✅ (already configured)
2. **Use CDN** for static assets (optional)
3. **Database indexing** ✅ (already in schema)
4. **Connection pooling** - add to backend if needed
5. **Monitoring** - `htop`, `iostat`, database logs
6. **Rate limiting** ✅ (already configured)

## Cost Estimation

**Recommended VPS specs for production:**
- CPU: 2 cores minimum
- RAM: 2GB minimum (4GB recommended)
- Storage: 30GB minimum
- Monthly cost: $5-15 USD

**Estimated pricing:**
- DigitalOcean Droplet: $6/month
- Linode: $5/month
- Hetzner: €3/month
- AWS EC2: $10-20/month

## Support & Logs

```bash
# Follow application logs in real-time
sudo journalctl -u beetronic-os -f

# See last 100 lines
sudo journalctl -u beetronic-os -n 100

# See only errors
sudo journalctl -u beetronic-os -p err

# Export to file
sudo journalctl -u beetronic-os > beetronic-logs.txt
```

## Next Steps

1. ✅ Review DEPLOYMENT.md for detailed steps
2. ✅ Prepare your server (rent VPS if needed)
3. ✅ Run `deploy.sh` script
4. ✅ Upload application files
5. ✅ Initialize database
6. ✅ Start service & verify
7. ✅ Setup SSL certificate
8. ✅ Configure DNS (point domain to server)
9. ✅ Monitor logs & performance
10. ✅ Set up backups

---

**Questions?** Check DEPLOYMENT.md for the full guide.

**Status**: Ready to Deploy ✅
**Build Date**: 2026-09-05
**Version**: 1.0.0
