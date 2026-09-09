import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

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
      // เรียกใช้งาน API Endpoint ที่สอดคล้องกับ refundRoutes.js (router.get('/refund-policy', ...))
      const response = await axios.get('http://localhost:5000/api/refund-policy');
      
      setRefundData(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching refund policy:', err);
      setError('ไม่สามารถโหลดข้อมูล Refund Policy ได้ในขณะนี้');
      setLoading(false);
    }
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
          Refund Policy
        </h1>
        <hr className="border-t border-gray-300 mb-8" />

        <div className="space-y-6">
          {refundData.map((section, index) => (
            <div key={section.id || index} className="space-y-3">
              {/* หัวข้อหลัก */}
              <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
                {section.title}
              </h2>

              {section.subGroups && section.subGroups.length > 0 && (
                <div className="space-y-2 pl-4">
                  {section.subGroups.map((sub, subIdx) => (
                    <div key={sub.subId || subIdx} className="space-y-2">
                      {/* หัวข้อย่อย */}
                      {sub.subTitle && (
                        <p className="font-semibold text-gray-800 text-sm">
                          {subIdx + 1}. {sub.subTitle}
                        </p>
                      )}

                      {sub.rules && sub.rules.length > 0 && (
                        <ul className="space-y-2 pl-2">
                          {sub.rules.map((rule, ruleIdx) => (
                            <li key={rule.ruleId || ruleIdx} className="flex items-start text-sm text-gray-700 leading-relaxed">
                              <span className="font-medium mr-2 min-w-[28px]">
                                {subIdx + 1}.{ruleIdx + 1}
                              </span>
                              <div className="flex-1">
                                <span>{rule.text}</span>
                                
                                {rule.penaltyValue && (
                                  <span className="text-red-600 font-medium ml-1">
                                    {rule.penaltyValue}
                                  </span>
                                )}

                                {rule.subItems && rule.subItems.length > 0 && (
                                  <ul className="list-disc pl-5 mt-1 space-y-1">
                                    {rule.subItems.map((si, siIdx) => (
                                      <li key={si.subItemId || siIdx} className="text-gray-600">
                                        {si.text}
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* หมายเหตุ */}
              {section.footerNote && (
                <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-md border-l-4 border-gray-400 italic mt-2 ml-4">
                  <span className="font-semibold not-italic text-gray-900">หมายเหตุ: </span>
                  {section.footerNote}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}