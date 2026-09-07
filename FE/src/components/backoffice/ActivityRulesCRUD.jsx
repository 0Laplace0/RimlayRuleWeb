import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';

const ActivityRulesCRUD = () => {
  const [rulesList, setRulesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('table');
  const [form, setForm] = useState({ id: null, title: '', footerNote: '', subGroups: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_URL = 'http://localhost:5000/api/rules';
  const token = localStorage.getItem('token');
  const defaultPic = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=150&q=80';

  // --- API Fetching ---
  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL);
      setRulesList(res.data);
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลกิจกรรมได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  const filteredRules = rulesList.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setForm({ id: null, title: '', footerNote: '', subGroups: [] });
    setView('add');
  };

  const handleOpenEdit = (item) => {
    const copiedSubGroups = JSON.parse(JSON.stringify(item.subGroups || []));
    setForm({ 
      id: item.id, 
      title: item.title, 
      footerNote: item.footerNote || item.footer_note || '', 
      subGroups: copiedSubGroups 
    });
    setView('edit');
  };

  const handleDelete = async (item) => {
    const result = await swalUtils.confirm({
      title: 'ต้องการลบข้อมูลใช่หรือไม่?',
      text: `เมื่อยืนยันแล้ว ข้อมูลหัวข้อ "${item.title}" จะถูกลบออกจากระบบทันที`,
      confirmButtonText: 'ยืนยันการลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      isDangerous: true
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/main/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        swalUtils.success('ลบข้อมูลสำเร็จ!', `ได้ทำการลบรายการ "${item.title}" เรียบร้อยแล้ว`);
        fetchRules();
      } catch (err) {
        swalUtils.error('ล้มเหลว!', err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  // --- Functions สำหรับจัดการ Sub-groups & Rules ---
  const handleAddSubGroup = () => {
    setForm({
      ...form,
      subGroups: [...form.subGroups, { subId: `temp_${Date.now()}`, subTitle: '', rules: [] }]
    });
  };

  const handleRemoveSubGroup = (subId) => {
    setForm({
      ...form,
      subGroups: form.subGroups.filter(sg => sg.subId !== subId && sg.id !== subId)
    });
  };

  const handleUpdateSubGroupTitle = (subId, value) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          return { ...sg, subTitle: value, sub_title: value };
        }
        return sg;
      })
    });
  };

  const handleAddRule = (subId) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rules = sg.rules || sg.items || [];
          return {
            ...sg,
            rules: [...rules, { 
              ruleId: `temp_${Date.now()}`, 
              text: '', 
              penaltyType: 'ปรับเงิน', 
              penaltyValue: '500,000 IC / ต่อคน' 
            }]
          };
        }
        return sg;
      })
    });
  };

  const handleRemoveRule = (subId, ruleId) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updated = rulesList.filter(r => r.ruleId !== ruleId && r.id !== ruleId);
          return { ...sg, rules: updated, items: updated };
        }
        return sg;
      })
    });
  };

  const handleUpdateRule = (subId, ruleId, field, value) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updated = rulesList.map(r => 
            (r.ruleId === ruleId || r.id === ruleId) ? { ...r, [field]: value } : r
          );
          return { ...sg, rules: updated, items: updated };
        }
        return sg;
      })
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actionTitle = view === 'add' ? 'ตรวจสอบการเพิ่มข้อมูลกิจกรรม' : 'ตรวจสอบการแก้ไขข้อมูลกิจกรรม';

    const isConfirmed = await swalUtils.previewConfirm({
      actionTitle,
      fields: [
        { label: 'ชื่อหัวข้อ', value: form.title },
        { label: 'จำนวนกลุ่มย่อย', value: `${form.subGroups.length} กลุ่ม` }
      ],
      confirmText: view === 'add' ? 'ยืนยันการเพิ่ม' : 'ยืนยันอัปเดต',
      cancelText: 'กลับไปแก้ไข'
    });

    if (!isConfirmed) return;

    try {
      const payload = {
        title: form.title,
        icon: defaultPic,
        footerNote: form.footerNote,
        footer_note: form.footerNote,
        subGroups: form.subGroups
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (view === 'add') {
        await axios.post(`${API_URL}/full`, payload, config);
        swalUtils.success('เพิ่มข้อมูลกิจกรรมสำเร็จแล้ว!');
      } else {
        await axios.put(`${API_URL}/full/${form.id}`, payload, config);
        swalUtils.success('อัปเดตข้อมูลกิจกรรมสำเร็จแล้ว!');
      }

      fetchRules();
      setView('table');
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRules.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {view === 'table' ? (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-purple-300">จัดการข้อมูล: กิจกรรม</h2>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-64 px-5 py-2 rounded-full bg-[#121216] border border-purple-950/80 focus:outline-none focus:border-purple-500 text-sm text-white shadow-inner"
              />
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition shrink-0 shadow-lg shadow-blue-600/20 text-white cursor-pointer"
              >
                + เพิ่มหัวข้อกิจกรรม
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-purple-950/60 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#181125] border-b border-purple-950/60 text-purple-300 font-bold">
                <tr>
                  <th className="p-4 text-center w-16">No.</th>
                  <th className="p-4">ชื่อหัวข้อหลัก (Title)</th>
                  <th className="p-4 text-center w-24">edit</th>
                  <th className="p-4 text-center w-24">delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/20">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-gray-400">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-purple-950/10 transition">
                    <td className="p-4 text-center text-gray-400">{indexOfFirstItem + index + 1}.</td>
                    <td className="p-4 font-semibold text-white">
                      {item.title} 
                      <span className="text-xs text-purple-400/80 ml-3 bg-purple-900/30 px-2 py-0.5 rounded-full">
                        {(item.subGroups || []).length} Sub-groups
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleOpenEdit(item)} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-full transition shadow-md cursor-pointer">edit</button>
                    </td>
                    <td className="p-4 text-center">
                      <button onClick={() => handleDelete(item)} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-full transition shadow-md cursor-pointer">delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Form View */
        <div className="space-y-6">
          <div className="bg-[#181125] border border-purple-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-purple-300 tracking-wide">
              :: {view === 'add' ? 'เพิ่มข้อมูลกิจกรรม' : 'แก้ไขข้อมูลกิจกรรม'} ::
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 text-sm pt-4">
            <div className="bg-[#181125]/40 p-6 rounded-2xl border border-purple-950/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-36 text-gray-400 font-semibold mb-1">ชื่อหัวข้อหลัก</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#121216] border border-purple-950/60 focus:outline-none focus:border-purple-500 text-white"
                />
              </div>
            </div>

            {/* Sub-groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-950/40 pb-2">
                <h3 className="text-md font-bold text-purple-300">หมวดหมู่กฎย่อย & บทลงโทษ</h3>
                <button type="button" onClick={handleAddSubGroup} className="px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มกลุ่มย่อย
                </button>
              </div>

              {form.subGroups.map((sg, index) => {
                const subKey = sg.subId || sg.id;
                const rulesItems = sg.rules || sg.items || [];
                return (
                  <div key={subKey} className="bg-[#181125]/80 p-5 rounded-2xl border border-purple-900/30 space-y-4 relative">
                    <button type="button" onClick={() => handleRemoveSubGroup(subKey)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" title="ลบกลุ่มนี้">
                      ✕
                    </button>

                    <div className="flex items-center gap-3 pr-10">
                      <span className="text-purple-400 font-bold bg-purple-900/30 px-3 py-1.5 rounded-lg text-xs">#{index + 1}</span>
                      <input
                        type="text"
                        required
                        value={sg.subTitle || sg.sub_title || ''}
                        onChange={(e) => handleUpdateSubGroupTitle(subKey, e.target.value)}
                        className="flex-1 px-4 py-2 rounded-xl bg-[#121216] border border-purple-950/60 text-white font-semibold"
                      />
                    </div>

                    {/* รายการข้อกฎหมาย + ค่าปรับ */}
                    <div className="pl-0 sm:pl-12 space-y-3">
                      {rulesItems.map((rule) => {
                        const ruleKey = rule.ruleId || rule.id;
                        return (
                          <div key={ruleKey} className="flex flex-col md:flex-row items-stretch md:items-center gap-2 bg-[#121216] p-3 rounded-xl border border-purple-950/30 group">
                            <input
                              type="text"
                              required
                              value={rule.text}
                              onChange={(e) => handleUpdateRule(subKey, ruleKey, 'text', e.target.value)}
                              className="flex-1 px-3 py-1.5 bg-transparent border-none outline-none text-gray-300 text-xs"
                            />

                            <div className="flex items-center gap-2 shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-purple-950/40">
                              {/* เปลี่ยน text สีของ select เป็นสีขาว (text-white) */}
                              <select
                                value={rule.penaltyType || rule.penalty_type || 'ปรับเงิน'}
                                onChange={(e) => handleUpdateRule(subKey, ruleKey, 'penaltyType', e.target.value)}
                                className="w-32 px-2 py-1 bg-[#181125] border border-purple-900/40 rounded-lg text-white text-xs text-center focus:outline-none focus:border-purple-500 cursor-pointer"
                              >
                                <option value="ปรับเงิน">ปรับเงิน</option>
                                <option value="ใบเหลือง">ใบเหลือง</option>
                                <option value="ใบส้ม">ใบส้ม</option>
                                <option value="ใบแดง">ใบแดง</option>
                                <option value="ใบแดงถาวร">ใบแดงถาวร</option>
                              </select>

                              <input
                                type="text"
                                value={rule.penaltyValue || rule.penalty_value || '500,000 IC / ต่อคน'}
                                onChange={(e) => handleUpdateRule(subKey, ruleKey, 'penaltyValue', e.target.value)}
                                className="w-40 px-2 py-1 bg-[#181125] border border-purple-900/40 rounded-lg text-white text-xs text-center font-semibold"
                              />
                              <button type="button" onClick={() => handleRemoveRule(subKey, ruleKey)} className="p-1.5 text-gray-500 hover:text-rose-500 rounded-lg cursor-pointer">
                                🗑
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      <button type="button" onClick={() => handleAddRule(subKey)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer">
                        + เพิ่มข้อบังคับ/กฎ
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* กล่องหมายเหตุท้ายหน้า */}
            <div className="bg-[#181125]/40 p-6 rounded-2xl border border-purple-950/40 space-y-2">
              <label className="text-gray-400 font-semibold block text-xs">หมายเหตุท้ายหน้า</label>
              <input
                type="text"
                value={form.footerNote}
                onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#121216] border border-amber-500/30 text-amber-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-center space-x-3 pt-6 border-t border-purple-950/40">
              <button type="submit" className="px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer">Save Data</button>
              <button type="button" onClick={() => setView('table')} className="px-8 py-2.5 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ActivityRulesCRUD;