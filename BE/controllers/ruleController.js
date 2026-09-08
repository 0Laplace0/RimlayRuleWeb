const db = require('../config/db');

// [READ] ดึงข้อมูลกฎตามประเภท (ผ่าน slug ของหมวดหมู่ เช่น /api/rules/activity)
exports.getRulesByType = async (req, res) => {
  const { categoryType } = req.params; 
  try {
    const [categories] = await db.query(
      'SELECT * FROM rule_categories WHERE slug = ?', 
      [categoryType]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: 'ไม่พบหมวดหมู่ดังกล่าว' });
    }

    const category = categories[0];

    const [subcategories] = await db.query(
      'SELECT * FROM rule_subcategories WHERE category_id = ? ORDER BY sort_order ASC, id ASC', 
      [category.id]
    );

    let subcategoriesData = [];

    if (subcategories.length > 0) {
      subcategoriesData = await Promise.all(subcategories.map(async (sub) => {
        const [rules] = await db.query(
          'SELECT * FROM rules WHERE subcategory_id = ? ORDER BY sort_order ASC, id ASC', 
          [sub.id]
        );
        return {
          id: sub.id,
          subTitle: sub.name,
          rules: rules.map(rule => ({
            id: rule.id,
            title: rule.title,
            text: rule.rule_text,
            penaltyValue: rule.penalty_value
          }))
        };
      }));
    } else {
      const [directRules] = await db.query(
        'SELECT * FROM rules WHERE category_id = ? AND subcategory_id IS NULL ORDER BY sort_order ASC, id ASC', 
        [category.id]
      );
      subcategoriesData = [{
        id: null,
        subTitle: null,
        rules: directRules.map(rule => ({
          id: rule.id,
          title: rule.title,
          text: rule.rule_text,
          penaltyValue: rule.penalty_value
        }))
      }];
    }

    const [footers] = await db.query(
      'SELECT * FROM rule_footers WHERE category_id = ?', 
      [category.id]
    );

    const result = {
      id: category.id,
      name: category.name,
      slug: category.slug,
      footerNote: footers.length > 0 ? footers[0].note_text : null,
      subcategories: subcategoriesData
    };

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// [READ ALL] ดึงข้อมูลรายการหลักทั้งหมด (สำหรับตารางหน้าจัดการ)
exports.getAllRules = async (req, res) => {
  try {
    const [categories] = await db.query('SELECT * FROM rule_categories ORDER BY id ASC');
    
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
            text: r.rule_text,
            penaltyValue: r.penalty_value
          }))
        };
      }));

      const [footers] = await db.query('SELECT * FROM rule_footers WHERE category_id = ?', [cat.id]);

      return {
        id: cat.id,
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

// [CREATE FULL] เพิ่มหัวข้อ หมวดหมู่ย่อย และกฎ แบบครบชุดในครั้งเดียว
exports.createFullRule = async (req, res) => {
  const { title, footerNote, subGroups } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const slug = title ? title.toLowerCase().replace(/\s+/g, '-') : '';

    const [catResult] = await connection.query(
      'INSERT INTO rule_categories (name, slug) VALUES (?, ?)',
      [title, slug]
    );
    const categoryId = catResult.insertId;

    if (subGroups && subGroups.length > 0) {
      for (const [subIndex, sub] of subGroups.entries()) {
        const subTitleName = sub.subTitle || sub.sub_title || '';
        const subSlug = subTitleName ? subTitleName.toLowerCase().replace(/\s+/g, '-') : `sub-${Date.now()}-${subIndex}`;

        const [subResult] = await connection.query(
          'INSERT INTO rule_subcategories (category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)',
          [categoryId, subTitleName, subSlug, subIndex]
        );
        const subcategoryId = subResult.insertId;

        const rulesList = sub.rules || sub.items || [];
        if (rulesList.length > 0) {
          for (const [ruleIndex, rule] of rulesList.entries()) {
            await connection.query(
              'INSERT INTO rules (category_id, subcategory_id, rule_text, penalty_value, sort_order) VALUES (?, ?, ?, ?, ?)',
              [categoryId, subcategoryId, rule.text, rule.penaltyValue || rule.penalty_value || null, ruleIndex]
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
    res.status(201).json({ message: 'เพิ่มข้อมูลสำเร็จ', id: categoryId });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("CREATE ERROR DETAILED:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// [UPDATE FULL] อัปเดตข้อมูลแบบโครงสร้างครบชุด (แก้ไขให้ถูกต้องและสมบูรณ์)
exports.updateFullRule = async (req, res) => {
  const { id } = req.params;
  const { title, footerNote, subGroups } = req.body;
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const slug = title ? title.toLowerCase().replace(/\s+/g, '-') : undefined;

    if (title) {
      await connection.query(
        'UPDATE rule_categories SET name = ?, slug = ? WHERE id = ?',
        [title, slug, id]
      );
    }

    // ลบ Subgroups และ Rules เก่าออกก่อนจัดการชุดใหม่
    const [oldSubs] = await connection.query('SELECT id FROM rule_subcategories WHERE category_id = ?', [id]);
    for (const sub of oldSubs) {
      await connection.query('DELETE FROM rules WHERE subcategory_id = ?', [sub.id]);
    }
    await connection.query('DELETE FROM rule_subcategories WHERE category_id = ?', [id]);

    // เพิ่ม Subgroups และ Rules ใหม่เข้าไป
    if (subGroups && subGroups.length > 0) {
      for (const [subIndex, sub] of subGroups.entries()) {
        const subTitleName = sub.subTitle || sub.sub_title || '';
        const subSlug = subTitleName ? subTitleName.toLowerCase().replace(/\s+/g, '-') : `sub-${Date.now()}-${subIndex}`;

        const [subResult] = await connection.query(
          'INSERT INTO rule_subcategories (category_id, name, slug, sort_order) VALUES (?, ?, ?, ?)',
          [id, subTitleName, subSlug, subIndex]
        );
        const subcategoryId = subResult.insertId;

        const rulesList = sub.rules || sub.items || [];
        if (rulesList.length > 0) {
          for (const [ruleIndex, rule] of rulesList.entries()) {
            await connection.query(
              'INSERT INTO rules (category_id, subcategory_id, rule_text, penalty_value, sort_order) VALUES (?, ?, ?, ?, ?)',
              [id, subcategoryId, rule.text, rule.penaltyValue || rule.penalty_value || null, ruleIndex]
            );
          }
        }
      }
    }

    // จัดการ Footer Note
    await connection.query('DELETE FROM rule_footers WHERE category_id = ?', [id]);
    if (footerNote) {
      await connection.query(
        'INSERT INTO rule_footers (category_id, note_text) VALUES (?, ?)',
        [id, footerNote]
      );
    }

    await connection.commit();
    res.json({ message: 'อัปเดตข้อมูลสำเร็จ' });
  } catch (err) {
    if (connection) await connection.rollback();
    console.error("UPDATE ERROR DETAILED:", err);
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// [DELETE MAIN] ลบหัวข้อหลัก (รวมถึง Subgroups และ Rules ที่ผูกอยู่)
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
    res.json({ message: 'ลบหัวข้อหลักสำเร็จ' });
  } catch (err) {
    if (connection) await connection.rollback();
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) connection.release();
  }
};

// ฟังก์ชันย่อยเดิม
exports.createRuleItem = async (req, res) => {
  const { category_id, subcategory_id, title, rule_text, penalty_value, sort_order } = req.body;
  try {
    const [result] = await db.query(
      `INSERT INTO rules (category_id, subcategory_id, title, rule_text, penalty_value, sort_order) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [category_id, subcategory_id || null, title || null, rule_text, penalty_value || null, sort_order || 0]
    );
    res.status(201).json({ message: 'เพิ่มกฎสำเร็จ', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateRuleItem = async (req, res) => {
  const { id } = req.params;
  const { title, rule_text, penalty_value, sort_order } = req.body;
  try {
    await db.query(
      `UPDATE rules 
       SET title = ?, rule_text = ?, penalty_value = ?, sort_order = ? 
       WHERE id = ?`,
      [title || null, rule_text, penalty_value || null, sort_order || 0, id]
    );
    res.json({ message: 'อัปเดตกฎสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteRuleItem = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM rules WHERE id = ?', [id]);
    res.json({ message: 'ลบกฎสำเร็จ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};