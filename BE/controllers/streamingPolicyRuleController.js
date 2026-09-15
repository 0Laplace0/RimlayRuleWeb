const prisma = require('../config/prisma');

// [READ ALL] ดึงข้อมูลทั้งหมด
const getAllStreamingPolicies = async (req, res) => {
  try {
    const policies = await prisma.ruleCategory.findMany({
      where: { category: 'streaming' },
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

    const fullData = policies.map((cat) => {
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
    res.status(500).json({ message: 'เกิดข้อผิดพลาดในการดึงข้อมูล Streaming Policy', error: err.message });
  }
};

// [CREATE] สร้างข้อมูลใหม่ (Create)
const createStreamingPolicy = async (req, res) => {
  const { title, footerNote, subGroups } = req.body;
  const ruleCategory = 'streaming';

  try {
    const baseSlug = title ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : 'streaming';
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    const newPolicy = await prisma.$transaction(async (tx) => {
      // 1. บันทึกหัวข้อหลัก
      const createdCat = await tx.ruleCategory.create({
        data: {
          category: ruleCategory,
          name: title,
          slug: slug,
          footers: footerNote ? {
            create: { noteText: footerNote }
          } : undefined
        }
      });

      // 2. บันทึกข้อมูลกลุ่มย่อยและกฎย่อย
      if (subGroups && subGroups.length > 0) {
        for (const [subIndex, sg] of subGroups.entries()) {
          const subTitleName = sg.subTitle || '';
          const cleanSubName = subTitleName 
            ? subTitleName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') 
            : 'sub';
          const subSlug = `${cleanSubName}-${subIndex}-${Math.random().toString(36).substring(2, 7)}`;
          const rulesList = sg.rules || [];

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
                  penaltyValue: rule.penaltyValue || null,
                  sortOrder: ruleIndex
                }))
              }
            }
          });
        }
      }

      return createdCat;
    });

    res.status(201).json({ message: 'เพิ่มนโยบาย Streaming & AI Moderation สำเร็จ', id: newPolicy.id });
  } catch (err) {
    console.error("CREATE ERROR:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'ชื่อหัวข้อนี้หรือหมวดหมู่ย่อยซ้ำกับในระบบ กรุณาตรวจสอบข้อมูล' });
    }
    res.status(500).json({ message: 'ไม่สามารถบันทึกข้อมูลได้', error: err.message });
  }
};

// [UPDATE] อัปเดตข้อมูล (Update)
const updateStreamingPolicy = async (req, res) => {
  const { id } = req.params;
  const { title, footerNote, subGroups } = req.body;
  const categoryId = Number(id);

  try {
    const currentCat = await prisma.ruleCategory.findUnique({
      where: { id: categoryId }
    });

    if (!currentCat) {
      return res.status(404).json({ message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    const newTitle = title || currentCat.name;
    const baseSlug = newTitle ? newTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : currentCat.slug;
    const slug = `${baseSlug}-${categoryId}`;

    await prisma.$transaction(async (tx) => {
      // 1. อัปเดตหัวข้อหลัก
      await tx.ruleCategory.update({
        where: { id: categoryId },
        data: {
          category: 'streaming',
          name: newTitle,
          slug: slug
        }
      });

      // 2. ลบ Footer และ Subcategories เก่า (ระบบ Cascade ใน Prisma จะลบ Rules ให้อัตโนมัติ)
      await tx.ruleFooter.deleteMany({ where: { categoryId: categoryId } });
      await tx.ruleSubcategory.deleteMany({ where: { categoryId: categoryId } });

      // 3. สร้าง Subcategories และ Rules ใหม่
      if (subGroups && subGroups.length > 0) {
        for (const [subIndex, sg] of subGroups.entries()) {
          const subTitleName = sg.subTitle || '';
          const cleanSubName = subTitleName 
            ? subTitleName.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') 
            : 'sub';
          const subSlug = `${cleanSubName}-${categoryId}-${subIndex}-${Math.random().toString(36).substring(2, 7)}`;
          const rulesList = sg.rules || [];

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
                  penaltyValue: rule.penaltyValue || null,
                  sortOrder: ruleIndex
                }))
              }
            }
          });
        }
      }

      // 4. สร้าง Footer ใหม่ (ถ้ามี)
      if (footerNote) {
        await tx.ruleFooter.create({
          data: {
            categoryId: categoryId,
            noteText: footerNote
          }
        });
      }
    });

    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (err) {
    console.error("UPDATE ERROR:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ message: 'ชื่อหัวข้อนี้หรือหมวดหมู่ย่อยซ้ำกับในระบบ กรุณาตรวจสอบข้อมูล' });
    }
    res.status(500).json({ message: 'ไม่สามารถอัปเดตข้อมูลได้', error: err.message });
  }
};

// [DELETE] ลบข้อมูล (Delete)
const deleteStreamingPolicy = async (req, res) => {
  const { id } = req.params;
  const categoryId = Number(id);

  try {
    await prisma.ruleCategory.delete({
      where: { id: categoryId }
    });

    res.json({ message: 'ลบข้อมูลสำเร็จ' });
  } catch (err) {
    res.status(500).json({ message: 'ไม่สามารถลบข้อมูลได้', error: err.message });
  }
};

module.exports = {
  getAllStreamingPolicies,
  createStreamingPolicy,
  updateStreamingPolicy,
  deleteStreamingPolicy
};