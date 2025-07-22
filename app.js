require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const app = express();
const port = 3000;

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
