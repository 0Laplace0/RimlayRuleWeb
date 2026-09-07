const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seedData() {
  try {
    // 1. สร้าง Hash รหัสผ่าน "123456"
    const passwordHash = await bcrypt.hash('123456', 10);

    // 2. สร้างข้อมูล Admin
    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['admin', 'admin@rimlay.com', passwordHash, 'admin']
    );

    // 3. สร้างข้อมูล User (Member)
    await db.query(
      'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
      ['member01', 'member01@rimlay.com', passwordHash, 'user']
    );

    console.log('✅ สร้างข้อมูลผู้ใช้ใหม่สำเร็จ!');
    console.log('-----------------------------------');
    console.log('1. Admin => User/Email: admin@rimlay.com | Pass: 123456');
    console.log('2. User  => User/Email: member01@rimlay.com | Pass: 123456');
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  }
}

seedData();