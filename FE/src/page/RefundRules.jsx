import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function RefundPolicyRules() {
  const [refundData, setRefundData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRefundPolicy();
  }, []);

  const fetchRefundPolicy = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/refund-policy');
      setRefundData(response.data || []);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching refund policy:', err);
      setError('ไม่สามารถโหลดข้อมูล Refund Policy ได้ในขณะนี้');
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-transparent text-white">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] text-[#80deea] animate-pulse">
          กำลังโหลดข้อมูล...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <Navbar />
        <div className="flex justify-center items-center min-h-[60vh] text-rose-500">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col w-full relative overflow-x-hidden">
      <Navbar />
      <Banner manageGlobalBackground={true} />

      <div className="flex-1 w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-center text-white mb-4 tracking-wide">
          Refund Policy
        </h1>
        <hr className="border-t border-[#80deea]/30 mb-8" />

        <div className="space-y-6">
          {refundData.map((section, index) => {
            const subGroupsList = section.subGroups || section.subcategories || [];
            const footerText = section.footerNote || section.footer_note;

            return (
              <div key={section.id || index} className="space-y-4 bg-[#111a1f]/80 border border-[#80deea]/40 rounded-2xl p-6 shadow-lg">
                {/* หัวข้อหลัก */}
                <h2 className="text-xl md:text-2xl font-bold text-white leading-relaxed border-b border-[#80deea]/20 pb-3">
                  {section.title}
                </h2>

                {subGroupsList.length > 0 && (
                  <div className="space-y-4 pl-2 md:pl-4">
                    {subGroupsList.map((sub, subIdx) => {
                      const subTitleText = sub.subTitle || sub.sub_title || sub.name;
                      const rulesList = sub.rules || sub.items || [];

                      return (
                        <div key={sub.subId || sub.id || subIdx} className="space-y-2">
                          {/* หัวข้อย่อย */}
                          {subTitleText && (
                            <p className="font-semibold text-[#80deea] text-base border-l-4 border-[#80deea] pl-3 py-0.5">
                              {subIdx + 1}. {subTitleText}
                            </p>
                          )}

                          {rulesList.length > 0 && (
                            <ul className="space-y-2 pl-4">
                              {rulesList.map((rule, ruleIdx) => {
                                const subItems = rule.subItems || rule.sub_items || [];

                                return (
                                  <li key={rule.ruleId || rule.id || ruleIdx} className="flex items-start text-sm text-gray-300 leading-relaxed">
                                    <span className="font-medium mr-2 min-w-[32px] shrink-0 text-[#80deea]">
                                      {subIdx + 1}.{ruleIdx + 1}
                                    </span>
                                    <div className="flex-1 whitespace-pre-wrap">
                                      <span>{renderFormattedContent(rule)}</span>

                                      {rule.penaltyValue && (
                                        <span className="text-red-400 font-semibold ml-2 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded text-xs">
                                          {rule.penaltyValue}
                                        </span>
                                      )}

                                      {subItems.length > 0 && (
                                        <ul className="list-disc pl-5 mt-1.5 space-y-1">
                                          {subItems.map((si, siIdx) => (
                                            <li key={si.subItemId || si.id || siIdx} className="text-gray-400 whitespace-pre-wrap">
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

                {/* หมายเหตุ */}
                {footerText && (
                  <div className="text-sm text-[#80deea] bg-[#80deea]/10 p-4 rounded-xl border border-[#80deea]/40 mt-4">
                    <strong className="text-white">หมายเหตุ: </strong>
                    <span className="text-gray-300">{footerText}</span>
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