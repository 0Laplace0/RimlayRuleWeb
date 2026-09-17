import { useState } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';

const Login = ({ onLoginSuccess }) => {
  const [form, setForm] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // ปรับ path ให้ตรงกับ BE เช่น /auth/login หรือ /login
      const res = await axios.post(`${API_URL}/auth/login`, {
        username: form.identifier, 
        password: form.password
      });

      const responseData = res.data.data || res.data;
      const token = responseData.token || res.data.token;
      const user = responseData.user || res.data.user;

      if (token) {
        localStorage.setItem('token', token);
      }
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }

      swalUtils.success('เข้าสู่ระบบสำเร็จ!', 'ยินดีต้อนรับกลับสู่ระบบ');

      if (onLoginSuccess) {
        onLoginSuccess(res.data);
      } else {
        window.location.href = '/';
      }
    } catch (err) {
      swalUtils.error('เข้าสู่ระบบไม่สำเร็จ', err.response?.data?.message || 'กรุณาตรวจสอบชื่อผู้ใช้และรหัสผ่านอีกครั้ง');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-[#1e293b] border border-indigo-950/60 rounded-2xl shadow-xl p-8 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-white tracking-wide">เข้าสู่ระบบ</h1>
          <p className="text-sm text-gray-400">ระบบจัดการหลังบ้าน Rimlay</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold block">ชื่อผู้ใช้ / อีเมล</label>
            <input
              type="text"
              name="identifier"
              required
              value={form.identifier}
              onChange={handleChange}
              placeholder="กรอกชื่อผู้ใช้หรืออีเมล"
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-gray-400 font-semibold block">รหัสผ่าน</label>
            <input
              type="password"
              name="password"
              required
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full px-4 py-3 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 rounded-xl font-bold text-white transition shadow-lg shadow-blue-600/20 cursor-pointer"
            >
              {loading ? 'กำลังตรวจสอบสิทธิ์...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;