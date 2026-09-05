import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';
import { auditMiddleware } from './middleware/audit';
import { query } from './config/database';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests, please try again later.',
});

app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Trust proxy
app.set('trust proxy', 1);

// Audit logging
app.use(auditMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);

// Protected route example
app.get('/api/users', authMiddleware, async (req, res) => {
  try {
    const result = await query(
      `SELECT id, email, first_name, last_name, is_active, created_at
       FROM users
       LIMIT 50`
    );

    res.json({
      success: true,
      data: result.rows,
      statusCode: 200,
    });
  } catch (err) {
    console.error('Users error:', err);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      statusCode: 500,
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    statusCode: 404,
  });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    statusCode: 500,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 BEETRONIC OS Backend running on port ${PORT}`);
  console.log(`📚 Environment: ${process.env.NODE_ENV || 'development'}`);
});
