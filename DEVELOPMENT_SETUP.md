# 🛠️ BEETRONIC OS - Development Setup

## Quick Start (No External Dependencies)

### For Development with SQLite (Fastest)

1. **Install dependencies** ✅ Done
   ```bash
   npm install
   ```

2. **Start Backend** (Terminal 1)
   ```bash
   cd backend
   npm run dev
   ```

3. **Start Frontend** (Terminal 2)
   ```bash
   cd frontend
   npm run dev
   ```

4. **Access the App**
   ```
   http://localhost:3001
   ```

## Database Setup Options

### Option A: SQLite (Recommended for Development)

SQLite requires **NO** external setup:
- ✅ File-based database (no server needed)
- ✅ Perfect for development and testing
- ✅ Zero configuration
- ✅ Embedded in the backend

**Status**: Ready to implement. Would you like me to convert the backend to use SQLite?

---

### Option B: PostgreSQL (Recommended for Production)

Requires PostgreSQL installed locally.

#### Installation

**Windows:**
1. Download from https://www.postgresql.org/download/windows/
2. Run installer (default settings OK)
3. Remember the password you set for the `postgres` user

**After Installation:**
```bash
# Create database
createdb beetronic_os

# Initialize schema
psql beetronic_os < backend/src/config/schema.sql

# Update backend/.env
DATABASE_URL=postgresql://postgres:your_password@localhost:5432/beetronic_os
```

---

### Option C: Docker (Recommended for Consistency)

Requires Docker Desktop for Windows.

#### Installation

1. Download Docker Desktop: https://www.docker.com/products/docker-desktop
2. Install and start Docker
3. Run:
   ```bash
   docker-compose up -d
   ```

---

## Current System Status

- ✅ npm dependencies installed
- ✅ Project structure complete
- ✅ TypeScript configured
- ⚠️ Database: **Not yet configured**
- ⚠️ PostgreSQL: Not found on system
- ⚠️ Docker: Not found on system

## Recommended Next Steps

**To get running in 2 minutes:**
- [ ] Convert to SQLite (simplest, zero setup)

**To use PostgreSQL:**
- [ ] Install PostgreSQL for Windows
- [ ] Configure DATABASE_URL in backend/.env
- [ ] Initialize database schema

**To use Docker:**
- [ ] Install Docker Desktop
- [ ] Run `docker-compose up -d`

---

## Development Commands

Once database is set up:

```bash
# Start backend (from backend/ directory)
npm run dev

# Start frontend (from frontend/ directory)
npm run dev

# Build backend
npm run build

# Build frontend
npm run build

# Run backend tests
npm test

# Lint backend code
npm lint
```

## Environment Variables

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:pass@localhost:5432/beetronic_os
JWT_SECRET=dev-key-12345
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=refresh-key-12345
REFRESH_TOKEN_EXPIRY=7d
TOTP_WINDOW=2
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Troubleshooting

**"Cannot connect to database"**
- Ensure PostgreSQL is running
- Verify DATABASE_URL in .env
- Check database exists: `psql -l`

**"Port 3000/3001 already in use"**
- Change PORT in backend/.env
- Change port in frontend/vite.config.ts

**"Module not found"**
```bash
rm -rf node_modules package-lock.json
npm install
```

---

**Next:** Choose your database setup option above! 🚀
