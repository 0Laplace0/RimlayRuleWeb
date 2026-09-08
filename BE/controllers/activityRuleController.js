const db = require('../config/db');

// [READ ALL] ดึงข้อมูลเฉพาะหมวด activity สำหรับหน้าตารางจัดการ
exports.getAllRules = async (req, res) => {
  try {
    const [categories] = await db.query(
      'SELECT * FROM rule_categories WHERE category = ? ORDER BY id ASC', 
      ['activity']
    );
    
    const fullData = await Promise.all(categories.map(async (cat) => {
      const [subcategories] = await db.query(
        'SELECT * FROM rule_subcategories WHERE category_id = ? ORDER BY sort_order ASC, id ASC',
        [cat.id]
      );

      const subGroups = await Promise.all(subcategories.map(async (sub) => {
        const [rules] = await db.query(
          'SELECT * FROM rules WHERE subcategory_id = ? ORDER BY sort_order ASC, id ASC',
          [sub.id]
        );
        return {
          id: sub.id,
          subTitle: sub.name,
          rules: rules.map(r => ({
            id: r.id,
            title: r.title,
            text: r.rule_text,
            penaltyValue: r.penalty_value
          }))
        };
      }));

      const [footers] = await db.query('SELECT * FROM rule_footers WHERE category_id = ?', [cat.id]);

      return {
        id: cat.id,
        category: cat.category,
        title: cat.name,
        slug: cat.slug,
        footerNote: footers.length > 0 ? footers[0].note_text : '',
        subGroups: subGroups
      };
    }));

    res.json(fullData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// [CREATE FULL] เพิ่มข้อมูลกิจกรรมแบบครบชุดในครั้งเดียว (ล็อก category เป็น activity)
exports.createFullRule = async (req, res) => {
  const { title, footerNote, subGroups } = req.body;
  const ruleCategory = 'activity'; // ล็อกค่าเป็น activity

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const slug = title ? title.toLowerCase().trim().replace(/\s+/g, '-') : '';

    const [catResult] = await connection.query(
      'INSERT INTO rule_categories (category, name, slug) VALUES (?, ?, ?)',
      [ruleCategory, title, slug]
    );
    const categoryId = catResult.insertId;

    if (subGroups && subGroups.length > 0) {
      for (const [subIndex, sub] of subGroups.entries()) {
        const subTitleName = sub.subTitle || sub.sub_title || '';
        const subSlug = subTitleName ? subTitleName.toLowerCase().trim().replace(/\s+/g, '-') : `sub-${Date.now()}-${subIndex}`;

        const [subResult] = await connection.query(
          'INSERT INTO rule_subcategories (category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)',
          [categoryId, subTitleName, subSlug, subIndex]
        );
        const subcategoryId = subResult.insertId;

        const rulesList = sub.rules || sub.items || [];
        if (rulesList.length > 0) {
          for (const [ruleIndex, rule] of rulesList.entries()) {
            await connection.query(
              'INSERT INTO rules (category_id, subcategory_id, title, rule_text, penalty_value, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
              [categoryId, subcategoryId, rule.title || null, rule.text, rule.penaltyValue || rule.penalty_value || null, ruleIndex]
            );
          }
        }
      }
    }

    if (footerNote) {
      await connection.query(
        'INSERT INTO rule_footers (category_id, note_text) VALUES (?, ?)',
        [categoryId, footerNote]
      );
    }

    await connection.commit();
    res.status(201).json({ message: 'เพิ่มข้อมูลกิจกรรมสำเร็จ', id: categoryId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("CREATE ERROR DETAILED:", err);
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'ชื่อหัวข้อนี้มีอยู่แล้วในหมวดหมู่เดียวกัน กรุณาเปลี่ยนชื่อใหม่' });
    }
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// [UPDATE FULL] อัปเดตข้อมูลกิจกรรมแบบครบชุด
exports.updateFullRule = async (req, res) => {
  const { id } = req.params;
  const { title, footerNote, subGroups } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const slug = title ? title.toLowerCase().trim().replace(/\s+/g, '-') : undefined;

    if (title) {
      const [currentCat] = await connection.query('SELECT * FROM rule_categories WHERE id = ?', [id]);
      if (currentCat.length === 0) {
        await connection.rollback();
        return res.status(404).json({ error: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
      }

      const newTitle = title || currentCat[0].name;
      const newSlug = slug || currentCat[0].slug;

      await connection.query(
        'UPDATE rule_categories SET category = ?, name = ?, slug = ? WHERE id = ?',
        ['activity', newTitle, newSlug, id]
      );
    }

    const [oldSubs] = await connection.query('SELECT id FROM rule_subcategories WHERE category_id = ?', [id]);
    for (const sub of oldSubs) {
      await connection.query('DELETE FROM rules WHERE subcategory_id = ?', [sub.id]);
    }
    await connection.query('DELETE FROM rule_subcategories WHERE category_id = ?', [id]);

    if (subGroups && subGroups.length > 0) {
      for (const [subIndex, sub] of subGroups.entries()) {
        const subTitleName = sub.subTitle || sub.sub_title || '';
        const subSlug = subTitleName ? subTitleName.toLowerCase().trim().replace(/\s+/g, '-') : `sub-${Date.now()}-${subIndex}`;

        const [subResult] = await connection.query(
          'INSERT INTO rule_subcategories (category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)',
          [id, subTitleName, subSlug, subIndex]
        );
        const subcategoryId = subResult.insertId;

        const rulesList = sub.rules || sub.items || [];
        if (rulesList.length > 0) {
          for (const [ruleIndex, rule] of rulesList.entries()) {
            await connection.query(
              'INSERT INTO rules (category_id, subcategory_id, title, rule_text, penalty_value, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
              [id, subcategoryId, rule.title || null, rule.text, rule.penaltyValue || rule.penalty_value || null, ruleIndex]
            );
          }
        }
      }
    }

    await connection.query('DELETE FROM rule_footers WHERE category_id = ?', [id]);
    if (footerNote) {
      await connection.query(
        'INSERT INTO rule_footers (category_id, note_text) VALUES (?, ?)',
        [id, footerNote]
      );
    }

    await connection.commit();
    res.json({ message: 'อัปเดตข้อมูลกิจกรรมสำเร็จ' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("UPDATE ERROR DETAILED:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// [DELETE MAIN] ลบหัวข้อหลักของกิจกรรม (รวมถึง Subgroups และ Rules ที่ผูกอยู่)
exports.deleteMainRule = async (req, res) => {
  const { id } = req.params;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [subs] = await connection.query('SELECT id FROM rule_subcategories WHERE category_id = ?', [id]);
    for (const sub of subs) {
      await connection.query('DELETE FROM rules WHERE subcategory_id = ?', [sub.id]);
    }
    await connection.query('DELETE FROM rule_subcategories WHERE category_id = ?', [id]);
    await connection.query('DELETE FROM rule_footers WHERE category_id = ?', [id]);
    await connection.query('DELETE FROM rule_categories WHERE id = ?', [id]);

    await connection.commit();
    res.json({ message: 'ลบหัวข้อกิจกรรมสำเร็จ' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};