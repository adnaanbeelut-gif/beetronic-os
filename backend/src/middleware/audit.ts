import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  const originalSend = res.send;

  res.send = function (data: any) {
    if (req.userId && req.method !== 'GET') {
      const action = `${req.method} ${req.path}`;
      const details = {
        method: req.method,
        path: req.path,
        statusCode: res.statusCode,
        queryParams: req.query,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      };

      query(
        `INSERT INTO audit_logs (user_id, action, resource, details, ip_address)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.userId, action, req.path, JSON.stringify(details), req.ip]
      ).catch((err) => console.error('Audit log error:', err));
    }

    res.send = originalSend;
    return originalSend.call(this, data);
  };

  next();
}
