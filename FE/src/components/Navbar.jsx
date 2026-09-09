import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/hero.png';
import ProfileModal from './ProfileModal';

const Navbar = () => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);
  const [isAgencyDropdownOpen, setIsAgencyDropdownOpen] = useState(false);
  const [rulesCategories, setRulesCategories] = useState([]);
  const [isLoadingRules, setIsLoadingRules] = useState(true);
  
  const countryDropdownRef = useRef(null);
  const agencyDropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRulesMenu = async () => {
      try {
        setIsLoadingRules(true);
        const response = await fetch('http://localhost:5000/api/activity-rules');
        if (response.ok) {
          const data = await response.json();
          const categoriesArray = Array.isArray(data) ? data : (data.categories || data.data || []);
          setRulesCategories(categoriesArray);
        } else {
          console.error('API Error Status:', response.status);
        }
      } catch (err) {
        console.error('Failed to fetch rules menu:', err);
      } finally {
        setIsLoadingRules(false);
      }
    };

    fetchRulesMenu();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (countryDropdownRef.current && !countryDropdownRef.current.contains(event.target)) {
        setIsCountryDropdownOpen(false);
      }
      if (agencyDropdownRef.current && !agencyDropdownRef.current.contains(event.target)) {
        setIsAgencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavigateRule = (categoryName, mainId = null) => {
    setIsCountryDropdownOpen(false);
    setIsAgencyDropdownOpen(false);
    navigate('/activity-rules', { state: { categoryName, selectedMainId: mainId } });
  };

  const handleNavigateActivityView = () => {
    setIsCountryDropdownOpen(false);
    setIsAgencyDropdownOpen(false);
    navigate('/activity-rules-view');
  };

  return (
    <div className="w-full relative">
      <nav className="w-full">
        <div className="w-full bg-[#0f172a] border-b border-indigo-950/60 flex items-center justify-between px-8 py-4 shadow-2xl relative z-50">
          
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
            
            <Link 
              to="/" 
              className="hover:text-indigo-400 transition-colors duration-200"
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
                type="button"
                onClick={() => {
                  setIsCountryDropdownOpen(false);
                  navigate('/country-rules');
                }}
                className="flex items-center gap-2 hover:text-indigo-400 transition-colors duration-200 cursor-pointer focus:outline-none py-2"
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

              {isCountryDropdownOpen && (
                <div className="absolute left-0 mt-0 w-72 bg-[#0f172a] border border-indigo-950/60 rounded-xl shadow-2xl py-3 z-50 backdrop-blur-md max-h-[80vh] overflow-y-auto animate-fadeIn">
                  
                  <button
                    type="button"
                    onClick={() => {
                      setIsCountryDropdownOpen(false);
                      navigate('/country-rules');
                    }}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors flex items-center gap-2 font-semibold border-b border-indigo-950/40 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    กฎประเทศ
                  </button>

                  <div className="py-2 border-b border-indigo-950/40">
                    <button
                      type="button"
                      onClick={handleNavigateActivityView}
                      className="w-full text-left px-4 py-1 text-xs font-bold text-indigo-400 hover:text-white uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      กิจกรรม
                    </button>
                    <div className="pl-6 mt-1 space-y-1">
                      {isLoadingRules ? (
                        <div className="px-3 py-1 text-xs text-gray-500">กำลังโหลดหัวข้อ...</div>
                      ) : rulesCategories.length === 0 ? (
                        <div className="px-3 py-1 text-xs text-gray-500">ไม่มีข้อมูลหัวข้อ</div>
                      ) : (
                        rulesCategories.map((ruleItem) => (
                          <button
                            type="button"
                            key={ruleItem.id}
                            onClick={() => handleNavigateRule(ruleItem.title, ruleItem.id)}
                            className="w-full text-left px-3 py-1.5 text-xs text-gray-400 hover:text-indigo-300 hover:bg-indigo-950/30 rounded-lg transition-colors truncate cursor-pointer"
                          >
                            • {ruleItem.title}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleNavigateRule('Safezone', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors flex items-center gap-2 font-semibold border-b border-indigo-950/40 mt-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Safezone
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigateRule('กฎ Roleplay พื้นฐาน', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors flex items-center gap-2 font-semibold border-b border-indigo-950/40 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    กฎ Roleplay พื้นฐาน
                  </button>

                  <button
                    type="button"
                    onClick={() => handleNavigateRule('Streaming Policy & AI Moderation', null)}
                    className="w-full text-left px-4 py-2.5 text-sm text-gray-300 hover:bg-indigo-950/40 hover:text-indigo-300 transition-colors flex items-center gap-2 font-semibold mt-1 cursor-pointer"
                  >
                    <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                    Streaming Policy & AI Moderation
                  </button>

                </div>
              )}
            </div>

            {/* 2. เมนูกฎหน่วยงาน */}
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
                type="button"
                onClick={() => {
                  setIsAgencyDropdownOpen(false);
                  navigate('/country-rules');
                }}
                className="flex items-center gap-2 hover:text-indigo-400 transition-colors duration-200 cursor-pointer focus:outline-none py-2"
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

              {isAgencyDropdownOpen && (
                <div className="absolute left-0 mt-0 w-60 bg-[#0f172a] border border-indigo-950/60 rounded-xl shadow-2xl py-3 z-50 backdrop-blur-md animate-fadeIn">
                  <div className="space-y-1 px-2">
                    <button
                      type="button"
                      onClick={() => handleNavigateRule('กฎตำรวจ', null)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-indigo-300 hover:bg-indigo-950/30 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      กฎตำรวจ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateRule('กฎหมอ', null)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-indigo-300 hover:bg-indigo-950/30 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      กฎหมอ
                    </button>
                    <button
                      type="button"
                      onClick={() => handleNavigateRule('กฎสภา', null)}
                      className="w-full text-left px-3 py-2 text-xs text-gray-300 hover:text-indigo-300 hover:bg-indigo-950/30 rounded-lg transition-colors flex items-center gap-2 cursor-pointer font-medium"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                      กฎสภา
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link 
              to="/terms-rules" 
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              Terms & Conditions
            </Link>

            <Link 
              to="/refund-rules" 
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              Refund Policy
            </Link>

            <Link 
              to="/backoffice" 
              className="hover:text-indigo-400 transition-colors duration-200"
            >
              BackOffice
            </Link>

            <button
              type="button"
              onClick={() => setIsProfileOpen(true)}
              className="hover:text-indigo-400 transition-colors duration-200 cursor-pointer"
            >
              Profile
            </button>
            
            <Link 
              to="/login" 
              className="px-5 py-1.5 rounded-full bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600 hover:text-white hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-300 font-semibold"
            >
              เข้าสู่ระบบ
            </Link>
          </div>

        </div>
      </nav>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />
    </div>
  );
};

export default Navbar;