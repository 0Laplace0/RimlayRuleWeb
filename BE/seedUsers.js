const bcrypt = require('bcryptjs');
const prisma = require('./config/prisma');

async function seedData() {
  try {
    // 1. สร้าง Hash รหัสผ่าน "123456"
    const passwordHash = await bcrypt.hash('123456', 10);

    // ล้างข้อมูลเก่ากันซ้ำ (ถ้ามี)
    await prisma.user.deleteMany({
      where: {
        email: { in: ['admin@rimlay.com', 'member01@rimlay.com'] }
      }
    });

    // 2. สร้างข้อมูล Admin ผ่าน Prisma
    await prisma.user.create({
      data: {
        username: 'admin',
        email: 'admin@rimlay.com',
        password: passwordHash,
        role: 'admin',
      },
    });

    // 3. สร้างข้อมูล User (Member) ผ่าน Prisma
    await prisma.user.create({
      data: {
        username: 'member01',
        email: 'member01@rimlay.com',
        password: passwordHash,
        role: 'user',
      },
    });

    console.log('✅ สร้างข้อมูลผู้ใช้ใหม่สำเร็จ!');
    console.log('-----------------------------------');
    console.log('1. Admin => Email: admin@rimlay.com | Pass: 123456');
    console.log('2. User  => Email: member01@rimlay.com | Pass: 123456');
    console.log('-----------------------------------');
  } catch (error) {
    console.error('❌ เกิดข้อผิดพลาด:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
}

seedData();