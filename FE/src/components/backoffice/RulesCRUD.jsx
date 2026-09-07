import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';

const RulesCRUD = () => {
  const [rulesList, setRulesList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState('table');
  const [form, setForm] = useState({ id: null, title: '', icon: '', subGroups: [] });
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
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลกฎระเบียบได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  // Filter Rules
  const filteredRules = rulesList.filter(r => 
    r.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAdd = () => {
    setForm({ id: null, title: '', icon: '', subGroups: [] });
    setView('add');
  };

  const handleOpenEdit = (item) => {
    const copiedSubGroups = JSON.parse(JSON.stringify(item.subGroups || []));
    setForm({ id: item.id, title: item.title, icon: item.icon || '', subGroups: copiedSubGroups });
    setView('edit');
  };

  // --- API Delete ---
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

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForm({ ...form, icon: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Functions สำหรับจัดการ Form (Sub-groups & Rules) ---
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
      subGroups: form.subGroups.map(sg => 
        (sg.subId === subId || sg.id === subId) ? { ...sg, subTitle: value, sub_title: value } : sg
      )
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
            rules: [...rules, { ruleId: `temp_${Date.now()}`, symbol: 'check', text: '' }]
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

  // --- API Submit (Add / Edit) ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const actionTitle = view === 'add' ? 'ตรวจสอบการเพิ่มข้อมูล' : 'ตรวจสอบการแก้ไขข้อมูล';
    const ruleIcon = form.icon || defaultPic;

    const isConfirmed = await swalUtils.previewConfirm({
      actionTitle,
      image: ruleIcon,
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
        icon: form.icon || defaultPic,
        subGroups: form.subGroups
      };

      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (view === 'add') {
        await axios.post(`${API_URL}/full`, payload, config);
        swalUtils.success('เพิ่มข้อมูลใหม่สำเร็จแล้ว!');
      } else {
        await axios.put(`${API_URL}/full/${form.id}`, payload, config);
        swalUtils.success('อัปเดตข้อมูลสำเร็จแล้ว!');
      }

      fetchRules();
      setView('table');
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // Pagination Calculation
  const totalPages = Math.ceil(filteredRules.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRules.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {view === 'table' ? (
        <div>
          {/* Header & Search */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-purple-300">Rules & Regulations Management</h2>
            
            <div className="flex items-center gap-3 w-full md:w-auto">
              <input
                type="text"
                placeholder="Search rule title..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full md:w-64 px-5 py-2 rounded-full bg-[#121216] border border-purple-950/80 focus:outline-none focus:border-purple-500 text-sm text-white placeholder-gray-500 shadow-inner"
              />
              <button
                onClick={handleOpenAdd}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition shrink-0 shadow-lg shadow-blue-600/20 text-white cursor-pointer"
              >
                + Add Rule
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto border border-purple-950/60 rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[#181125] border-b border-purple-950/60 text-purple-300 font-bold">
                <tr>
                  <th className="p-4 text-center w-16">No.</th>
                  <th className="p-4 text-center w-24">Pic (Icon)</th>
                  <th className="p-4">ชื่อหัวข้อหลัก (Title)</th>
                  <th className="p-4 text-center w-24">edit</th>
                  <th className="p-4 text-center w-24">delete</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-950/20">
                {loading ? (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-gray-400">กำลังโหลดข้อมูล...</td>
                  </tr>
                ) : currentItems.map((item, index) => (
                  <tr key={item.id} className="hover:bg-purple-950/10 transition">
                    <td className="p-4 text-center text-gray-400">
                      {indexOfFirstItem + index + 1}.
                    </td>
                    <td className="p-2 text-center">
                      <img 
                        src={item.icon || defaultPic} 
                        alt={item.title}
                        className="w-10 h-10 object-cover rounded-full border border-purple-500/50 shadow mx-auto"
                      />
                    </td>
                    <td className="p-4 font-semibold text-white">
                      {item.title} 
                      <span className="text-xs text-purple-400/80 ml-3 bg-purple-900/30 px-2 py-0.5 rounded-full">
                        {(item.subGroups || []).length} Sub-groups
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-full transition shadow-md shadow-amber-500/10 cursor-pointer"
                      >
                        edit
                      </button>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleDelete(item)}
                        className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-full transition shadow-md shadow-rose-600/10 cursor-pointer"
                      >
                        delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && currentItems.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center p-8 text-gray-500">
                      ไม่พบข้อมูลที่ต้องการค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-5 px-1">
              <div className="text-xs text-gray-400">
                Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredRules.length)} of {filteredRules.length} records
              </div>
              <div className="flex items-center space-x-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-1.5 bg-[#121216] border border-purple-950/60 rounded-full text-xs font-bold text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-950/20 transition cursor-pointer"
                >
                  Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                      currentPage === pageNum
                        ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                        : 'bg-[#121216] border border-purple-950/60 text-gray-400 hover:text-purple-300'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-1.5 bg-[#121216] border border-purple-950/60 rounded-full text-xs font-bold text-purple-400 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-purple-950/20 transition cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Form View */
        <div className="space-y-6">
          <div className="bg-[#181125] border border-purple-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-purple-300 tracking-wide">
              :: {view === 'add' ? 'Form Add Rule' : 'Form Update Rule'} ::
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 text-sm pt-4">
            {/* Title & Icon */}
            <div className="bg-[#181125]/40 p-6 rounded-2xl border border-purple-950/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-36 text-gray-400 font-semibold mb-1">ชื่อหัวข้อหลัก (Title)</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="เช่น กฎระเบียบข้อบังคับหอพัก"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#121216] border border-purple-950/60 focus:outline-none focus:border-purple-500 text-white"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-start">
                <label className="sm:w-36 text-gray-400 font-semibold mb-1 sm:mt-2">ไอคอน (Icon)</label>
                <div className="flex-1 space-y-3">
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-purple-950/60 rounded-xl cursor-pointer bg-[#121216] hover:bg-purple-950/10 hover:border-purple-500/50 transition">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <p className="text-xs text-gray-400">
                          <span className="font-semibold text-purple-300">คลิกเพื่ออัปโหลด</span> หรือลากไฟล์มาวาง
                        </p>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                  {form.icon && (
                    <div className="flex items-center gap-3 bg-[#121216] p-2 rounded-xl border border-purple-950/40 w-max">
                      <img 
                        src={form.icon} 
                        alt="Preview" 
                        className="w-10 h-10 object-cover rounded-md border border-purple-500/40"
                      />
                      <button 
                        type="button" 
                        onClick={() => setForm({ ...form, icon: '' })}
                        className="text-[10px] text-rose-400 hover:underline px-2 cursor-pointer"
                      >
                        ลบรูปภาพ
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sub-groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-purple-950/40 pb-2">
                <h3 className="text-md font-bold text-purple-300">หมวดหมู่กฎย่อย (Sub-groups)</h3>
                <button
                  type="button"
                  onClick={handleAddSubGroup}
                  className="px-4 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/40 border border-emerald-500/50 text-emerald-400 rounded-full text-xs font-bold transition cursor-pointer"
                >
                  + เพิ่มหัวข้อย่อย
                </button>
              </div>

              {form.subGroups.map((sg, index) => {
                const subKey = sg.subId || sg.id;
                const rulesItems = sg.rules || sg.items || [];
                return (
                  <div key={subKey} className="bg-[#181125]/80 p-5 rounded-2xl border border-purple-900/30 space-y-4 relative">
                    <button
                      type="button"
                      onClick={() => handleRemoveSubGroup(subKey)}
                      className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 transition cursor-pointer"
                      title="ลบหัวข้อย่อยนี้"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-3 pr-10">
                      <span className="text-purple-400 font-bold bg-purple-900/30 px-3 py-1.5 rounded-lg text-xs">
                        #{index + 1}
                      </span>
                      <input
                        type="text"
                        required
                        value={sg.subTitle || sg.sub_title || ''}
                        onChange={(e) => handleUpdateSubGroupTitle(subKey, e.target.value)}
                        placeholder="ชื่อหัวข้อย่อย (เช่น ข้อห้ามปฏิบัติ)"
                        className="flex-1 px-4 py-2 rounded-xl bg-[#121216] border border-purple-950/60 focus:outline-none focus:border-purple-500 text-white font-semibold"
                      />
                    </div>

                    <div className="pl-4 sm:pl-12 space-y-2">
                      {rulesItems.map((rule) => {
                        const ruleKey = rule.ruleId || rule.id;
                        return (
                          <div key={ruleKey} className="flex flex-col sm:flex-row sm:items-center gap-2 bg-[#121216] p-2 rounded-xl border border-purple-950/30 group">
                            <select
                              value={rule.symbol}
                              onChange={(e) => handleUpdateRule(subKey, ruleKey, 'symbol', e.target.value)}
                              className="px-2 py-1.5 bg-[#181125] border border-purple-900/40 rounded-lg text-white outline-none cursor-pointer text-center focus:border-purple-500 min-w-[70px]"
                            >
                              <option value="check">✅ อนุญาต</option>
                              <option value="cross">❌ ข้อห้าม</option>
                            </select>

                            <input
                              type="text"
                              required
                              value={rule.text}
                              onChange={(e) => handleUpdateRule(subKey, ruleKey, 'text', e.target.value)}
                              placeholder="รายละเอียดกฎข้อบังคับ..."
                              className="flex-1 px-4 py-1.5 bg-transparent border-none outline-none text-gray-300 placeholder-gray-600 focus:text-white"
                            />

                            <button
                              type="button"
                              onClick={() => handleRemoveRule(subKey, ruleKey)}
                              className="sm:opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-rose-500 transition-opacity rounded-lg hover:bg-rose-500/10 ml-auto shrink-0 cursor-pointer"
                              title="ลบกฎข้อนี้"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        );
                      })}

                      <button
                        type="button"
                        onClick={() => handleAddRule(subKey)}
                        className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold transition cursor-pointer"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        เพิ่มข้อบังคับ/กฎ
                      </button>
                    </div>
                  </div>
                );
              })}
              
              {form.subGroups.length === 0 && (
                <div className="text-center py-6 text-gray-500 border border-dashed border-purple-950/60 rounded-xl bg-[#121216]">
                  ยังไม่มีหัวข้อย่อย คลิก "+ เพิ่มหัวข้อย่อย" เพื่อเริ่มต้น
                </div>
              )}
            </div>

            <div className="flex items-center justify-center space-x-3 pt-6 border-t border-purple-950/40">
              <button
                type="submit"
                className="px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 transition duration-300 shadow-md shadow-blue-600/20 cursor-pointer"
              >
                {view === 'add' ? 'Save Rule Data' : 'Update Rule Data'}
              </button>
              <button
                type="button"
                onClick={() => setView('table')}
                className="px-8 py-2.5 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-500 transition duration-300 shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default RulesCRUD;