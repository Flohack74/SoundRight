import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/init';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const equipmentSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  category: Joi.string().min(1).max(50).required(),
  brand: Joi.string().max(50).allow(''),
  model: Joi.string().max(50).allow(''),
  serialNumber: Joi.string().max(100).allow(''),
  description: Joi.string().allow(''),
  specifications: Joi.string().allow(''),
  purchaseDate: Joi.date().allow(''),
  purchasePrice: Joi.number().min(0).allow(''),
  currentValue: Joi.number().min(0).allow(''),
  conditionStatus: Joi.string().valid('excellent', 'good', 'fair', 'poor', 'repair').default('good'),
  location: Joi.string().max(100).allow(''),
  isAvailable: Joi.boolean().default(true),
  maintenanceNotes: Joi.string().allow(''),
  lastMaintenance: Joi.date().allow(''),
  nextMaintenance: Joi.date().allow('')
});

// @desc    Get all equipment
// @route   GET /api/equipment
// @access  Private
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, category, condition, available, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (category) {
    whereClause += ' AND category = ?';
    params.push(category);
  }

  if (condition) {
    whereClause += ' AND condition_status = ?';
    params.push(condition);
  }

  if (available !== undefined) {
    whereClause += ' AND is_available = ?';
    params.push(available === 'true' ? 1 : 0);
  }

  if (search) {
    whereClause += ' AND (name LIKE ? OR brand LIKE ? OR model LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM equipment ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get equipment
  const equipment = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT * FROM equipment ${whereClause} 
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
    count: equipment.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: equipment
  });
}));

// @desc    Get single equipment
// @route   GET /api/equipment/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const equipment = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM equipment WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!equipment) {
    return next(createError('Equipment not found', 404));
  }

  res.json({
    success: true,
    data: equipment
  });
}));

// @desc    Create equipment
// @route   POST /api/equipment
// @access  Private (Admin/Manager only)
router.post('/', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = equipmentSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const {
    name, category, brand, model, serialNumber, description, specifications,
    purchaseDate, purchasePrice, currentValue, conditionStatus, location,
    isAvailable, maintenanceNotes, lastMaintenance, nextMaintenance
  } = value;

  // Check if serial number already exists (if provided)
  if (serialNumber) {
    const existing = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM equipment WHERE serial_number = ?',
        [serialNumber],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (existing) {
      return next(createError('Equipment with this serial number already exists', 400));
    }
  }

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO equipment (
        name, category, brand, model, serial_number, description, specifications,
        purchase_date, purchase_price, current_value, condition_status, location,
        is_available, maintenance_notes, last_maintenance, next_maintenance
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, category, brand || null, model || null, serialNumber || null,
        description || null, specifications || null, purchaseDate || null,
        purchasePrice || null, currentValue || null, conditionStatus, location || null,
        isAvailable ? 1 : 0, maintenanceNotes || null, lastMaintenance || null,
        nextMaintenance || null
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created equipment
  const newEquipment = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM equipment WHERE id = ?',
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: newEquipment
  });
}));

// @desc    Update equipment
// @route   PUT /api/equipment/:id
// @access  Private (Admin/Manager only)
router.put('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = equipmentSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if equipment exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM equipment WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Equipment not found', 404));
  }

  const {
    name, category, brand, model, serialNumber, description, specifications,
    purchaseDate, purchasePrice, currentValue, conditionStatus, location,
    isAvailable, maintenanceNotes, lastMaintenance, nextMaintenance
  } = value;

  // Check if serial number already exists for different equipment
  if (serialNumber) {
    const duplicate = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM equipment WHERE serial_number = ? AND id != ?',
        [serialNumber, req.params.id],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (duplicate) {
      return next(createError('Equipment with this serial number already exists', 400));
    }
  }

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE equipment SET 
        name = ?, category = ?, brand = ?, model = ?, serial_number = ?, 
        description = ?, specifications = ?, purchase_date = ?, purchase_price = ?, 
        current_value = ?, condition_status = ?, location = ?, is_available = ?, 
        maintenance_notes = ?, last_maintenance = ?, next_maintenance = ?, 
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, category, brand || null, model || null, serialNumber || null,
        description || null, specifications || null, purchaseDate || null,
        purchasePrice || null, currentValue || null, conditionStatus, location || null,
        isAvailable ? 1 : 0, maintenanceNotes || null, lastMaintenance || null,
        nextMaintenance || null, req.params.id
      ],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Get updated equipment
  const updatedEquipment = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM equipment WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: updatedEquipment
  });
}));

// @desc    Delete equipment
// @route   DELETE /api/equipment/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if equipment exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM equipment WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Equipment not found', 404));
  }

  // Check if equipment is allocated to any active projects
  const allocated = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT pe.id FROM project_equipment pe 
       JOIN projects p ON pe.project_id = p.id 
       WHERE pe.equipment_id = ? AND p.status IN ('planning', 'active')`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (allocated) {
    return next(createError('Cannot delete equipment that is allocated to active projects', 400));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM equipment WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Equipment deleted successfully'
  });
}));

// @desc    Get equipment categories
// @route   GET /api/equipment/categories
// @access  Private
router.get('/meta/categories', protect, asyncHandler(async (req: Request, res: Response) => {
  const categories = await new Promise<any[]>((resolve, reject) => {
    db.all(
      'SELECT DISTINCT category FROM equipment ORDER BY category',
      [],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  res.json({
    success: true,
    data: categories.map(c => c.category)
  });
}));

// @desc    Get equipment statistics
// @route   GET /api/equipment/stats
// @access  Private
router.get('/meta/stats', protect, asyncHandler(async (req: Request, res: Response) => {
  const stats = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN is_available = 1 THEN 1 ELSE 0 END) as available,
        SUM(CASE WHEN is_available = 0 THEN 1 ELSE 0 END) as allocated,
        SUM(CASE WHEN condition_status = 'excellent' THEN 1 ELSE 0 END) as excellent,
        SUM(CASE WHEN condition_status = 'good' THEN 1 ELSE 0 END) as good,
        SUM(CASE WHEN condition_status = 'fair' THEN 1 ELSE 0 END) as fair,
        SUM(CASE WHEN condition_status = 'poor' THEN 1 ELSE 0 END) as poor,
        SUM(CASE WHEN condition_status = 'repair' THEN 1 ELSE 0 END) as repair
       FROM equipment`,
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
