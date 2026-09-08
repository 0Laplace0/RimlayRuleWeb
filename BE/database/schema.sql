-- Users Schema

-- 1. ตารางเก็บข้อมูลผู้ใช้งาน (Users & Authentication)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Rules Schema

-- 1. ตารางหมวดหมู่หลัก (ปรับปรุงให้รองรับ category และแก้ unique key)
CREATE TABLE IF NOT EXISTS rule_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category VARCHAR(50) NOT NULL DEFAULT 'activity' COMMENT 'ประเภทหมวดหมู่ เช่น activity, country, safezone',
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อหัวข้อหลัก',
    slug VARCHAR(255) NOT NULL COMMENT 'URL slug สำหรับอ้างอิง',
    sort_order INT DEFAULT 0 COMMENT 'ลำดับการแสดงผล',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    -- เปลี่ยนจาก UNIQUE(slug) เดี่ยวๆ เป็น Unique ร่วมกันระหว่าง category กับ slug
    CONSTRAINT unique_category_slug UNIQUE (category, slug)
);

-- 2. ตารางหมวดหมู่ย่อย (สำหรับหมวดที่มีข้อย่อย)
CREATE TABLE IF NOT EXISTS rule_subcategories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT 'เชื่อมไปหมวดหมู่หลัก (FK)',
    name VARCHAR(255) NOT NULL COMMENT 'ชื่อหมวดหมู่ย่อย',
    slug VARCHAR(255) NOT NULL COMMENT 'URL slug ย่อย',
    sort_order INT DEFAULT 0 COMMENT 'ลำดับการแสดงผล',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES rule_categories(id) ON DELETE CASCADE
);

-- 3. ตารางรายการกฎข้อบังคับ (รองรับทั้งผูกกับหมวดหมู่หลักโดยตรง หรือผูกผ่านหมวดหมู่ย่อย)
CREATE TABLE IF NOT EXISTS rules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT 'เชื่อมหมวดหมู่หลัก (FK)',
    subcategory_id INT NULL COMMENT 'เชื่อมหมวดหมู่ย่อย (ถ้ามี) (FK)',
    title VARCHAR(255) NULL COMMENT 'หัวข้อใหญ่ของกฎ (ถ้ามี)',
    rule_text TEXT NOT NULL COMMENT 'เนื้อหากฎข้อบังคับ / หัวข้อย่อย',
    penalty_value VARCHAR(255) NULL COMMENT 'บทลงโทษ เช่น ปรับ 5000 IC, ใบเหลือง',
    sort_order INT DEFAULT 0 COMMENT 'ลำดับข้อกฎหมาย',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES rule_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES rule_subcategories(id) ON DELETE CASCADE
);

-- 4. ตารางหมายเหตุท้ายหมวดหมู่ (Footers / Notes)
CREATE TABLE IF NOT EXISTS rule_footers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    category_id INT NOT NULL COMMENT 'เชื่อมหมวดหมู่หลัก (FK)',
    subcategory_id INT NULL COMMENT 'เชื่อมหมวดหมู่ย่อย (ถ้ามี) (FK)',
    note_text TEXT NOT NULL COMMENT 'ข้อความหมายเหตุ',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES rule_categories(id) ON DELETE CASCADE,
    FOREIGN KEY (subcategory_id) REFERENCES rule_subcategories(id) ON DELETE CASCADE
);