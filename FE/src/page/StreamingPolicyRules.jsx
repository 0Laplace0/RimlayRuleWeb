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

  const renderFormattedContent = (rule) => {
    const raw = rule.textDelta || rule.text;
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

  const renderPenaltyBadge = (penaltyValue) => {
    if (!penaltyValue) return null;

    let badgeStyle = 'bg-gray-800/60 text-gray-300 border-gray-600';
    if (penaltyValue.includes('ใบแดง') || penaltyValue.includes('ร้ายแรง')) {
      badgeStyle = 'bg-red-500/20 text-red-300 border-red-500/50';
    } else if (penaltyValue.includes('ใบส้ม') || penaltyValue.includes('พยายาม')) {
      badgeStyle = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    } else if (penaltyValue.includes('ใบเหลือง')) {
      badgeStyle = 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    }

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium border ${badgeStyle} mb-2`}>
        {penaltyValue}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <Navbar />
        <div className="text-center py-20 text-[#80deea] animate-pulse">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error || !policyData) {
    return (
      <div className="min-h-screen bg-transparent text-white">
        <Navbar />
        <div className="text-center py-20">
          <p className="text-rose-500 mb-4">{error || 'ไม่พบข้อมูล'}</p>
          <Link to="/" className="text-[#80deea] underline">กลับสู่หน้าหลัก</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-white flex flex-col w-full relative overflow-x-hidden">
      <Navbar />
      <Banner manageGlobalBackground={true} />

      <div className="flex-1 w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        
        {/* หัวข้อหลัก */}
        <div className="text-center pb-8 border-b border-[#80deea]/30 mb-10 pt-4">
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            {policyData.title}
          </h1>
        </div>

        {/* รายการหัวข้อย่อยและกฎ */}
        <div className="space-y-10">
          {policyData.subGroups && policyData.subGroups.map((group, groupIdx) => (
            <div key={groupIdx} className="space-y-4">
              {group.subTitle && (
                <h2 className="text-xl sm:text-2xl font-bold text-[#80deea]">
                  {group.subTitle}
                </h2>
              )}
              <div className="space-y-6">
                {group.rules && group.rules.map((rule, ruleIdx) => (
                  <div key={ruleIdx} className="space-y-1">
                    {renderPenaltyBadge(rule.penaltyValue)}
                    <p className="text-gray-300 leading-relaxed text-base sm:text-lg whitespace-pre-wrap">
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
          <div className="mt-16 pt-6 border-t border-[#80deea]/30">
            <h3 className="text-lg font-bold text-[#80deea] mb-2">หมายเหตุ</h3>
            <p className="text-gray-400 text-sm sm:text-base leading-relaxed whitespace-pre-line">
              {policyData.footerNote}
            </p>
          </div>
        )}

      </div>
    </div>
  );
}