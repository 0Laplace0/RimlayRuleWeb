import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [usersList, setUsersList] = useState([]);

  // 1. ฟังก์ชัน Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username,
        password
      });

      const { token, user } = res.data;
      setToken(token);
      setUser(user);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setMessage('เข้าสู่ระบบสำเร็จ!');
    } catch (err) {
      setMessage(err.response?.data?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อ');
    }
  };

  // 2. ฟังก์ชัน ดึงรายชื่อผู้ใช้ทั้งหมด (เฉพาะ Admin)
  const fetchUsers = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsersList(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'ไม่มีสิทธิ์เข้าถึงข้อมูลนี้');
    }
  };

  // 3. ฟังก์ชัน Logout
  const handleLogout = () => {
    setToken('');
    setUser(null);
    setUsersList([]);
    localStorage.clear();
  };

  return (
    <div style={{ maxWidth: '600px', margin: '50px auto', fontFamily: 'sans-serif', padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
      <h1>RimlayRule Portal</h1>

      {!token ? (
        <form onSubmit={handleLogin}>
          <h2>เข้าสู่ระบบ</h2>
          {message && <p style={{ color: 'red' }}>{message}</p>}
          <div style={{ marginBottom: '10px' }}>
            <label>Username / Email: </label><br />
            <input 
              type="text" 
              value={username} 
              onChange={(e) => setUsername(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <div style={{ marginBottom: '15px' }}>
            <label>Password: </label><br />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              style={{ width: '100%', padding: '8px', marginTop: '5px' }}
            />
          </div>
          <button type="submit" style={{ padding: '10px 20px', cursor: 'pointer' }}>Login</button>
        </form>
      ) : (
        <div>
          <h2>ยินดีต้อนรับ, {user?.full_name} ({user?.role})</h2>
          <button onClick={handleLogout} style={{ padding: '8px 15px', background: 'red', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            Logout
          </button>

          <hr style={{ margin: '20px 0' }} />

          {user?.role === 'admin' ? (
            <div>
              <h3>Admin Management Panel</h3>
              <button onClick={fetchUsers} style={{ padding: '8px 15px', cursor: 'pointer' }}>
                ดึงรายชื่อผู้ใช้ทั้งหมด
              </button>

              {usersList.length > 0 && (
                <table border="1" cellPadding="8" style={{ marginTop: '15px', width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Role</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.role}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          ) : (
            <p>ยินดีต้อนรับสมาชิก! คุณอยู่ในหน้าเมมเบอร์ทั่วไป</p>
          )}
        </div>
      )}
    </div>
  );
}

export default App;