import { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Banner from '../components/Banner';

const Home = () => {
  const [contentList, setContentList] = useState([]);
  const [loading, setLoading] = useState(true);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/home?category=home`);
        const responseData = res.data.data || res.data;
        setContentList(Array.isArray(responseData) ? responseData : [responseData]);
      } catch (err) {
        console.error('Failed to fetch home data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, [API_URL]);

  // ฟังก์ชันแปลง rule text / textDelta รองรับ JSON String, Delta Object และการแต่งสไตล์ทั้งหมด (รวม Highlight)
  const renderRuleText = (rule) => {
    if (!rule) return '';

    let deltaObj = rule.textDelta || rule.description || rule.penalty || rule;

    if (typeof deltaObj === 'string') {
      const trimmed = deltaObj.trim();
      if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
        try {
          deltaObj = JSON.parse(trimmed);
        } catch (e) {
          return deltaObj;
        }
      } else {
        return deltaObj;
      }
    }

    if (deltaObj && typeof deltaObj === 'object' && Array.isArray(deltaObj.ops)) {
      return deltaObj.ops.map((o, idx) => {
        const text = o.insert || '';
        
        if (typeof text === 'string' && text === '\n') {
          return null;
        }

        if (o.attributes && Object.keys(o.attributes).length > 0) {
          const style = {};
          
          if (o.attributes.color) style.color = o.attributes.color;
          if (o.attributes.bold) style.fontWeight = 'bold';
          if (o.attributes.italic) style.fontStyle = 'italic';
          
          if (o.attributes.background) style.backgroundColor = o.attributes.background;
          if (o.attributes.bg) style.backgroundColor = o.attributes.bg;

          const textDecorations = [];
          if (o.attributes.underline) textDecorations.push('underline');
          if (o.attributes.strike) textDecorations.push('line-through');
          if (textDecorations.length > 0) {
            style.textDecoration = textDecorations.join(' ');
          }

          return (
            <span key={idx} style={style}>
              {text}
            </span>
          );
        }
        return text;
      });
    }

    if (rule.html) {
      return <span dangerouslySetInnerHTML={{ __html: rule.html }} />;
    }

    return rule.text || rule.ruleText || (typeof rule === 'string' ? rule : '');
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full relative overflow-x-hidden">
      <Navbar />
      <Banner />

      <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 space-y-10 relative z-10">
        {loading ? (
          <div className="text-center text-gray-400 py-20">กำลังโหลดข้อมูล...</div>
        ) : contentList.length > 0 ? (
          contentList.map((section, sIdx) => (
            <div key={section.id || sIdx} className="space-y-6">
              {/* หัวข้อหลัก */}
              {section.title && (
                <h1 className="text-2xl md:text-3xl font-bold text-center text-white mb-8">
                  {section.title}
                </h1>
              )}

              {/* SubGroups / รายละเอียดแบบไม่มีกรอบ */}
              <div className="text-gray-300 leading-relaxed space-y-6">
                {section.subGroups && section.subGroups.length > 0 ? (
                  section.subGroups.map((group, idx) => (
                    <div key={idx} className="space-y-2">
                      {group.subTitle && (
                        <h3 className="text-base font-bold text-indigo-300 mt-4">
                          {group.subTitle}
                        </h3>
                      )}
                      
                      {group.rules && group.rules.length > 0 ? (
                        <ul className="list-disc pl-6 space-y-2 text-gray-200">
                          {group.rules.map((rule, rIdx) => (
                            <li key={rIdx} className="leading-relaxed whitespace-pre-wrap">
                              {renderRuleText(rule)}
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">ยังไม่มีเนื้อหาประกาศในระบบ</p>
                )}
              </div>

              {/* Footer Note (หมายเหตุ) แบบกรอบสีเหลือง/ครีม */}
              {section.footerNote && (
                <div className="mt-8 px-4 py-3.5 rounded-xl bg-amber-50/95 border border-amber-300 text-amber-900 text-sm">
                  <span className="font-semibold">หมายเหตุ: </span>
                  {section.footerNote.replace(/^หมายเหตุ[:：]\s*/i, '')}
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center text-gray-500 py-25">ไม่พบข้อมูลหน้าแรก</div>
        )}
      </div>
    </div>
  );
};

export default Home;