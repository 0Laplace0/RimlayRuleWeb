import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/hero.png';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [rulesCategories, setRulesCategories] = useState([]);
  
  const countryDropdownRef = useRef(null);
  const agencyDropdownRef = useRef(null);
  const navigate = useNavigate();

  // ดึงข้อมูลกฎทั้งหมดจาก Backend เพื่อนำมาแสดงเป็นหัวข้อย่อยในหมวด "กิจกรรม"
  useEffect(() => {
    const fetchRulesMenu = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/activity-rules');
        if (response.ok) {
          const data = await response.json();
          // รองรับทั้งกรณีที่ Backend ส่งมาเป็น Array ตรงๆ หรืออยู่ใน Object เช่น { data: [...] }
          const categoriesArray = Array.isArray(data) ? data : (data.categories || data.data || []);
          setRulesCategories(categoriesArray);
        } else {
          console.error('API Error Status:', response.status);
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
      if (
        countryDropdownRef.current && !countryDropdownRef.current.contains(event.target) &&
        agencyDropdownRef.current && !agencyDropdownRef.current.contains(event.target)
      ) {
        setIsCountryDropdownOpen(false);
        setIsAgencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ฟังก์ชันควบคุมการพาไปยังหน้า ActivityRules พร้อมส่ง ID ไปด้วย
  const handleNavigateRule = (categoryName, mainId = null) => {
    setIsCountryDropdownOpen(false);
    setIsAgencyDropdownOpen(false);
    navigate('/activity-rules', { state: { categoryName, selectedMainId: mainId } });
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
            
            {/* เมนูหน้าแรก (Home) */}
            <Link 
              to="/" 
              className="hover:text-purple-400 transition-colors duration-200"
            >
              Home
            </Link>

            {/* 1. เมนูกฎประเทศ */}
            <div 
              className="relative" 
              ref={countryDropdownRef}
              onMouseEnter={() => {
                setIsCountryDropdownOpen(true);
                setIsAgencyDropdownOpen(false);
              }}
              onMouseLeave={() => setIsCountryDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  setIsCountryDropdownOpen(false);
                  navigate('/country-rules');
                }}
                className="flex items-center gap-2 hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none py-2"
              >
                <span>กฎประเทศ</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isCountryDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* กล่องเมนูดรอปดาวน์ของกฎประเทศ */}
              {isCountryDropdownOpen && (
                <div className="absolute left-0 mt-0 w-72 bg-[#0b0b0d] border border-purple-900/60 rounded-xl shadow-2xl py-3 z-50 backdrop-blur-md max-h-[80vh] overflow-y-auto animate-fadeIn">
                  
                  {/* กฎประเทศหลัก */}
                  <button
                    onClick={() => {
                      setIsCountryDropdownOpen(false);
                      navigate('/country-rules');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold border-b border-purple-950/60 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    กฎประเทศ
                  </button>

                  {/* กิจกรรม (ดึงชื่อหัวข้อหลักจาก Backend) */}
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

                  {/* Safezone */}
                  <button
                    onClick={() => handleNavigateRule('Safezone', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold border-b border-purple-950/60 mt-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    Safezone
                  </button>

                  {/* กฎ Roleplay พื้นฐาน */}
                  <button
                    onClick={() => handleNavigateRule('กฎ Roleplay พื้นฐาน', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-purple-600/20 hover:text-purple-200 transition-colors flex items-center gap-2 font-semibold border-b border-purple-950/60 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    กฎ Roleplay พื้นฐาน
                  </button>

                  {/* Streaming Policy & AI Moderation */}
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

            {/* 2. เมนูกฎหน่วยงาน (วางอยู่ข้างๆ กฎประเทศ พร้อมหัวข้อย่อย กฎตำรวจ, กฎหมอ, กฎสภา) */}
            <div 
              className="relative" 
              ref={agencyDropdownRef}
              onMouseEnter={() => {
                setIsAgencyDropdownOpen(true);
                setIsCountryDropdownOpen(false);
              }}
              onMouseLeave={() => setIsAgencyDropdownOpen(false)}
            >
              <button
                onClick={() => {
                  setIsAgencyDropdownOpen(false);
                  navigate('/country-rules');
                }}
                className="flex items-center gap-2 hover:text-purple-400 transition-colors duration-200 cursor-pointer focus:outline-none py-2"
              >
                <span>กฎหน่วยงาน</span>
                <svg 
                  className={`w-4 h-4 transition-transform duration-200 ${isAgencyDropdownOpen ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* กล่องเมนูดรอปดาวน์ของกฎหน่วยงาน */}
              {isAgencyDropdownOpen && (
                <div className="absolute left-0 mt-0 w-60 bg-[#0b0b0d] border border-purple-900/60 rounded-xl shadow-2xl py-3 z-50 backdrop-blur-md animate-fadeIn">
                  <div className="space-y-1 px-2">
                    <button
                      onClick={() => handleNavigateRule('กฎตำรวจ', null)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-purple-200 hover:bg-purple-600/20 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      กฎตำรวจ
                    </button>
                    <button
                      onClick={() => handleNavigateRule('กฎหมอ', null)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-purple-200 hover:bg-purple-600/20 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      กฎหมอ
                    </button>
                    <button
                      onClick={() => handleNavigateRule('กฎสภา', null)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-purple-200 hover:bg-purple-600/20 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                      กฎสภา
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <Link 
              to="/terms" 
              className="hover:text-purple-400 transition-colors duration-200"
            >
              Terms & Conditions
            </Link>

            {/* Refund Policy */}
            <Link 
              to="/refund" 
              className="hover:text-purple-400 transition-colors duration-200"
            >
              Refund Policy
            </Link>

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