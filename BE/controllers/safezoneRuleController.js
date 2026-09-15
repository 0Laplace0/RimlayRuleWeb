const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const fs = require('fs');
const path = require('path');

// 1. ดึงข้อมูล Safezone ทั้งหมด
exports.getAllSafezones = async (req, res) => {
  try {
    const safezones = await prisma.safezone.findMany({
      include: {
        images: true,
      },
      orderBy: { id: 'desc' },
    });
    res.json(safezones);
  } catch (error) {
    console.error('Error fetching safezones:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Safezone' });
  }
};

// 2. สร้าง Safezone ใหม่
exports.createSafezone = async (req, res) => {
  try {
    const { title, description, penalty } = req.body;
    const files = req.files || [];
    
    // ดึงข้อมูล images ที่ส่งมาเป็น JSON string หรือ array จาก FormData
    let imagesData = [];
    if (req.body.images) {
      try {
        imagesData = typeof req.body.images === 'string' 
          ? JSON.parse(req.body.images) 
          : req.body.images;
      } catch (e) {
        imagesData = [];
      }
    }

    // สร้างข้อมูล Safezone หลัก (เพิ่ม title เข้าไปตรงนี้)
    const newSafezone = await prisma.safezone.create({
      data: {
        title: title || '',
        description,
        penalty,
      },
    });

    // บันทึกรูปภาพประกอบ (ถ้ามีไฟล์อัปโหลดเข้ามาคู่กัน)
    if (files.length > 0) {
      const imageRecords = files.map((file, index) => {
        const captionObj = imagesData[index] || {};
        return {
          safezoneId: newSafezone.id,
          imageUrl: `/uploads/safezones/${file.filename}`,
          caption: captionObj.caption || '',
        };
      });

      await prisma.safezoneImage.createMany({
        data: imageRecords,
      });
    }

    const result = await prisma.safezone.findUnique({
      where: { id: newSafezone.id },
      include: { images: true },
    });

    res.status(201).json({ message: 'เพิ่มข้อมูล Safezone สำเร็จ', data: result });
  } catch (error) {
    console.error('Error creating safezone:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  }
};

// 3. แก้ไขข้อมูล Safezone
exports.updateSafezone = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, penalty } = req.body;
    const files = req.files || [];

    let imagesData = [];
    if (req.body.images) {
      try {
        imagesData = typeof req.body.images === 'string' 
          ? JSON.parse(req.body.images) 
          : req.body.images;
      } catch (e) {
        imagesData = [];
      }
    }

    // อัปเดตข้อมูลข้อความหลัก (รวมถึง title)
    const updatedSafezone = await prisma.safezone.update({
      where: { id: Number(id) },
      data: {
        title: title !== undefined ? title : undefined,
        description,
        penalty,
      },
    });

    // จัดการอัปเดตรูปภาพเพิ่มเติม (ถ้ามีรูปใหม่ถูกอัปโหลดเข้ามา)
    if (files.length > 0) {
      const imageRecords = files.map((file, index) => {
        const captionObj = imagesData[index] || {};
        return {
          safezoneId: Number(id),
          imageUrl: `/uploads/safezones/${file.filename}`,
          caption: captionObj.caption || '',
        };
      });

      await prisma.safezoneImage.createMany({
        data: imageRecords,
      });
    }

    const result = await prisma.safezone.findUnique({
      where: { id: Number(id) },
      include: { images: true },
    });

    res.json({ message: 'อัปเดตข้อมูล Safezone สำเร็จ', data: result });
  } catch (error) {
    console.error('Error updating safezone:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  }
};

// 4. ลบข้อมูล Safezone
exports.deleteSafezone = async (req, res) => {
  try {
    const { id } = req.params;

    // ค้นหารูปภาพที่ผูกอยู่เพื่อลบไฟล์ออกจาก Server (ถ้าต้องการ)
    const safezone = await prisma.safezone.findUnique({
      where: { id: Number(id) },
      include: { images: true },
    });

    if (!safezone) {
      return res.status(404).json({ message: 'ไม่พบข้อมูล Safezone ที่ต้องการลบ' });
    }

    // ลบไฟล์รูปภาพจริงในโฟลเดอร์ uploads
    safezone.images.forEach((img) => {
      if (img.imageUrl) {
        const filePath = path.join(__dirname, '..', img.imageUrl);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    });

    // ลบข้อมูลจากฐานข้อมูล (Cascade delete หรือลบรูปลงมาก่อนตามโครงสร้าง DB)
    await prisma.safezoneImage.deleteMany({
      where: { safezoneId: Number(id) },
    });

    await prisma.safezone.delete({
      where: { id: Number(id) },
    });

    res.json({ message: 'ลบข้อมูล Safezone สำเร็จ' });
  } catch (error) {
    console.error('Error deleting safezone:', error);
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
};