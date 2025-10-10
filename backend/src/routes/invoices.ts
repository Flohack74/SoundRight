import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/init';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const invoiceSchema = Joi.object({
  projectId: Joi.number().integer().allow(null),
  quoteId: Joi.number().integer().allow(null),
  clientName: Joi.string().min(1).max(100).required(),
  clientEmail: Joi.string().email().allow(''),
  clientPhone: Joi.string().max(20).allow(''),
  clientAddress: Joi.string().allow(''),
  invoiceDate: Joi.date().default(() => new Date()),
  dueDate: Joi.date().allow(null),
  taxRate: Joi.number().min(0).max(100).default(0),
  status: Joi.string().valid('draft', 'sent', 'paid', 'overdue', 'cancelled').default('draft'),
  paymentTerms: Joi.string().max(100).allow(''),
  notes: Joi.string().allow('')
});

const invoiceItemSchema = Joi.object({
  equipmentId: Joi.number().integer().allow(null),
  description: Joi.string().min(1).max(200).required(),
  quantity: Joi.number().integer().min(1).default(1),
  unitPrice: Joi.number().min(0).required()
});

// Generate invoice number
const generateInvoiceNumber = async (): Promise<string> => {
  const year = new Date().getFullYear();
  const count = await new Promise<number>((resolve, reject) => {
    db.get(
      'SELECT COUNT(*) as count FROM invoices WHERE invoice_number LIKE ?',
      [`INV${year}-%`],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });
  return `INV${year}-${String(count + 1).padStart(4, '0')}`;
};

// @desc    Get all invoices
// @route   GET /api/invoices
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
    whereClause += ' AND (invoice_number LIKE ? OR client_name LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM invoices ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get invoices
  const invoices = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT i.*, p.name as project_name, q.quote_number, u.first_name || ' ' || u.last_name as created_by_name 
       FROM invoices i 
       LEFT JOIN projects p ON i.project_id = p.id
       LEFT JOIN quotes q ON i.quote_id = q.id
       LEFT JOIN users u ON i.created_by = u.id
       ${whereClause} 
       ORDER BY i.created_at DESC 
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
    count: invoices.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: invoices
  });
}));

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const invoice = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT i.*, p.name as project_name, q.quote_number, u.first_name || ' ' || u.last_name as created_by_name 
       FROM invoices i 
       LEFT JOIN projects p ON i.project_id = p.id
       LEFT JOIN quotes q ON i.quote_id = q.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!invoice) {
    return next(createError('Invoice not found', 404));
  }

  // Get invoice items
  const items = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT ii.*, e.name as equipment_name, e.category, e.brand, e.model
       FROM invoice_items ii
       LEFT JOIN equipment e ON ii.equipment_id = e.id
       WHERE ii.invoice_id = ?
       ORDER BY ii.id`,
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
      ...invoice,
      items
    }
  });
}));

// @desc    Create invoice
// @route   POST /api/invoices
// @access  Private
router.post('/', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = invoiceSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const {
    projectId, quoteId, clientName, clientEmail, clientPhone, clientAddress,
    invoiceDate, dueDate, taxRate, status, paymentTerms, notes
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

  // Check if quote exists (if provided)
  if (quoteId) {
    const quote = await new Promise<any>((resolve, reject) => {
      db.get(
        'SELECT id FROM quotes WHERE id = ?',
        [quoteId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });

    if (!quote) {
      return next(createError('Quote not found', 404));
    }
  }

  const invoiceNumber = await generateInvoiceNumber();

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO invoices (
        invoice_number, project_id, quote_id, client_name, client_email, client_phone, client_address,
        invoice_date, due_date, tax_rate, status, payment_terms, notes, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        invoiceNumber, projectId || null, quoteId || null, clientName, clientEmail || null,
        clientPhone || null, clientAddress || null, invoiceDate, dueDate || null, taxRate,
        status, paymentTerms || null, notes || null, req.user!.id
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created invoice
  const newInvoice = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT i.*, p.name as project_name, q.quote_number, u.first_name || ' ' || u.last_name as created_by_name 
       FROM invoices i 
       LEFT JOIN projects p ON i.project_id = p.id
       LEFT JOIN quotes q ON i.quote_id = q.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: newInvoice
  });
}));

// @desc    Update invoice
// @route   PUT /api/invoices/:id
// @access  Private
router.put('/:id', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = invoiceSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if invoice exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by, status FROM invoices WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Invoice not found', 404));
  }

  // Check if user can modify this invoice
  if (existing.created_by !== req.user!.id && !['admin', 'manager'].includes(req.user!.role)) {
    return next(createError('Not authorized to modify this invoice', 403));
  }

  // Don't allow modification of paid invoices
  if (existing.status === 'paid') {
    return next(createError('Cannot modify paid invoices', 400));
  }

  const {
    projectId, quoteId, clientName, clientEmail, clientPhone, clientAddress,
    invoiceDate, dueDate, taxRate, status, paymentTerms, notes
  } = value;

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE invoices SET 
        project_id = ?, quote_id = ?, client_name = ?, client_email = ?, client_phone = ?, client_address = ?,
        invoice_date = ?, due_date = ?, tax_rate = ?, status = ?, payment_terms = ?, 
        notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        projectId || null, quoteId || null, clientName, clientEmail || null, clientPhone || null,
        clientAddress || null, invoiceDate, dueDate || null, taxRate, status,
        paymentTerms || null, notes || null, req.params.id
      ],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Recalculate totals
  await recalculateInvoiceTotals(req.params.id);

  // Get updated invoice
  const updatedInvoice = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT i.*, p.name as project_name, q.quote_number, u.first_name || ' ' || u.last_name as created_by_name 
       FROM invoices i 
       LEFT JOIN projects p ON i.project_id = p.id
       LEFT JOIN quotes q ON i.quote_id = q.id
       LEFT JOIN users u ON i.created_by = u.id
       WHERE i.id = ?`,
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: updatedInvoice
  });
}));

// @desc    Delete invoice
// @route   DELETE /api/invoices/:id
// @access  Private (Admin/Manager only)
router.delete('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if invoice exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM invoices WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Invoice not found', 404));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM invoices WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Invoice deleted successfully'
  });
}));

// @desc    Add item to invoice
// @route   POST /api/invoices/:id/items
// @access  Private
router.post('/:id/items', protect, asyncHandler(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { error, value } = invoiceItemSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if invoice exists
  const invoice = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id, created_by, status FROM invoices WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!invoice) {
    return next(createError('Invoice not found', 404));
  }

  if (invoice.status === 'paid') {
    return next(createError('Cannot modify paid invoices', 400));
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
      'INSERT INTO invoice_items (invoice_id, equipment_id, description, quantity, unit_price, total_price) VALUES (?, ?, ?, ?, ?, ?)',
      [req.params.id, equipmentId || null, description, quantity, unitPrice, totalPrice],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Recalculate invoice totals
  await recalculateInvoiceTotals(req.params.id);

  // Get the created item
  const item = await new Promise<any>((resolve, reject) => {
    db.get(
      `SELECT ii.*, e.name as equipment_name, e.category, e.brand, e.model
       FROM invoice_items ii
       LEFT JOIN equipment e ON ii.equipment_id = e.id
       WHERE ii.id = ?`,
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

// Helper function to recalculate invoice totals
const recalculateInvoiceTotals = async (invoiceId: string) => {
  // Get subtotal
  const subtotal = await new Promise<number>((resolve, reject) => {
    db.get(
      'SELECT COALESCE(SUM(total_price), 0) as subtotal FROM invoice_items WHERE invoice_id = ?',
      [invoiceId],
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.subtotal);
      }
    );
  });

  // Get tax rate
  const invoice = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT tax_rate FROM invoices WHERE id = ?',
      [invoiceId],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  const taxAmount = subtotal * (invoice.tax_rate / 100);
  const totalAmount = subtotal + taxAmount;

  // Update invoice totals
  await new Promise((resolve, reject) => {
    db.run(
      'UPDATE invoices SET subtotal = ?, tax_amount = ?, total_amount = ? WHERE id = ?',
      [subtotal, taxAmount, totalAmount, invoiceId],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });
};

export default router;
