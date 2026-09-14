import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

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

  // ฟังก์ชันช่วยจัดรูปแบบบทลงโทษ (Badge สีต่างๆ)
  const renderPenalty = (penaltyText) => {
    if (!penaltyText) return <span className="text-gray-400">-</span>;

    return (
      <div className="flex flex-wrap gap-1.5 items-center">
        {penaltyText.split(',').map((item, idx) => {
          const text = item.trim();
          if (text.includes('ใบเหลือง')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-amber-100 text-amber-800 text-xs font-semibold rounded-md border border-amber-200">
                {text}
              </span>
            );
          } else if (text.includes('ใบส้ม')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-md border border-orange-200">
                {text}
              </span>
            );
          } else if (text.includes('ใบแดง')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-md border border-red-200">
                {text}
              </span>
            );
          } else if (text.includes('ปรับ')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-md border border-emerald-200">
                {text}
              </span>
            );
          }
          return <span key={idx} className="text-gray-700 text-sm">{text}</span>;
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
            <div key={category.id} className="mb-12 bg-white shadow-sm border border-gray-200 rounded-xl overflow-hidden">
              
              {/* หัวข้อหมวดหมู่ใหญ่ */}
              <div className="bg-gray-900 px-6 py-4">
                <h2 className="text-xl font-bold text-white">
                  {category.title}
                </h2>
              </div>

              <div className="p-6 space-y-8">
                {category.subGroups && category.subGroups.length > 0 ? (
                  category.subGroups.map((sub, subIdx) => (
                    <div key={sub.subId || subIdx} className="space-y-4">
                      
                      {/* ชื่อหมวดหมู่ย่อย (ถ้ามี) */}
                      {sub.subTitle && (
                        <h3 className="text-lg font-semibold text-indigo-600 border-l-4 border-indigo-600 pl-3">
                          {sub.subTitle}
                        </h3>
                      )}

                      {/* ตารางแสดงกฎย่อย */}
                      <div className="overflow-x-auto border border-gray-200 rounded-lg">
                        <table className="min-w-full divide-y divide-gray-200 bg-white">
                          <thead className="bg-gray-50">
                            <tr>
                              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-3/5">
                                รายละเอียดข้อบังคับ / กฎ
                              </th>
                              <th scope="col" className="px-6 py-3.5 text-left text-xs font-bold text-gray-700 uppercase tracking-wider w-2/5">
                                บทลงโทษ
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {sub.rules && sub.rules.length > 0 ? (
                              sub.rules.map((rule, ruleIdx) => (
                                <tr key={rule.ruleId || ruleIdx} className="hover:bg-gray-50/75 transition-colors">
                                  
                                  {/* คอลัมน์ รายละเอียดกฎ + ข้อย่อย (subItems ถ้ามี) */}
                                  <td className="px-6 py-4 text-sm text-gray-800 align-top leading-relaxed">
                                    <div className="whitespace-pre-line">{rule.text}</div>
                                    
                                    {/* แสดงข้อย่อยย่อยลงไปอีก (ถ้ามี subItems) */}
                                    {rule.subItems && rule.subItems.length > 0 && (
                                      <ul className="mt-2 pl-5 list-disc space-y-1 text-gray-600 text-xs">
                                        {rule.subItems.map((si, siIdx) => (
                                          <li key={si.subItemId || siIdx}>{si.text}</li>
                                        ))}
                                      </ul>
                                    )}
                                  </td>

                                  {/* คอลัมน์ บทลงโทษ */}
                                  <td className="px-6 py-4 text-sm align-top">
                                    {renderPenalty(rule.penaltyValue)}
                                  </td>

                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="2" className="px-6 py-6 text-center text-gray-400 text-sm">
                                  ไม่มีข้อมูลกฎในหมวดหมู่นี้
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>

                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 text-gray-400 text-sm">
                    ไม่มีหมวดหมู่ย่อยในหัวข้อนี้
                  </div>
                )}

                {/* ส่วนหมายเหตุท้าย (Footer Note) ถ้ามี */}
                {category.footerNote && (
                  <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                    <span className="font-semibold">หมายเหตุ: </span> {category.footerNote}
                  </div>
                )}

              </div>
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