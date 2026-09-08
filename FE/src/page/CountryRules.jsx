import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from '../components/Navbar';

const CountryRules = () => {
  const location = useLocation();
  const [rulesCategories, setRulesCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        // สามารถเปลี่ยน Endpoint เป็นของกฎประเทศโดยเฉพาะได้ เช่น http://localhost:5000/api/country-rules
        // หรือใช้ endpoint ร่วมกันแล้วกรองหมวดหมู่ตามต้องการ
        const response = await fetch('http://localhost:5000/api/country-rules');
        if (!response.ok) {
          throw new Error('ไม่สามารถดึงข้อมูลกฎระเบียบประเทศได้');
        }
        const data = await response.json();
        setRulesCategories(data);

        const selectedMainId = location.state?.selectedMainId;

        if (selectedMainId) {
          const found = data.find(item => item.id === selectedMainId);
          if (found) {
            setSelectedCategory(found);
          } else if (data.length > 0) {
            setSelectedCategory(data[0]);
          }
        } else if (data.length > 0) {
          setSelectedCategory(data[0]);
        }

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

  // รวบรวม items จากทุก subGroups ออกมาแสดงเป็นตารางเดียวต่อเนื่องกัน
  const allRulesItems = [];
  selectedCategory?.subGroups?.forEach((sub) => {
    const items = sub.rules || sub.items || [];
    items.forEach((item) => {
      allRulesItems.push(item);
    });
  });

  // ฟังก์ชันช่วยจัดรูปแบบป้ายบทลงโทษ (กรอบเขียวสำหรับปรับ, สีเหลือง, ส้ม, แดง)
  const renderPenaltyBadge = (penaltyText) => {
    if (!penaltyText) return <span className="text-gray-500">-</span>;

    const words = penaltyText.split(' ');

    return (
      <div className="flex flex-wrap items-center gap-2">
        {words.map((word, idx) => {
          if (!word) return null;

          if (word.includes('ปรับ')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบเหลือง')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-yellow-500/20 border border-yellow-500/50 text-yellow-300 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบส้ม')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-orange-500/20 border border-orange-500/50 text-orange-300 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบแดงถาวร')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบแดง')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-red-500/20 border border-red-500/50 text-red-400 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word === 'หรือ') {
            return <span key={idx} className="text-red-400 font-semibold text-xs">หรือ</span>;
          }

          return <span key={idx} className="text-gray-300 text-xs">{word}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full relative">
      <Navbar />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
        {loading && <p className="text-purple-400 animate-pulse mt-10">กำลังโหลดข้อมูลกฎระเบียบประเทศ...</p>}
        {error && <p className="text-rose-500 mt-10">เกิดข้อผิดพลาด: {error}</p>}

        {!loading && !error && selectedCategory && (
          <div className="w-full space-y-6 animate-fadeIn">
            {/* หัวข้อหลัก */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-wide">
                {selectedCategory.title}
              </h1>
            </div>

            {/* ตารางแสดง กฎข้อบังคับ และ บทลงโทษ */}
            <div className="bg-[#181125]/80 border border-purple-950/80 rounded-2xl overflow-hidden shadow-lg">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-purple-900/50 text-red-400 font-bold text-base">
                    <th className="p-4 w-3/4">กฎข้อบังคับ</th>
                    <th className="p-4 w-1/4 border-l border-purple-900/50">บทลงโทษ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-950/40 text-sm">
                  {allRulesItems.length > 0 ? (
                    allRulesItems.map((rule, index) => (
                      <tr key={rule.id || index} className="hover:bg-purple-950/20 transition align-top">
                        <td className="p-4 text-gray-200 leading-relaxed">
                          {index + 1}. {rule.text}
                        </td>
                        <td className="p-4 font-semibold border-l border-purple-900/40">
                          {renderPenaltyBadge(rule.penaltyValue || rule.penalty_value)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="2" className="p-6 text-center text-gray-500">
                        ยังไม่มีข้อมูลกฎข้อบังคับในหมวดนี้
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* หมายเหตุท้ายหน้า (ถ้ามี) */}
            {(selectedCategory.footerNote || selectedCategory.footer_note) && (
              <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-amber-300 text-xs text-center">
                <strong>หมายเหตุ:</strong> {selectedCategory.footerNote || selectedCategory.footer_note}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CountryRules;