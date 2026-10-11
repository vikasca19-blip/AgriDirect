const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./agridirect.db');

db.serialize(() => {
  // Users table (Farmers, Customers, Admin)
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    role TEXT,
    mobile TEXT,
    email TEXT,
    address TEXT
  )`);

  // Products table
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    price REAL,
    description TEXT,
    image TEXT,
    category TEXT,
    stock INTEGER,
    farmer_username TEXT,
    approved INTEGER DEFAULT 1
  )`);

  // Orders table
  db.run(`CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT,
    total REAL,
    date TEXT,
    status TEXT
  )`);

  // Order Items table
  db.run(`CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER,
    product_name TEXT,
    quantity INTEGER,
    price REAL,
    farmer_username TEXT,
    FOREIGN KEY(order_id) REFERENCES orders(id)
  )`);

  // Create default admin if not exists
  const bcrypt = require('bcryptjs');
  const adminPassword = bcrypt.hashSync('admin123', 10);
  db.run(`INSERT OR IGNORE INTO users (username, password, role) VALUES ('admin', ?, 'Admin')`, [adminPassword]);
});

module.exports = db;
