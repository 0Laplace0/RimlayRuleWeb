const prisma = require('../config/prisma');

// [READ ALL] ดึงข้อมูลหมวด roleplay
exports.getAllRules = async (req, res) => {
  try {
    const categories = await prisma.ruleCategory.findMany({
      where: { category: 'roleplay' },
      orderBy: { id: 'asc' },
      include: {
        subcategories: {
          include: {
            rules: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
            }
          }
        },
        footers: true
      }
    });

    // แปลงข้อมูลให้เป็นแบบ Flat (เอา rules ออกมาจาก subcategory เพื่อให้ Frontend ใช้ง่ายๆ)
    const fullData = categories.map((cat) => {
      // ดึง rules ทั้งหมดจากทุก subcategory มารวมเป็นก้อนเดียว (ปกติหมวดนี้จะมีแค่ 1 subcategory ที่ซ่อนไว้)
      let allRules = [];
      cat.subcategories.forEach(sub => {
        allRules = allRules.concat(sub.rules.map(r => ({
          id: r.id,
          title: r.title || '',
          text: r.ruleText || '',
          penaltyValue: r.penaltyValue || ''
        })));
      });

      const footer = cat.footers[0];

      return {
        id: cat.id,
        category: cat.category,
        title: cat.name,
        slug: cat.slug,
        footerNote: footer ? footer.noteText : '',
        rules: allRules // ส่งกลับไปเป็น Array ชั้นเดียว
      };
    });

    res.json(fullData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// [CREATE FULL] เพิ่มข้อมูล Roleplay
exports.createFullRule = async (req, res) => {
  const { title, footerNote, rules } = req.body;
  const ruleCategory = 'roleplay';

  try {
    const baseSlug = title ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : 'roleplay';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const newCategory = await prisma.$transaction(async (tx) => {
      // 1. สร้าง Category หลัก
      const createdCat = await tx.ruleCategory.create({
        data: {
          category: ruleCategory,
          name: title || 'กฎ Roleplay พื้นฐาน',
          slug: slug,
          footers: footerNote ? { create: { noteText: footerNote } } : undefined
        }
      });

      // 2. สร้าง Subcategory แบบจำลอง (Dummy) 1 อัน เพื่อครอบ Rules เอาไว้ตามโครงสร้าง DB
      if (rules && rules.length > 0) {
        const dummySubSlug = `general-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 7)}`;
        
        await tx.ruleSubcategory.create({
          data: {
            categoryId: createdCat.id,
            name: 'General', // ชื่อซ่อน
            slug: dummySubSlug,
            sortOrder: 0,
            rules: {
              create: rules.map((rule, ruleIndex) => ({
                categoryId: createdCat.id,
                title: rule.title || null,
                ruleText: rule.text || '',
                penaltyValue: rule.penaltyValue || rule.penalty_value || null,
                sortOrder: ruleIndex
              }))
            }
          }
        });
      }

      return createdCat;
    });

    res.status(201).json({ message: 'เพิ่มกฎ Roleplay สำเร็จ', id: newCategory.id });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'ข้อมูลซ้ำซ้อนในระบบ' });
    res.status(500).json({ error: err.message });
  }
};

// [UPDATE FULL] อัปเดตข้อมูล Roleplay
exports.updateFullRule = async (req, res) => {
  const { id } = req.params;
  const { title, footerNote, rules } = req.body;
  const categoryId = Number(id);

  try {
    const currentCat = await prisma.ruleCategory.findUnique({ where: { id: categoryId } });
    if (!currentCat) return res.status(404).json({ error: 'ไม่พบข้อมูล' });

    const newTitle = title || currentCat.name;
    const baseSlug = newTitle ? newTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : currentCat.slug;
    const slug = `${baseSlug}-${categoryId}`;

    await prisma.$transaction(async (tx) => {
      await tx.ruleCategory.update({
        where: { id: categoryId },
        data: { name: newTitle, slug: slug }
      });

      await tx.ruleFooter.deleteMany({ where: { categoryId: categoryId } });
      await tx.ruleSubcategory.deleteMany({ where: { categoryId: categoryId } }); // ลบ Sub เดิม (Rules จะโดนลบตาม Cascade)

      if (rules && rules.length > 0) {
        const dummySubSlug = `general-${categoryId}-${Math.random().toString(36).substring(2, 7)}`;
        
        await tx.ruleSubcategory.create({
          data: {
            categoryId: categoryId,
            name: 'General',
            slug: dummySubSlug,
            sortOrder: 0,
            rules: {
              create: rules.map((rule, ruleIndex) => ({
                categoryId: categoryId,
                title: rule.title || null,
                ruleText: rule.text || '',
                penaltyValue: rule.penaltyValue || rule.penalty_value || null,
                sortOrder: ruleIndex
              }))
            }
          }
        });
      }

      if (footerNote) {
        await tx.ruleFooter.create({
          data: { categoryId: categoryId, noteText: footerNote }
        });
      }
    });

    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (err) {
    if (err.code === 'P2002') return res.status(400).json({ error: 'ข้อมูลซ้ำซ้อนในระบบ' });
    res.status(500).json({ error: err.message });
  }
};

// [DELETE MAIN]
exports.deleteMainRule = async (req, res) => {
  try {
    await prisma.ruleCategory.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};