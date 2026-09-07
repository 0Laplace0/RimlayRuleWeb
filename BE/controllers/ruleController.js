const db = require('../config/db');

// 1. ดึงข้อมูลกฎทั้งหมด (Nested Structure)
exports.getAllRules = async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT 
        m.id AS main_id, m.title AS main_title, m.icon,
        s.id AS sub_id, s.sub_title,
        i.id AS item_id, i.symbol, i.text
      FROM rules_main m
      LEFT JOIN rule_sub_groups s ON m.id = s.rules_main_id
      LEFT JOIN rule_items i ON s.id = i.sub_group_id
      ORDER BY m.id ASC, s.id ASC, i.id ASC
    `);

    const rulesMap = {};
    rows.forEach(row => {
      if (!rulesMap[row.main_id]) {
        rulesMap[row.main_id] = {
          id: row.main_id,
          title: row.main_title,
          icon: row.icon,
          subGroups: {}
        };
      }
      if (row.sub_id) {
        if (!rulesMap[row.main_id].subGroups[row.sub_id]) {
          rulesMap[row.main_id].subGroups[row.sub_id] = {
            id: row.sub_id,
            sub_title: row.sub_title,
            rules: [] // ปรับให้ตรงกับ Frontend ที่เรียกใช้ .rules หรือ .items
          };
        }
        if (row.item_id) {
          rulesMap[row.main_id].subGroups[row.sub_id].rules.push({
            id: row.item_id,
            symbol: row.symbol,
            text: row.text
          });
        }
      }
    });

    const result = Object.values(rulesMap).map(m => ({
      ...m,
      subGroups: Object.values(m.subGroups)
    }));

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching rules', error: error.message });
  }
};

// 2. บันทึกข้อมูลกฎทั้งหมดแบบครบชุด (Full Structure Create) - รองรับ /api/rules/full
exports.createFullRule = async (req, res) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { title, icon, subGroups } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อหัวข้อหลัก' });
    }

    const [mainResult] = await connection.query(
      'INSERT INTO rules_main (title, icon) VALUES (?, ?)',
      [title, icon || null]
    );
    const mainId = mainResult.insertId;

    if (subGroups && Array.isArray(subGroups)) {
      for (let i = 0; i < subGroups.length; i++) {
        const sub = subGroups[i];
        const [subResult] = await connection.query(
          'INSERT INTO rule_sub_groups (rules_main_id, sub_title, sort_order) VALUES (?, ?, ?)',
          [mainId, sub.sub_title || sub.title, i]
        );
        const subGroupId = subResult.insertId;

        const items = sub.rules || sub.items;
        if (items && Array.isArray(items)) {
          for (let j = 0; j < items.length; j++) {
            const item = items[j];
            await connection.query(
              'INSERT INTO rule_items (sub_group_id, symbol, text, sort_order) VALUES (?, ?, ?, ?)',
              [subGroupId, item.symbol || 'check', item.text, j]
            );
          }
        }
      }
    }

    await connection.commit();
    connection.release();
    res.status(201).json({ message: 'บันทึกข้อมูลกฎทั้งหมดสำเร็จ', mainId });
  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: error.message });
  }
};

// 3. อัปเดตข้อมูลกฎทั้งหมดแบบครบชุดตาม ID (Full Structure Update) - รองรับ PUT /api/rules/full/:id
exports.updateFullRule = async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    const { title, icon, subGroups } = req.body;
    if (!title) {
      return res.status(400).json({ message: 'กรุณากรอกชื่อหัวข้อหลัก' });
    }

    await connection.query(
      'UPDATE rules_main SET title = ?, icon = ? WHERE id = ?',
      [title, icon || null, id]
    );

    // ลบของเก่าทิ้งแล้วใส่ชุดใหม่แทนที่ (ใช้ Cascade บน Sub Groups)
    await connection.query('DELETE FROM rule_sub_groups WHERE rules_main_id = ?', [id]);

    if (subGroups && Array.isArray(subGroups)) {
      for (let i = 0; i < subGroups.length; i++) {
        const sub = subGroups[i];
        const [subResult] = await connection.query(
          'INSERT INTO rule_sub_groups (rules_main_id, sub_title, sort_order) VALUES (?, ?, ?)',
          [id, sub.sub_title || sub.title, i]
        );
        const subGroupId = subResult.insertId;

        const items = sub.rules || sub.items;
        if (items && Array.isArray(items)) {
          for (let j = 0; j < items.length; j++) {
            const item = items[j];
            await connection.query(
              'INSERT INTO rule_items (sub_group_id, symbol, text, sort_order) VALUES (?, ?, ?, ?)',
              [subGroupId, item.symbol || 'check', item.text, j]
            );
          }
        }
      }
    }

    await connection.commit();
    connection.release();
    res.json({ message: 'อัปเดตข้อมูลกฎทั้งหมดสำเร็จ', mainId: id });
  } catch (error) {
    await connection.rollback();
    connection.release();
    res.status(500).json({ error: error.message });
  }
};

// 4. เพิ่ม Rules Main แบบเดี่ยวๆ
exports.createMainRule = async (req, res) => {
  const { title, icon } = req.body;
  try {
    const [result] = await db.query('INSERT INTO rules_main (title, icon) VALUES (?, ?)', [title, icon]);
    res.status(201).json({ id: result.insertId, title, icon });
  } catch (error) {
    res.status(500).json({ message: 'Error adding main rule', error: error.message });
  }
};

// 5. ลบ Rules Main
exports.deleteMainRule = async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM rules_main WHERE id = ?', [id]);
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting rule', error: error.message });
  }
};