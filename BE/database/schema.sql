-- 1. ตารางเก็บข้อมูลผู้ใช้งาน (Users & Authentication)
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 2. ตารางหัวข้อหลัก (Main Rules)
CREATE TABLE rules_main (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    icon TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 3. ตารางหมวดหมู่ย่อย (Rule Sub-Groups)
CREATE TABLE rule_sub_groups (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rules_main_id INT NOT NULL,
    sub_title VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (rules_main_id) REFERENCES rules_main(id) ON DELETE CASCADE
);

-- 4. ตารางรายการกฎแต่ละข้อ (Rule Items)
CREATE TABLE rule_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sub_group_id INT NOT NULL,
    symbol VARCHAR(50) NOT NULL DEFAULT 'check',
    text TEXT NOT NULL,
    sort_order INT DEFAULT 0,
    FOREIGN KEY (sub_group_id) REFERENCES rule_sub_groups(id) ON DELETE CASCADE
);