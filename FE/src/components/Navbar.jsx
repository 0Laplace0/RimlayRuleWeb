import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/hero.png';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRulesDropdownOpen, setIsRulesDropdownOpen] = useState(false);
  const [rulesCategories, setRulesCategories] = useState([]);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ดึงข้อมูลกฎทั้งหมดจาก Backend เพื่อนำมาแสดงเป็นหัวข้อย่อยในหมวด "กิจกรรม"
  useEffect(() => {
    const fetchRulesMenu = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/rules');
        if (response.ok) {
          const data = await response.json();
          setRulesCategories(data);
        }
      } catch (err) {
        console.error('Failed to fetch rules menu:', err);
      }
    };

    fetchRulesMenu();
  }, []);

  // ปิด Dropdown เมื่อคลิกพื้นที่ด้านนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsRulesDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ฟังก์ชันควบคุมการพาไปยังหน้า Rules
  const handleNavigateRule = (categoryName, mainId = null) => {
    setIsRulesDropdownOpen(false);
    // ถ้ามี mainId จะส่ง state ไปเปิดหน้าตารางย่อยนั้นทันที แต่ถ้าไม่มี (เช่นกด "กฎประเทศ") จะไปหน้ารวม
    navigate('/rules', { state: { categoryName, selectedMainId: mainId } });
  };

  return (
    <div className="w-full relative">
      <nav className="w-full">
        <div className="w-full bg-[#0b0b0d] border-b border-purple-950/60 flex items-center justify-between px-8 py-4 shadow-2xl relative z-50">
          
          {/* LOGO */}
          <Link to="/" className="flex items-center">
            <img 
              src={logo} 
              alt="Rimlay Logo" 
              className="h-12 w-auto object-contain cursor-pointer" 
            />
          </Link>

          {/* MENU & LOGIN BUTTON */}
          <div className="flex items-center space-x-8 text-sm font-medium text-gray-300">
            
            {/* เมนูกฎประเทศ แบบมี Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsRulesDropdownOpen(!isRulesDropdownOpen)}
                className="flex items-center gap-2 hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none"
              >
                <span>กฎประเทศ</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isRulesDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* กล่องเมนูดรอปดาวน์ย่อย */}
              {isRulesDropdownOpen && (
                <div className="absolute left-0 mt-3 w-72 bg-[#0b0b0d] border border-purple-900/60 rounded-xl shadow-2xl py-3 z-50 backdrop-blur-md max-h-[80vh] overflow-y-auto">
                  
                  {/* 1. กฎประเทศ (กดแล้วไปหน้ารวม Grid ทันที โดยไม่ส่ง mainId) */}
                  <button
                    onClick={() => handleNavigateRule('กฎประเทศ', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold border-b border-purple-950/60 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    กฎประเทศ
                  </button>

                  {/* 2. กิจกรรม (ดึงชื่อหัวข้อหลักจาก Backend กดแล้วลิงก์เจาะจงไปตารางหัวข้อนั้น) */}
                  <div className="py-2 border-b border-purple-950/60">
                    <div className="px-4 py-1 text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      กิจกรรม
                    </div>
                    <div className="pl-6 mt-1 space-y-1">
                      {rulesCategories.length === 0 ? (
                        <div className="px-3 py-1 text-xs text-gray-500">กำลังโหลดหัวข้อ...</div>
                      ) : (
                        rulesCategories.map((ruleItem) => (
                          <button
                            key={ruleItem.id}
                            onClick={() => handleNavigateRule(ruleItem.title, ruleItem.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-purple-200 hover:bg-purple-600/10 rounded-lg transition-colors truncate cursor-pointer"
                          >
                            • {ruleItem.title}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* 3. Safezone */}
                  <button
                    onClick={() => handleNavigateRule('Safezone', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold border-b border-purple-950/60 mt-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Safezone
                  </button>

                  {/* 4. กฎ Roleplay พื้นฐาน */}
                  <button
                    onClick={() => handleNavigateRule('กฎ Roleplay พื้นฐาน', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold border-b border-purple-950/60 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    กฎ Roleplay พื้นฐาน
                  </button>

                  {/* 5. Streaming Policy & AI Moderation */}
                  <button
                    onClick={() => handleNavigateRule('Streaming Policy & AI Moderation', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold mt-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Streaming Policy & AI Moderation
                  </button>

                </div>
              )}
            </div>

            {/* BackOffice */}
            <Link 
              to="/backoffice" 
              className="hover:text-purple-400 transition-colors duration-200"
            >
              BackOffice
            </Link>

            {/* Profile Modal Trigger */}
            <button
              onClick={() => setIsProfileOpen(true)}
              className="hover:text-purple-400 transition-colors duration-200 cursor-pointer"
            >
              Profile
            </button>
            
            {/* ปุ่มเข้าสู่ระบบ */}
            <Link 
              to="/login" 
              className="px-5 py-1.5 rounded-full bg-purple-600/20 border border-purple-500/40 text-purple-300 hover:bg-purple-600 hover:text-white hover:shadow-lg hover:shadow-purple-900/50 transition-all duration-300 font-semibold"
            >
              เข้าสู่ระบบ
            </Link>
          </div>

        </div>
      </nav>

      {/* Popup Profile */}
      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
};

export default Navbar;