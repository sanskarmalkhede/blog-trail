import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { Request, Response } from 'express';
import pool from '../db';

interface NewUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
}

interface SignupRequest {
  name: string;
  email: string;
  password: string;
}

export const signup = async (req: Request<{}, {}, SignupRequest>, res: Response): Promise<void> => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    res.status(400).json({ error: 'Name, email, and password are required.' });
    return;
  }

  try {
    // 1) Hash the password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    // 2) Insert user into DB
    const { rows } = await pool.query<NewUser>(
      `INSERT INTO users(name, email, password_hash)
       VALUES($1, $2, $3) RETURNING id, name, email, created_at`,
      [name, email, password_hash]
    );
    const user = rows[0];

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

    // 4) Respond with user data + token
    res.status(201).json({ user, token });
  } catch (err: any) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
}; 