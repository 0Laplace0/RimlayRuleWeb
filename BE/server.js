const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require('./routes/authRoutes');
const activityRuleRoutes = require('./routes/activityRuleRoutes');
const countryRuleRoutes = require('./routes/countryRuleRoutes');
const termsRoutes = require('./routes/termsRoutes');
const refundRoutes = require('./routes/refundRoutes');

app.use('/api/auth', authRoutes);
app.use('/api', activityRuleRoutes); 
app.use('/api', countryRuleRoutes);
app.use('/api', termsRoutes);
app.use('/api', refundRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});