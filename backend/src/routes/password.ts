import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import { hashPassword, verifyPassword, generateRandomToken } from '../utils/auth';
import { sendEmail } from '../utils/email';
import type { ApiResponse } from '@beetronic/shared';

const router = Router();

interface UserRow {
  id: string;
  email: string;
  password_hash: string;
}

router.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
        statusCode: 400,
      });
    }

    const userResult = await query('SELECT id, email FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      // For security, don't reveal if email exists
      return res.json({
        success: true,
        data: { message: 'If an account exists with that email, password reset instructions have been sent.' },
        statusCode: 200,
      });
    }

    const user = userResult.rows[0] as UserRow;
    const token = generateRandomToken(32);
    const tokenId = uuidv4();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await query(
      `INSERT INTO password_reset_tokens (id, user_id, token, expires_at, used)
       VALUES ($1, $2, $3, $4, 0)`,
      [tokenId, user.id, token, expiresAt]
    );

    // Send email with reset link (in production, this would be a real email)
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3001'}/reset-password/${token}`;

    console.log(`📧 Password reset link for ${email}: ${resetLink}`);

    // In production, use actual email service
    // await sendEmail(email, 'Password Reset', `Click here to reset your password: ${resetLink}`);

    res.json({
      success: true,
      data: { message: 'Password reset instructions sent to email' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/reset-password/:token', async (req: Request, res: Response) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        error: 'New password is required',
        statusCode: 400,
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        statusCode: 400,
      });
    }

    const tokenResult = await query(
      `SELECT id, user_id, used, expires_at FROM password_reset_tokens
       WHERE token = $1`,
      [token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid reset token',
        statusCode: 401,
      });
    }

    const resetToken = tokenResult.rows[0] as any;

    if (resetToken.used) {
      return res.status(401).json({
        success: false,
        error: 'Reset token has already been used',
        statusCode: 401,
      });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      return res.status(401).json({
        success: false,
        error: 'Reset token has expired',
        statusCode: 401,
      });
    }

    const passwordHash = await hashPassword(newPassword);

    // Update password
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, resetToken.user_id]);

    // Mark token as used
    await query('UPDATE password_reset_tokens SET used = 1 WHERE id = $1', [resetToken.id]);

    res.json({
      success: true,
      data: { message: 'Password reset successfully' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Reset password error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

router.post('/change-password', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new password are required',
        statusCode: 400,
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
        statusCode: 400,
      });
    }

    const userResult = await query('SELECT password_hash FROM users WHERE id = $1', [req.userId]);

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
        statusCode: 404,
      });
    }

    const user = userResult.rows[0] as UserRow;
    const passwordMatch = await verifyPassword(currentPassword, user.password_hash);

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Current password is incorrect',
        statusCode: 401,
      });
    }

    const passwordHash = await hashPassword(newPassword);
    await query('UPDATE users SET password_hash = $1 WHERE id = $2', [passwordHash, req.userId]);

    res.json({
      success: true,
      data: { message: 'Password changed successfully' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

export default router;
