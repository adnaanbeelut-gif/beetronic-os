# 🚀 BEETRONIC OS - Quick Start Guide

Get BEETRONIC OS running in 5 minutes!

## Option 1: Using Docker (Recommended)

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- npm

### Steps

1. **Start PostgreSQL**
   ```bash
   docker-compose up -d
   ```
   This starts a PostgreSQL container and initializes the database schema automatically.

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```
   ✅ Backend ready at `http://localhost:3000`

4. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```
   ✅ Frontend ready at `http://localhost:3001`

5. **Open in Browser**
   ```
   http://localhost:3001
   ```

### Stop Services
```bash
docker-compose down
```

---

## Option 2: Local PostgreSQL

### Prerequisites
- PostgreSQL 12+ installed locally
- Node.js 18+
- npm

### Steps

1. **Create Database**
   ```bash
   createdb beetronic_os
   ```

2. **Initialize Schema**
   ```bash
   psql beetronic_os < backend/src/config/schema.sql
   ```

3. **Install Dependencies**
   ```bash
   npm install
   ```

4. **Configure Backend**
   - Edit `backend/.env`:
   ```env
   DATABASE_URL=postgresql://postgres:password@localhost:5432/beetronic_os
   ```

5. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```

6. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```

7. **Open in Browser**
   ```
   http://localhost:3001
   ```

---

## First Login Test

### Create a Test User

**Method 1: Via Frontend**
1. Go to `http://localhost:3001`
2. Sign up with:
   - Email: `test@example.com`
   - Password: `test123456`
   - Name: Test User

**Method 2: Via API**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "test123456",
    "firstName": "Test",
    "lastName": "User"
  }'
```

### Login
1. Email: `test@example.com`
2. Password: `test123456`

---

## Test 2FA (Two-Factor Authentication)

1. **Login** to the dashboard
2. Go to **Profile** (top right)
3. Click **Enable 2FA**
4. **Scan QR Code** with authenticator app:
   - Google Authenticator
   - Microsoft Authenticator
   - Authy
   - Any TOTP app
5. **Enter the 6-digit code** from your app
6. Click **Verify & Enable 2FA**
7. Success! ✅

---

## Verify Everything Works

### Backend Health Check
```bash
curl http://localhost:3000/health
```
Expected response:
```json
{"status":"ok","timestamp":"2026-09-05T..."}
```

### Login via API
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123456"}'
```
Expected response includes JWT token.

### Dashboard
Access `http://localhost:3001` - should show:
- User dashboard with user list
- System overview statistics
- Profile page with 2FA options

---

## Common Issues

### ❌ "Cannot connect to database"
- Check PostgreSQL is running: `psql -l`
- Verify `DATABASE_URL` in `backend/.env`
- Try Docker: `docker-compose up`

### ❌ "Port 3000/3001 already in use"
- Change port in:
  - Backend: Update `backend/.env` `PORT=3001`
  - Frontend: Update `frontend/vite.config.ts` `port: 3002`

### ❌ "Module not found" errors
```bash
rm -rf node_modules package-lock.json
npm install
```

### ❌ "Cannot login"
- Verify user exists: `psql beetronic_os`
  ```sql
  SELECT email FROM users;
  ```
- Check backend logs for errors

### ❌ "TypeScript errors"
```bash
cd backend && npm run build
cd ../frontend && npm run build
```

---

## Next Steps

1. ✅ Explore the dashboard
2. ✅ Test user management
3. ✅ Enable 2FA on your account
4. ✅ Review API endpoints in `README.md`
5. ✅ Read `CLAUDE.md` for development guide

---

## Project Files Overview

```
beetronic-os/
├── backend/          API server (Express + TypeScript)
├── frontend/         Admin dashboard (React)
├── shared/           Shared types
├── README.md         Full documentation
├── CLAUDE.md         Developer guide
├── QUICKSTART.md     This file
└── docker-compose.yml PostgreSQL container setup
```

---

## Key Features Ready to Use

✅ User registration & login
✅ JWT authentication
✅ Two-factor authentication (TOTP)
✅ Admin dashboard
✅ User management
✅ Audit logging
✅ Rate limiting
✅ Security headers

---

**Time to get running: ~5 minutes** ⚡

For detailed documentation, see [README.md](README.md)

For development info, see [CLAUDE.md](CLAUDE.md)
