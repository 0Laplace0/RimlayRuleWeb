const prisma = require('../config/prisma');

const generateSlug = (text) => {
  return text.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
};

const getCountryRules = async (req, res) => {
  try {
    const categories = await prisma.ruleCategory.findMany({
      where: { category: 'country' },
      orderBy: { id: 'asc' },
      include: {
        subcategories: {
          orderBy: { id: 'asc' },
          include: {
            rules: {
              orderBy: { id: 'asc' },
              include: {
                subItems: {
                  orderBy: { id: 'asc' }
                }
              }
            }
          }
        },
        footers: true
      }
    });

    const result = categories.map((cat) => {
      const footer = cat.footers[0];
      return {
        id: cat.id,
        title: cat.name,
        slug: cat.slug,
        footerNote: footer ? footer.noteText : '',
        subGroups: cat.subcategories.map((sub) => ({
          subId: sub.id,
          subTitle: sub.name,
          rules: sub.rules.map((rule) => ({
            ruleId: rule.id,
            text: rule.ruleText,
            penaltyValue: rule.penaltyValue || '',
            subItems: rule.subItems.map((si) => ({
              subItemId: si.id,
              text: si.content
            }))
          }))
        }))
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};

const createCountryRule = async (req, res) => {
  const { title, footerNote, subGroups } = req.body;
  const categorySlug = generateSlug(title);

  try {
    const existing = await prisma.ruleCategory.findFirst({
      where: { category: 'country', slug: categorySlug }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'ชื่อหัวข้อกฎระเบียบประเทศนี้มีอยู่แล้วในระบบ' });
    }

    await prisma.$transaction(async (tx) => {
      const newCategory = await tx.ruleCategory.create({
        data: {
          category: 'country',
          name: title,
          slug: categorySlug,
          footers: footerNote ? {
            create: {
              noteText: footerNote
            }
          } : undefined
        }
      });

      if (subGroups && subGroups.length > 0) {
        for (const sg of subGroups) {
          const subTitle = sg.subTitle || sg.sub_title || '';
          const subSlug = generateSlug(subTitle);
          const rulesList = sg.rules || sg.items || [];

          await tx.ruleSubcategory.create({
            data: {
              categoryId: newCategory.id,
              name: subTitle,
              slug: subSlug,
              rules: {
                create: rulesList.map((item) => ({
                  categoryId: newCategory.id,
                  ruleText: item.text,
                  penaltyValue: item.penaltyValue || item.penalty_value || null,
                  subItems: item.subItems && item.subItems.length > 0 ? {
                    create: item.subItems.map((si) => ({
                      content: si.text
                    }))
                  } : undefined
                }))
              }
            }
          });
        }
      }
    });

    return res.status(201).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('Create Country Rule Error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', error: error.message });
  }
};

const updateCountryRule = async (req, res) => {
  const { id } = req.params;
  const categoryId = Number(id);
  const { title, footerNote, subGroups } = req.body;
  const categorySlug = generateSlug(title);

  try {
    const existing = await prisma.ruleCategory.findFirst({
      where: { 
        category: 'country', 
        slug: categorySlug, 
        NOT: { id: categoryId } 
      }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'ชื่อหัวข้อนี้มีอยู่แล้ว โปรดใช้ชื่ออื่น' });
    }

    const currentCat = await prisma.ruleCategory.findUnique({
      where: { id: categoryId }
    });

    if (!currentCat) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    await prisma.$transaction(async (tx) => {
      await tx.ruleCategory.update({
        where: { id: categoryId },
        data: { name: title, slug: categorySlug }
      });

      await tx.ruleFooter.deleteMany({ where: { categoryId } });
      await tx.ruleSubcategory.deleteMany({ where: { categoryId } });
      await tx.rule.deleteMany({ where: { categoryId } });

      if (subGroups && subGroups.length > 0) {
        for (const sg of subGroups) {
          const subTitle = sg.subTitle || sg.sub_title || '';
          const subSlug = generateSlug(subTitle);
          const rulesList = sg.rules || sg.items || [];

          await tx.ruleSubcategory.create({
            data: {
              categoryId: categoryId,
              name: subTitle,
              slug: subSlug,
              rules: {
                create: rulesList.map((item) => ({
                  categoryId: categoryId,
                  ruleText: item.text,
                  penaltyValue: item.penaltyValue || item.penalty_value || null,
                  subItems: item.subItems && item.subItems.length > 0 ? {
                    create: item.subItems.map((si) => ({
                      content: si.text
                    }))
                  } : undefined
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

    return res.status(200).json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('Update Country Rule Error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล', error: error.message });
  }
};

const deleteCountryRule = async (req, res) => {
  try {
    const { id } = req.params;
    const categoryId = Number(id);

    const cat = await prisma.ruleCategory.findFirst({
      where: { id: categoryId, category: 'country' }
    });

    if (!cat) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }

    await prisma.ruleCategory.delete({
      where: { id: categoryId }
    });

    return res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    console.error('Delete Country Rule Error:', error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
};

module.exports = {
  getCountryRules,
  createCountryRule,
  updateCountryRule,
  deleteCountryRule
};