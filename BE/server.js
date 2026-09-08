const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// นำเข้า Routes
const authRoutes = require('./routes/authRoutes');
const ruleRoutes = require('./routes/ruleRoutes');

// กำหนด Endpoint Prefix
app.use('/api/auth', authRoutes);
app.use('/api', ruleRoutes);

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});