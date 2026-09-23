const prisma = require('../config/prisma');

// ดึงข้อมูล Banner ทั้งหมด (เรียงจากล่าสุด)
exports.getBanners = async (req, res) => {
  try {
    const banners = await prisma.banner.findMany({
      orderBy: { id: 'desc' }
    });
    res.json(banners);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching banners', error: error.message });
  }
};

// สร้าง Banner ใหม่ (รองรับทั้ง banner และ background)
exports.createBanner = async (req, res) => {
  try {
    const bannerFile = req.files?.banner?.[0];
    const bgFile = req.files?.background?.[0];

    const data = {};
    if (bannerFile) {
      data.imageUrl = `/uploads/${bannerFile.filename}`;
    }
    if (bgFile) {
      data.backgroundUrl = `/uploads/${bgFile.filename}`; // ใช้ชื่อฟิลด์ backgroundUrl ใน DB
    }

    const newBanner = await prisma.banner.create({ data });
    res.status(201).json({ message: 'Created banner successfully', data: newBanner });
  } catch (error) {
    res.status(500).json({ message: 'Error creating banner', error: error.message });
  }
};

// อัปเดต Banner ตาม ID (Int)
exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.banner.findUnique({
      where: { id: Number(id) }
    });

    if (!existing) {
      return res.status(404).json({ message: 'Banner not found' });
    }

    const bannerFile = req.files?.banner?.[0];
    const bgFile = req.files?.background?.[0];

    const updateData = {};
    if (bannerFile) {
      updateData.imageUrl = `/uploads/${bannerFile.filename}`;
    }
    if (bgFile) {
      updateData.backgroundUrl = `/uploads/${bgFile.filename}`;
    }

    const updatedBanner = await prisma.banner.update({
      where: { id: Number(id) },
      data: updateData
    });

    res.json({ message: 'Updated banner successfully', data: updatedBanner });
  } catch (error) {
    res.status(500).json({ message: 'Error updating banner', error: error.message });
  }
};