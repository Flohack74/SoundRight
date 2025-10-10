import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/init';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const projectSchema = Joi.object({
  name: Joi.string().min(1).max(100).required(),
  clientName: Joi.string().min(1).max(100).required(),
  clientEmail: Joi.string().email().allow(''),
  clientPhone: Joi.string().max(20).allow(''),
  clientAddress: Joi.string().allow(''),
  description: Joi.string().allow(''),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  status: Joi.string().valid('planning', 'active', 'completed', 'cancelled').default('planning'),
  location: Joi.string().max(200).allow(''),
  notes: Joi.string().allow('')
});

const allocateEquipmentSchema = Joi.object({
  equipmentId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).default(1),
  notes: Joi.string().allow('')
});

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
router.get('/', protect, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (name LIKE ? OR client_name LIKE ? OR description LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM projects ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get projects
  const projects = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name 
       FROM projects p 
       LEFT JOIN users u ON p.created_by = u.id
       ${whereClause} 
       ORDER BY p.created_at DESC 
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
    count: projects.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: projects
  });
}));

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const project = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name 
       FROM projects p 
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!project) {
    return next(createError('Project not found', 404));
  }

  res.json({
    success: true,
    data: project
  });
}));

// @desc    Create project
// @route   POST /api/projects
// @access  Private
router.post('/', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = projectSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const {
    name, clientName, clientEmail, clientPhone, clientAddress,
    description, startDate, endDate, status, location, notes
  } = value;

  if (new Date(startDate) >= new Date(endDate)) {
    return next(createError('End date must be after start date', 400));
  }

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO projects (
        name, client_name, client_email, client_phone, client_address,
        description, start_date, end_date, status, location, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        name, clientName, clientEmail || null, clientPhone || null, clientAddress || null,
        description || null, startDate, endDate, status, location || null,
        notes || null, req.user!.id
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created project
  const newProject = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name 
       FROM projects p 
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: newProject
  });
}));

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = projectSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if project exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by FROM projects WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Project not found', 404));
  }

  // Check if user can modify this project (creator or admin/manager)
  if (existing.created_by !== req.user!.id && !['admin', 'manager'].includes(req.user!.role)) {
    return next(createError('Not authorized to modify this project', 403));
  }

  const {
    name, clientName, clientEmail, clientPhone, clientAddress,
    description, startDate, endDate, status, location, notes
  } = value;

  if (new Date(startDate) >= new Date(endDate)) {
    return next(createError('End date must be after start date', 400));
  }

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE projects SET 
        name = ?, client_name = ?, client_email = ?, client_phone = ?, client_address = ?,
        description = ?, start_date = ?, end_date = ?, status = ?, location = ?, 
        notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        name, clientName, clientEmail || null, clientPhone || null, clientAddress || null,
        description || null, startDate, endDate, status, location || null,
        notes || null, req.params.id
      ],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Get updated project
  const updatedProject = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT p.*, u.first_name || ' ' || u.last_name as created_by_name 
       FROM projects p 
       LEFT JOIN users u ON p.created_by = u.id
       WHERE p.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: updatedProject
  });
}));

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Admin/Manager only)
router.delete('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if project exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM projects WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Project not found', 404));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM projects WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}));

// @desc    Get project equipment
// @route   GET /api/projects/:id/equipment
// @access  Private
router.get('/:id/equipment', protect, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if project exists
  const project = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM projects WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!project) {
    return next(createError('Project not found', 404));
  }

  const equipment = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT pe.*, e.name, e.category, e.brand, e.model, e.serial_number, 
              e.condition_status, e.location
       FROM project_equipment pe
       JOIN equipment e ON pe.equipment_id = e.id
       WHERE pe.project_id = ?
       ORDER BY pe.allocated_date DESC`,
      [req.params.id],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  res.json({
    success: true,
    data: equipment
  });
}));

// @desc    Allocate equipment to project
// @route   POST /api/projects/:id/equipment
// @access  Private
router.post('/:id/equipment', protect, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = allocateEquipmentSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if project exists
  const project = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, status FROM projects WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!project) {
    return next(createError('Project not found', 404));
  }

  if (project.status === 'completed' || project.status === 'cancelled') {
    return next(createError('Cannot allocate equipment to completed or cancelled projects', 400));
  }

  const { equipmentId, quantity, notes } = value;

  // Check if equipment exists and is available
  const equipment = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, name, is_available FROM equipment WHERE id = ?',
      [equipmentId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!equipment) {
    return next(createError('Equipment not found', 404));
  }

  if (!equipment.is_available) {
    return next(createError('Equipment is not available for allocation', 400));
  }

  // Check if equipment is already allocated to this project
  const existingAllocation = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM project_equipment WHERE project_id = ? AND equipment_id = ?',
      [req.params.id, equipmentId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (existingAllocation) {
    return next(createError('Equipment is already allocated to this project', 400));
  }

  // Allocate equipment
  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      'INSERT INTO project_equipment (project_id, equipment_id, quantity, notes) VALUES (?, ?, ?, ?)',
      [req.params.id, equipmentId, quantity, notes || null],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Update equipment availability
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE equipment SET is_available = 0 WHERE id = ?',
      [equipmentId],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Get the allocation details
  const allocation = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT pe.*, e.name, e.category, e.brand, e.model, e.serial_number
       FROM project_equipment pe
       JOIN equipment e ON pe.equipment_id = e.id
       WHERE pe.id = ?`,
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: allocation
  });
}));

// @desc    Return equipment from project
// @route   PUT /api/projects/:id/equipment/:equipmentId
// @access  Private
router.put('/:id/equipment/:equipmentId', protect, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if allocation exists
  const allocation = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, equipment_id FROM project_equipment WHERE project_id = ? AND equipment_id = ? AND returned_date IS NULL',
      [req.params.id, req.params.equipmentId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!allocation) {
    return next(createError('Equipment allocation not found or already returned', 404));
  }

  // Mark equipment as returned
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE project_equipment SET returned_date = CURRENT_DATE WHERE id = ?',
      [allocation.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Update equipment availability
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE equipment SET is_available = 1 WHERE id = ?',
      [req.params.equipmentId],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Equipment returned successfully'
  });
}));

export default router;
