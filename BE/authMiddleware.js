const jwt = require('jsonwebtoken');

// ตรวจสอบ Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Access Token Required' });

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid Token' });
    req.user = user; // { id, username, role }
    next();
  });
};

// ตรวจสอบยศ/สิทธิ์
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (ยศไม่ถึง)' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };