import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

export default function StreamingPolicy() {
  const [policyData, setPolicyData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPolicyDetail();
  }, []);

  const fetchPolicyDetail = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/streaming-policies');
      
      const found = res.data.find((item) => item.category === 'streaming') || res.data[0];
      
      if (found) {
        setPolicyData(found);
      } else {
        setError('ไม่พบข้อมูลนโยบายที่คุณต้องการ');
      }
    } catch (err) {
      console.error(err);
      setError('เกิดข้อผิดพลาดในการโหลดข้อมูล');
    } finally {
      setLoading(false);
    }
  };

  // --- เพิ่มฟังก์ชันแปลง Delta/Text เป็น JSX ---
  const renderFormattedContent = (rule) => {
    const raw = rule.textDelta || rule.text;
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

        // เตรียม Inline Style สำหรับสีฟอนต์และพื้นหลัง
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

  const renderPenaltyBadge = (penaltyValue) => {
    if (!penaltyValue) return null;

    let badgeStyle = 'bg-gray-100 text-gray-700 border-gray-200';
    if (penaltyValue.includes('ใบแดง') || penaltyValue.includes('ร้ายแรง')) {
      badgeStyle = 'bg-red-50 text-red-600 border-red-200';
    } else if (penaltyValue.includes('ใบส้ม') || penaltyValue.includes('พยายาม')) {
      badgeStyle = 'bg-orange-50 text-orange-600 border-orange-200';
    } else if (penaltyValue.includes('ใบเหลือง')) {
      badgeStyle = 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${badgeStyle} mb-2`}>
        {penaltyValue}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-20 text-gray-500">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error || !policyData) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-red-500 mb-4">{error || 'ไม่พบข้อมูล'}</p>
          <Link to="/" className="text-blue-600 underline">กลับสู่หน้าหลัก</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Banner />

      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* หัวข้อหลัก */}
        <div className="text-center pb-8 border-b border-gray-200 mb-10 pt-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
            {policyData.title}
          </h1>
        </div>

        {/* รายการหัวข้อย่อยและกฎ */}
        <div className="space-y-10">
          {policyData.subGroups && policyData.subGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-4">
              {group.subTitle && (
                <h2 className="text-xl sm:text-2xl font-bold text-blue-600">
                  {group.subTitle}
                </h2>
              )}
              <div className="space-y-6">
                {group.rules && group.rules.map((rule, ruleIdx) => (
                  <div key={ruleIdx} className="space-y-1">
                    {renderPenaltyBadge(rule.penaltyValue)}
                    <p className="text-gray-700 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
                      {renderFormattedContent(rule)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* หมายเหตุท้ายหน้า */}
        {policyData.footerNote && (
          <div className="mt-16 pt-6 border-t border-gray-100">
            <h3 className="text-lg font-bold text-blue-600 mb-2">หมายเหตุ</h3>
            <p className="text-gray-600 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {policyData.footerNote}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}