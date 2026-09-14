import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';
import Pagination from '../Pagination';

const StreamingPolicyCRUD = () => {
  const [policiesList, setPoliciesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('table');
  const [form, setForm] = useState({ id: null, title: '', footerNote: '', subGroups: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  // --- API Fetching ---
  const fetchPolicies = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/streaming-policies`); 
      setPoliciesList(res.data);
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูล Streaming Policy ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPolicies();
  }, []);

  const filteredPolicies = policiesList.filter(p => 
    p.title?.toLowerCase().includes(searchTerm.toLowerCase())
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
        await axios.delete(`${API_URL}/streaming-policies/${item.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        swalUtils.success('ลบข้อมูลสำเร็จ!', `ได้ทำการลบรายการ "${item.title}" เรียบร้อยแล้ว`);
        fetchPolicies();
      } catch (err) {
        swalUtils.error('ล้มเหลว!', err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  // --- Functions สำหรับจัดการ Sub-groups & Rules ---
  const handleAddSubGroup = () => {
    setForm({
      ...form,
      subGroups: [
        ...form.subGroups, 
        { 
          subId: `temp_${Date.now()}`, 
          subTitle: '', 
          rules: [{ 
            ruleId: `temp_rule_${Date.now()}`, 
            text: ''
          }] 
        }
      ]
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actionTitle = view === 'add' ? 'ตรวจสอบการเพิ่ม Streaming Policy' : 'ตรวจสอบการแก้ไข Streaming Policy';

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
      const formattedSubGroups = form.subGroups.map(sg => ({
        subTitle: sg.subTitle || sg.sub_title || '',
        rules: (sg.rules || sg.items || []).map(r => ({
          text: r.text || ''
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
        await axios.post(`${API_URL}/streaming-policies`, payload, config);
        swalUtils.success('เพิ่มข้อมูล Streaming Policy สำเร็จแล้ว!');
      } else {
        await axios.put(`${API_URL}/streaming-policies/${form.id}`, payload, config);
        swalUtils.success('อัปเดตข้อมูล Streaming Policy สำเร็จแล้ว!');
      }

      fetchPolicies();
      setView('table');
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  const totalPages = Math.ceil(filteredPolicies.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPolicies.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {view === 'table' ? (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">จัดการข้อมูล: Streaming Policy & AI Moderation</h2>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-64 px-5 py-2 rounded-full bg-[#0f172a] border border-indigo-950/85 focus:outline-none focus:border-indigo-500 text-sm text-white shadow-inner"
                placeholder="ค้นหาหัวข้อ..."
              />
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition shrink-0 shadow-lg shadow-blue-600/20 text-white cursor-pointer"
              >
                + เพิ่มนโยบายใหม่
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
                ) : currentItems.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="text-center p-8 text-gray-400">ไม่พบข้อมูล</td>
                  </tr>
                ) : currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-indigo-950/10 transition">
                    <td className="p-4 text-center text-gray-400">{indexOfFirstItem + index + 1}.</td>
                    <td className="p-4 font-semibold text-white">
                      {item.title} 
                      <span className="text-xs text-indigo-400/80 ml-3 bg-indigo-900/30 px-2 py-0.5 rounded-full">
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

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            indexOfFirstItem={indexOfFirstItem}
            indexOfLastItem={indexOfLastItem}
            totalItems={filteredPolicies.length}
          />
        </div>
      ) : (
        /* Form View */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {view === 'add' ? 'เพิ่ม Streaming Policy & AI Moderation' : 'แก้ไข Streaming Policy'} ::
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
                <h3 className="text-md font-bold text-indigo-300">หมวดหมู่หัวข้อย่อย & รายละเอียดข้อบังคับ</h3>
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
                        placeholder="ชื่อหัวข้อย่อย (เช่น AI Content Filtering)..."
                        value={sg.subTitle || sg.sub_title || ''}
                        onChange={(e) => handleUpdateSubGroupTitle(subKey, e.target.value)}
                        className="flex-1 px-4 py-3 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="pl-0 sm:pl-14 space-y-3">
                      {rulesItems.map((rule) => {
                        const ruleKey = rule.ruleId || rule.id;
                        const ruleText = rule.text || '';
                        return (
                          <div key={ruleKey} className="flex flex-col bg-[#0f172a] p-4 rounded-xl border border-indigo-950/30 gap-3">
                            <div className="w-full">
                              <textarea
                                rows={2}
                                required
                                placeholder="รายละเอียดข้อบังคับ / คำอธิบาย..."
                                value={ruleText}
                                onChange={(e) => handleUpdateRuleText(subKey, ruleKey, e.target.value)}
                                className="w-full px-4 py-3 bg-[#1e293b] border border-indigo-900/40 rounded-xl outline-none text-gray-200 text-sm focus:border-indigo-500 resize-y"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center pt-2">
                <button type="button" onClick={handleAddSubGroup} className="px-6 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มหัวข้อย่อย
                </button>
              </div>
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

export default StreamingPolicyCRUD;