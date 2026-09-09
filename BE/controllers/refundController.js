const pool = require('../config/db');

const getRefundPolicy = async (req, res) => {
  try {
    // 1. ดึงข้อมูลหมวดหมู่หลักทั้งหมดที่เป็น refund
    const [categories] = await pool.query('SELECT * FROM rule_categories WHERE category = "refund" ORDER BY id ASC');
    
    const result = [];

    for (const cat of categories) {
      // 2. ดึงข้อมูลหมวดหมู่ย่อย (Rule Subcategories)
      const [subcategories] = await pool.query(
        'SELECT * FROM rule_subcategories WHERE category_id = ? ORDER BY id ASC',
        [cat.id]
      );

      const subGroups = [];

      for (const sub of subcategories) {
        // 3. ดึงรายการข้อใหญ่ (Rules)
        const [rules] = await pool.query(
          'SELECT id, rule_text, penalty_value FROM rules WHERE category_id = ? AND subcategory_id = ? ORDER BY id ASC',
          [cat.id, sub.id]
        );

        const rulesList = [];

        for (const rule of rules) {
          // 4. ดึงข้อย่อย (Sub-items)
          const [subItems] = await pool.query(
            'SELECT id, content FROM rule_sub_items WHERE item_id = ? ORDER BY id ASC',
            [rule.id]
          );

          rulesList.push({
            ruleId: rule.id,
            text: rule.rule_text,
            penaltyValue: rule.penalty_value || '', 
            subItems: subItems.map(si => ({
              subItemId: si.id,
              text: si.content
            }))
          });
        }

        subGroups.push({
          subId: sub.id,
          subTitle: sub.name,
          rules: rulesList
        });
      }

      // 5. ดึงหมายเหตุท้ายหน้า (Rule Footers)
      const [footers] = await pool.query(
        'SELECT note_text FROM rule_footers WHERE category_id = ? LIMIT 1',
        [cat.id]
      );

      result.push({
        id: cat.id,
        title: cat.name,
        slug: cat.slug,
        footerNote: footers.length > 0 ? footers[0].note_text : '',
        subGroups: subGroups
      });
    }

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการดึงข้อมูล' });
  }
};

const createRefundRule = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { title, footer_note, subGroups } = req.body;

    const generateSlug = (text) => {
      return text.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    };

    const categorySlug = generateSlug(title);

    // --- เช็กข้อมูลซ้ำก่อนบันทึก ป้องกัน Error 500 ---
    const [existing] = await connection.query(
      'SELECT id FROM rule_categories WHERE category = "refund" AND slug = ?', 
      [categorySlug]
    );
    
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'ชื่อหัวข้อ Refund Policy นี้มีอยู่แล้วในระบบ' });
    }

    // 1. บันทึกหัวข้อหลัก
    const [catResult] = await connection.query(
      'INSERT INTO rule_categories (category, name, slug) VALUES (?, ?, ?)',
      ['refund', title, categorySlug]
    );
    const categoryId = catResult.insertId;

    // 2. วนลูปบันทึกย่อย
    if (subGroups && subGroups.length > 0) {
      for (const sg of subGroups) {
        const subTitle = sg.subTitle || '';
        const subSlug = generateSlug(subTitle);

        const [subResult] = await connection.query(
          'INSERT INTO rule_subcategories (category_id, name, slug) VALUES (?, ?, ?)',
          [categoryId, subTitle, subSlug]
        );
        const subcategoryId = subResult.insertId;

        const rulesList = sg.rules || sg.items || [];
        if (rulesList.length > 0) {
          for (const item of rulesList) {
            const penaltyValue = item.penaltyValue || item.penalty_value || null;

            const [itemResult] = await connection.query(
              'INSERT INTO rules (category_id, subcategory_id, rule_text, penalty_value) VALUES (?, ?, ?, ?)',
              [categoryId, subcategoryId, item.text, penaltyValue]
            );
            const itemId = itemResult.insertId;

            if (item.subItems && item.subItems.length > 0) {
              for (const subItem of item.subItems) {
                await connection.query(
                  'INSERT INTO rule_sub_items (item_id, content) VALUES (?, ?)',
                  [itemId, subItem.text]
                );
              }
            }
          }
        }
      }
    }

    // บันทึกหมายเหตุ
    if (footer_note) {
      await connection.query(
        'INSERT INTO rule_footers (category_id, note_text) VALUES (?, ?)',
        [categoryId, footer_note]
      );
    }

    await connection.commit();
    return res.status(201).json({ success: true, message: 'บันทึกข้อมูลสำเร็จ' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล' });
  } finally {
    connection.release();
  }
};

// ================= ฟังก์ชันอัปเดต (เรียกใช้ตอนกด Edit) =================
const updateRefundRule = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const { id } = req.params;
    const { title, footer_note, subGroups } = req.body;

    const generateSlug = (text) => text.toLowerCase().replace(/&/g, 'and').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-');
    const categorySlug = generateSlug(title);

    // เช็กว่าแก้ชื่อไปซ้ำกับหมวดอื่นที่มีอยู่แล้วหรือไม่ (ยกเว้นตัวเอง)
    const [existing] = await connection.query(
      'SELECT id FROM rule_categories WHERE category = "refund" AND slug = ? AND id != ?', 
      [categorySlug, id]
    );
    if (existing.length > 0) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: 'ชื่อหัวข้อนี้มีอยู่แล้ว โปรดใช้ชื่ออื่น' });
    }

    // 1. อัปเดตหัวข้อหลัก
    await connection.query(
      'UPDATE rule_categories SET name = ?, slug = ? WHERE id = ? AND category = "refund"',
      [title, categorySlug, id]
    );

    // 2. เคลียร์ข้อมูลลูกเก่าทิ้ง
    await connection.query('DELETE FROM rule_subcategories WHERE category_id = ?', [id]);
    await connection.query('DELETE FROM rules WHERE category_id = ?', [id]);
    await connection.query('DELETE FROM rule_footers WHERE category_id = ?', [id]);

    // 3. วนลูปบันทึกข้อมูลลูกใหม่เข้าไป
    if (subGroups && subGroups.length > 0) {
      for (const sg of subGroups) {
        const subTitle = sg.subTitle || '';
        const subSlug = generateSlug(subTitle);

        const [subResult] = await connection.query(
          'INSERT INTO rule_subcategories (category_id, name, slug) VALUES (?, ?, ?)',
          [id, subTitle, subSlug]
        );
        const subcategoryId = subResult.insertId;

        const rulesList = sg.rules || sg.items || [];
        if (rulesList.length > 0) {
          for (const item of rulesList) {
            const penaltyValue = item.penaltyValue || item.penalty_value || null;
            const [itemResult] = await connection.query(
              'INSERT INTO rules (category_id, subcategory_id, rule_text, penalty_value) VALUES (?, ?, ?, ?)',
              [id, subcategoryId, item.text, penaltyValue]
            );
            const itemId = itemResult.insertId;

            if (item.subItems && item.subItems.length > 0) {
              for (const subItem of item.subItems) {
                await connection.query(
                  'INSERT INTO rule_sub_items (item_id, content) VALUES (?, ?)',
                  [itemId, subItem.text]
                );
              }
            }
          }
        }
      }
    }

    if (footer_note) {
      await connection.query('INSERT INTO rule_footers (category_id, note_text) VALUES (?, ?)', [id, footer_note]);
    }

    await connection.commit();
    return res.status(200).json({ success: true, message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (error) {
    await connection.rollback();
    console.error(error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการอัปเดตข้อมูล' });
  } finally {
    connection.release();
  }
};

// ================= ฟังก์ชันลบ (เรียกใช้ตอนกด Delete) =================
const deleteRefundRule = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM rule_categories WHERE id = ? AND category = "refund"', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }

    return res.status(200).json({ success: true, message: 'ลบข้อมูลสำเร็จ' });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการลบข้อมูล' });
  }
};

module.exports = {
  getRefundPolicy,
  createRefundRule,
  updateRefundRule,
  deleteRefundRule
};