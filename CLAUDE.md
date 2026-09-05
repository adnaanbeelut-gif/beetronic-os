# BEETRONIC OS - Development Guide for Claude

## Project Overview

BEETRONIC OS is a full-stack, production-ready authentication and user management system built with TypeScript, Node.js, React, and PostgreSQL. It includes secure authentication, 2FA, audit logging, and an admin dashboard.

## Project Structure

```
beetronic-os/
├── backend/              # Express.js API
│   ├── src/
│   │   ├── config/       # Database & schema
│   │   ├── middleware/   # Auth, audit
│   │   ├── routes/       # API endpoints
│   │   ├── utils/        # Auth utilities
│   │   └── index.ts      # Main server file
│   ├── .env              # Environment variables
│   └── package.json
├── frontend/             # React dashboard
│   ├── src/
│   │   ├── api/          # API client
│   │   ├── pages/        # React pages
│   │   └── main.tsx      # Entry point
│   └── package.json
├── shared/               # Shared TypeScript types
│   ├── src/
│   │   └── index.ts      # Type definitions
│   └── package.json
├── README.md             # User documentation
└── CLAUDE.md             # This file
```

## Development Workflow

### 1. Starting the Project

```bash
# Install all dependencies (monorepo)
npm install

# Terminal 1: Start backend
cd backend
npm run dev

# Terminal 2: Start frontend
cd frontend
npm run dev
```

Backend runs on: `http://localhost:3000`
Frontend runs on: `http://localhost:3001`

### 2. Database Setup

```bash
# Create database
createdb beetronic_os

# Initialize schema
psql beetronic_os < backend/src/config/schema.sql

# Or from PostgreSQL CLI
psql
CREATE DATABASE beetronic_os;
\c beetronic_os
\i backend/src/config/schema.sql
```

### 3. Key Files to Know

**Backend:**
- `backend/src/index.ts` - Express server setup, routes configuration
- `backend/src/routes/auth.ts` - Authentication endpoints
- `backend/src/utils/auth.ts` - Password, JWT, 2FA utilities
- `backend/src/middleware/auth.ts` - Authentication middleware
- `backend/src/config/database.ts` - PostgreSQL connection pool
- `backend/src/config/schema.sql` - Database schema

**Frontend:**
- `frontend/src/App.tsx` - Main app component & routing
- `frontend/src/pages/LoginPage.tsx` - Login form
- `frontend/src/pages/DashboardPage.tsx` - Admin dashboard
- `frontend/src/pages/ProfilePage.tsx` - User profile & 2FA setup
- `frontend/src/api/client.ts` - API client with axios

**Shared:**
- `shared/src/index.ts` - TypeScript interfaces for User, Role, Permission, Session, etc.

## Common Tasks

### Adding a New API Endpoint

1. Create route handler in `backend/src/routes/`
2. Import and use in `backend/src/index.ts`:
   ```typescript
   app.use('/api/new-route', newRoute);
   ```
3. Test with curl or Postman
4. Add corresponding method to `frontend/src/api/client.ts`
5. Use in React components

### Adding a New Database Table

1. Add SQL to `backend/src/config/schema.sql`
2. Run migration: `psql beetronic_os < backend/src/config/schema.sql`
3. Create corresponding TypeScript interface in `shared/src/index.ts`
4. Create CRUD operations in backend routes

### Adding a New Frontend Page

1. Create component in `frontend/src/pages/YourPage.tsx`
2. Add route in `frontend/src/App.tsx`:
   ```typescript
   <Route path="/your-page" element={<YourPage />} />
   ```
3. Add navigation in existing pages
4. Test with `npm run dev`

### Enabling/Disabling 2FA for Testing

The 2FA implementation uses TOTP (Time-based One-Time Password). To test:
1. Go to Profile page
2. Click "Enable 2FA"
3. Scan QR code with Google Authenticator
4. Enter 6-digit code to verify

For testing without authenticator app, use the secret directly.

## Environment Variables

**Backend (.env)**
- `NODE_ENV` - development/production
- `PORT` - server port (default: 3000)
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - secret for signing JWTs
- `JWT_EXPIRY` - JWT expiration time
- `REFRESH_TOKEN_SECRET` - secret for refresh tokens
- `REFRESH_TOKEN_EXPIRY` - refresh token expiration
- `TOTP_WINDOW` - 2FA time window for verification (default: 2)
- `RATE_LIMIT_WINDOW_MS` - rate limiting window
- `RATE_LIMIT_MAX_REQUESTS` - max requests per window

## API Reference

### Authentication Endpoints

```
POST   /api/auth/register      - Register new user
POST   /api/auth/login         - Login user
POST   /api/auth/logout        - Logout (requires auth)
POST   /api/auth/refresh-token - Refresh JWT token
GET    /api/auth/profile       - Get user profile (requires auth)
POST   /api/auth/setup-2fa     - Get 2FA QR code (requires auth)
POST   /api/auth/verify-2fa    - Enable 2FA (requires auth)
```

### Protected Endpoints

```
GET    /api/users              - List users (requires auth)
GET    /health                 - Health check (public)
```

## Security Notes

1. **Passwords**: Hashed with bcryptjs (10 rounds)
2. **JWTs**: Signed with secret, expires in 24h
3. **2FA**: TOTP protocol, 30-second window
4. **Audit Logging**: All non-GET requests logged
5. **Rate Limiting**: 100 requests per 15 minutes default
6. **CORS**: Configured in Express
7. **Helmet**: Security headers enabled

## Testing Checklist

- [ ] User registration works
- [ ] User login works
- [ ] JWT token valid
- [ ] Protected routes require auth
- [ ] 2FA QR code generates
- [ ] 2FA verification works
- [ ] Logout clears session
- [ ] Audit logs created for actions
- [ ] Rate limiting blocks excessive requests
- [ ] Dashboard loads user data

## Build for Production

```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm preview
```

## Debugging Tips

- Backend: Check `NODE_ENV=development` for verbose logging
- Frontend: Browser DevTools console for errors
- Database: Use `psql -d beetronic_os` for direct queries
- API: Use Postman/curl to test endpoints
- Audit Logs: Query `SELECT * FROM audit_logs;` in psql

## Future Enhancements

- [ ] Email verification on signup
- [ ] Password reset flow
- [ ] Role-based access control (RBAC)
- [ ] Admin user management page
- [ ] Activity history per user
- [ ] Device management & trusted devices
- [ ] Session management (view/revoke sessions)
- [ ] API rate limiting per user
- [ ] OAuth/SSO integration
- [ ] WebAuthn/FIDO2 support
- [ ] SMS 2FA option

## Dependency Notes

- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT signing/verification
- **speakeasy** - TOTP generation/verification
- **qrcode** - QR code generation
- **express-rate-limit** - Request rate limiting
- **helmet** - HTTP security headers
- **pg** - PostgreSQL driver
- **vite** - Frontend build tool
- **axios** - HTTP client

## Last Updated

2026-09-05

---

For questions about development, refer to the README.md for user documentation.
