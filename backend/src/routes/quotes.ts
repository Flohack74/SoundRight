import express from 'express';
import { db } from '../database/init';
import { protect, authorize } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const quoteSchema = Joi.object({
  projectId: Joi.number().integer().allow(null),
  clientName: Joi.string().min(1).max(100).required(),
  clientEmail: Joi.string().email().allow(''),
  clientPhone: Joi.string().max(20).allow(''),
  clientAddress: Joi.string().allow(''),
  quoteDate: Joi.date().default(() => new Date()),
  validUntil: Joi.date().allow(null),
  taxRate: Joi.number().min(0).max(100).default(0),
  status: Joi.string().valid('draft', 'sent', 'accepted', 'rejected', 'expired').default('draft'),
  notes: Joi.string().allow(''),
  termsConditions: Joi.string().allow('')
});

const quoteItemSchema = Joi.object({
  equipmentId: Joi.number().integer().allow(null),
  description: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().integer().min(1).default(1),
  unitPrice: Joi.number().min(0).required()
});

// Generate quote number
const generateQuoteNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await new Promise<number>((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM quotes WHERE quote_number LIKE ?',
      [`Q${year}-%`],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
  return `Q${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all quotes
// @route   GET /api/quotes
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (status) {
    whereClause += ' AND status = ?';
    params.push(status);
  }

  if (search) {
    whereClause += ' AND (quote_number LIKE ? OR client_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM quotes ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get quotes
  const quotes = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT q.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM quotes q 
       LEFT JOIN projects p ON q.project_id = p.id
       LEFT JOIN users u ON q.created_by = u.id
       ${whereClause} 
       ORDER BY q.created_at DESC 
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
    count: quotes.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: quotes
  });
}));

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req, res, next) => {
  const quote = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT q.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM quotes q 
       LEFT JOIN projects p ON q.project_id = p.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!quote) {
    return next(createError('Quote not found', 404));
  }

  // Get quote items
  const items = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT qi.*, e.name as equipment_name, e.category, e.brand, e.model
       FROM quote_items qi
       LEFT JOIN equipment e ON qi.equipment_id = e.id
       WHERE qi.quote_id = ?
       ORDER BY qi.id`,
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
      ...quote,
      items
    }
  });
}));

// @desc    Create quote
// @route   POST /api/quotes
// @access  Private
router.post('/', protect, asyncHandler(async (req, res, next) => {
  const { error, value } = quoteSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const {
    projectId, clientName, clientEmail, clientPhone, clientAddress,
    quoteDate, validUntil, taxRate, status, notes, termsConditions
  } = value;

  // Check if project exists (if provided)
  if (projectId) {
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
  }

  const quoteNumber = await generateQuoteNumber();

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO quotes (
        quote_number, project_id, client_name, client_email, client_phone, client_address,
        quote_date, valid_until, tax_rate, status, notes, terms_conditions, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quoteNumber, projectId || null, clientName, clientEmail || null, clientPhone || null,
        clientAddress || null, quoteDate, validUntil || null, taxRate, status, notes || null,
        termsConditions || null, req.user.id
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created quote
  const newQuote = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT q.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM quotes q 
       LEFT JOIN projects p ON q.project_id = p.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = ?`,
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: newQuote
  });
}));

// @desc    Update quote
// @route   PUT /api/quotes/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req, res, next) => {
  const { error, value } = quoteSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if quote exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by, status FROM quotes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Quote not found', 404));
  }

  // Check if user can modify this quote
  if (existing.created_by !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return next(createError('Not authorized to modify this quote', 403));
  }

  // Don't allow modification of accepted quotes
  if (existing.status === 'accepted') {
    return next(createError('Cannot modify accepted quotes', 400));
  }

  const {
    projectId, clientName, clientEmail, clientPhone, clientAddress,
    quoteDate, validUntil, taxRate, status, notes, termsConditions
  } = value;

  // Check if project exists (if provided)
  if (projectId) {
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
  }

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE quotes SET 
        project_id = ?, client_name = ?, client_email = ?, client_phone = ?, client_address = ?,
        quote_date = ?, valid_until = ?, tax_rate = ?, status = ?, notes = ?, 
        terms_conditions = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        projectId || null, clientName, clientEmail || null, clientPhone || null,
        clientAddress || null, quoteDate, validUntil || null, taxRate, status,
        notes || null, termsConditions || null, req.params.id
      ],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Recalculate totals
  await recalculateQuoteTotals(req.params.id);

  // Get updated quote
  const updatedQuote = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT q.*, p.name as project_name, u.first_name || ' ' || u.last_name as created_by_name 
       FROM quotes q 
       LEFT JOIN projects p ON q.project_id = p.id
       LEFT JOIN users u ON q.created_by = u.id
       WHERE q.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: updatedQuote
  });
}));

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private (Admin/Manager only)
router.delete('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req, res, next) => {
  // Check if quote exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM quotes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Quote not found', 404));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM quotes WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Quote deleted successfully'
  });
}));

// @desc    Add item to quote
// @route   POST /api/quotes/:id/items
// @access  Private
router.post('/:id/items', protect, asyncHandler(async (req, res, next) => {
  const { error, value } = quoteItemSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if quote exists
  const quote = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by, status FROM quotes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!quote) {
    return next(createError('Quote not found', 404));
  }

  // Check if user can modify this quote
  if (quote.created_by !== req.user.id && !['admin', 'manager'].includes(req.user.role)) {
    return next(createError('Not authorized to modify this quote', 403));
  }

  if (quote.status === 'accepted') {
    return next(createError('Cannot modify accepted quotes', 400));
  }

  const { equipmentId, description, quantity, unitPrice } = value;

  // Check if equipment exists (if provided)
  if (equipmentId) {
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
  }

  const totalPrice = quantity * unitPrice;

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      'INSERT INTO quote_items (quote_id, equipment_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, equipmentId || null, description, quantity, unitPrice, totalPrice],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Recalculate quote totals
  await recalculateQuoteTotals(req.params.id);

  // Get the created item
  const item = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT qi.*, e.name as equipment_name, e.category, e.brand, e.model
       FROM quote_items qi
       LEFT JOIN equipment e ON qi.equipment_id = e.id
       WHERE qi.id = ?`,
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

// @desc    Update quote item
// @route   PUT /api/quotes/:id/items/:itemId
// @access  Private
router.put('/:id/items/:itemId', protect, asyncHandler(async (req, res, next) => {
  const { error, value } = quoteItemSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if quote and item exist
  const quote = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by, status FROM quotes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!quote) {
    return next(createError('Quote not found', 404));
  }

  if (quote.status === 'accepted') {
    return next(createError('Cannot modify accepted quotes', 400));
  }

  const item = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM quote_items WHERE id = ? AND quote_id = ?',
      [req.params.itemId, req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!item) {
    return next(createError('Quote item not found', 404));
  }

  const { equipmentId, description, quantity, unitPrice } = value;
  const totalPrice = quantity * unitPrice;

  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE quote_items SET equipment_id = ?, description = ?, quantity = ?, unit_price = ?, total_price = ? WHERE id = ?',
      [equipmentId || null, description, quantity, unitPrice, totalPrice, req.params.itemId],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Recalculate quote totals
  await recalculateQuoteTotals(req.params.id);

  res.json({
    success: true,
    message: 'Quote item updated successfully'
  });
}));

// @desc    Delete quote item
// @route   DELETE /api/quotes/:id/items/:itemId
// @access  Private
router.delete('/:id/items/:itemId', protect, asyncHandler(async (req, res, next) => {
  // Check if quote exists
  const quote = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by, status FROM quotes WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!quote) {
    return next(createError('Quote not found', 404));
  }

  if (quote.status === 'accepted') {
    return next(createError('Cannot modify accepted quotes', 400));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM quote_items WHERE id = ? AND quote_id = ?',
      [req.params.itemId, req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Recalculate quote totals
  await recalculateQuoteTotals(req.params.id);

  res.json({
    success: true,
    message: 'Quote item deleted successfully'
  });
}));

// Helper function to recalculate quote totals
const recalculateQuoteTotals = async (quoteId: string) => {
  // Get subtotal
  const subtotal = await new Promise<number>((resolve, reject) => {
    db.get(
      'SELECT COALESCE(SUM(total_price), 0) as subtotal FROM quote_items WHERE quote_id = ?',
      [quoteId],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.subtotal);
      }
    );
  });

  // Get tax rate
  const quote = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT tax_rate FROM quotes WHERE id = ?',
      [quoteId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  const taxAmount = subtotal * (quote.tax_rate / 100);
  const totalAmount = subtotal + taxAmount;

  // Update quote totals
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE quotes SET subtotal = ?, tax_amount = ?, total_amount = ? WHERE id = ?',
      [subtotal, taxAmount, totalAmount, quoteId],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });
};

export default router;
