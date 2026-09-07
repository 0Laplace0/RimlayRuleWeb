const jwt = require('jsonwebtoken');

// ตรวจสอบ Token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access Token Required' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'secretkey', (err, user) => {
    if (err) {
      return res.status(401).json({ message: 'Invalid or Expired Token' });
    }
    req.user = user; // { id, username, role }
    next();
  });
};

// ตรวจสอบยศ/สิทธิ์
const checkRole = (roles = []) => {
  return (req, res, next) => {
    // ป้องกัน App Crash หากลืมใช้ verifyToken ก่อนหน้า
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'คุณไม่มีสิทธิ์เข้าถึงส่วนนี้ (ยศไม่ถึง)' });
    }
    next();
  };
};

module.exports = { verifyToken, checkRole };