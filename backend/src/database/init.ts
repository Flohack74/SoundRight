import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

const DB_PATH = process.env.DB_PATH || './data/soundright.db';

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

export const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('📦 Connected to SQLite database');
  }
});

export const initializeDatabase = () => {
  // Enable foreign keys
  db.run('PRAGMA foreign_keys = ON');

  // Create tables
  createUsersTable();
  createEquipmentTable();
  createProjectsTable();
  createProjectEquipmentTable();
  createQuotesTable();
  createQuoteItemsTable();
  createDeliveryNotesTable();
  createDeliveryItemsTable();
  createInvoicesTable();
  createInvoiceItemsTable();
  
  console.log('🗄️ Database tables initialized');
};

const createUsersTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(50) NOT NULL,
      last_name VARCHAR(50) NOT NULL,
      role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user', 'manager')),
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(sql);
};

const createEquipmentTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      category VARCHAR(50) NOT NULL,
      brand VARCHAR(50),
      model VARCHAR(50),
      serial_number VARCHAR(100) UNIQUE,
      description TEXT,
      specifications TEXT,
      purchase_date DATE,
      purchase_price DECIMAL(10,2),
      current_value DECIMAL(10,2),
      condition_status VARCHAR(20) DEFAULT 'good' CHECK (condition_status IN ('excellent', 'good', 'fair', 'poor', 'repair')),
      location VARCHAR(100),
      is_available BOOLEAN DEFAULT 1,
      maintenance_notes TEXT,
      last_maintenance DATE,
      next_maintenance DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;
  db.run(sql);
};

const createProjectsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(100) NOT NULL,
      client_name VARCHAR(100) NOT NULL,
      client_email VARCHAR(100),
      client_phone VARCHAR(20),
      client_address TEXT,
      description TEXT,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      status VARCHAR(20) DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
      location VARCHAR(200),
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `;
  db.run(sql);
};

const createProjectEquipmentTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS project_equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      allocated_date DATE DEFAULT CURRENT_DATE,
      returned_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment (id),
      UNIQUE(project_id, equipment_id)
    )
  `;
  db.run(sql);
};

const createQuotesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS quotes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_number VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER,
      client_name VARCHAR(100) NOT NULL,
      client_email VARCHAR(100),
      client_phone VARCHAR(20),
      client_address TEXT,
      quote_date DATE DEFAULT CURRENT_DATE,
      valid_until DATE,
      subtotal DECIMAL(10,2) DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
      notes TEXT,
      terms_conditions TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `;
  db.run(sql);
};

const createQuoteItemsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quote_id INTEGER NOT NULL,
      equipment_id INTEGER,
      description VARCHAR(200) NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quote_id) REFERENCES quotes (id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    )
  `;
  db.run(sql);
};

const createDeliveryNotesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS delivery_notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_number VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER NOT NULL,
      delivery_date DATE DEFAULT CURRENT_DATE,
      delivery_address TEXT,
      contact_person VARCHAR(100),
      contact_phone VARCHAR(20),
      notes TEXT,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'delivered', 'returned')),
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `;
  db.run(sql);
};

const createDeliveryItemsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS delivery_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      delivery_note_id INTEGER NOT NULL,
      equipment_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      condition_before VARCHAR(20),
      condition_after VARCHAR(20),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (delivery_note_id) REFERENCES delivery_notes (id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    )
  `;
  db.run(sql);
};

const createInvoicesTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS invoices (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number VARCHAR(50) UNIQUE NOT NULL,
      project_id INTEGER,
      quote_id INTEGER,
      client_name VARCHAR(100) NOT NULL,
      client_email VARCHAR(100),
      client_phone VARCHAR(20),
      client_address TEXT,
      invoice_date DATE DEFAULT CURRENT_DATE,
      due_date DATE,
      subtotal DECIMAL(10,2) DEFAULT 0,
      tax_rate DECIMAL(5,2) DEFAULT 0,
      tax_amount DECIMAL(10,2) DEFAULT 0,
      total_amount DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
      payment_terms VARCHAR(100),
      notes TEXT,
      created_by INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (project_id) REFERENCES projects (id),
      FOREIGN KEY (quote_id) REFERENCES quotes (id),
      FOREIGN KEY (created_by) REFERENCES users (id)
    )
  `;
  db.run(sql);
};

const createInvoiceItemsTable = () => {
  const sql = `
    CREATE TABLE IF NOT EXISTS invoice_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_id INTEGER NOT NULL,
      equipment_id INTEGER,
      description VARCHAR(200) NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price DECIMAL(10,2) NOT NULL,
      total_price DECIMAL(10,2) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (invoice_id) REFERENCES invoices (id) ON DELETE CASCADE,
      FOREIGN KEY (equipment_id) REFERENCES equipment (id)
    )
  `;
  db.run(sql);
};
