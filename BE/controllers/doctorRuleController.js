const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../data');
const dataFilePath = path.join(dataDir, 'doctorRules.json');

// ช่วยอ่านข้อมูลจากไฟล์อย่างปลอดภัย
const getStoredData = () => {
  try {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    if (!fs.existsSync(dataFilePath)) {
      fs.writeFileSync(dataFilePath, JSON.stringify([], null, 2), 'utf-8');
      return [];
    }

    const rawData = fs.readFileSync(dataFilePath, 'utf-8');
    if (!rawData || !rawData.trim()) {
      return [];
    }

    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error reading/parsing stored data:', error.message);
    return [];
  }
};

// ช่วยบันทึกข้อมูลอย่างปลอดภัย
const saveData = (data) => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2), 'utf-8');
};

// 1. Get All Categories / Rules
exports.getDoctorRules = async (req, res) => {
  try {
    const data = getStoredData();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error in getDoctorRules:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Create Category/Section
exports.createDoctorRuleCategory = async (req, res) => {
  try {
    let { title, type, items, subGroups, footerNote, footer_note } = req.body;
    const files = req.files || [];

    const finalFooterNote = footerNote || footer_note || '';

    // แปลง subGroups หากส่งมาเป็น JSON string
    if (typeof subGroups === 'string') {
      try {
        subGroups = JSON.parse(subGroups);
      } catch (e) {
        subGroups = [];
      }
    }

    // แปลง images data (caption) ที่ส่งมาคู่กันจาก FormData
    let imagesData = [];
    if (req.body.images) {
      try {
        imagesData = typeof req.body.images === 'string' 
          ? JSON.parse(req.body.images) 
          : req.body.images;
      } catch (e) {
        imagesData = [];
      }
    }

    // จัดการรูปภาพและ Path
    const images = files.map((file, index) => {
      const captionObj = imagesData[index] || {};
      return {
        id: `img_${Date.now()}_${index}`,
        imageUrl: `/uploads/doctor-rules/${file.filename}`,
        caption: captionObj.caption || req.body[`images[${index}][caption]`] || ''
      };
    });

    const data = getStoredData();

    const newCategory = {
      id: Date.now().toString(),
      title: title || '',
      type: type || 'rule',
      items: items || [],
      subGroups: subGroups || [],
      images: images,
      footerNote: finalFooterNote,
      createdAt: new Date()
    };

    data.push(newCategory);
    saveData(data);

    res.status(201).json({ success: true, data: newCategory, message: 'เพิ่มข้อมูลเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error in createDoctorRuleCategory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Update Category/Section
exports.updateDoctorRuleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let { title, type, items, subGroups, footerNote, footer_note } = req.body;
    const files = req.files || [];
    let data = getStoredData();

    const index = data.findIndex(item => item.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการแก้ไข' });
    }

    if (typeof subGroups === 'string') {
      try {
        subGroups = JSON.parse(subGroups);
      } catch (e) {
        subGroups = data[index].subGroups;
      }
    }

    let imagesData = [];
    if (req.body.images) {
      try {
        imagesData = typeof req.body.images === 'string' 
          ? JSON.parse(req.body.images) 
          : req.body.images;
      } catch (e) {
        imagesData = [];
      }
    }

    // รวมรูปภาพเดิมที่มีอยู่ กับรูปภาพใหม่ที่อัปโหลดเข้ามา
    let existingImages = data[index].images || [];
    if (files.length > 0) {
      const newImages = files.map((file, i) => {
        const captionObj = imagesData[i] || {};
        return {
          id: `img_${Date.now()}_${i}`,
          imageUrl: `/uploads/doctor-rules/${file.filename}`,
          caption: captionObj.caption || req.body[`images[${i}][caption]`] || ''
        };
      });
      existingImages = [...existingImages, ...newImages];
    }

    const finalFooterNote = footerNote !== undefined 
      ? footerNote 
      : (footer_note !== undefined ? footer_note : data[index].footerNote);

    data[index] = {
      ...data[index],
      title: title !== undefined ? title : data[index].title,
      type: type !== undefined ? type : data[index].type,
      items: items !== undefined ? items : data[index].items,
      subGroups: subGroups !== undefined ? subGroups : data[index].subGroups,
      images: existingImages,
      footerNote: finalFooterNote,
      updatedAt: new Date()
    };

    saveData(data);
    res.status(200).json({ success: true, data: data[index], message: 'อัปเดตข้อมูลเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error in updateDoctorRuleCategory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Delete Category/Section
exports.deleteDoctorRuleCategory = async (req, res) => {
  try {
    const { id } = req.params;
    let data = getStoredData();

    const targetItem = data.find(item => item.id === id);
    if (!targetItem) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลที่ต้องการลบ' });
    }

    // ลบไฟล์รูปภาพจริงออกจาก Server เมื่อข้อมูลถูกลบ
    if (targetItem.images && targetItem.images.length > 0) {
      targetItem.images.forEach(img => {
        if (img.imageUrl) {
          const filePath = path.join(__dirname, '..', img.imageUrl);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }
      });
    }

    const filteredData = data.filter(item => item.id !== id);
    saveData(filteredData);
    
    res.status(200).json({ success: true, message: 'ลบข้อมูลเรียบร้อยแล้ว' });
  } catch (error) {
    console.error('Error in deleteDoctorRuleCategory:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};