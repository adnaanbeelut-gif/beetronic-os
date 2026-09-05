import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../config/database';
import { authMiddleware } from '../middleware/auth';
import crypto from 'crypto';

const router = Router();

interface ApiTokenRow {
  id: string;
  user_id: string;
  name: string;
  token_hash: string;
  last_used: string;
  expires_at: string;
  created_at: string;
}

function generateApiToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

// Get all API tokens for current user
router.get('/api-tokens', authMiddleware, async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, name, last_used, expires_at, created_at
       FROM api_tokens
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    const tokens = (result.rows as any[]).map((t) => ({
      id: t.id,
      name: t.name,
      lastUsed: t.last_used ? new Date(t.last_used) : null,
      expiresAt: t.expires_at ? new Date(t.expires_at) : null,
      createdAt: new Date(t.created_at),
    }));

    res.json({
      success: true,
      data: tokens,
      statusCode: 200,
    });
  } catch (err) {
    console.error('Get tokens error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Create new API token
router.post('/api-tokens', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name, expiresIn } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Token name is required',
        statusCode: 400,
      });
    }

    const token = generateApiToken();
    const tokenHash = hashToken(token);
    const tokenId = uuidv4();

    let expiresAt = null;
    if (expiresIn) {
      const expiresDate = new Date();
      if (expiresIn === '7d') expiresDate.setDate(expiresDate.getDate() + 7);
      else if (expiresIn === '30d') expiresDate.setDate(expiresDate.getDate() + 30);
      else if (expiresIn === '90d') expiresDate.setDate(expiresDate.getDate() + 90);
      expiresAt = expiresDate.toISOString();
    }

    await query(
      `INSERT INTO api_tokens (id, user_id, name, token_hash, expires_at)
       VALUES ($1, $2, $3, $4, $5)`,
      [tokenId, req.userId, name, tokenHash, expiresAt]
    );

    res.status(201).json({
      success: true,
      data: {
        id: tokenId,
        name,
        token: token, // Only return once at creation
        expiresAt,
      },
      statusCode: 201,
    });
  } catch (err) {
    console.error('Create token error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Revoke API token
router.delete('/api-tokens/:tokenId', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { tokenId } = req.params;

    const tokenResult = await query(
      'SELECT user_id FROM api_tokens WHERE id = $1',
      [tokenId]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Token not found',
        statusCode: 404,
      });
    }

    const token = tokenResult.rows[0] as { user_id: string };

    if (token.user_id !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized',
        statusCode: 403,
      });
    }

    await query('DELETE FROM api_tokens WHERE id = $1', [tokenId]);

    res.json({
      success: true,
      data: { message: 'Token revoked' },
      statusCode: 200,
    });
  } catch (err) {
    console.error('Revoke token error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Middleware to validate API token
export async function validateApiToken(token: string): Promise<string | null> {
  try {
    const tokenHash = hashToken(token);
    const result = await query(
      `SELECT user_id FROM api_tokens
       WHERE token_hash = $1 AND (expires_at IS NULL OR expires_at > datetime("now"))`,
      [tokenHash]
    );

    if (result.rows.length === 0) return null;

    const apiToken = result.rows[0] as { user_id: string };

    // Update last_used
    try {
      query('UPDATE api_tokens SET last_used = datetime("now") WHERE token_hash = $1', [tokenHash]);
    } catch {}

    return apiToken.user_id;
  } catch (err) {
    console.error('Validate token error:', err);
    return null;
  }
}

export default router;
