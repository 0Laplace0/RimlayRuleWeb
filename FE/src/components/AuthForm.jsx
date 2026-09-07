import { useState } from 'react';
import Navbar from './Navbar';

const AuthForm = ({ title, buttonText, onSubmit, isRegister = false, togglePath, toggleText }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isRegister) {
      onSubmit({ username, email, password });
    } else {
      onSubmit({ username, password });
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full">
      <Navbar />

      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center w-full">
        {/* การ์ดหลักขอบสีม่วงเข้มจางๆ */}
        <div className="bg-[#0b0b0d] border border-purple-950/40 p-8 rounded-xl shadow-2xl shadow-purple-950/10 max-w-sm w-full">
          {/* เปลี่ยนหัวข้อเป็นสีม่วงสว่าง */}
          <h2 className="text-2xl font-bold text-purple-400 mb-6 tracking-wider">{title}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input: Username */}
            <input
              type="text"
              placeholder="ชื่อผู้ใช้งาน"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 rounded bg-[#14141a] border border-purple-950/60 text-white focus:outline-none focus:border-purple-500 transition-all duration-200"
              required
            />

            {/* Input: Email (เฉพาะ Register) */}
            {isRegister && (
              <input
                type="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 rounded bg-[#14141a] border border-purple-950/60 text-white focus:outline-none focus:border-purple-500 transition-all duration-200"
                required
              />
            )}

            {/* Input: Password */}
            <input
              type="password"
              placeholder="รหัสผ่าน"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded bg-[#14141a] border border-purple-950/60 text-white focus:outline-none focus:border-purple-500 transition-all duration-200"
              required
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold transition duration-300 hover:shadow-lg hover:shadow-purple-900/40"
            >
              {buttonText}
            </button>
          </form>

          <div className="mt-6 text-sm text-gray-400">
            <a href={togglePath} className="hover:text-purple-400 transition duration-200">
              {toggleText}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthForm;