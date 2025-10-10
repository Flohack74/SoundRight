import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/init';
import { protect, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const deliveryNoteSchema = Joi.object({
  projectId: Joi.number().integer().required(),
  deliveryDate: Joi.date().default(() => new Date()),
  deliveryAddress: Joi.string().allow(''),
  contactPerson: Joi.string().max(100).allow(''),
  contactPhone: Joi.string().max(20).allow(''),
  notes: Joi.string().allow(''),
  status: Joi.string().valid('pending', 'delivered', 'returned').default('pending')
});

const deliveryItemSchema = Joi.object({
  equipmentId: Joi.number().integer().required(),
  quantity: Joi.number().integer().min(1).default(1),
  conditionBefore: Joi.string().valid('excellent', 'good', 'fair', 'poor').allow(''),
  conditionAfter: Joi.string().valid('excellent', 'good', 'fair', 'poor').allow(''),
  notes: Joi.string().allow('')
});

// Generate delivery number
const generateDeliveryNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await new Promise<number>((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM delivery_notes WHERE delivery_number LIKE ?',
      [`DN${year}-%`],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
  return `DN${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all delivery notes
// @route   GET /api/delivery
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
    whereClause += ' AND (delivery_number LIKE ? OR p.name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM delivery_notes dn 
       JOIN projects p ON dn.project_id = p.id
       ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get delivery notes
  const deliveryNotes = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT dn.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM delivery_notes dn 
       JOIN projects p ON dn.project_id = p.id
       LEFT JOIN users u ON dn.created_by = u.id
       ${whereClause} 
       ORDER BY dn.created_at DESC 
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
    count: deliveryNotes.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: deliveryNotes
  });
}));

// @desc    Get single delivery note
// @route   GET /api/delivery/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const deliveryNote = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT dn.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM delivery_notes dn 
       JOIN projects p ON dn.project_id = p.id
       LEFT JOIN users u ON dn.created_by = u.id
       WHERE dn.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!deliveryNote) {
    return next(createError('Delivery note not found', 404));
  }

  // Get delivery items
  const items = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT di.*, e.name, e.category, e.brand, e.model, e.serial_number
       FROM delivery_items di
       JOIN equipment e ON di.equipment_id = e.id
       WHERE di.delivery_note_id = ?
       ORDER BY di.id`,
      [req.params.id],
      (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      }
    );
  });

  res.json({
    success: true,
    data: {
      ...deliveryNote,
      items
    }
  });
}));

// @desc    Create delivery note
// @route   POST /api/delivery
// @access  Private
router.post('/', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = deliveryNoteSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const {
    projectId, deliveryDate, deliveryAddress, contactPerson, contactPhone, notes, status
  } = value;

  // Check if project exists
  const project = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM projects WHERE id = ?',
      [projectId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!project) {
    return next(createError('Project not found', 404));
  }

  const deliveryNumber = await generateDeliveryNumber();

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO delivery_notes (
        delivery_number, project_id, delivery_date, delivery_address, contact_person,
        contact_phone, notes, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        deliveryNumber, projectId, deliveryDate, deliveryAddress || null,
        contactPerson || null, contactPhone || null, notes || null, status, req.user!.id
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created delivery note
  const newDeliveryNote = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT dn.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM delivery_notes dn 
       JOIN projects p ON dn.project_id = p.id
       LEFT JOIN users u ON dn.created_by = u.id
       WHERE dn.id = ?`,
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: newDeliveryNote
  });
}));

// @desc    Update delivery note
// @route   PUT /api/delivery/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = deliveryNoteSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if delivery note exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by FROM delivery_notes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Delivery note not found', 404));
  }

  const {
    projectId, deliveryDate, deliveryAddress, contactPerson, contactPhone, notes, status
  } = value;

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE delivery_notes SET 
        project_id = ?, delivery_date = ?, delivery_address = ?, contact_person = ?,
        contact_phone = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        projectId, deliveryDate, deliveryAddress || null, contactPerson || null,
        contactPhone || null, notes || null, status, req.params.id
      ],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Get updated delivery note
  const updatedDeliveryNote = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT dn.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM delivery_notes dn 
       JOIN projects p ON dn.project_id = p.id
       LEFT JOIN users u ON dn.created_by = u.id
       WHERE dn.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: updatedDeliveryNote
  });
}));

// @desc    Add item to delivery note
// @route   POST /api/delivery/:id/items
// @access  Private
router.post('/:id/items', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = deliveryItemSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if delivery note exists
  const deliveryNote = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM delivery_notes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!deliveryNote) {
    return next(createError('Delivery note not found', 404));
  }

  const { equipmentId, quantity, conditionBefore, conditionAfter, notes } = value;

  // Check if equipment exists
  const equipment = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM equipment WHERE id = ?',
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

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      'INSERT INTO delivery_items (delivery_note_id, equipment_id, quantity, condition_before, condition_after, notes) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, equipmentId, quantity, conditionBefore || null, conditionAfter || null, notes || null],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created item
  const item = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT di.*, e.name, e.category, e.brand, e.model, e.serial_number
       FROM delivery_items di
       JOIN equipment e ON di.equipment_id = e.id
       WHERE di.id = ?`,
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: item
  });
}));

export default router;
