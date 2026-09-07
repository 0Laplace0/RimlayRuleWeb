import { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [userData, setUserData] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [error, setError] = useState('');

  // ฟังก์ชัน เข้าสู่ระบบ
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', { username, password });
      localStorage.setItem('token', res.data.token);
      setUserData(res.data.user);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'เกิดข้อผิดพลาด');
    }
  };

  // ฟังก์ชัน ดึงข้อมูลแดชบอร์ดเฉพาะ Admin
  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAdminUsers(res.data);
      setError('');
    } catch (err) {
      setError(err.response?.data?.message || 'เข้าถึงไม่ได้');
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>RimlayRule Portal</h1>

      {!userData ? (
        <form onSubmit={handleLogin}>
          <h2>เข้าสู่ระบบ</h2>
          <div>
            <input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          </div>
          <div style={{ marginTop: '10px' }}>
            <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} />
          </div>
          <button type="submit" style={{ marginTop: '10px' }}>Login</button>
        </form>
      ) : (
        <div>
          <h2>ยินดีต้อนรับ: {userData.full_name}</h2>
          <p>ยศของคุณ: <strong>{userData.role.toUpperCase()}</strong></p>

          <button onClick={fetchAdminData}>ดึงข้อมูลสมาชิกทั้งหมด (สำหรับ Admin/Moderator)</button>

          {adminUsers.length > 0 && (
            <div>
              <h3>รายชื่อสมาชิกทั้งหมดในระบบ:</h3>
              <ul>
                {adminUsers.map(u => (
                  <li key={u.id}>{u.username} - ยศ: {u.role} ({u.email})</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
    </div>
  );
}

export default App;