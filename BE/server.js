const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// เปิดให้เข้าถึงไฟล์รูปภาพที่อัปโหลดได้ผ่าน URL เช่น http://localhost:5000/uploads/...
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Import Routes
const authRoutes = require('./routes/authRoutes');
const activityRuleRoutes = require('./routes/activityRuleRoutes');
const countryRuleRoutes = require('./routes/countryRuleRoutes');
const termsRoutes = require('./routes/termsRoutes');
const refundRoutes = require('./routes/refundRoutes');
const roleplayRuleRoutes = require('./routes/roleplayRuleRoutes');
const streamingPolicyRoutes = require('./routes/streamingPolicyRoutes');
const safezoneRoutes = require('./routes/safezoneRoutes');

// Use Routes
app.use('/api/auth', authRoutes);
app.use('/api', activityRuleRoutes); 
app.use('/api', countryRuleRoutes);
app.use('/api', termsRoutes);
app.use('/api', refundRoutes);
app.use('/api', roleplayRuleRoutes);
app.use('/api', streamingPolicyRoutes);
app.use('/api', safezoneRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});