import { useState, useEffect } from 'react';
import Navbar from './Navbar';

const RulesPage = () => {
  const [rulesData, setRulesData] = useState([]);
  const [activeSubGroup, setActiveSubGroup] = useState(null);
  const [loading, setLoading] = useState(true);

  // ดึงข้อมูลทั้งหมดจาก Backend
  useEffect(() => {
    const fetchRules = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/rules');
        const data = await res.json();
        setRulesData(data);
        
        // กำหนดให้เลือกหัวข้อย่อยอันแรกเป็นค่าเริ่มต้น
        if (data.length > 0 && data[0].subGroups.length > 0) {
          setActiveSubGroup(data[0].subGroups[0]);
        }
      } catch (err) {
        console.error('Error fetching rules:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full">
      <Navbar />

      <div className="flex flex-1 max-w-7xl mx-auto w-full px-4 py-8 gap-8">
        
        {/* ================= SIDEBAR MENU (ตามภาพที่ 1) ================= */}
        <div className="w-80 shrink-0 bg-[#0b0b0d] border border-purple-950/60 rounded-2xl p-4 h-fit sticky top-24">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4 px-3">
            หมวดหมู่กฎระเบียบ
          </h3>
          
          {loading ? (
            <p className="text-purple-400 text-sm px-3 animate-pulse">กำลังโหลดเมนู...</p>
          ) : (
            <div className="space-y-6">
              {rulesData.map((main) => (
                <div key={main.id} className="space-y-2">
                  {/* กรอบแดง: หัวข้อหลัก (Fixed / Category Header) */}
                  <div className="flex items-center gap-2 px-3 py-2 text-purple-300 font-bold text-sm bg-purple-950/30 rounded-xl border border-purple-900/40">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    {main.title}
                  </div>

                  {/* กรอบเหลือง: หัวข้อย่อย (Sub Groups ที่ Relate ตามข้อมูล) */}
                  <div className="pl-4 space-y-1 border-l border-purple-950/60 ml-3">
                    {main.subGroups.map((sub) => {
                      const isActive = activeSubGroup?.id === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => setActiveSubGroup(sub)}
                          className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-all flex items-center justify-between ${
                            isActive
                              ? 'bg-purple-600/20 text-purple-200 border border-purple-500/50 font-semibold shadow-md shadow-purple-900/20'
                              : 'text-gray-400 hover:text-white hover:bg-purple-950/20'
                          }`}
                        >
                          <span className="truncate">▪ {sub.sub_title}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ================= CONTENT DISPLAY (ตามภาพที่ 2) ================= */}
        <div className="flex-1 bg-[#0b0b0d] border border-purple-950/60 rounded-2xl p-8 shadow-xl">
          {activeSubGroup ? (
            <div>
              {/* Breadcrumb & Title */}
              <div className="text-xs text-gray-500 mb-2">
                กฎประเทศ / หมวดหมู่ / <span className="text-purple-400">{activeSubGroup.sub_title}</span>
              </div>
              <h1 className="text-2xl font-extrabold text-purple-200 mb-8 pb-4 border-b border-purple-950">
                {activeSubGroup.sub_title}
              </h1>

              {/* ตารางแสดงกฎและบทลงโทษ */}
              <div className="overflow-x-auto border border-purple-950/60 rounded-xl">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#14121a] text-purple-300 text-sm border-b border-purple-950">
                      <th className="p-4 font-semibold w-3/4">กฎข้อบังคับ</th>
                      <th className="p-4 font-semibold w-1/4 text-center">บทลงโทษ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/40 text-sm text-gray-300">
                    {activeSubGroup.rules && activeSubGroup.rules.length > 0 ? (
                      activeSubGroup.rules.map((rule, idx) => (
                        <tr key={idx} className="hover:bg-[#14121a]/50 transition-colors">
                          <td className="p-4 leading-relaxed">
                            <span className="font-semibold text-purple-400 mr-2">{idx + 1}.</span>
                            <span>{rule.text}</span>
                          </td>
                          <td className="p-4 text-center">
                            <span className="inline-block px-3 py-1 rounded-lg bg-emerald-950/40 border border-emerald-900/50 text-emerald-400 text-xs font-bold">
                              {rule.symbol || 'ปรับเงิน 500,000 IC'}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="2" className="p-8 text-center text-gray-500">
                          ยังไม่มีข้อมูลกฎในหมวดหมู่นี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-gray-500">
              กรุณาเลือกหัวข้อจากเมนูด้านซ้าย
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default RulesPage;