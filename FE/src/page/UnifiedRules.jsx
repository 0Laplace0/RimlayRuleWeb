import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function UnifiedRules({
  apiUrl = 'http://localhost:5000/api/default-rules',
  defaultPageTitle = 'กฎระเบียบและข้อบังคับ'
} = {}) {
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);

  useEffect(() => {
    fetchRules();
  }, [location.state]);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(apiUrl);
      const data = res.data.data || res.data || [];
      const categoriesArray = Array.isArray(data) ? data : [];
      setCategories(categoriesArray);

      const selectedMainId = location.state?.selectedMainId;
      const categoryName = location.state?.categoryName;

      if (selectedMainId !== undefined && selectedMainId !== null) {
        const found = categoriesArray.find((item) => String(item.id) === String(selectedMainId));
        if (found) {
          setSelectedCategory(found);
        } else if (categoriesArray.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesArray[0]);
        }
      } else if (categoryName) {
        const found = categoriesArray.find((item) => item.title === categoryName);
        if (found) {
          setSelectedCategory(found);
        } else if (categoriesArray.length > 0 && !selectedCategory) {
          setSelectedCategory(categoriesArray[0]);
        }
      } else if (categoriesArray.length > 0 && !selectedCategory) {
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

  // --- Helper สำหรับแปลง Delta / JSON / Text เป็น JSX ---
  const renderFormattedContent = (itemOrDelta) => {
    if (!itemOrDelta && itemOrDelta !== 0) return '';
    if (typeof itemOrDelta === 'string' && !itemOrDelta.trim().startsWith('{')) {
      return itemOrDelta;
    }
    
    const raw = itemOrDelta?.textDelta || itemOrDelta?.text || itemOrDelta;
    if (!raw) return '';

    let deltaObj = raw;
    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
      try {
        deltaObj = JSON.parse(raw);
      } catch (e) {
        return raw;
      }
    }

    if (deltaObj && Array.isArray(deltaObj.ops)) {
      return deltaObj.ops.map((op, idx) => {
        if (typeof op.insert !== 'string') return null;
        const attrs = op.attributes || {};

        const style = {};
        if (attrs.color) style.color = attrs.color;
        if (attrs.background) style.backgroundColor = attrs.background;

        return (
          <span
            key={idx}
            style={style}
            className={`
              ${attrs.bold ? 'font-bold' : ''} 
              ${attrs.italic ? 'italic' : ''} 
              ${attrs.underline ? 'underline' : ''}
            `}
          >
            {op.insert}
          </span>
        );
      });
    }

    return String(raw);
  };

  // --- ดึงค่าการเงิน ---
  const extractMoneyVal = (rule) => {
    if (typeof rule !== 'object' || !rule) return null;
    return (
      rule.penaltyValue ??
      rule.penalty_value ??
      rule.fine ??
      rule.fineValue ??
      rule.fine_value ??
      rule.price ??
      rule.fee ??
      rule.amount ??
      rule.cost ??
      null
    );
  };

  // --- ดึงค่าจำคุก / เวลา ---
  const extractJailVal = (rule) => {
    if (typeof rule !== 'object' || !rule) return null;
    return (
      rule.jailTime ??
      rule.jail_time ??
      rule.jailMinutes ??
      rule.jail_minutes ??
      rule.jail ??
      rule.jailValue ??
      rule.jail_value ??
      rule.time ??
      rule.minutes ??
      rule.imprisonment ??
      rule.duration ??
      null
    );
  };

  // --- แสดงผลข้อความธรรมดา ---
  const renderValue = (val, isJailColumn = false) => {
    if (val === null || val === undefined || val === '') {
      return <span className="text-gray-500">-</span>;
    }

    const str = String(val).trim();
    if (!str) return <span className="text-gray-500">-</span>;

    if (isJailColumn && !isNaN(str)) {
      return `${str} นาที`;
    }

    return str;
  };

  // --- ตรวจสอบว่าเป็นหมวดหมู่ตารางหรือไม่ ---
  const isTableCategory = (() => {
    if (!selectedCategory) return false;
    const typeStr = String(selectedCategory.type || '').toLowerCase();
    if (['fine', 'fines', 'penalty', 'fee', 'price', 'cost', 'charge', 'police', 'law'].includes(typeStr)) return true;

    const titleStr = selectedCategory.title || '';
    if (
      titleStr.includes('ค่ารักษา') || titleStr.includes('ค่าบริการ') || 
      titleStr.includes('ค่าปรับ') || titleStr.includes('จำคุก') ||
      titleStr.toLowerCase().includes('fine') || titleStr.toLowerCase().includes('fee') ||
      titleStr.toLowerCase().includes('price')
    ) return true;

    if (selectedCategory.subGroups && selectedCategory.subGroups.length > 0) {
      return selectedCategory.subGroups.some((sub) => {
        const list = sub.rules || sub.items || [];
        return list.some((item) => typeof item === 'object' && (extractMoneyVal(item) !== null || extractJailVal(item) !== null));
      });
    }

    const topList = selectedCategory.rules || selectedCategory.items || [];
    return topList.some((item) => typeof item === 'object' && (extractMoneyVal(item) !== null || extractJailVal(item) !== null));
  })();

  // 🌟 ตรวจสอบว่าเป็นหมวดหมู่ "ตำรวจ" หรือไม่ (เพื่อแสดงคอลัมน์จำคุก)
  const isPoliceCategory = (() => {
    if (!selectedCategory) return false;
    const typeStr = String(selectedCategory.type || '').toLowerCase();
    const titleStr = selectedCategory.title || '';

    if (['police', 'law', 'cop'].includes(typeStr)) return true;
    if (titleStr.includes('ตำรวจ') || titleStr.includes('สน.') || titleStr.toLowerCase().includes('police')) return true;

    const hasJailInRules = (rules) => rules?.some((r) => extractJailVal(r) !== null);

    if (selectedCategory.subGroups && selectedCategory.subGroups.length > 0) {
      return selectedCategory.subGroups.some((sub) => hasJailInRules(sub.rules || sub.items));
    }

    return hasJailInRules(selectedCategory.rules || selectedCategory.items);
  })();

  // 🌟 เรนเดอร์ตาราง (Dark Mode / Cyan Style)
  const renderTableData = (ruleList) => {
    if (!ruleList || ruleList.length === 0) return null;

    return (
      <div className="overflow-x-auto border border-[#80deea]/30 rounded-xl bg-[#111a1f]/90 shadow-sm">
        <table className="min-w-full border-collapse text-left text-sm">
          <thead className="bg-[#80deea]/15 border-b border-[#80deea]/30 text-[#80deea]">
            <tr>
              <th className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider border-r border-[#80deea]/20 ${isPoliceCategory ? 'w-1/2' : 'w-2/3'}`}>
                รายการ
              </th>
              <th className={`px-6 py-3.5 text-xs font-bold uppercase tracking-wider ${isPoliceCategory ? 'border-r border-[#80deea]/20 w-1/4' : 'w-1/3'}`}>
                {isPoliceCategory ? 'ค่าปรับ' : 'ค่ารักษา / ค่าบริการ'}
              </th>
              {isPoliceCategory && (
                <th className="px-6 py-3.5 text-xs font-bold uppercase tracking-wider w-1/4">
                  จำคุก / นาที
                </th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#80deea]/20">
            {ruleList.map((rule, rIdx) => {
              const textContent = typeof rule === 'object' && !rule.textDelta ? (rule.text || rule.description || rule.title || '') : rule;
              const moneyVal = extractMoneyVal(rule);
              const jailVal = extractJailVal(rule);

              return (
                <tr key={rIdx} className="hover:bg-[#80deea]/10 transition">
                  <td className="px-6 py-4 font-medium text-white align-top border-r border-[#80deea]/20 whitespace-pre-wrap">
                    {renderFormattedContent(textContent)}
                  </td>
                  <td className={`px-6 py-4 align-top font-normal text-gray-300 ${isPoliceCategory ? 'border-r border-[#80deea]/20' : ''}`}>
                    {renderValue(moneyVal, false)}
                  </td>
                  {isPoliceCategory && (
                    <td className="px-6 py-4 align-top font-normal text-gray-300">
                      {renderValue(jailVal, true)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    return url.startsWith('http') ? url : `http://localhost:5000${url.startsWith('/') ? '' : '/'}${url}`;
  };

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col w-full relative overflow-x-hidden">
      <Navbar />
      <Banner manageGlobalBackground={true} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 py-8 flex flex-col items-center">
        {loading && <div className="text-center py-10 text-gray-400">กำลังโหลดข้อมูล...</div>}
        {error && <div className="text-center py-10 text-red-400">เกิดข้อผิดพลาด: {error}</div>}

        {!loading && !error && (
          <div className="w-full space-y-6 animate-fadeIn">
            {selectedCategory && (
              <>
                {/* หัวข้อหลักประจำหน้า */}
                <div className="text-center pb-6 border-b border-[#80deea]/30 mb-8">
                  <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    {selectedCategory.title || defaultPageTitle}
                  </h1>
                </div>

                {/* =================== 1. ฝั่ง กฎทั่วไป =================== */}
                {!isTableCategory ? (
                  <div className="bg-[#111a1f]/80 p-6 sm:p-8 rounded-2xl border border-[#80deea]/30 shadow-sm space-y-8 text-white">
                    {selectedCategory.items && selectedCategory.items.length > 0 && (
                      <ul className="space-y-3 list-disc pl-5 text-gray-300 text-sm sm:text-base leading-relaxed">
                        {selectedCategory.items.map((item, index) => {
                          const subItems = item.subItems || item.items || [];
                          const textContent = typeof item === 'object' && !item.textDelta ? (item.text || item.description || '') : item;
                          return (
                            <li key={index} className="space-y-2">
                              <div className="font-medium text-white whitespace-pre-wrap">
                                {renderFormattedContent(textContent)}
                              </div>
                              {subItems.length > 0 && (
                                <ul className="space-y-1.5 list-[circle] pl-5 mt-2 text-gray-400 text-sm">
                                  {subItems.map((subItem, sIdx) => {
                                    const subText = typeof subItem === 'object' && !subItem.textDelta ? (subItem.text || subItem.description || '') : subItem;
                                    return (
                                      <li key={sIdx} className="whitespace-pre-wrap">
                                        {renderFormattedContent(subText)}
                                      </li>
                                    );
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
                          const subTitleText = sub.subTitle || sub.sub_title || sub.name;
                          return (
                            <div key={sub.id || sub.subId || sIdx} className="space-y-3">
                              {subTitleText && (
                                <h3 className="text-base sm:text-lg font-bold text-white border-l-4 border-[#80deea] pl-3">
                                  {subTitleText}
                                </h3>
                              )}
                              {subItemsList.length > 0 && (
                                <ul className="space-y-2 list-disc pl-5 text-gray-300 text-sm sm:text-base leading-relaxed">
                                  {subItemsList.map((subItem, rIdx) => {
                                    const nestedSubItems = subItem.subItems || subItem.items || [];
                                    const textContent = typeof subItem === 'object' && !subItem.textDelta ? (subItem.text || subItem.description || '') : subItem;
                                    return (
                                      <li key={rIdx} className="space-y-1">
                                        <div className="whitespace-pre-wrap text-white">
                                          {renderFormattedContent(textContent)}
                                        </div>
                                        {nestedSubItems.length > 0 && (
                                          <ul className="space-y-1 list-[circle] pl-5 mt-1 text-gray-400 text-sm">
                                            {nestedSubItems.map((nested, nIdx) => (
                                              <li key={nIdx} className="whitespace-pre-wrap">
                                                {renderFormattedContent(nested)}
                                              </li>
                                            ))}
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
                      <div className="space-y-4 pt-6 border-t border-[#80deea]/20">
                        <h3 className="text-base font-semibold text-[#80deea]">รูปภาพประกอบ</h3>
                        <div className="flex flex-col gap-6">
                          {selectedCategory.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="space-y-2 text-center">
                              <img
                                src={getImageUrl(img.imageUrl)}
                                alt={img.caption || 'rule-img'}
                                className="w-1/2 mx-auto h-auto rounded-lg object-cover border border-[#80deea]/30"
                              />
                              {img.caption && (
                                <p className="text-xs text-gray-400 font-medium text-center">
                                  * {img.caption}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* =================== 2. ฝั่ง ตาราง =================== */
                  <div className="space-y-6">
                    {selectedCategory.subGroups && selectedCategory.subGroups.length > 0 ? (
                      selectedCategory.subGroups.map((sub, sIdx) => {
                        const ruleList = sub.rules || sub.items || [];
                        const subTitleText = sub.subTitle || sub.sub_title || sub.name;
                        return (
                          <div key={sub.id || sub.subId || sIdx} className="space-y-4 bg-[#111a1f]/80 p-6 rounded-2xl border border-[#80deea]/30 shadow-sm">
                            {subTitleText && (
                              <h3 className="text-base sm:text-lg font-bold text-white border-l-4 border-[#80deea] pl-3">
                                {subTitleText}
                              </h3>
                            )}
                            {renderTableData(ruleList)}
                          </div>
                        );
                      })
                    ) : (
                      <div className="space-y-3 bg-[#111a1f]/80 p-6 rounded-2xl border border-[#80deea]/30 shadow-sm">
                        {renderTableData(selectedCategory.rules || selectedCategory.items || [])}
                      </div>
                    )}
                  </div>
                )}

                {/* หมายเหตุท้ายหน้า */}
                {(selectedCategory.footerNote || selectedCategory.footer_note) && (
                  <div className="p-4 bg-[#80deea]/10 border border-[#80deea]/40 rounded-xl text-[#80deea] text-sm">
                    <span className="font-semibold text-white">หมายเหตุ: </span>{' '}
                    {selectedCategory.footerNote || selectedCategory.footer_note}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}