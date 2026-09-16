const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เปิดให้เข้าถึงไฟล์รูปภาพที่อัปโหลดได้ผ่าน URL
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes (ปรับชื่อตัวแปรให้ตรงกับตอนเรียกใช้งาน)
const authRoutes = require('./routes/authRoutes');
const activityRuleRoutes = require('./routes/activityRuleRoutes');
const countryRuleRoutes = require('./routes/countryRuleRoutes');
const termsRuleRoutes = require('./routes/termsRuleRoutes');
const refundRuleRoutes = require('./routes/refundRuleRoutes');
const roleplayRuleRoutes = require('./routes/roleplayRuleRoutes');
const streamingPolicyRuleRoutes = require('./routes/streamingPolicyRuleRoutes');
const safezoneRuleRoutes = require('./routes/safezoneRuleRoutes');
const policeRuleRoutes = require('./routes/policeRuleRoutes'); 
const doctorRuleRoutes = require('./routes/doctorRuleRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api', activityRuleRoutes); 
app.use('/api', countryRuleRoutes);
app.use('/api', termsRuleRoutes);
app.use('/api', refundRuleRoutes);
app.use('/api', roleplayRuleRoutes);
app.use('/api', streamingPolicyRuleRoutes);
app.use('/api', safezoneRuleRoutes);
app.use('/api', policeRuleRoutes);
app.use('/api', doctorRuleRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});