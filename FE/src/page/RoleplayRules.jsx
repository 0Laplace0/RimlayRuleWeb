import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function RoleplayRules() {
  const [rulesData, setRulesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRoleplayRules();
  }, []);

  const fetchRoleplayRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/roleplay-rules');
      const resultData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setRulesData(resultData);
    } catch (err) {
      console.error('Error fetching roleplay rules:', err);
      setError('ไม่สามารถดึงข้อมูลกฎระเบียบได้');
    } finally {
      setLoading(false);
    }
  };

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
          if (word.includes('ใบแดงถาวร') || word.includes('ใบแดง')) {
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
    <div className="min-h-screen bg-transparent text-white flex flex-col w-full relative overflow-x-hidden">
      <Navbar />
      <Banner manageGlobalBackground={true} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
        {loading && <p className="text-[#80deea] animate-pulse mt-10">กำลังโหลดข้อมูลกฎ Roleplay...</p>}
        {error && <p className="text-rose-500 mt-10">เกิดข้อผิดพลาด: {error}</p>}

        {!loading && !error && (
          <div className="w-full space-y-6 animate-fadeIn">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-extrabold text-white tracking-wide">
                กฎ Roleplay พื้นฐาน
              </h1>
            </div>

            <div className="space-y-8">
              {rulesData.length > 0 ? (
                rulesData.map((category) => (
                  <div key={category.id} className="space-y-6">
                    {category.subGroups && category.subGroups.length > 0 ? (
                      category.subGroups.map((subGroup, subIndex) => {
                        const rulesList = subGroup.rules || [];
                        return (
                          <div key={subGroup.subId || subIndex} className="space-y-3">
                            {subGroup.subTitle && (
                              <h3 className="text-lg font-bold text-[#80deea] border-l-4 border-[#80deea] pl-3">
                                {subGroup.subTitle}
                              </h3>
                            )}

                            <div className="bg-[#111a1f]/80 border border-[#80deea]/40 rounded-2xl overflow-hidden shadow-lg">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="border-b border-[#80deea]/30 text-white font-bold text-sm bg-[#80deea]/10">
                                    <th className="p-4 w-1/4 border-r border-[#80deea]/25">กฎ</th>
                                    <th className="p-4 w-2/4 border-r border-[#80deea]/25">รายละเอียด</th>
                                    <th className="p-4 w-1/4 text-red-400">บทลงโทษ</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-[#80deea]/10 text-sm">
                                  {rulesList.length > 0 ? (
                                    rulesList.map((rule, ruleIndex) => (
                                      <tr key={rule.ruleId || ruleIndex} className="hover:bg-[#80deea]/10 transition align-top">
                                        <td className="p-4 w-1/4 border-r border-[#80deea]/20 font-semibold text-white">
                                          {subGroup.subTitle || '-'}
                                        </td>
                                        <td className="p-4 w-2/4 border-r border-[#80deea]/20 text-gray-300 leading-relaxed font-medium">
                                          <div className="whitespace-pre-line">{rule.text}</div>
                                          {rule.subItems && rule.subItems.length > 0 && (
                                            <ul className="mt-2 pl-5 list-disc space-y-1 text-gray-400 text-xs">
                                              {rule.subItems.map((si, siIdx) => (
                                                <li key={si.subItemId || siIdx}>{si.text}</li>
                                              ))}
                                            </ul>
                                          )}
                                        </td>
                                        <td className="p-4 w-1/4 font-semibold">
                                          {renderPenaltyBadge(rule.penaltyValue || rule.penalty_value)}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td colSpan="3" className="p-6 text-center text-gray-400">
                                        ยังไม่มีข้อมูลกฎในกลุ่มย่อยนี้
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        );
                      })
                    ) : null}

                    {category.footerNote && (
                      <div className="bg-[#80deea]/10 border border-[#80deea]/40 p-4 rounded-xl text-[#80deea] text-xs text-center">
                        <strong>หมายเหตุ:</strong> {category.footerNote}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="bg-[#111a1f]/80 border border-[#80deea]/40 rounded-2xl p-8 text-center text-gray-400">
                  ไม่พบข้อมูลกฎ Roleplay ในระบบ
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}