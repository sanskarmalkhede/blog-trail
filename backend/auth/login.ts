import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Request, Response } from 'express';
import pool from '../db';

interface User {
  id: number;
  name: string;
  email: string;
  password_hash: string;
}

interface LoginRequest {
  email: string;
  password: string;
}

export const login = async (req: Request<{}, {}, LoginRequest>, res: Response): Promise<void> => {
  const { email, password } = req.body;
  if (!email || !password) {
    res.status(400).json({ error: 'Email and password are required.' });
    return;
  }

  try {
    // 1) Lookup user
    const { rows } = await pool.query<User>(
      'SELECT id, name, email, password_hash FROM users WHERE email = $1',
      [email]
    );
    if (!rows.length) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }
    const user = rows[0];

    // 2) Compare password
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Invalid credentials.' });
      return;
    }

    // 3) Issue JWT
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      res.status(500).json({ error: 'JWT secret not configured' });
      return;
    }
    
    const token = jwt.sign(
      { sub: user.id, email: user.email },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as any
    );

    // 4) Respond
    res.json({ user: { id: user.id, name: user.name, email: user.email }, token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
}; 