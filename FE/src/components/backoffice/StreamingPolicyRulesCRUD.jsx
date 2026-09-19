import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';
import QuillEditor from '../QuillEditor.jsx';

const StreamingPolicyCRUD = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ id: null, title: '', footerNote: '', subGroups: [] });

  const API_URL = 'http://localhost:5000/api/streaming-policies';
  const token = localStorage.getItem('token');

  // --- Helper function สำหรับแปลง Text/Delta ---
  const normalizeDelta = (val) => {
    if (!val) return { ops: [{ insert: '' }] };
    if (typeof val === 'string' && val.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(val);
        if (parsed && parsed.ops) return parsed;
      } catch (e) {
        // ignore parse error, treat as text
      }
    }
    if (typeof val === 'object' && val.ops) return val;
    return { ops: [{ insert: String(val) }] };
  };

  // --- ดึงข้อมูลมาใส่ฟอร์มทันทีที่เปิดหน้านี้ ---
  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const dataList = res.data || [];
      if (dataList.length > 0) {
        const item = dataList[0];
        const rawSubGroups = item.subGroups || [];
        const copiedSubGroups = JSON.parse(JSON.stringify(rawSubGroups)).map(sg => ({
          ...sg,
          subId: sg.subId || sg.id || `temp_${Date.now()}_${Math.random()}`,
          subTitle: sg.subTitle || sg.sub_title || '',
          rules: (sg.rules || sg.items || []).map(r => ({
            ...r,
            ruleId: r.ruleId || r.id || `temp_${Date.now()}_${Math.random()}`,
            textDelta: normalizeDelta(r.textDelta || r.text)
          }))
        }));

        setForm({ 
          id: item.id, 
          title: item.title || '', 
          footerNote: item.footerNote || item.footer_note || '', 
          subGroups: copiedSubGroups 
        });
      }
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูล Streaming Policy ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicy();
  }, []);

  // --- Handlers สำหรับ subGroups & rules ---
  const handleAddSubGroup = () => {
    setForm(prev => ({
      ...prev,
      subGroups: [
        ...prev.subGroups, 
        { 
          subId: `temp_${Date.now()}_${Math.random()}`, 
          subTitle: '', 
          rules: [{ 
            ruleId: `temp_rule_${Date.now()}_${Math.random()}`, 
            textDelta: { ops: [{ insert: '' }] }
          }] 
        }
      ]
    }));
  };

  const handleRemoveSubGroup = (subId) => {
    setForm(prev => ({
      ...prev,
      subGroups: prev.subGroups.filter(sg => sg.subId !== subId && sg.id !== subId)
    }));
  };

  const handleUpdateSubGroupTitle = (subId, value) => {
    setForm(prev => ({
      ...prev,
      subGroups: prev.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          return { ...sg, subTitle: value, sub_title: value };
        }
        return sg;
      })
    }));
  };

  const handleAddRule = (subId) => {
    setForm(prev => ({
      ...prev,
      subGroups: prev.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rules = sg.rules || sg.items || [];
          const newRule = { 
            ruleId: `temp_rule_${Date.now()}_${Math.random()}`, 
            textDelta: { ops: [{ insert: '' }] }
          };
          return { ...sg, rules: [...rules, newRule], items: [...rules, newRule] };
        }
        return sg;
      })
    }));
  };

  const handleRemoveRule = (subId, ruleId) => {
    setForm(prev => ({
      ...prev,
      subGroups: prev.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updated = rulesList.filter(r => r.ruleId !== ruleId && r.id !== ruleId);
          return { ...sg, rules: updated, items: updated };
        }
        return sg;
      })
    }));
  };

  const handleUpdateRuleDelta = (subId, ruleId, delta) => {
    setForm(prev => ({
      ...prev,
      subGroups: prev.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updated = rulesList.map(r => {
            if (r.ruleId === ruleId || r.id === ruleId) {
              return { ...r, textDelta: delta };
            }
            return r;
          });
          return { ...sg, rules: updated, items: updated };
        }
        return sg;
      })
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isConfirmed = await swalUtils.previewConfirm({
      actionTitle: 'ตรวจสอบการบันทึก Streaming Policy',
      fields: [
        { label: 'ชื่อหัวข้อหลัก', value: form.title },
        { label: 'จำนวนกลุ่มย่อย', value: `${form.subGroups.length} กลุ่ม` }
      ],
      confirmText: 'ยืนยันบันทึกข้อมูล',
      cancelText: 'กลับไปแก้ไข'
    });

    if (!isConfirmed) return;

    try {
      const formattedSubGroups = form.form || form.subGroups.map(sg => ({
        subTitle: sg.subTitle || sg.sub_title || '',
        rules: (sg.rules || sg.items || []).map(r => {
          const delta = r.textDelta || { ops: [{ insert: '' }] };
          return {
            ruleId: r.ruleId || r.id || undefined,
            textDelta: delta,
            // เผื่อ Backend เก็บฟิลด์ text เป็น JSON String ของ Delta
            text: typeof delta === 'object' ? JSON.stringify(delta) : String(delta || '')
          };
        })
      }));

      const payload = {
        title: form.title,
        footerNote: form.footerNote,
        footer_note: form.footerNote,
        subGroups: formattedSubGroups
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (form.id) {
        await axios.put(`${API_URL}/${form.id}`, payload, config);
      } else {
        await axios.post(API_URL, payload, config);
      }

      swalUtils.success('บันทึกข้อมูล Streaming Policy สำเร็จแล้ว!');
      fetchPolicy();
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-indigo-300 font-bold">
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Title Header Bar */}
      <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
        <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
          :: จัดการข้อมูล: Streaming Policy & AI Moderation ::
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 text-sm pt-2">
        {/* Main Title Section */}
        <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40">
          <div className="flex flex-col sm:flex-row sm:items-center">
            <label className="sm:w-36 text-gray-400 font-semibold mb-1 sm:mb-0">ชื่อหัวข้อหลัก</label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white"
            />
          </div>
        </div>

        {/* Sub-groups Section */}
        <div className="space-y-4">
          <h3 className="text-md font-bold text-indigo-300 border-b border-indigo-950/40 pb-2">
            หมวดหมู่หัวข้อย่อย & รายละเอียดข้อบังคับ
          </h3>

          {form.subGroups.map((sg, index) => {
            const subKey = sg.subId || sg.id;
            const rulesItems = sg.rules || sg.items || [];
            return (
              <div key={subKey} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-5 relative shadow-md">
                
                {/* Header ของ Sub-group */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="text-indigo-300 font-black text-sm">#{index + 1}</span>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="ชื่อหัวข้อย่อย (เช่น AI Content Filtering)..."
                      value={sg.subTitle || sg.sub_title || ''}
                      onChange={(e) => handleUpdateSubGroupTitle(subKey, e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => handleRemoveSubGroup(subKey)} 
                    className="p-2 text-gray-400 hover:text-white transition cursor-pointer shrink-0" 
                    title="ลบกลุ่มย่อยนี้"
                  >
                    ✕
                  </button>
                </div>

                {/* Rules List inside Sub-group */}
                <div className="space-y-4 pt-2">
                  {rulesItems.map((rule, ruleIndex) => {
                    const ruleKey = rule.ruleId || rule.id;
                    const ruleDelta = normalizeDelta(rule.textDelta || rule.text);

                    return (
                      <div key={ruleKey} className="bg-[#0f172a] p-4 rounded-xl border border-indigo-950/40 space-y-3">
                        <div className="flex items-start gap-3">
                          <span className="text-indigo-400 font-bold shrink-0 pt-2">{ruleIndex + 1}.</span>
                          <div className="flex-1 flex items-start gap-2">
                            <div className="flex-1 bg-[#1e293b] rounded-xl overflow-hidden border border-indigo-900/40 text-white">
                              <QuillEditor
                                value={ruleDelta}
                                onChange={(delta) => handleUpdateRuleDelta(subKey, ruleKey, delta)}
                                placeholder="รายละเอียดข้อบังคับ / คำอธิบาย..."
                              />
                            </div>
                            <button 
                              type="button" 
                              onClick={() => handleRemoveRule(subKey, ruleKey)} 
                              className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer shrink-0 mt-1" 
                              title="ลบข้อบังคับนี้"
                            >
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button 
                    type="button" 
                    onClick={() => handleAddRule(subKey)} 
                    className="mt-2 text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    + เพิ่มข้อบังคับ
                  </button>
                </div>
              </div>
            );
          })}

          {/* ปุ่ม + เพิ่มกลุ่มย่อย */}
          <div className="flex justify-center pt-2">
            <button 
              type="button" 
              onClick={handleAddSubGroup} 
              className="px-6 py-2 bg-indigo-900/60 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-300 rounded-full text-xs font-bold transition cursor-pointer shadow-md"
            >
              + เพิ่มกลุ่มย่อย
            </button>
          </div>
        </div>

        {/* Footer Note Section */}
        <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-2">
          <label className="text-gray-400 font-semibold block text-xs">หมายเหตุท้ายหน้า</label>
          <input
            type="text"
            value={form.footerNote}
            onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
            className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-amber-500/30 text-amber-300 text-xs focus:outline-none focus:border-amber-500"
          />
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-center pt-6">
          <button 
            type="submit" 
            className="px-10 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-600/30 transition"
          >
            Save Data
          </button>
        </div>
      </form>
    </div>
  );
};

export default StreamingPolicyCRUD;