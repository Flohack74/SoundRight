import express, { Request, Response, NextFunction } from 'express';
import { db } from '../database/init';
import { protect, authorize, AuthRequest } from '../middleware/auth';
import { asyncHandler, createError } from '../middleware/errorHandler';
import Joi from 'joi';

const router = express.Router();

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const camelObj: any = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
      let value = obj[key];
      // Convert numeric booleans for specific fields
      if (
        (camelKey === 'isActive' || camelKey === 'isAvailable') &&
        (value === 0 || value === 1)
      ) {
        value = Boolean(value);
      }
      camelObj[camelKey] = value;
    }
  }
  return camelObj;
};

// Validation schemas
const customerSchema = Joi.object({
  companyName: Joi.string().min(1).max(100).required(),
  contactPerson: Joi.string().max(100).allow(''),
  email: Joi.string().email().required(),
  phone: Joi.string().max(20).required(),
  address: Joi.string().required(),
  city: Joi.string().max(50).allow(''),
  state: Joi.string().max(50).allow(''),
  postalCode: Joi.string().max(20).required(),
  country: Joi.string().max(50).allow(''),
  taxId: Joi.string().max(50).allow(''),
  notes: Joi.string().allow(''),
  isActive: Joi.boolean().default(true)
});

// @desc    Get all customers
// @route   GET /api/customers
// @access  Private
router.get('/', protect, asyncHandler(async (req: Request, res: Response) => {
  const { page = 1, limit = 10, active, search } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let whereClause = 'WHERE 1=1';
  const params: any[] = [];

  if (active !== undefined) {
    whereClause += ' AND is_active = ?';
    params.push(active === 'true' ? 1 : 0);
  }

  if (search) {
    whereClause += ' AND (company_name LIKE ? OR contact_person LIKE ? OR email LIKE ? OR phone LIKE ?)';
    const searchTerm = `%${search}%`;
    params.push(searchTerm, searchTerm, searchTerm, searchTerm);
  }

  // Get total count
  const totalCount = await new Promise<number>((resolve, reject) => {
    db.get(
      `SELECT COUNT(*) as count FROM customers ${whereClause}`,
      params,
      (err, row: any) => {
        if (err) reject(err);
        else resolve(row.count);
      }
    );
  });

  // Get customers
  const customers = await new Promise<any[]>((resolve, reject) => {
    db.all(
      `SELECT * FROM customers ${whereClause} 
       ORDER BY company_name ASC 
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
    count: customers.length,
    totalCount,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / Number(limit))
    },
    data: customers.map(toCamelCase)
  });
}));

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
router.get('/:id', protect, asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const customer = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!customer) {
    return next(createError('Customer not found', 404));
  }

  res.json({
    success: true,
    data: toCamelCase(customer)
  });
}));

// @desc    Create customer
// @route   POST /api/customers
// @access  Private (Admin/Manager only)
router.post('/', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = customerSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  const {
    companyName, contactPerson, email, phone, address, city, state,
    postalCode, country, taxId, notes, isActive
  } = value;

  // Check if customer with same email already exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM customers WHERE email = ?',
      [email],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (existing) {
    return next(createError('Customer with this email already exists', 400));
  }

  const result = await new Promise<any>((resolve, reject) => {
    db.run(
      `INSERT INTO customers (
        company_name, contact_person, email, phone, address, city, state,
        postal_code, country, tax_id, notes, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        companyName, contactPerson || null, email, phone, address, city || null,
        state || null, postalCode, country || null, taxId || null, notes || null,
        isActive ? 1 : 0
      ],
      function(err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });

  // Get the created customer
  const newCustomer = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM customers WHERE id = ?',
      [result.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.status(201).json({
    success: true,
    data: toCamelCase(newCustomer)
  });
}));

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private (Admin/Manager only)
router.put('/:id', protect, authorize('admin', 'manager'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  const { error, value } = customerSchema.validate(req.body);
  if (error) {
    return next(createError(error.details[0].message, 400));
  }

  // Check if customer exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM customers WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Customer not found', 404));
  }

  const {
    companyName, contactPerson, email, phone, address, city, state,
    postalCode, country, taxId, notes, isActive
  } = value;

  // Check if email already exists for different customer
  const duplicate = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM customers WHERE email = ? AND id != ?',
      [email, req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (duplicate) {
    return next(createError('Customer with this email already exists', 400));
  }

  await new Promise((resolve, reject) => {
    db.run(
      `UPDATE customers SET 
        company_name = ?, contact_person = ?, email = ?, phone = ?, address = ?,
        city = ?, state = ?, postal_code = ?, country = ?, tax_id = ?, 
        notes = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [
        companyName, contactPerson || null, email, phone, address, city || null,
        state || null, postalCode, country || null, taxId || null, notes || null,
        isActive ? 1 : 0, req.params.id
      ],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  // Get updated customer
  const updatedCustomer = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT * FROM customers WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  res.json({
    success: true,
    data: toCamelCase(updatedCustomer)
  });
}));

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private (Admin only)
router.delete('/:id', protect, authorize('admin'), asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  // Check if customer exists
  const existing = await new Promise<any>((resolve, reject) => {
    db.get(
      'SELECT id FROM customers WHERE id = ?',
      [req.params.id],
      (err, row) => {
        if (err) reject(err);
        else resolve(row);
      }
    );
  });

  if (!existing) {
    return next(createError('Customer not found', 404));
  }

  await new Promise((resolve, reject) => {
    db.run(
      'DELETE FROM customers WHERE id = ?',
      [req.params.id],
      (err) => {
        if (err) reject(err);
        else resolve(null);
      }
    );
  });

  res.json({
    success: true,
    message: 'Customer deleted successfully'
  });
}));

export default router;

