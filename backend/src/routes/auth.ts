import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import {
  hashPassword,
  verifyPassword,
  generateToken,
  generateRefreshToken,
  verifyRefreshToken,
  generateTwoFactorSecret,
  verifyTwoFactorToken,
  generateRandomToken,
} from '../utils/auth';
import type { AuthRequest, AuthResponse, ApiResponse } from '@beetronic/shared';

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role_id: string;
  is_active: number;
  two_factor_enabled: number;
  created_at: string;
  updated_at: string;
}

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        statusCode: 400,
      });
    }

    const userExists = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (userExists.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered',
        statusCode: 409,
      });
    }

    const passwordHash = await hashPassword(password);

    // Default role (user role)
    const roleResult = await query('SELECT id FROM roles WHERE name = $1', ['user']);
    if (roleResult.rows.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Default role not found',
        statusCode: 500,
      });
    }

    const roleId = (roleResult.rows[0] as { id: string }).id;
    const userId = uuidv4();

    const result = await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, first_name, last_name, role_id, is_active, created_at, updated_at`,
      [userId, email, passwordHash, firstName, lastName, roleId]
    );

    const user = result.rows[0] as UserRow;
    const token = generateToken(user.id, user.email);

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      statusCode: 201,
    });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password }: AuthRequest = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required',
        statusCode: 400,
      });
    }

    const result = await query(
      `SELECT id, password_hash, email, first_name, last_name, role_id, is_active, two_factor_enabled
       FROM users WHERE email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        statusCode: 401,
      });
    }

    const user = result.rows[0] as UserRow;

    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account is inactive',
        statusCode: 403,
      });
    }

    const passwordMatch = await verifyPassword(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Invalid credentials',
        statusCode: 401,
      });
    }

    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);
    const sessionId = uuidv4();

    // Store session
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await query(
      `INSERT INTO sessions (id, user_id, token, expires_at, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [sessionId, user.id, token, expiresAt, req.ip]
    );

    // Update last login
    const now = new Date().toISOString();
    await query('UPDATE users SET last_login = $1 WHERE id = $2', [now, user.id]);

    const response: ApiResponse<AuthResponse> = {
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          roleId: user.role_id,
          isActive: Boolean(user.is_active),
          createdAt: new Date(user.created_at),
          updatedAt: new Date(user.updated_at),
        },
        token,
        refreshToken,
      },
      statusCode: 200,
    };

    res.json(response);
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/logout', authMiddleware, async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.substring(7);
    if (token) {
      await query('DELETE FROM sessions WHERE token = $1', [token]);
    }

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/refresh-token', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token required',
        statusCode: 400,
      });
    }

    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token',
        statusCode: 401,
      });
    }

    const userResult = await query(
      'SELECT id, email FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    const user = userResult.rows[0] as { id: string; email: string };
    const newToken = generateToken(user.id, user.email);

    res.json({
      success: true,
      data: { token: newToken },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Refresh token error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/setup-2fa', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { secret, qrCode } = await generateTwoFactorSecret(req.email!);

    res.json({
      success: true,
      data: {
        secret,
        qrCode,
      },
      statusCode: 200,
    });
  } catch (err) {
    console.error('2FA setup error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/verify-2fa', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { secret, token } = req.body;

    if (!secret || !token) {
      return res.status(400).json({
        success: false,
        error: 'Secret and token required',
        statusCode: 400,
      });
    }

    const isValid = verifyTwoFactorToken(secret, token);
    if (!isValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid 2FA token',
        statusCode: 401,
      });
    }

    await query(
      `UPDATE users SET two_factor_enabled = 1, two_factor_secret = $1 WHERE id = $2`,
      [secret, req.userId]
    );

    res.json({
      success: true,
      data: { message: '2FA enabled successfully' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('2FA verification error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.get('/profile', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role_id, is_active, created_at, updated_at
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    const user = result.rows[0] as UserRow;

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        roleId: user.role_id,
        isActive: Boolean(user.is_active),
        createdAt: new Date(user.created_at),
        updatedAt: new Date(user.updated_at),
      },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

export default router;
