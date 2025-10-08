import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../database/init';
import { protect, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(50).required(),
  lastName: Joi.string().min(1).max(50).required(),
  role: Joi.string().valid('admin', 'user', 'manager').default('user')
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

// Generate JWT token
const generateToken = (id: number): string => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public
router.post('/register', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const { username, email, password, firstName, lastName, role } = value;

  // Check if user already exists
  const existingUser = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email, username],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (existingUser) {
    return next(createError('User already exists with this email or username', 400));
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  // Create user
  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO users (username, email, password_hash, first_name, last_name, role) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [username, email, passwordHash, firstName, lastName, role],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created user
  const user = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    token: generateToken(user.id),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  });
}));

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const { email, password } = value;

  // Check for user
  const user = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM users WHERE email = ? AND is_active = 1',
      [email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!user) {
    return next(createError('Invalid credentials', 401));
  }

  // Check password
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return next(createError('Invalid credentials', 401));
  }

  res.json({
    success: true,
    token: generateToken(user.id),
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  });
}));

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
router.get('/me', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const user = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, username, email, first_name, last_name, role FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  });
}));

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
router.put('/updatepassword', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return next(createError('Please provide current and new password', 400));
  }

  if (newPassword.length < 6) {
    return next(createError('Password must be at least 6 characters', 400));
  }

  // Get user with password
  const user = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT password_hash FROM users WHERE id = ?',
      [req.user.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  // Check current password
  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    return next(createError('Current password is incorrect', 401));
  }

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(newPassword, salt);

  // Update password
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [passwordHash, req.user.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Password updated successfully'
  });
}));

export default router;
