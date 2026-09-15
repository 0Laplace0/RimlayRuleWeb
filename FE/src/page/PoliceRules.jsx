import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function PoliceRules() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPoliceRules();
  }, []);

  const fetchPoliceRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/police-rules');
      const data = res.data.data || res.data || [];
      setCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  // Render Badge สำหรับฝั่งค่าปรับ
  const renderBadge = (text, defaultBg = 'bg-gray-100 text-gray-700') => {
    if (!text) return <span className="text-gray-400">-</span>;

    const words = text.split(' ');
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {words.map((word, idx) => {
          if (!word) return null;
          if (word.includes('จำคุก')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-md text-xs font-semibold">
                {word}
              </span>
            );
          }
          if (word.includes('ปรับ') || word.includes('X5')) {
            return (
              <span key={idx} className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-bold">
                {word}
              </span>
            );
          }
          return <span key={idx} className="text-gray-700 text-xs">{word}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-16 text-gray-800">
      <Navbar />

      <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6">
        
        {/* หัวข้อหลัก */}
        <div className="text-center pb-6 border-b border-gray-200 mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            กฎตำรวจ
          </h1>
        </div>

        {loading && <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูล...</div>}
        {error && <div className="text-center py-10 text-red-500">เกิดข้อผิดพลาด: {error}</div>}

        {!loading && !error && (
          <div className="space-y-12">
            {categories.map((cat) => (
              <div key={cat.id} className="space-y-6">
                
                {/* ชื่อหมวดหมู่ */}
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 border-l-4 border-slate-800 pl-3">
                  {cat.title}
                </h2>

                {/* --- 1. แสดงผลแบบ "กฎ" (Text + Images) --- */}
                {cat.type === 'rule' && (
                  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-4">
                    <ul className="space-y-3 list-disc pl-5 text-gray-700 text-sm sm:text-base leading-relaxed">
                      {cat.items?.map((item, index) => (
                        <li key={index} className="space-y-2">
                          <div>{item.text}</div>
                          
                          {/* รูปภาพประกอบ (ถ้ามี) */}
                          {item.imageUrl && (
                            <div className="mt-2 my-4">
                              <img 
                                src={item.imageUrl} 
                                alt={item.imageCaption || `rule-img-${index}`} 
                                className="max-w-full h-auto rounded-lg border border-gray-200 shadow-sm max-h-96 object-cover"
                              />
                              {item.imageCaption && (
                                <p className="text-xs text-gray-500 mt-1 italic">
                                  * {item.imageCaption}
                                </p>
                              )}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* --- 2. แสดงผลแบบ "ค่าปรับ" (ตาราง 3 ช่อง) --- */}
                {cat.type === 'fine' && (
                  <div className="space-y-6">
                    {cat.subGroups?.map((sub, sIdx) => (
                      <div key={sIdx} className="space-y-3">
                        {sub.subTitle && (
                          <h3 className="text-base font-semibold text-gray-700">{sub.subTitle}</h3>
                        )}
                        
                        <div className="overflow-x-auto border border-gray-300 rounded-lg bg-white shadow-sm">
                          <table className="min-w-full border-collapse text-left text-sm">
                            <thead className="bg-gray-100 border-b border-gray-300">
                              <tr>
                                <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase w-1/2 border-r border-gray-300">
                                  รายการ
                                </th>
                                <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase w-1/4 border-r border-gray-300">
                                  ค่าปรับ
                                </th>
                                <th className="px-6 py-3.5 text-xs font-bold text-gray-700 uppercase w-1/4">
                                  จำคุก / นาที
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-300">
                              {sub.rules?.map((rule, rIdx) => (
                                <tr key={rIdx} className="hover:bg-gray-50 transition">
                                  <td className="px-6 py-4 font-medium text-gray-900 align-top border-r border-gray-300">
                                    {rule.text}
                                  </td>
                                  <td className="px-6 py-4 align-top border-r border-gray-300 font-semibold text-gray-800">
                                    {renderBadge(rule.penaltyValue)}
                                  </td>
                                  <td className="px-6 py-4 align-top">
                                    {renderBadge(rule.jailTime)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* หมายเหตุท้าย (Footer Note) */}
                {cat.footerNote && (
                  <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                    <span className="font-semibold">หมายเหตุ: </span> {cat.footerNote}
                  </div>
                )}

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}