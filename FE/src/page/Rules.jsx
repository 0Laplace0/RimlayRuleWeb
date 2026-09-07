import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Rules = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [rulesCategories, setRulesCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State สำหรับเก็บหมวดหมู่ที่ถูกเลือกขึ้นมาแสดงเป็นหน้าตารางรายละเอียด
  const [selectedCategory, setSelectedCategory] = useState(null);

  // ดึงข้อมูลจริงจาก Backend เมื่อ Component โหลดขึ้นมา
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5000/api/rules');
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลกฎระเบียบได้');
        }
        const data = await response.json();
        setRulesCategories(data);

        // ตรวจสอบว่ามีการส่ง selectedMainId มาจาก Navbar หรือไม่
        const selectedMainId = location.state?.selectedMainId;
        const categoryName = location.state?.categoryName;

        if (selectedMainId) {
          // ถ้ามี ID เจาะจง ให้เปิดตารางของหัวข้อนั้น
          const found = data.find(item => item.id === selectedMainId);
          if (found) {
            setSelectedCategory(found);
          }
        } else if (categoryName && categoryName !== 'กฎประเทศ') {
          // ถ้าเลือกหมวดหมู่อื่นๆ (เช่น Safezone, กฎ Roleplay พื้นฐาน) แต่ไม่มี ID ใน Backend 
          // ให้แสดงหน้าแจ้งเตือนหรือเปิดหน้ารวม (สามารถปรับเปลี่ยนได้ตามโครงสร้างข้อมูลจริงของคุณ)
          setSelectedCategory(null);
        } else {
          // ถ้าเป็นการกด "กฎประเทศ" หรือเข้าหน้าแรกปกติ ให้แสดงหน้ารวม Grid
          setSelectedCategory(null);
        }

        // เคลียร์ location.state ทิ้ง เพื่อป้องกันไม่ให้ state ค้างเวลา Refresh หน้าเว็บ
        if (location.state) {
          window.history.replaceState({}, document.title);
        }

      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRules();
  }, [location.state]);

  // ฟังก์ชันแสดงผล Icon จริง
  const renderIcon = (iconData, isLarge = false) => {
    const sizeClass = isLarge ? "w-20 h-20" : "w-8 h-8";

    if (iconData && typeof iconData === 'string' && iconData.trim() !== '') {
      return (
        <img 
          src={iconData} 
          alt="icon" 
          className={`${sizeClass} object-cover rounded-xl shadow-md`} 
        />
      );
    }
    return (
      <svg className={sizeClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full relative">
      <Navbar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
        
        {/* แสดงสถานะกำลังโหลดหรือเกิดข้อผิดพลาด */}
        {loading && <p className="text-purple-400 animate-pulse mt-10">กำลังโหลดข้อมูลกฎระเบียบ...</p>}
        {error && <p className="text-rose-500 mt-10">เกิดข้อผิดพลาด: {error}</p>}

        {/* --- ส่วนที่ 1: หน้าจอแสดงรายละเอียดตาราง "กฎข้อบังคับ" และ "บทลงโทษ" เมื่อมีการเลือกหัวข้อ --- */}
        {!loading && !error && selectedCategory ? (
          <div className="w-full space-y-6 animate-fadeIn">
            
            {/* ปุ่มย้อนกลับ */}
            <button 
              onClick={() => setSelectedCategory(null)}
              className="px-5 py-2 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/50 rounded-full text-xs font-bold transition cursor-pointer shadow-md flex items-center gap-2"
            >
              <span>←</span> กลับไปหน้าเลือกหัวข้อทั้งหมด
            </button>

            {/* หัวข้อหลัก */}
            <div className="bg-[#14121a] border border-purple-950/80 p-6 rounded-2xl flex items-center gap-4 shadow-lg">
              <div className="text-purple-400">
                {renderIcon(selectedCategory.icon, false)}
              </div>
              <h1 className="text-2xl font-extrabold text-purple-300 tracking-wide">
                {selectedCategory.title}
              </h1>
            </div>

            {/* วนลูปกลุ่มย่อย (Sub Groups) และตาราง */}
            {selectedCategory.subGroups && selectedCategory.subGroups.map((sub, subIdx) => {
              const rulesItems = sub.rules || sub.items || [];
              return (
                <div key={subIdx} className="bg-[#121019] border border-purple-900/40 rounded-2xl p-5 space-y-4 shadow-md">
                  {sub.sub_title && (
                    <h3 className="text-md font-bold text-emerald-400">
                      {subIdx + 1}. {sub.sub_title}
                    </h3>
                  )}

                  {/* ตารางแสดง กฎข้อบังคับ และ บทลงโทษ */}
                  <div className="overflow-x-auto border border-purple-950/60 rounded-xl">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#0b0b0d] border-b border-purple-950/60 text-purple-300">
                        <tr>
                          <th className="p-3.5">กฎข้อบังคับ</th>
                          <th className="p-3.5 text-center w-36">ประเภทบทลงโทษ</th>
                          <th className="p-3.5 text-center w-48">รายละเอียด/จำนวน</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-purple-950/30">
                        {rulesItems.length > 0 ? (
                          rulesItems.map((rule, ruleIdx) => (
                            <tr key={ruleIdx} className="hover:bg-purple-950/10 transition">
                              <td className="p-3.5 text-gray-300">{rule.text}</td>
                              <td className="p-3.5 text-center">
                                <span className="px-3 py-1 bg-purple-900/40 border border-purple-700/50 rounded-full text-xs text-purple-200 font-medium">
                                  {rule.penaltyType || rule.penalty_type || '-'}
                                </span>
                              </td>
                              <td className="p-3.5 text-center font-semibold text-amber-300">
                                {rule.penaltyValue || rule.penalty_value || '-'}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="p-4 text-center text-gray-500">ไม่มีข้อมูลกฎข้อบังคับในหมวดนี้</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              );
            })}

            {/* หมายเหตุท้ายหน้า (ถ้ามี) */}
            {(selectedCategory.footerNote || selectedCategory.footer_note) && (
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-amber-300 text-xs text-center">
                <strong>หมายเหตุ:</strong> {selectedCategory.footerNote || selectedCategory.footer_note}
              </div>
            )}
          </div>
        ) : null}

        {/* --- ส่วนที่ 2: หน้าแรก แสดง Grid กล่องสี่เหลี่ยมให้ผู้ใช้คลิกเลือก --- */}
        {!loading && !error && !selectedCategory && (
          <div className="w-full flex flex-col items-center animate-fadeIn">
            <div className="text-center mb-10 mt-4">
              <h1 className="text-3xl md:text-4xl font-extrabold text-purple-300 tracking-wider">
                กฎระเบียบและข้อบังคับกิจกรรม
              </h1>
              <div className="w-20 h-1 bg-purple-600 mx-auto mt-3 rounded-full"></div>
              <p className="mt-4 text-sm text-gray-400">คลิกที่หมวดหมู่เพื่อดูรายละเอียดกฎระเบียบและบทลงโทษ</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 w-full mb-8 max-w-5xl">
              {rulesCategories.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSelectedCategory(item)}
                  className="p-5 rounded-2xl border border-purple-950/60 bg-[#0b0b0d] flex flex-col items-center justify-center text-center transition-all duration-300 group hover:-translate-y-1 hover:bg-[#14121c] hover:border-purple-500 hover:shadow-xl hover:shadow-purple-900/40 cursor-pointer"
                >
                  {/* รูปภาพขนาดใหญ่ขึ้น */}
                  <div className="mb-4 p-2 rounded-2xl bg-[#14121a] border border-purple-900/30 text-purple-400 group-hover:border-purple-500/50 transition-all flex items-center justify-center">
                    {renderIcon(item.icon, true)}
                  </div>
                  
                  <span className="text-sm font-semibold leading-relaxed text-gray-300 group-hover:text-purple-200 px-1 line-clamp-2">
                    {item.title}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Rules;