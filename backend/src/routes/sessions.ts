import { Router, Request, Response } from 'express';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';

const router = Router();

interface SessionRow {
  id: string;
  user_id: string;
  token: string;
  expires_at: string;
  device_info: string;
  ip_address: string;
  created_at: string;
}

// Get all sessions for current user
router.get('/my-sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, device_info, ip_address, expires_at, created_at
       FROM sessions
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const sessions = (result.rows as SessionRow[]).map((s) => ({
      id: s.id,
      deviceInfo: s.device_info || 'Unknown Device',
      ipAddress: s.ip_address,
      expiresAt: new Date(s.expires_at),
      createdAt: new Date(s.created_at),
      isCurrentSession: false, // We don't expose the actual token
    }));

    res.json({
      success: true,
      data: sessions,
      statusCode: 200,
    });
  } catch (err) {
    console.error('Get sessions error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Revoke a specific session
router.delete('/sessions/:sessionId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;

    // Make sure the session belongs to the current user
    const sessionResult = await query(
      'SELECT user_id FROM sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Session not found',
        statusCode: 404,
      });
    }

    const session = sessionResult.rows[0] as { user_id: string };

    if (session.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        statusCode: 403,
      });
    }

    await query('DELETE FROM sessions WHERE id = $1', [sessionId]);

    res.json({
      success: true,
      data: { message: 'Session revoked' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Revoke all other sessions
router.post('/revoke-all-other-sessions', authMiddleware, async (req: Request, res: Response) => {
  try {
    const currentToken = req.headers.authorization?.substring(7);

    if (!currentToken) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        statusCode: 401,
      });
    }

    // Delete all sessions except current
    await query(
      `DELETE FROM sessions
       WHERE user_id = $1 AND token != $2`,
      [req.userId, currentToken]
    );

    res.json({
      success: true,
      data: { message: 'All other sessions revoked' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Revoke all sessions error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Clean up expired sessions (admin utility)
export async function cleanupExpiredSessions() {
  try {
    const result = await query(
      'DELETE FROM sessions WHERE expires_at < datetime("now")'
    );
    console.log(`🧹 Cleaned up expired sessions: ${result.rowCount} rows deleted`);
  } catch (err) {
    console.error('Cleanup error:', err);
  }
}

export default router;
