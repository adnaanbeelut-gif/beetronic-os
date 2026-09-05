# 🔐 BEETRONIC OS

A production-grade, secure authentication and user management system built with TypeScript, Node.js, React, and PostgreSQL.

## Features

✅ **Secure Authentication**
- User registration and login with bcrypt password hashing
- JWT-based token authentication
- Refresh token support
- Session management

✅ **Two-Factor Authentication**
- TOTP (Time-based One-Time Password) support
- QR code generation for authenticator apps
- Google Authenticator, Authy, Microsoft Authenticator compatible

✅ **Security Features**
- Role-Based Access Control (RBAC)
- Audit logging for all actions
- Rate limiting to prevent abuse
- Helmet.js for HTTP security headers
- CORS protection
- Device management and tracking
- Password reset functionality

✅ **Admin Dashboard**
- User management interface
- System overview and monitoring
- User list with status tracking
- Profile management
- 2FA setup and verification

## Project Structure

```
beetronic-os/
├── backend/          # Express.js API server
├── frontend/         # React admin dashboard
├── shared/           # Shared TypeScript types
└── package.json      # Monorepo workspaces configuration
```

## Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **Authentication**: JWT + TOTP
- **Security**: Bcryptjs, Helmet, Rate Limiting

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Language**: TypeScript
- **HTTP Client**: Axios
- **Routing**: React Router

### Shared
- **TypeScript** types and utilities shared between backend and frontend

## Prerequisites

- Node.js 18+
- PostgreSQL 12+
- npm or yarn
- An authenticator app (Google Authenticator, Authy, etc.)

## Installation

### 1. Clone and Install Dependencies

```bash
cd beetronic-os
npm install
```

This installs dependencies for all workspaces (backend, frontend, shared).

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb beetronic_os
```

### 3. Initialize Database Schema

```bash
psql beetronic_os < backend/src/config/schema.sql
```

Or connect to the database and run the SQL from `backend/src/config/schema.sql`.

### 4. Environment Setup

Create a `.env` file in the `backend/` directory:

```bash
cp backend/.env.example backend/.env
```

Edit `backend/.env` with your configuration:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://username:password@localhost:5432/beetronic_os
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRY=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key
REFRESH_TOKEN_EXPIRY=7d
TOTP_WINDOW=2
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOG_LEVEL=info
```

## Running the Application

### Development Mode

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

The backend API will run on `http://localhost:3000`

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

The frontend will run on `http://localhost:3001`

Access the app at: `http://localhost:3001`

### Production Build

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
npm preview
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile (requires auth)

### Two-Factor Authentication

- `POST /api/auth/setup-2fa` - Generate 2FA secret and QR code (requires auth)
- `POST /api/auth/verify-2fa` - Verify and enable 2FA (requires auth)

### Protected Routes

- `GET /api/users` - List all users (requires auth)
- `GET /health` - Health check endpoint

## Database Schema

### Main Tables

- **users** - User accounts with authentication credentials
- **roles** - User roles (admin, user, etc.)
- **permissions** - System permissions
- **role_permissions** - Junction table for role-permission mapping
- **sessions** - Active user sessions
- **audit_logs** - Audit trail of all system actions
- **devices** - Trusted devices for enhanced security
- **password_reset_tokens** - Password reset tokens

## Security Best Practices

1. **Change all secrets** in `.env` for production
2. **Use HTTPS** in production
3. **Enable rate limiting** for API endpoints
4. **Regular backups** of your PostgreSQL database
5. **Monitor audit logs** for suspicious activity
6. **Keep dependencies updated** - run `npm audit` regularly
7. **Enable 2FA** for all user accounts
8. **Use strong passwords** - enforce password policies
9. **Implement CSRF protection** for state-changing operations
10. **Regular security audits** of the codebase

## Testing

### Manual Testing

1. Register a new user at the login page
2. Login with your credentials
3. View the dashboard
4. Navigate to profile and enable 2FA
5. Scan the QR code with an authenticator app
6. Verify the 2FA setup with a 6-digit code
7. Logout and login again

### API Testing

Use a tool like Postman or curl:

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","firstName":"John","lastName":"Doe"}'

# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'

# Get profile (replace TOKEN with actual JWT)
curl http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer TOKEN"
```

## Troubleshooting

### Database Connection Error
- Verify PostgreSQL is running
- Check DATABASE_URL in `.env`
- Ensure database exists: `psql -l | grep beetronic_os`

### Port Already in Use
- Backend default port: 3000 (change with PORT env var)
- Frontend default port: 3001 (change in vite.config.ts)

### Dependencies Installation Error
```bash
rm -rf node_modules package-lock.json
npm install
```

### TypeScript Compilation Errors
```bash
cd backend
npm run build

cd ../frontend
npm run build
```

## Contributing

1. Follow TypeScript strict mode
2. Add proper error handling
3. Write meaningful commit messages
4. Update this README for new features

## License

Proprietary - All rights reserved

## Support

For issues, questions, or security concerns, contact the development team.

---

**Last Updated**: 2026-09-05
**Version**: 1.0.0
