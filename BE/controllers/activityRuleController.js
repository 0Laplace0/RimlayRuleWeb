const prisma = require('../config/prisma');

// [READ ALL] ดึงข้อมูลเฉพาะหมวด activity สำหรับหน้าตารางจัดการ
exports.getAllRules = async (req, res) => {
  try {
    const categories = await prisma.ruleCategory.findMany({
      where: { category: 'activity' },
      orderBy: { id: 'asc' },
      include: {
        subcategories: {
          orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
          include: {
            rules: {
              orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]
            }
          }
        },
        footers: true
      }
    });

    const fullData = categories.map((cat) => {
      const subGroups = cat.subcategories.map((sub) => ({
        id: sub.id,
        subTitle: sub.name,
        rules: sub.rules.map((r) => ({
          id: r.id,
          title: r.title,
          text: r.ruleText,
          penaltyValue: r.penaltyValue
        }))
      }));

      const footer = cat.footers[0];

      return {
        id: cat.id,
        category: cat.category,
        title: cat.name,
        slug: cat.slug,
        footerNote: footer ? footer.noteText : '',
        subGroups: subGroups
      };
    });

    res.json(fullData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// [CREATE FULL] เพิ่มข้อมูลกิจกรรมแบบครบชุดในครั้งเดียว (ล็อก category เป็น activity)
exports.createFullRule = async (req, res) => {
  const { title, footerNote, subGroups } = req.body;
  const ruleCategory = 'activity';

  try {
    const baseSlug = title ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : 'activity';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const newCategory = await prisma.$transaction(async (tx) => {
      const createdCat = await tx.ruleCategory.create({
        data: {
          category: ruleCategory,
          name: title,
          slug: slug,
          footers: footerNote ? {
            create: {
              noteText: footerNote
            }
          } : undefined
        }
      });

      if (subGroups && subGroups.length > 0) {
        for (const [subIndex, sub] of subGroups.entries()) {
          const subTitleName = sub.subTitle || sub.sub_title || '';
          const cleanSubName = subTitleName 
            ? subTitleName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') 
            : 'sub';
          // ป้องกัน Slug ซ้ำด้วยการพ่วง subIndex และสุ่มรหัสท้าย
          const subSlug = `${cleanSubName}-${subIndex}-${Math.random().toString(36).substring(2, 7)}`;
          const rulesList = sub.rules || sub.items || [];

          await tx.ruleSubcategory.create({
            data: {
              categoryId: createdCat.id,
              name: subTitleName,
              slug: subSlug,
              sortOrder: subIndex,
              rules: {
                create: rulesList.map((rule, ruleIndex) => ({
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
      }

      return createdCat;
    });

    res.status(201).json({ message: 'เพิ่มข้อมูลกิจกรรมสำเร็จ', id: newCategory.id });
  } catch (err) {
    console.error("CREATE ERROR DETAILED:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'ชื่อหัวข้อนี้หรือหมวดหมู่ย่อยซ้ำกับในระบบ กรุณาตรวจสอบข้อมูล' });
    }
    res.status(500).json({ error: err.message });
  }
};

// [UPDATE FULL] อัปเดตข้อมูลกิจกรรมแบบครบชุด
exports.updateFullRule = async (req, res) => {
  const { id } = req.params;
  const { title, footerNote, subGroups } = req.body;
  const categoryId = Number(id);

  try {
    const currentCat = await prisma.ruleCategory.findUnique({
      where: { id: categoryId }
    });

    if (!currentCat) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    const newTitle = title || currentCat.name;
    const baseSlug = newTitle ? newTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : currentCat.slug;
    const slug = `${baseSlug}-${categoryId}`;

    await prisma.$transaction(async (tx) => {
      // 1. อัปเดตข้อมูลหัวข้อหลัก
      await tx.ruleCategory.update({
        where: { id: categoryId },
        data: {
          category: 'activity',
          name: newTitle,
          slug: slug
        }
      });

      // 2. ลบ Footer และ Subcategories เก่า (ระบบ Cascade จะลบ Rules ให้อัตโนมัติ)
      await tx.ruleFooter.deleteMany({
        where: { categoryId: categoryId }
      });

      await tx.ruleSubcategory.deleteMany({
        where: { categoryId: categoryId }
      });

      // 3. สร้าง Subcategories และ Rules ใหม่ทั้งหมดพร้อมระบุ categoryId และป้องกัน Slug ซ้ำ
      if (subGroups && subGroups.length > 0) {
        for (const [subIndex, sub] of subGroups.entries()) {
          const subTitleName = sub.subTitle || sub.sub_title || '';
          const cleanSubName = subTitleName 
            ? subTitleName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') 
            : 'sub';
          const subSlug = `${cleanSubName}-${categoryId}-${subIndex}-${Math.random().toString(36).substring(2, 7)}`;
          const rulesList = sub.rules || sub.items || [];

          await tx.ruleSubcategory.create({
            data: {
              categoryId: categoryId,
              name: subTitleName,
              slug: subSlug,
              sortOrder: subIndex,
              rules: {
                create: rulesList.map((rule, ruleIndex) => ({
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
      }

      // 4. สร้าง Footer ใหม่ถ้ามี
      if (footerNote) {
        await tx.ruleFooter.create({
          data: {
            categoryId: categoryId,
            noteText: footerNote
          }
        });
      }
    });

    res.json({ message: 'อัปเดตข้อมูลกิจกรรมสำเร็จ' });
  } catch (err) {
    console.error("UPDATE ERROR DETAILED:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'ชื่อหัวข้อนี้หรือหมวดหมู่ย่อยซ้ำกับในระบบ กรุณาตรวจสอบข้อมูล' });
    }
    res.status(500).json({ error: err.message });
  }
};

// [DELETE MAIN] ลบหัวข้อหลักของกิจกรรม (รวมถึง Subgroups และ Rules ที่ผูกอยู่)
exports.deleteMainRule = async (req, res) => {
  const { id } = req.params;
  const categoryId = Number(id);

  try {
    await prisma.ruleCategory.delete({
      where: { id: categoryId }
    });

    res.json({ message: 'ลบหัวข้อกิจกรรมสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};