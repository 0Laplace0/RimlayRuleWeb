import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function RoleplayRules() {
  const [rulesData, setRulesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoleplayRules();
  }, []);

  const fetchRoleplayRules = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/roleplay-rules');
      const resultData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setRulesData(resultData);
    } catch (err) {
      console.error('Error fetching roleplay rules:', err);
    } finally {
      setLoading(false);
    }
  };

  // ฟังก์ชันช่วยจัดรูปแบบบทลงโทษ
  const renderPenaltyBadge = (penaltyText) => {
    if (!penaltyText) return <span className="text-gray-400">-</span>;

    const words = penaltyText.split(' ');

    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {words.map((word, idx) => {
          if (!word) return null;

          if (word.includes('ปรับ')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-emerald-100 border border-emerald-300 text-emerald-800 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบเหลือง')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-amber-100 border border-amber-300 text-amber-800 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบส้ม')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-orange-100 border border-orange-300 text-orange-800 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word.includes('ใบแดงถาวร') || word.includes('ใบแดง')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-red-100 border border-red-300 text-red-800 rounded-md text-xs font-bold shadow-sm">
                {word}
              </span>
            );
          }
          if (word === 'หรือ') {
            return <span key={idx} className="text-gray-500 font-semibold text-xs mx-1">หรือ</span>;
          }

          return <span key={idx} className="text-gray-700 text-xs">{word}</span>;
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="text-center py-20 text-gray-600">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-16">
      <Navbar />
      <Banner />
      <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* หัวข้อหน้า */}
        <div className="text-center pb-8 border-b border-gray-200 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            กฎ Roleplay พื้นฐาน
          </h1>
        </div>

        {/* ตรวจสอบว่ามีข้อมูลหรือไม่ */}
        {rulesData.length > 0 ? (
          rulesData.map((category) => (
            <div key={category.id} className="mb-12">
              
              {/* ตาราง 3 ช่อง (เพิ่มกรอบและเส้นขอบตารางครบถ้วนทั้งแนวตั้งและแนวนอน) */}
              <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white shadow-sm">
                <table className="min-w-full border-collapse bg-white text-left text-sm text-gray-500">
                  <thead className="bg-gray-100 border-b border-gray-300">
                    <tr>
                      <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4 border-r border-gray-300">
                        กฎ
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider w-1/2 border-r border-gray-300">
                        รายละเอียด
                      </th>
                      <th scope="col" className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase tracking-wider w-1/4">
                        บทลงโทษ
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-300">
                    {category.subGroups && category.subGroups.length > 0 ? (
                      category.subGroups.flatMap((sub) => 
                        sub.rules && sub.rules.length > 0 
                          ? sub.rules.map((rule, ruleIdx) => ({
                              ...rule,
                              subTitle: sub.subTitle,
                              uniqueKey: `${sub.subId}-${rule.ruleId || ruleIdx}`
                            }))
                          : []
                      ).map((item) => (
                        <tr key={item.uniqueKey} className="hover:bg-gray-50/75 transition-colors">
                          
                          {/* คอลัมน์ที่ 1: กฎ (ชื่อหมวดหมู่ย่อย) */}
                          <td className="px-6 py-4 font-semibold text-gray-900 align-top border-r border-gray-300">
                            {item.subTitle || `-`}
                          </td>

                          {/* คอลัมน์ที่ 2: รายละเอียดกฎ + ข้อย่อย */}
                          <td className="px-6 py-4 text-gray-600 align-top leading-relaxed border-r border-gray-300">
                            <div className="whitespace-pre-line">{item.text}</div>
                            
                            {item.subItems && item.subItems.length > 0 && (
                              <ul className="mt-2 pl-5 list-disc space-y-1 text-gray-500 text-xs">
                                {item.subItems.map((si, siIdx) => (
                                  <li key={si.subItemId || siIdx}>{si.text}</li>
                                ))}
                              </ul>
                            )}
                          </td>

                          {/* คอลัมน์ที่ 3: บทลงโทษ */}
                          <td className="px-6 py-4 align-top">
                            {renderPenaltyBadge(item.penaltyValue || item.penalty_value)}
                          </td>

                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-6 text-center text-gray-400 text-sm">
                          ไม่มีข้อมูลกฎในหมวดหมู่นี้
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* ส่วนหมายเหตุท้าย (Footer Note) ถ้ามี */}
              {category.footerNote && (
                <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                  <span className="font-semibold">หมายเหตุ: </span> {category.footerNote}
                </div>
              )}

            </div>
          ))
        ) : (
          <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-base">ไม่พบข้อมูลกฎ Roleplay ในระบบ</p>
          </div>
        )}

      </div>
    </div>
  );
}