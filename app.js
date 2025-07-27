require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

app.use(express.json());
// สร้างการเชื่อมต่อ MySQL
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_DATABASE
});

// ดึงข้อมูลสินค้าทั้งหมด
app.get('/products', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products');
  res.json(rows);
});

// ดึงข้อมูลสินค้าตาม ID
app.get('/products/:id', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
  if (rows.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(rows[0]);
});

// ค้นหาสินค้าตาม keyword
app.get('/products/search/:keyword', async (req, res) => {
  const keyword = `%${req.params.keyword}%`;
  const [rows] = await pool.query('SELECT * FROM products WHERE name LIKE ?', [keyword]);
  res.json(rows);
});

// เริ่มเซิร์ฟเวอร์
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// เพิ่มสินค้าใหม่
app.post('/products', async (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;
  if (!name || !price) return res.status(400).json({ error: 'Name and price are required' });

  try {
    const [result] = await pool.query(
      'INSERT INTO products (name, price, discount, review_count, image_url) VALUES (?, ?, ?, ?, ?)',
      [name, price, discount || 0, review_count || 0, image_url || '']
    );
    res.status(201).json({ message: 'Product created', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// แก้ไขสินค้า
app.put('/products/:id', async (req, res) => {
  const { name, price, discount, review_count, image_url } = req.body;

  try {
    const [result] = await pool.query(
      'UPDATE products SET name = ?, price = ?, discount = ?, review_count = ?, image_url = ? WHERE id = ?',
      [name, price, discount, review_count, image_url, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบสินค้าแบบ soft delete
app.delete('/products/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE products SET is_deleted = TRUE WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found' });
    res.json({ message: 'Product soft deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงสินค้าที่ไม่ถูกลบ (GET /products เดิมให้กรอง is_deleted)
app.get('/products', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE is_deleted = FALSE');
  res.json(rows);
});

// ดึงสินค้าที่ถูกลบ (restore ได้)
app.get('/products/deleted', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM products WHERE is_deleted = TRUE');
  res.json(rows);
});

// คืนค่ารายการที่ถูกลบ
app.patch('/products/restore/:id', async (req, res) => {
  try {
    const [result] = await pool.query(
      'UPDATE products SET is_deleted = FALSE WHERE id = ?',
      [req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Product not found or not deleted' });
    res.json({ message: 'Product restored' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
