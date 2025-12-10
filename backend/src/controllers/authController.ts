import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { database } from '../db/database.js';
import 'dotenv/config';

const JWT_SECRET = process.env.JWT_SECRET || 'promptspark_dev_secret';

export class AuthController {
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, displayName } = req.body;
      if (!username || !password) {
        res.status(400).json({ success: false, message: 'username and password required' });
        return;
      }

      const existing = await database.get(`SELECT id FROM users WHERE username = ? OR email = ?`, [username, email]);
      if (existing) {
        res.status(409).json({ success: false, message: 'User already exists' });
        return;
      }

      const id = uuidv4();
      const now = new Date().toISOString();
      const passwordHash = await bcrypt.hash(password, 10);

      await database.run(
        `INSERT INTO users (id, username, email, passwordHash, displayName, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, username, email || null, passwordHash, displayName || username, now, now]
      );

      const token = jwt.sign({ id, username }, JWT_SECRET, { expiresIn: '7d' });

      res.status(201).json({ success: true, data: { id, username, email, displayName }, token });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Registration failed' });
    }
  }

  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        res.status(400).json({ success: false, message: 'username and password required' });
        return;
      }

      const user = await database.get(`SELECT * FROM users WHERE username = ?`, [username]);
      if (!user) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const valid = await bcrypt.compare(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
        return;
      }

      const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
      res.json({ success: true, data: { id: user.id, username: user.username, displayName: user.displayName }, token });
    } catch (error) {
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : 'Login failed' });
    }
  }
}

export default AuthController;
