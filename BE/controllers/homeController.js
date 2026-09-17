const prisma = require('../config/prisma');

// Helper แปลง rule text หรือ textDelta เป็น string (JSON ถ้าเป็น delta object)
const serializeRuleText = (rule) => {
  if (rule.textDelta !== undefined && rule.textDelta !== null) {
    return typeof rule.textDelta === 'string' ? rule.textDelta : JSON.stringify(rule.textDelta);
  }
  if (typeof rule.text === 'object') {
    return JSON.stringify(rule.text);
  }
  return rule.text || '';
};

// Helper แกะ string กลับเป็น delta/text สำหรับส่งให้ Frontend
const parseRuleText = (dbText) => {
  if (!dbText) return { textDelta: { ops: [{ insert: '' }] }, text: '' };
  try {
    const parsed = JSON.parse(dbText);
    if (parsed && parsed.ops) {
      return { textDelta: parsed, text: '' };
    }
  } catch (e) {
    // ถ้าไม่ใช่ JSON แสดงว่าเป็น plain text ธรรมดา
  }
  return {
    textDelta: { ops: [{ insert: dbText }] },
    text: dbText
  };
};

// [READ ALL] ดึงข้อมูลตามหมวดหมู่ (ค่าเริ่มต้นเป็น 'home')
exports.getAllRules = async (req, res) => {
  try {
    const categoryFilter = req.query.category || 'home';
    const categories = await prisma.ruleCategory.findMany({
      where: { category: categoryFilter },
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
        rules: sub.rules.map((r) => {
          const parsed = parseRuleText(r.ruleText);
          return {
            id: r.id,
            title: r.title,
            text: parsed.text,
            textDelta: parsed.textDelta,
            penaltyValue: r.penaltyValue
          };
        })
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

// [CREATE FULL] เพิ่มข้อมูลแบบครบชุดในครั้งเดียว
exports.createFullRule = async (req, res) => {
  const { title, footerNote, subGroups, category } = req.body;
  const ruleCategory = category || 'home';

  try {
    const baseSlug = title ? title.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : ruleCategory;
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
                  ruleText: serializeRuleText(rule),
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

    res.status(201).json({ message: 'เพิ่มข้อมูลสำเร็จ', id: newCategory.id });
  } catch (err) {
    console.error("CREATE ERROR DETAILED:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'ชื่อหัวข้อนี้หรือหมวดหมู่ย่อยซ้ำกับในระบบ กรุณาตรวจสอบข้อมูล' });
    }
    res.status(500).json({ error: err.message });
  }
};

// [UPDATE FULL] อัปเดตข้อมูลแบบครบชุด
exports.updateFullRule = async (req, res) => {
  const { id } = req.params;
  const { title, footerNote, subGroups, category } = req.body;
  const categoryId = Number(id);

  try {
    const currentCat = await prisma.ruleCategory.findUnique({
      where: { id: categoryId }
    });

    if (!currentCat) {
      return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    const newTitle = title || currentCat.name;
    const targetCategory = category || currentCat.category || 'home';
    const baseSlug = newTitle ? newTitle.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-') : currentCat.slug;
    const slug = `${baseSlug}-${categoryId}`;

    await prisma.$transaction(async (tx) => {
      await tx.ruleCategory.update({
        where: { id: categoryId },
        data: {
          category: targetCategory,
          name: newTitle,
          slug: slug
        }
      });

      await tx.ruleFooter.deleteMany({
        where: { categoryId: categoryId }
      });

      await tx.ruleSubcategory.deleteMany({
        where: { categoryId: categoryId }
      });

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
                  ruleText: serializeRuleText(rule),
                  penaltyValue: rule.penaltyValue || rule.penalty_value || null,
                  sortOrder: ruleIndex
                }))
              }
            }
          });
        }
      }

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
    console.error("UPDATE ERROR DETAILED:", err);
    if (err.code === 'P2002') {
      return res.status(400).json({ error: 'ชื่อหัวข้อนี้หรือหมวดหมู่ย่อยซ้ำกับในระบบ กรุณาตรวจสอบข้อมูล' });
    }
    res.status(500).json({ error: err.message });
  }
};

// [DELETE MAIN] ลบหัวข้อหลัก
exports.deleteMainRule = async (req, res) => {
  const { id } = req.params;
  const categoryId = Number(id);

  try {
    await prisma.ruleCategory.delete({
      where: { id: categoryId }
    });

    res.json({ message: 'ลบหัวข้อสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};