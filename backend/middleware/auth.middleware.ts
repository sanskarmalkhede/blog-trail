import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import pool from '../db';

interface JwtPayload {
  sub: string; // uuid
  email: string;
  iat?: number;
  exp?: number;
}

interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // uuid string
    email: string;
  };
}

export async function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or malformed Authorization header' });
    return;
  }
  const token = authHeader.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }

    const payload = jwt.verify(token, secret) as any;
    // Convert to string to match UUID column type
    const uid = String(payload.sub ?? payload.id);
    req.user = { id: uid, email: payload.email };

    // Ensure local users table has this user (for foreign key constraints)
    try {
      const meta = (payload.user_metadata ?? {}) as any;
      const displayName = meta.name || meta.full_name || (payload.email ? payload.email.split('@')[0] : '');
      await pool.query(
        `INSERT INTO users(id, name, email, password_hash)
         VALUES($1, $2, $3, '')
         ON CONFLICT (id) DO NOTHING`,
        [uid, displayName, payload.email]
      );
    } catch (dbErr) {
      console.error('Error ensuring local user:', dbErr);
    }
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export async function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const secret = process.env.JWT_SECRET;
      if (secret) {
        const payload = jwt.verify(token, secret) as any;
        const uid = String(payload.sub ?? payload.id);
        req.user = { id: uid, email: payload.email };
      }
    } catch {
      // ignore invalid token
    }
  }
  next();
}

export default requireAuth; 