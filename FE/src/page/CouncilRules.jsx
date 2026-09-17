import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function CouncilRules() {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchCouncilRules();
  }, [location.state]);

  const fetchCouncilRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/council-rules');
      const data = res.data.data || res.data || [];
      const categoriesArray = Array.isArray(data) ? data : [];
      setCategories(categoriesArray);

      const selectedMainId = location.state?.selectedMainId;
      const categoryName = location.state?.categoryName;

      if (selectedMainId) {
        const found = categoriesArray.find((item) => item.id === selectedMainId);
        if (found) {
          setSelectedCategory(found);
        } else if (categoriesArray.length > 0) {
          setSelectedCategory(categoriesArray[0]);
        }
      } else if (categoryName) {
        const found = categoriesArray.find((item) => item.title === categoryName);
        if (found) {
          setSelectedCategory(found);
        } else if (categoriesArray.length > 0) {
          setSelectedCategory(categoriesArray[0]);
        }
      } else if (categoriesArray.length > 0) {
        setSelectedCategory(categoriesArray[0]);
      }

      if (location.state) {
        window.history.replaceState({}, document.title);
      }
    } catch (err) {
      setError(err.message || 'ไม่สามารถดึงข้อมูลได้');
    } finally {
      setLoading(false);
    }
  };

  const renderBadge = (text) => {
    if (!text) return <span className="text-gray-400">-</span>;
    const words = String(text).split(' ');
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {words.map((word, idx) => {
          if (!word) return null;
          if (word.includes('จำคุก')) {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 bg-cyan-50 border border-cyan-200 text-cyan-700 rounded-md text-xs font-semibold"
              >
                {word}
              </span>
            );
          }
          if (word.includes('ปรับ') || word.includes('X5')) {
            return (
              <span
                key={idx}
                className="px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md text-xs font-bold"
              >
                {word}
              </span>
            );
          }
          return (
            <span key={idx} className="text-gray-700 text-xs">
              {word}
            </span>
          );
        })}
      </div>
    );
  };

  const isFineCategory = (() => {
    if (!selectedCategory) return false;
    if (selectedCategory.type === 'fine' || selectedCategory.type === 'fines' || selectedCategory.type === 'penalty') return true;
    if (selectedCategory.title && (selectedCategory.title.includes('ค่าปรับ') || selectedCategory.title.toLowerCase().includes('fine'))) return true;
    
    if (selectedCategory.subGroups && selectedCategory.subGroups.length > 0) {
      return selectedCategory.subGroups.some(sub => {
        const list = sub.rules || sub.items || [];
        return list.some(item => typeof item === 'object' && (item.penaltyValue || item.fine || item.jailTime || item.time));
      });
    }
    return false;
  })();

  return (
    <div className="min-h-screen bg-gray-50 pb-16 text-gray-800 flex flex-col w-full relative">
      <Navbar />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
        {loading && <div className="text-center py-10 text-gray-500">กำลังโหลดข้อมูลกฎสภา...</div>}
        {error && <div className="text-center py-10 text-red-500">เกิดข้อผิดพลาด: {error}</div>}

        {!loading && !error && selectedCategory && (
          <div className="w-full space-y-6 animate-fadeIn">
            {/* หัวข้อหลักประจำหน้า */}
            <div className="text-center pb-6 border-b border-gray-200 mb-8">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                {selectedCategory.title}
              </h1>
            </div>

            {/* =================== 1. ฝั่ง กฎทั่วไป =================== */}
            {!isFineCategory ? (
              <div className="bg-white p-6 sm:p-8 rounded-2xl border border-gray-200 shadow-sm space-y-8">
                {selectedCategory.items && selectedCategory.items.length > 0 && (
                  <ul className="space-y-3 list-disc pl-5 text-gray-700 text-sm sm:text-base leading-relaxed">
                    {selectedCategory.items.map((item, index) => {
                      const textContent = typeof item === 'string' ? item : item.text || item.description || '';
                      const subItems = item.subItems || item.items || [];
                      return (
                        <li key={index} className="space-y-2">
                          <div className="font-medium text-gray-900">{textContent}</div>
                          {subItems.length > 0 && (
                            <ul className="space-y-1.5 list-[circle] pl-5 mt-2 text-gray-600 text-sm">
                              {subItems.map((subItem, sIdx) => {
                                const subText =
                                  typeof subItem === 'string' ? subItem : subItem.text || subItem.description || '';
                                return <li key={sIdx}>{subText}</li>;
                              })}
                            </ul>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}

                {selectedCategory.subGroups && selectedCategory.subGroups.length > 0 && (
                  <div className="space-y-6">
                    {selectedCategory.subGroups.map((sub, sIdx) => {
                      const subItemsList = sub.items || sub.rules || [];
                      return (
                        <div key={sub.id || sIdx} className="space-y-3">
                          {sub.subTitle && (
                            <h3 className="text-base sm:text-lg font-bold text-slate-900 border-l-4 border-slate-900 pl-3">
                              {sub.subTitle}
                            </h3>
                          )}
                          {subItemsList.length > 0 && (
                            <ul className="space-y-2 list-disc pl-5 text-gray-700 text-sm sm:text-base leading-relaxed">
                              {subItemsList.map((subItem, rIdx) => {
                                const textContent =
                                  typeof subItem === 'string'
                                    ? subItem
                                    : subItem.text || subItem.description || '';
                                const nestedSubItems = subItem.subItems || subItem.items || [];
                                return (
                                  <li key={rIdx} className="space-y-1">
                                    <div>{textContent}</div>
                                    {nestedSubItems.length > 0 && (
                                      <ul className="space-y-1 list-[circle] pl-5 mt-1 text-gray-600 text-sm">
                                        {nestedSubItems.map((nested, nIdx) => {
                                          const nestedText =
                                            typeof nested === 'string'
                                              ? nested
                                              : nested.text || nested.description || '';
                                          return <li key={nIdx}>{nestedText}</li>;
                                        })}
                                      </ul>
                                    )}
                                  </li>
                                );
                              })}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {selectedCategory.images && selectedCategory.images.length > 0 && (
                  <div className="space-y-4 pt-6 border-t border-gray-100">
                    <h3 className="text-base font-semibold text-gray-800">รูปภาพประกอบ</h3>
                    <div className="flex flex-col gap-6">
                      {selectedCategory.images.map((img, imgIdx) => (
                        <div key={imgIdx} className="space-y-2 text-center">
                          <img
                            src={`http://localhost:5000${img.imageUrl}`}
                            alt={img.caption || 'rule-img'}
                            className="w-1/2 mx-auto h-auto rounded-lg object-cover"
                          />
                          {img.caption && (
                            <p className="text-xs text-gray-600 font-medium text-center">* {img.caption}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* =================== 2. ฝั่ง ค่าปรับ =================== */
              <div className="space-y-6">
                {selectedCategory.subGroups && selectedCategory.subGroups.length > 0 ? (
                  selectedCategory.subGroups.map((sub, sIdx) => {
                    const ruleList = sub.rules || sub.items || [];
                    return (
                      <div key={sIdx} className="space-y-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        {sub.subTitle && (
                          <h3 className="text-base sm:text-lg font-bold text-slate-900 border-l-4 border-slate-900 pl-3">
                            {sub.subTitle}
                          </h3>
                        )}
                        <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                          <table className="min-w-full border-collapse text-left text-sm">
                            <thead className="bg-gray-100 border-b border-gray-200 text-gray-700">
                              <tr>
                                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/2 border-r border-gray-200">
                                  รายการ
                                </th>
                                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/4 border-r border-gray-200">
                                  ค่าปรับ
                                </th>
                                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/4">
                                  จำคุก / นาที
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {ruleList.map((rule, rIdx) => {
                                const ruleText = typeof rule === 'string' ? rule : (rule.text || rule.description || '-');
                                const fineVal = typeof rule === 'object' ? (rule.penaltyValue || rule.fine) : null;
                                const jailVal = typeof rule === 'object' ? (rule.jailTime || rule.time) : null;

                                return (
                                  <tr key={rIdx} className="hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-medium text-gray-900 align-top border-r border-gray-200">
                                      {ruleText}
                                    </td>
                                    <td className="px-6 py-4 align-top border-r border-gray-200 font-semibold text-gray-800">
                                      {renderBadge(fineVal)}
                                    </td>
                                    <td className="px-6 py-4 align-top">
                                      {renderBadge(jailVal)}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="space-y-3 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="overflow-x-auto border border-gray-200 rounded-xl bg-white shadow-sm">
                      <table className="min-w-full border-collapse text-left text-sm">
                        <thead className="bg-gray-100 border-b border-gray-200 text-gray-700">
                          <tr>
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/2 border-r border-gray-200">
                              รายการ
                            </th>
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/4 border-r border-gray-200">
                              ค่าปรับ
                            </th>
                            <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/4">
                              จำคุก / นาที
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {(selectedCategory.rules || selectedCategory.items || []).map((rule, rIdx) => {
                            const ruleText = typeof rule === 'string' ? rule : (rule.text || rule.description || '-');
                            const fineVal = typeof rule === 'object' ? (rule.penaltyValue || rule.fine) : null;
                            const jailVal = typeof rule === 'object' ? (rule.jailTime || rule.time) : null;

                            return (
                              <tr key={rIdx} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4 font-medium text-gray-900 align-top border-r border-gray-200">
                                  {ruleText}
                                </td>
                                <td className="px-6 py-4 align-top border-r border-gray-200 font-semibold text-gray-800">
                                  {renderBadge(fineVal)}
                                </td>
                                <td className="px-6 py-4 align-top">
                                  {renderBadge(jailVal)}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* หมายเหตุท้ายหน้า */}
            {selectedCategory.footerNote && (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-sm">
                <span className="font-semibold">หมายเหตุ: </span> {selectedCategory.footerNote}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}