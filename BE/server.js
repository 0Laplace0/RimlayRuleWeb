const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');
const { verifyToken, checkRole } = require('./authMiddleware');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 1. Register API
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, full_name, role } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // กรอง Role ให้เหลือเฉพาะ 'admin' หรือ 'member' (ถ้าส่งค่าอื่นมาให้ตกเป็น 'member')
    const userRole = role === 'admin' ? 'admin' : 'member';

    await db.query(
      'INSERT INTO users (username, email, password_hash, full_name, role) VALUES (?, ?, ?, ?, ?)',
      [username, email, hashedPassword, full_name, userRole]
    );

    res.status(201).json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Login API (รองรับทั้ง Username และ Email)
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body; // รับค่าจากหน้าบ้าน (อาจเป็น username หรือ email)
  try {
    // ค้นหาผู้ใช้จากทั้ง username หรือ email
    const [users] = await db.query(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, username]
    );
    if (users.length === 0) return res.status(404).json({ message: 'ไม่พบผู้ใช้นี้' });

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) return res.status(400).json({ message: 'รหัสผ่านไม่ถูกต้อง' });

    // ออก JWT Token พร้อมฝังข้อมูล id, username และ role
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role, full_name: user.full_name }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Protected Route: ดูรายชื่อผู้ใช้ทั้งหมด (เฉพาะ Admin เท่านั้น)
app.get('/api/admin/users', verifyToken, checkRole(['admin']), async (req, res) => {
  try {
    const [users] = await db.query('SELECT id, username, email, role, status, created_at FROM users');
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`);
});