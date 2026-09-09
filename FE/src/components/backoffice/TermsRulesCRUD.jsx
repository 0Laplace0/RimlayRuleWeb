import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';
import Pagination from '../Pagination';

const TermsRulesCRUD = () => {
  const [rulesList, setRulesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('table');
  const [form, setForm] = useState({ id: null, title: '', footerNote: '', subGroups: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_URL = 'http://localhost:5000/api/terms';
  const token = localStorage.getItem('token');

  // --- API Fetching ---
  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get(API_URL); 
      setRulesList(res.data);
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูล Terms & Conditions ได้');
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
    const rawSubGroups = item.subGroups || item.subcategories || [];
    const copiedSubGroups = JSON.parse(JSON.stringify(rawSubGroups)).map(sg => ({
      ...sg,
      subId: sg.subId || sg.id,
      subTitle: sg.subTitle || sg.sub_title || sg.name || '',
      rules: (sg.rules || sg.items || []).map(r => ({
        ...r,
        ruleId: r.ruleId || r.id,
        text: r.text || r.rule_text || '',
        subItems: (r.subItems || r.sub_items || []).map(si => ({
          ...si,
          subItemId: si.subItemId || si.id,
          text: si.text || si.content || ''
        }))
      }))
    }));

    setForm({ 
      id: item.id, 
      title: item.title || item.name, 
      footerNote: item.footerNote || item.footer_note || '', 
      subGroups: copiedSubGroups 
    });
    setView('edit');
  };

  const handleDelete = async (item) => {
    const result = await swalUtils.confirm({
      title: 'ต้องการลบข้อมูลใช่หรือไม่?',
      text: `เมื่อยืนยันแล้ว ข้อมูลหัวข้อ "${item.title || item.name}" จะถูกลบออกจากระบบทันที`,
      confirmButtonText: 'ยืนยันการลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      isDangerous: true
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`${API_URL}/delete/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        swalUtils.success('ลบข้อมูลสำเร็จ!', `ได้ทำการลบรายการเรียบร้อยแล้ว`);
        fetchRules();
      } catch (err) {
        swalUtils.error('ล้มเหลว!', err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  // --- Functions สำหรับจัดการ Sub-groups, Rules & Sub-items ---
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
          return { ...sg, subTitle: value, sub_title: value, name: value };
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
          const newRule = { 
            ruleId: `temp_${Date.now()}`, 
            text: '', 
            subItems: []
          };
          return {
            ...sg,
            rules: [...rules, newRule],
            items: [...rules, newRule]
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

  const handleUpdateRuleText = (subId, ruleId, value) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updated = rulesList.map(r => {
            if (r.ruleId === ruleId || r.id === ruleId) {
              return { ...r, text: value };
            }
            return r;
          });
          return { ...sg, rules: updated, items: updated };
        }
        return sg;
      })
    });
  };

  const handleAddSubItem = (subId, ruleId) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updatedRules = rulesList.map(r => {
            if (r.ruleId === ruleId || r.id === ruleId) {
              const subItems = r.subItems || [];
              const newSubItem = { subItemId: `temp_${Date.now()}`, text: '' };
              return { ...r, subItems: [...subItems, newSubItem] };
            }
            return r;
          });
          return { ...sg, rules: updatedRules, items: updatedRules };
        }
        return sg;
      })
    });
  };

  const handleRemoveSubItem = (subId, ruleId, subItemId) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updatedRules = rulesList.map(r => {
            if (r.ruleId === ruleId || r.id === ruleId) {
              const subItems = r.subItems || [];
              const updatedSubItems = subItems.filter(si => si.subItemId !== subItemId && si.id !== subItemId);
              return { ...r, subItems: updatedSubItems };
            }
            return r;
          });
          return { ...sg, rules: updatedRules, items: updatedRules };
        }
        return sg;
      })
    });
  };

  const handleUpdateSubItem = (subId, ruleId, subItemId, value) => {
    setForm({
      ...form,
      subGroups: form.subGroups.map(sg => {
        if (sg.subId === subId || sg.id === subId) {
          const rulesList = sg.rules || sg.items || [];
          const updatedRules = rulesList.map(r => {
            if (r.ruleId === ruleId || r.id === ruleId) {
              const subItems = r.subItems || [];
              const updatedSubItems = subItems.map(si => {
                if (si.subItemId === subItemId || si.id === subItemId) {
                  return { ...si, text: value };
                }
                return si;
              });
              return { ...r, subItems: updatedSubItems };
            }
            return r;
          });
          return { ...sg, rules: updatedRules, items: updatedRules };
        }
        return sg;
      })
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actionTitle = view === 'add' ? 'ตรวจสอบการเพิ่มข้อมูล Terms & Conditions' : 'ตรวจสอบการแก้ไขข้อมูล Terms & Conditions';

    const isConfirmed = await swalUtils.previewConfirm({
      actionTitle,
      fields: [
        { label: 'ชื่อหัวข้อหลัก', value: form.title },
        { label: 'จำนวนกลุ่มย่อย', value: `${form.subGroups.length} กลุ่ม` }
      ],
      confirmText: view === 'add' ? 'ยืนยันการเพิ่ม' : 'ยืนยันอัปเดต',
      cancelText: 'กลับไปแก้ไข'
    });

    if (!isConfirmed) return;

    try {
      const formattedSubGroups = form.subGroups.map(sg => ({
        subTitle: sg.subTitle || sg.sub_title || sg.name || '',
        rules: (sg.rules || sg.items || []).map(r => ({
          text: r.text || r.rule_text || '',
          subItems: (r.subItems || r.sub_items || []).map(si => ({
            text: si.text || si.content || ''
          }))
        }))
      }));

      const payload = {
        title: form.title,
        footerNote: form.footerNote,
        footer_note: form.footerNote,
        subGroups: formattedSubGroups
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (view === 'add') {
        await axios.post(`${API_URL}/create`, payload, config);
        swalUtils.success('เพิ่มข้อมูล Terms & Conditions สำเร็จแล้ว!');
      } else {
        await axios.put(`${API_URL}/update/${form.id}`, payload, config);
        swalUtils.success('อัปเดตข้อมูล Terms & Conditions สำเร็จแล้ว!');
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
            <h2 className="text-2xl font-bold text-white">จัดการข้อมูล: Terms & Conditions</h2>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-64 px-5 py-2 rounded-full bg-[#0f172a] border border-indigo-950/80 focus:outline-none focus:border-indigo-500 text-sm text-white shadow-inner"
                placeholder="ค้นหาหัวข้อ..."
              />
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition shrink-0 shadow-lg shadow-blue-600/20 text-white cursor-pointer"
              >
                + เพิ่มหัวข้อ Terms
              </button>
            </div>
          </div>

          <div className="overflow-x-auto border border-indigo-950/60 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#1e293b] border-b border-indigo-950/60 text-indigo-300 font-bold">
                <tr>
                  <th className="p-4 text-center w-16">No.</th>
                  <th className="p-4">ชื่อหัวข้อหลัก (Title)</th>
                  <th className="p-4 text-center w-24">edit</th>
                  <th className="p-4 text-center w-24">delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-950/20">
                {loading ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-gray-400">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-indigo-950/10 transition">
                    <td className="p-4 text-center text-gray-400">{indexOfFirstItem + index + 1}.</td>
                    <td className="p-4 font-semibold text-white">
                      {item.title || item.name} 
                      <span className="text-xs text-indigo-400/80 ml-3 bg-indigo-900/30 px-2 py-0.5 rounded-full">
                        {(item.subGroups || item.subcategories || []).length} Sub-groups
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

          {/* เรียกใช้งานคอมโพเนนต์ Pagination ที่แยกออกมา */}
          {!loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              totalItems={filteredRules.length}
            />
          )}
        </div>
      ) : (
        /* Form View */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {view === 'add' ? 'เพิ่มข้อมูล Terms & Conditions' : 'แก้ไขข้อมูล Terms & Conditions'} ::
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 text-sm pt-4">
            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-36 text-gray-400 font-semibold mb-1">ชื่อหัวข้อหลัก</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            </div>

            {/* Sub-groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                <h3 className="text-md font-bold text-indigo-300">หมวดหมู่กฎย่อย & รายการข้อ</h3>
                <button type="button" onClick={handleAddSubGroup} className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มกลุ่มย่อย
                </button>
              </div>

              {form.subGroups.map((sg, index) => {
                const subKey = sg.subId || sg.id;
                const rulesItems = sg.rules || sg.items || [];
                return (
                  <div key={subKey} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-5 relative">
                    <button type="button" onClick={() => handleRemoveSubGroup(subKey)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" title="ลบกลุ่มนี้">
                      ✕
                    </button>

                    <div className="flex items-center gap-3 pr-10">
                      <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="text-indigo-300 font-black text-lg">#{index + 1}</span>
                      </div>
                      <input
                        type="text"
                        required
                        placeholder="ชื่อหมวดหมู่กฎย่อย..."
                        value={sg.subTitle || sg.sub_title || sg.name || ''}
                        onChange={(e) => handleUpdateSubGroupTitle(subKey, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pl-0 sm:pl-14 space-y-4">
                      {rulesItems.map((rule, ruleIndex) => {
                        const ruleKey = rule.ruleId || rule.id;
                        const ruleText = rule.text ?? rule.rule_text ?? '';
                        const subItems = rule.subItems || rule.sub_items || [];

                        return (
                          <div key={ruleKey} className="flex flex-col gap-4 bg-[#0f172a] p-4 rounded-xl border border-indigo-950/30">
                            
                            <div className="flex items-start gap-3">
                              <span className="text-indigo-400 font-bold shrink-0 pt-2">{ruleIndex + 1}.</span>
                              <div className="flex-1 flex items-center gap-2">
                                <textarea
                                  rows="2"
                                  required
                                  placeholder="รายละเอียดข้อใหญ่..."
                                  value={ruleText}
                                  onChange={(e) => handleUpdateRuleText(subKey, ruleKey, e.target.value)}
                                  className="w-full px-4 py-2.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg outline-none text-gray-200 text-sm focus:border-indigo-500 resize-y"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => handleRemoveRule(subKey, ruleKey)} 
                                  className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer shrink-0" 
                                  title="ลบข้อใหญ่"
                                >
                                  🗑
                                </button>
                              </div>
                            </div>

                            <div className="pl-6 pt-1 space-y-2">
                              {subItems.map((subItem, subItemIndex) => {
                                const subItemKey = subItem.subItemId || subItem.id;
                                const subItemText = subItem.text ?? subItem.content ?? '';
                                return (
                                  <div key={subItemKey} className="flex items-center gap-2">
                                    <span className="text-xs text-indigo-400 font-bold shrink-0">{ruleIndex + 1}.{subItemIndex + 1}</span>
                                    <input
                                      type="text"
                                      placeholder={`รายละเอียดข้อย่อยที่ ${ruleIndex + 1}.${subItemIndex + 1}...`}
                                      value={subItemText}
                                      onChange={(e) => handleUpdateSubItem(subKey, ruleKey, subItemKey, e.target.value)}
                                      className="flex-1 px-3 py-2 bg-[#1e293b] border border-indigo-900/40 rounded-lg outline-none text-gray-200 text-xs focus:border-indigo-500"
                                    />
                                    <button 
                                      type="button" 
                                      onClick={() => handleRemoveSubItem(subKey, ruleKey, subItemKey)} 
                                      className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer shrink-0 text-xs"
                                      title="ลบข้อย่อย"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                );
                              })}
                              <button 
                                type="button" 
                                onClick={() => handleAddSubItem(subKey, ruleKey)} 
                                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer pt-1"
                              >
                                + เพิ่มข้อย่อย ({ruleIndex + 1}.x)
                              </button>
                            </div>

                          </div>
                        );
                      })}

                      <button type="button" onClick={() => handleAddRule(subKey)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer">
                        + เพิ่มข้อบังคับ/กฎ (ข้อใหญ่)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-2">
              <label className="text-gray-400 font-semibold block text-xs">หมายเหตุท้ายหน้า</label>
              <input
                type="text"
                value={form.footerNote}
                onChange={(e) => setForm({ ...form, footerNote: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-amber-500/30 text-amber-300 text-xs"
              />
            </div>

            <div className="flex items-center justify-center space-x-3 pt-6 border-t border-indigo-950/40">
              <button type="submit" className="px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer">Save Data</button>
              <button type="button" onClick={() => setView('table')} className="px-8 py-2.5 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer">Cancel</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TermsRulesCRUD;