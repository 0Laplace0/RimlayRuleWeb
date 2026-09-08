import { useState, useEffect } from 'react';
import axios from 'axios';

const ActivityRulesView = () => {
  const [rulesList, setRulesList] = useState([]);
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [loading, setLoading] = useState(true);

  const API_URL = 'http://localhost:5000/api/rules';

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true);
        const res = await axios.get(API_URL);
        setRulesList(res.data);
      } catch (err) {
        console.error("Error fetching rules:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchRules();
  }, []);

  if (selectedTopic) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6 text-white animate-fadeIn">
        <button 
          onClick={() => setSelectedTopic(null)}
          className="px-5 py-2 bg-purple-900/40 hover:bg-purple-900/60 border border-purple-500/50 rounded-full text-xs font-bold transition cursor-pointer shadow-md"
        >
          ← กลับไปหน้าเลือกหัวข้อกิจกรรม
        </button>

        {/* หัวข้อหลัก */}
        <div className="bg-[#181125] border border-purple-950/80 p-6 rounded-2xl text-center shadow-lg">
          <h1 className="text-2xl font-extrabold text-purple-300 tracking-wide">
            {selectedTopic.title}
          </h1>
        </div>

        {/* วนลูปแสดงกลุ่มย่อย */}
        {selectedTopic.subGroups?.map((sg, index) => {
          const rulesItems = sg.rules || sg.items || [];
          return (
            <div key={sg.id || index} className="bg-[#181125]/80 border border-purple-900/40 rounded-2xl p-5 space-y-4 shadow-md">
              <h3 className="text-md font-bold text-emerald-400">
                {index + 1}. {sg.subTitle || sg.sub_title}
              </h3>

              {/* ตารางแสดง กฎข้อบังคับ และ บทลงโทษ */}
              <div className="overflow-x-auto border border-purple-950/60 rounded-xl">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#121216] border-b border-purple-950/60 text-purple-300">
                    <tr>
                      <th className="p-3.5">กฎข้อบังคับ</th>
                      <th className="p-3.5 text-center w-36">ประเภทบทลงโทษ</th>
                      <th className="p-3.5 text-center w-48">รายละเอียด/จำนวน</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-purple-950/30">
                    {rulesItems.length > 0 ? (
                      rulesItems.map((rule, rIndex) => (
                        <tr key={rule.id || rIndex} className="hover:bg-purple-950/10 transition">
                          <td className="p-3.5 text-gray-300">{rule.text}</td>
                          <td className="p-3.5 text-center">
                            <span className="px-3 py-1 bg-purple-900/40 border border-purple-700/50 rounded-full text-xs text-purple-200 font-medium">
                              {rule.penaltyType || rule.penalty_type}
                            </span>
                          </td>
                          <td className="p-3.5 text-center font-semibold text-amber-300">
                            {rule.penaltyValue || rule.penalty_value}
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

        {/* หมายเหตุท้ายหน้า (ถ้ามีข้อมูล) */}
        {(selectedTopic.footerNote || selectedTopic.footer_note) && (
          <div className="bg-amber-950/20 border border-amber-500/30 p-4 rounded-xl text-amber-300 text-xs text-center">
            <strong>หมายเหตุ:</strong> {selectedTopic.footerNote || selectedTopic.footer_note}
          </div>
        )}
      </div>
    );
  }

  // --- หน้าแรก: แสดงรายการหัวข้อทั้งหมดให้ผู้ใช้คลิกเลือก (Bullet / Card List) ---
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-4">
      <h2 className="text-2xl font-bold text-purple-300 text-center mb-6">ระเบียบและข้อบังคับกิจกรรม</h2>
      
      {loading ? (
        <div className="text-center text-gray-400 py-10">กำลังโหลดข้อมูล...</div>
      ) : rulesList.length === 0 ? (
        <div className="text-center text-gray-400 py-10">ยังไม่มีข้อมูลระเบียบกิจกรรมในระบบ</div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {rulesList.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedTopic(item)}
              className="bg-[#181125] hover:bg-purple-950/30 border border-purple-900/40 p-4 rounded-2xl cursor-pointer transition flex items-center justify-between shadow-md group"
            >
              <span className="font-semibold text-white text-base group-hover:text-purple-200 transition">
                {item.title}
              </span>
              <span className="text-xs text-purple-400 bg-purple-900/30 px-3.5 py-1.5 rounded-full border border-purple-800/40 group-hover:bg-purple-800/40 transition">
                ดูรายละเอียด →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityRulesView;