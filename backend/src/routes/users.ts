import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/init';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const updateUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30),
  email: Joi.string().email(),
  firstName: Joi.string().min(1).max(50),
  lastName: Joi.string().min(1).max(50),
  role: Joi.string().valid('admin', 'user', 'manager'),
  isActive: Joi.boolean()
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private (Admin/Manager only)
router.get('/', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, role, active, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (role) {
    whereClause += ' AND role = ?';
    params.push(role);
  }

  if (active !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  if (search) {
    whereClause += ' AND (username LIKE ? OR email LIKE ? OR first_name LIKE ? OR last_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM users ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get users
  const users = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at 
       FROM users ${whereClause} 
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  res.json({
    success: true,
    count: users.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: users.map(user => ({
      ...user,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: Boolean(user.is_active)
    }))
  });
}));

// @desc    Get single user
// @route   GET /api/users/:id
// @access  Private (Admin/Manager only)
router.get('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const user = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!user) {
    return next(createError('User not found', 404));
  }

  res.json({
    success: true,
    data: {
      ...user,
      firstName: user.first_name,
      lastName: user.last_name,
      isActive: Boolean(user.is_active)
    }
  });
}));

// @desc    Update user
// @route   PUT /api/users/:id
// @access  Private (Admin/Manager only)
router.put('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = updateUserSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if user exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM users WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('User not found', 404));
  }

  const { username, email, firstName, lastName, role, isActive } = value;

  // Check for duplicate username (if provided)
  if (username) {
    const duplicate = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE username = ? AND id != ?',
        [username, req.params.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (duplicate) {
      return next(createError('Username already exists', 400));
    }
  }

  // Check for duplicate email (if provided)
  if (email) {
    const duplicate = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.params.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (duplicate) {
      return next(createError('Email already exists', 400));
    }
  }

  // Build update query dynamically
  const updates: string[] = [];
  const params: any[] = [];

  if (username !== undefined) {
    updates.push('username = ?');
    params.push(username);
  }
  if (email !== undefined) {
    updates.push('email = ?');
    params.push(email);
  }
  if (firstName !== undefined) {
    updates.push('first_name = ?');
    params.push(firstName);
  }
  if (lastName !== undefined) {
    updates.push('last_name = ?');
    params.push(lastName);
  }
  if (role !== undefined) {
    updates.push('role = ?');
    params.push(role);
  }
  if (isActive !== undefined) {
    updates.push('is_active = ?');
    params.push(isActive ? 1 : 0);
  }

  updates.push('updated_at = CURRENT_TIMESTAMP');
  params.push(req.params.id);

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      params,
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Get updated user
  const updatedUser = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, username, email, first_name, last_name, role, is_active, created_at, updated_at FROM users WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: {
      ...updatedUser,
      firstName: updatedUser.first_name,
      lastName: updatedUser.last_name,
      isActive: Boolean(updatedUser.is_active)
    }
  });
}));

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if user exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM users WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('User not found', 404));
  }

  // Don't allow deleting the current user
  if (existing.id === req.user!.id) {
    return next(createError('Cannot delete your own account', 400));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM users WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
}));

// @desc    Get user statistics
// @route   GET /api/users/stats
// @access  Private (Admin/Manager only)
router.get('/meta/stats', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response) => {
  const stats = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active,
        SUM(CASE WHEN is_active = 0 THEN 1 ELSE 0 END) as inactive,
        SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
        SUM(CASE WHEN role = 'manager' THEN 1 ELSE 0 END) as managers,
        SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as users
       FROM users`,
      [],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: stats
  });
}));

export default router;
