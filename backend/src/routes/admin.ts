import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { hashPassword } from '../utils/auth';
import type { ApiResponse, User } from '@beetronic/shared';

const router = Router();

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role_id: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

// Middleware to check if user is admin
async function isAdmin(req: Request, res: Response, next: Function) {
  try {
    const userResult = await query(
      `SELECT u.id FROM users u
       JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1 AND r.name = $2`,
      [req.userId, 'admin']
    );

    if (userResult.rows.length === 0) {
      return res.status(403).json({
        success: false,
        error: 'Admin access required',
        statusCode: 403,
      });
    }

    next();
  } catch (err) {
    console.error('Admin check error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
}

// Get all users (admin only)
router.get('/users', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, role_id, is_active, created_at, updated_at
       FROM users
       ORDER BY created_at DESC
       LIMIT 100`
    );

    const users = (result.rows as UserRow[]).map((u) => ({
      id: u.id,
      email: u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      roleId: u.role_id,
      isActive: Boolean(u.is_active),
      createdAt: new Date(u.created_at),
      updatedAt: new Date(u.updated_at),
    }));

    res.json({
      success: true,
      data: users,
      statusCode: 200,
    });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Create user (admin only)
router.post('/users', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, roleId } = req.body;

    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        statusCode: 400,
      });
    }

    // Check if email exists
    const existingUser = await query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'Email already exists',
        statusCode: 409,
      });
    }

    const userId = uuidv4();
    const passwordHash = await hashPassword(password);
    const roleRes = await query('SELECT id FROM roles WHERE name = $1', ['user']);
    const userRoleId = roleId || ((roleRes.rows as any[])[0] as any).id;

    await query(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, role_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, 1)`,
      [userId, email, passwordHash, firstName, lastName, userRoleId]
    );

    res.status(201).json({
      success: true,
      data: { id: userId, email, firstName, lastName },
      statusCode: 201,
    });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Update user (admin only)
router.put('/users/:userId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, roleId, isActive } = req.body;

    const updateFields: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (firstName !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      params.push(firstName);
    }

    if (lastName !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      params.push(lastName);
    }

    if (roleId !== undefined) {
      updateFields.push(`role_id = $${paramIndex++}`);
      params.push(roleId);
    }

    if (isActive !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      params.push(isActive ? 1 : 0);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update',
        statusCode: 400,
      });
    }

    params.push(userId);

    await query(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
      params
    );

    res.json({
      success: true,
      data: { message: 'User updated successfully' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Delete user (admin only)
router.delete('/users/:userId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    // Don't allow deleting yourself
    if (userId === req.userId) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
        statusCode: 400,
      });
    }

    await query('DELETE FROM users WHERE id = $1', [userId]);

    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Get user by ID
router.get('/users/:userId', authMiddleware, isAdmin, async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    const result = await query(
      `SELECT id, email, first_name, last_name, role_id, is_active, created_at, updated_at, last_login, two_factor_enabled
       FROM users WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    const u = result.rows[0] as UserRow & { last_login: string; two_factor_enabled: number };

    res.json({
      success: true,
      data: {
        id: u.id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        roleId: u.role_id,
        isActive: Boolean(u.is_active),
        twoFactorEnabled: Boolean(u.two_factor_enabled),
        lastLogin: u.last_login ? new Date(u.last_login) : null,
        createdAt: new Date(u.created_at),
        updatedAt: new Date(u.updated_at),
      },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

export default router;
