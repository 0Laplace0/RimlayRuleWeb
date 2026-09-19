import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function TermsRules() {
  const [termsData, setTermsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchTerms();
  }, []);

  const fetchTerms = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/terms-and-conditions');
      setTermsData(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching terms:', err);
      setError('ไม่สามารถโหลดข้อมูล Terms & Conditions ได้ในขณะนี้');
      setLoading(false);
    }
  };

  // --- Helper สำหรับแปลง Delta / JSON / Text เป็น JSX พร้อม Style สีและ Format ---
  const renderFormattedContent = (itemOrDelta) => {
    const raw = itemOrDelta?.textDelta || itemOrDelta?.text || itemOrDelta;
    if (!raw) return '';

    let deltaObj = raw;
    if (typeof raw === 'string' && raw.trim().startsWith('{')) {
      try {
        deltaObj = JSON.parse(raw);
      } catch (e) {
        return raw; // กรณีเป็น string ปกติ
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

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] text-gray-600">
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] text-red-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-gray-800 font-sans">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-4 tracking-wide">
          Terms & Conditions
        </h1>
        <hr className="border-t border-gray-300 mb-8" />

        <div className="space-y-6">
          {termsData.map((section, index) => {
            const subGroupsList = section.subGroups || section.subcategories || [];
            const footerText = section.footerNote || section.footer_note;

            return (
              <div key={section.id || index} className="space-y-3">
                {/* 1. กรอบแดง: เอาเลขนำหน้าออก เหลือแค่ชื่อหัวข้อ */}
                <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
                  {section.title}
                </h2>

                {subGroupsList.length > 0 && (
                  <div className="space-y-2 pl-4">
                    {subGroupsList.map((sub, subIdx) => {
                      const subTitleText = sub.subTitle || sub.sub_title || sub.name;
                      const rulesList = sub.rules || sub.items || [];

                      return (
                        <div key={sub.subId || sub.id || subIdx} className="space-y-2">
                          {/* 2. กรอบเขียว: ปรับเป็นเลขหลักเดี่ยว เช่น 1., 2. */}
                          {subTitleText && (
                            <p className="font-semibold text-gray-800 text-sm">
                              {subIdx + 1}. {subTitleText}
                            </p>
                          )}

                          {rulesList.length > 0 && (
                            <ul className="space-y-2 pl-2">
                              {rulesList.map((rule, ruleIdx) => {
                                const subItems = rule.subItems || rule.sub_items || [];

                                return (
                                  <li key={rule.ruleId || rule.id || ruleIdx} className="flex items-start text-sm text-gray-700 leading-relaxed">
                                    <span className="font-medium mr-2 min-w-[28px] shrink-0">
                                      {subIdx + 1}.{ruleIdx + 1}
                                    </span>
                                    <div className="flex-1 whitespace-pre-wrap">
                                      <span>{renderFormattedContent(rule)}</span>

                                      {rule.penaltyValue && (
                                        <span className="text-red-600 font-medium ml-1">
                                          {rule.penaltyValue}
                                        </span>
                                      )}

                                      {subItems.length > 0 && (
                                        <ul className="list-disc pl-5 mt-1 space-y-1">
                                          {subItems.map((si, siIdx) => (
                                            <li key={si.subItemId || si.id || siIdx} className="text-gray-600 whitespace-pre-wrap">
                                              {renderFormattedContent(si)}
                                            </li>
                                          ))}
                                        </ul>
                                      )}
                                    </div>
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

                {/* 3. กรอบเหลือง: ทำหมายเหตุให้รู้ว่าเป็นหมายเหตุชัดเจน */}
                {footerText && (
                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border-l-4 border-gray-400 italic mt-2 ml-4">
                    <span className="font-semibold not-italic text-gray-900">หมายเหตุ: </span>
                    {footerText}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}