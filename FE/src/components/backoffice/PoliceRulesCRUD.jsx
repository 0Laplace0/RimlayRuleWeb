import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';
import Pagination from '../Pagination';

export default function PoliceRulesCRUD() {
  // --- STATES ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('table'); // 'table' | 'form-police' | 'form-terms'
  const [formType, setFormType] = useState('police'); // 'police' | 'terms'
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false); // Popup State

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State (Shared / General)
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [footerNote, setFooterNote] = useState('');
  
  // 1. Police Rules SubGroups (มี penaltyValue, jailTime)
  const [policeSubGroups, setPoliceSubGroups] = useState([
    { subTitle: '', rules: [{ text: '', penaltyValue: '', jailTime: '' }] }
  ]);

  // 2. Terms Rules SubGroups (มี subItems)
  const [termsSubGroups, setTermsSubGroups] = useState([
    { 
      subId: `temp_${Date.now()}`, 
      subTitle: '', 
      rules: [
        { 
          ruleId: `temp_${Date.now()}`, 
          text: '', 
          subItems: [] 
        }
      ] 
    }
  ]);

  // 3. Terms Images State (สำหรับฟอร์มกฎ)
  const [termsImages, setTermsImages] = useState([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  useEffect(() => {
    fetchPoliceRules();
  }, []);

  // --- API CALLS ---
  const fetchPoliceRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/police-rules', getAuthHeader());
      setCategories(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลกฎตำรวจได้');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setFooterNote('');
    setPoliceSubGroups([{ subTitle: '', rules: [{ text: '', penaltyValue: '', jailTime: '' }] }]);
    setTermsSubGroups([{ subId: `temp_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_${Date.now()}`, text: '', subItems: [] }] }]);
    setTermsImages([]);
    setView('table');
  };

  // เปิด Popup เลือกประเภทฟอร์ม
  const handleOpenSelectModal = () => {
    resetForm();
    setIsSelectModalOpen(true);
  };

  const handleSelectFormType = (type) => {
    setFormType(type);
    setIsSelectModalOpen(false);
    if (type === 'terms') {
      setView('form-terms');
    } else {
      setView('form-police');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category.id || category._id);
    setTitle(category.title || '');
    setFooterNote(category.footerNote || category.footer_note || '');

    const rawSubGroups = category.subGroups || category.sub_groups || [];
    const isTermsStyle = rawSubGroups.some(sg => (sg.rules || sg.items || []).some(r => r.subItems));

    if (isTermsStyle) {
      setFormType('terms');
      const mappedTerms = rawSubGroups.map(sg => ({
        subId: sg.subId || sg.id || `temp_${Date.now()}`,
        subTitle: sg.subTitle || sg.sub_title || sg.name || '',
        rules: (sg.rules || sg.items || []).map(r => ({
          ruleId: r.ruleId || r.id || `temp_${Date.now()}`,
          text: r.text || r.rule_text || '',
          subItems: (r.subItems || r.sub_items || []).map(si => ({
            subItemId: si.subItemId || si.id || `temp_${Date.now()}`,
            text: si.text || si.content || ''
          }))
        }))
      }));
      setTermsSubGroups(mappedTerms.length > 0 ? mappedTerms : [{ subId: `temp_${Date.now()}`, subTitle: '', rules: [] }]);

      // Map รูปภาพสำหรับฟอร์มกฎ
      const copiedImages = (category.images || []).map(img => ({
        id: img.id,
        caption: img.caption || '',
        file: null,
        preview: img.imageUrl ? `http://localhost:5000${img.imageUrl}` : null
      }));
      setTermsImages(copiedImages);

      setView('form-terms');
    } else {
      setFormType('police');
      const mappedPolice = rawSubGroups.map(sub => ({
        subTitle: sub.subTitle || sub.sub_title || '',
        rules: (sub.rules || sub.items || []).map(r => ({
          text: r.text || '',
          penaltyValue: r.penaltyValue || r.penalty_value || '',
          jailTime: r.jailTime || r.jail_time || ''
        }))
      }));
      setPoliceSubGroups(mappedPolice.length > 0 ? mappedPolice : [{ subTitle: '', rules: [{ text: '', penaltyValue: '', jailTime: '' }] }]);
      setView('form-police');
    }
  };

  const handleDelete = async (id) => {
    const result = await swalUtils.confirm({
      title: 'ต้องการลบข้อมูลใช่หรือไม่?',
      text: 'เมื่อยืนยันแล้ว ข้อมูลนี้จะถูกลบออกจากระบบทันที',
      confirmButtonText: 'ยืนยันการลบข้อมูล',
      cancelButtonText: 'ยกเลิก',
      isDangerous: true
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:5000/api/police-rules/${id}`, getAuthHeader());
        swalUtils.success('ลบข้อมูลสำเร็จ!', 'ได้ทำการลบรายการเรียบร้อยแล้ว');
        fetchPoliceRules();
      } catch (err) {
        console.error(err);
        swalUtils.error('ล้มเหลว!', err.response?.data?.message || 'เกิดข้อผิดพลาดในการลบข้อมูล');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!title.trim()) {
      swalUtils.error('เกิดข้อผิดพลาด!', 'กรุณากรอกชื่อหัวข้อหลัก');
      return;
    }

    let payload = {};
    let apiUrl = 'http://localhost:5000/api/police-rules'; // ตั้งค่าเริ่มต้นเป็น police-rules ได้เลย หรือกำหนดแยกตามเงื่อนไข
    let isMultipart = false;

    if (formType === 'terms') {
      apiUrl = 'http://localhost:5000/api/police-rules'; // <--- เปลี่ยนจาก /api/terms เป็น /api/police-rules ที่นี่
      
      const formattedSubGroups = termsSubGroups.map(sg => ({
        subTitle: sg.subTitle || '',
        rules: (sg.rules || []).map(r => ({
          text: r.text || '',
          subItems: (r.subItems || []).map(si => ({ text: si.text || '' }))
        }))
      }));

      if (termsImages.length > 0) {
        isMultipart = true;
        const formData = new FormData();
        formData.append('title', title.trim());
        formData.append('footerNote', footerNote.trim());
        formData.append('footer_note', footerNote.trim());
        formData.append('subGroups', JSON.stringify(formattedSubGroups));

        termsImages.forEach((img, index) => {
          formData.append(`images[${index}][caption]`, img.caption || '');
          if (img.file) {
            formData.append('images', img.file);
          }
        });
        payload = formData;
      } else {
        payload = {
          title: title.trim(),
          footerNote: footerNote.trim(),
          footer_note: footerNote.trim(),
          subGroups: formattedSubGroups
        };
      }
    } else {
      apiUrl = 'http://localhost:5000/api/police-rules';
      payload = {
        title: title.trim(),
        footerNote: footerNote.trim(),
        footer_note: footerNote.trim(),
        subGroups: policeSubGroups
      };
    }

    try {
      const config = {
        headers: {
          ...getAuthHeader().headers,
          ...(isMultipart ? { 'Content-Type': 'multipart/form-data' } : {})
        }
      };

      if (editingId) {
        await axios.put(`${apiUrl}/${editingId}`, payload, config);
        swalUtils.success('อัปเดตข้อมูลสำเร็จแล้ว!');
      } else {
        await axios.post(apiUrl, payload, config);
        swalUtils.success('เพิ่มข้อมูลสำเร็จแล้ว!');
      }
      resetForm();
      fetchPoliceRules();
    } catch (err) {
      console.error(err);
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // --- POLICE FORM HANDLERS ---
  const handleAddPoliceSubGroup = () => {
    setPoliceSubGroups([...policeSubGroups, { subTitle: '', rules: [{ text: '', penaltyValue: '', jailTime: '' }] }]);
  };
  const handleRemovePoliceSubGroup = (subIdx) => {
    setPoliceSubGroups(policeSubGroups.filter((_, idx) => idx !== subIdx));
  };
  const handlePoliceSubTitleChange = (subIdx, value) => {
    const updated = [...policeSubGroups];
    updated[subIdx].subTitle = value;
    setPoliceSubGroups(updated);
  };
  const handleAddPoliceRule = (subIdx) => {
    const updated = [...policeSubGroups];
    updated[subIdx].rules.push({ text: '', penaltyValue: '', jailTime: '' });
    setPoliceSubGroups(updated);
  };
  const handleRemovePoliceRule = (subIdx, ruleIdx) => {
    const updated = [...policeSubGroups];
    updated[subIdx].rules = updated[subIdx].rules.filter((_, idx) => idx !== ruleIdx);
    setPoliceSubGroups(updated);
  };
  const handlePoliceRuleChange = (subIdx, ruleIdx, field, value) => {
    const updated = [...policeSubGroups];
    updated[subIdx].rules[ruleIdx][field] = value;
    setPoliceSubGroups(updated);
  };

  // --- TERMS FORM HANDLERS ---
  const handleAddTermsSubGroup = () => {
    setTermsSubGroups([
      ...termsSubGroups, 
      { subId: `temp_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_${Date.now()}`, text: '', subItems: [] }] }
    ]);
  };
  const handleRemoveTermsSubGroup = (subId) => {
    setTermsSubGroups(termsSubGroups.filter(sg => sg.subId !== subId));
  };
  const handleUpdateTermsSubGroupTitle = (subId, value) => {
    setTermsSubGroups(termsSubGroups.map(sg => sg.subId === subId ? { ...sg, subTitle: value } : sg));
  };
  const handleAddTermsRule = (subId) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: [...sg.rules, { ruleId: `temp_${Date.now()}`, text: '', subItems: [] }]
        };
      }
      return sg;
    }));
  };
  const handleRemoveTermsRule = (subId, ruleId) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return { ...sg, rules: sg.rules.filter(r => r.ruleId !== ruleId) };
      }
      return sg;
    }));
  };
  const handleUpdateTermsRuleText = (subId, ruleId, value) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, text: value } : r)
        };
      }
      return sg;
    }));
  };
  const handleAddTermsSubItem = (subId, ruleId) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, subItems: [...r.subItems, { subItemId: `temp_${Date.now()}`, text: '' }] } : r)
        };
      }
      return sg;
    }));
  };
  const handleRemoveTermsSubItem = (subId, ruleId, subItemId) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, subItems: r.subItems.filter(si => si.subItemId !== subItemId) } : r)
        };
      }
      return sg;
    }));
  };
  const handleUpdateTermsSubItem = (subId, ruleId, subItemId, value) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? {
            ...r,
            subItems: r.subItems.map(si => si.subItemId === subItemId ? { ...si, text: value } : si)
          } : r)
        };
      }
      return sg;
    }));
  };

  // --- TERMS IMAGE HANDLERS ---
  const handleAddTermsImageRow = () => {
    setTermsImages([
      ...termsImages,
      {
        tempId: `temp_img_${Date.now()}`,
        caption: '',
        file: null,
        preview: null
      }
    ]);
  };

  const handleRemoveTermsImageRow = (index) => {
    setTermsImages(termsImages.filter((_, i) => i !== index));
  };

  const handleTermsImageFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updated = [...termsImages];
      updated[index] = {
        ...updated[index],
        file: file,
        preview: URL.createObjectURL(file)
      };
      setTermsImages(updated);
    }
  };

  const handleTermsImageCaptionChange = (index, value) => {
    const updated = [...termsImages];
    updated[index] = {
      ...updated[index],
      caption: value
    };
    setTermsImages(updated);
  };

  // --- SEARCH & PAGINATION FILTERING ---
  const filteredCategories = categories.filter(cat =>
    cat.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCategories.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6">
      {view === 'table' ? (
        <div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-white">จัดการข้อมูล: กฎ & ค่าปรับ</h2>
            
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
                onClick={handleOpenSelectModal}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded-full text-sm font-bold transition shrink-0 shadow-lg shadow-blue-600/20 text-white cursor-pointer"
              >
                + เพิ่มหัวข้อใหม่
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
                ) : (
                  currentItems.map((cat, index) => (
                    <tr key={cat.id || cat._id} className="hover:bg-indigo-950/10 transition">
                      <td className="p-4 text-center text-gray-400">{indexOfFirstItem + index + 1}.</td>
                      <td className="p-4 font-semibold text-white">
                        {cat.title || cat.name}
                        <span className="text-xs text-indigo-400/80 ml-3 bg-indigo-900/30 px-2 py-0.5 rounded-full">
                          {(cat.subGroups || cat.sub_groups || []).length} Sub-groups
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleEdit(cat)} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold rounded-full transition shadow-md cursor-pointer">edit</button>
                      </td>
                      <td className="p-4 text-center">
                        <button onClick={() => handleDelete(cat.id || cat._id)} className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-full transition shadow-md cursor-pointer">delete</button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {!loading && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              indexOfFirstItem={indexOfFirstItem}
              indexOfLastItem={indexOfLastItem}
              totalItems={filteredCategories.length}
            />
          )}
        </div>
      ) : view === 'form-police' ? (
        /* --- POLICE FORM VIEW (ค่าปรับ) --- */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {editingId ? 'แก้ไขข้อมูลค่าปรับ' : 'เพิ่มข้อมูลค่าปรับ'} ::
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 text-sm pt-4">
            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-36 text-gray-400 font-semibold mb-1">ชื่อหัวข้อหลัก</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white"
                  placeholder="เช่น อัตราค่าปรับจราจร"
                />
              </div>
            </div>

            {/* SubGroups for Police */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                <h3 className="text-md font-bold text-indigo-300">หมวดหมู่กลุ่มย่อย & รายการ</h3>
                <button type="button" onClick={handleAddPoliceSubGroup} className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มกลุ่มย่อย
                </button>
              </div>

              {policeSubGroups.map((sub, subIdx) => (
                <div key={subIdx} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-4 relative">
                  {policeSubGroups.length > 1 && (
                    <button type="button" onClick={() => handleRemovePoliceSubGroup(subIdx)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" title="ลบกลุ่มนี้">
                      ✕
                    </button>
                  )}

                  <div className="flex items-center gap-3 pr-8">
                    <span className="text-indigo-400 font-bold">#{subIdx + 1}</span>
                    <input
                      type="text"
                      placeholder="ชื่อกลุ่มย่อย (ถ้ามี)..."
                      value={sub.subTitle}
                      onChange={(e) => handlePoliceSubTitleChange(subIdx, e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-3 pl-0 sm:pl-6">
                    {sub.rules.map((rule, ruleIdx) => (
                      <div key={ruleIdx} className="bg-[#0f172a] p-4 rounded-xl border border-indigo-950/40 space-y-3">
                        <div className="flex items-start gap-2">
                          <span className="text-indigo-400 font-bold pt-2">{ruleIdx + 1}.</span>
                          <textarea
                            rows="2"
                            required
                            placeholder="รายละเอียด..."
                            value={rule.text}
                            onChange={(e) => handlePoliceRuleChange(subIdx, ruleIdx, 'text', e.target.value)}
                            className="flex-1 px-3 py-2 bg-[#1e293b] border border-indigo-900/40 rounded-lg text-gray-200 text-sm focus:outline-none focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            onClick={() => handleRemovePoliceRule(subIdx, ruleIdx)}
                            className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer"
                            title="ลบข้อนี้"
                          >
                            🗑
                          </button>
                        </div>

                        {/* Penalty & Jail Time */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">ค่าปรับ / บทลงโทษ</label>
                            <input
                              type="text"
                              placeholder="เช่น [ยึดของกลาง] 5,000 บาท"
                              value={rule.penaltyValue}
                              onChange={(e) => handlePoliceRuleChange(subIdx, ruleIdx, 'penaltyValue', e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="text-xs text-gray-400 mb-1 block">เวลาจำคุก (ถ้ามี)</label>
                            <input
                              type="text"
                              placeholder="เช่น 30 นาที หรือ 3 เดือน"
                              value={rule.jailTime}
                              onChange={(e) => handlePoliceRuleChange(subIdx, ruleIdx, 'jailTime', e.target.value)}
                              className="w-full px-3 py-1.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={() => handleAddPoliceRule(subIdx)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
                      + เพิ่มรายการในกลุ่มนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-2">
              <label className="text-gray-400 font-semibold block text-xs">หมายเหตุท้ายหน้า</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-[#0f172a] border border-amber-500/30 text-amber-300 text-xs"
                placeholder="หมายเหตุเพิ่มเติม..."
              />
            </div>

            <div className="flex items-center justify-center space-x-3 pt-6 border-t border-indigo-950/40">
              <button type="submit" className="px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer">Save Data</button>
              <button type="button" onClick={() => setView('table')} className="px-8 py-2.5 rounded-full font-bold text-white bg-rose-600 hover:bg-rose-500 cursor-pointer">Cancel</button>
            </div>
          </form>
        </div>
      ) : (
        /* --- TERMS FORM VIEW (กฎ) --- */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {editingId ? 'แก้ไขข้อมูลกฎ' : 'เพิ่มข้อมูลกฎ'} ::
            </h1>
          </div>

          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6 text-sm pt-4">
            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center">
                <label className="sm:w-36 text-gray-400 font-semibold mb-1">ชื่อหัวข้อหลัก</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
            </div>

            {/* Sub-groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                <h3 className="text-md font-bold text-indigo-300">หมวดหมู่กฎย่อย & ข้อย่อย (Sub-items)</h3>
                <button type="button" onClick={handleAddTermsSubGroup} className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มกลุ่มย่อย
                </button>
              </div>

              {termsSubGroups.map((sg, index) => (
                <div key={sg.subId} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-5 relative">
                  <button type="button" onClick={() => handleRemoveTermsSubGroup(sg.subId)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" title="ลบกลุ่มนี้">
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
                      value={sg.subTitle}
                      onChange={(e) => handleUpdateTermsSubGroupTitle(sg.subId, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pl-0 sm:pl-14 space-y-4">
                    {sg.rules.map((rule, ruleIndex) => (
                      <div key={rule.ruleId} className="flex flex-col gap-4 bg-[#0f172a] p-4 rounded-xl border border-indigo-950/30">
                        <div className="flex items-start gap-3">
                          <span className="text-indigo-400 font-bold shrink-0 pt-2">{ruleIndex + 1}.</span>
                          <div className="flex-1 flex items-center gap-2">
                            <textarea
                              rows="2"
                              required
                              placeholder="รายละเอียดข้อใหญ่..."
                              value={rule.text}
                              onChange={(e) => handleUpdateTermsRuleText(sg.subId, rule.ruleId, e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg outline-none text-gray-200 text-sm focus:border-indigo-500 resize-y"
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveTermsRule(sg.subId, rule.ruleId)} 
                              className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer shrink-0" 
                              title="ลบข้อใหญ่"
                            >
                              🗑
                            </button>
                          </div>
                        </div>

                        <div className="pl-6 pt-1 space-y-2">
                          {rule.subItems.map((subItem, subItemIndex) => (
                            <div key={subItem.subItemId} className="flex items-center gap-2">
                              <span className="text-xs text-indigo-400 font-bold shrink-0">{ruleIndex + 1}.{subItemIndex + 1}</span>
                              <input
                                type="text"
                                placeholder={`รายละเอียดข้อย่อยที่ ${ruleIndex + 1}.${subItemIndex + 1}...`}
                                value={subItem.text}
                                onChange={(e) => handleUpdateTermsSubItem(sg.subId, rule.ruleId, subItem.subItemId, e.target.value)}
                                className="flex-1 px-3 py-2 bg-[#1e293b] border border-indigo-900/40 rounded-lg outline-none text-gray-200 text-xs focus:border-indigo-500"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveTermsSubItem(sg.subId, rule.ruleId, subItem.subItemId)} 
                                className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer shrink-0 text-xs"
                                title="ลบข้อย่อย"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button 
                            type="button" 
                            onClick={() => handleAddTermsSubItem(sg.subId, rule.ruleId)} 
                            className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold cursor-pointer pt-1"
                          >
                            + เพิ่มข้อย่อย ({ruleIndex + 1}.x)
                          </button>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={() => handleAddTermsRule(sg.subId)} className="mt-2 text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold cursor-pointer">
                      + เพิ่มข้อบังคับ/กฎ (ข้อใหญ่)
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- Section รูปภาพประกอบ และชื่อภาพ (วางไว้ก่อนหมายเหตุ) --- */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                <h3 className="text-md font-bold text-indigo-300">รูปภาพประกอบ และชื่อภาพ</h3>
              </div>

              {termsImages.map((img, index) => {
                const imgKey = img.tempId || img.id;
                return (
                  <div key={imgKey} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-4 relative">
                    <button 
                      type="button" 
                      onClick={() => handleRemoveTermsImageRow(index)} 
                      className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" 
                      title="ลบรูปนี้"
                    >
                      ✕
                    </button>

                    <div className="flex items-center gap-3 pr-10">
                      <div className="w-10 h-10 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0 shadow-inner">
                        <span className="text-indigo-300 font-black text-sm">#{index + 1}</span>
                      </div>
                      <input
                        type="text"
                        placeholder="ชื่อภาพประกอบ (Caption)..."
                        value={img.caption}
                        onChange={(e) => handleTermsImageCaptionChange(index, e.target.value)}
                        className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold focus:outline-none focus:border-indigo-500 text-sm"
                      />
                    </div>

                    <div className="pl-0 sm:pl-13 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleTermsImageFileChange(index, e)}
                        className="w-full sm:flex-1 px-4 py-2 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-gray-300 file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer text-xs"
                      />
                      {img.preview && (
                        <div className="shrink-0">
                          <img src={img.preview} alt="Preview" className="w-24 h-14 object-cover rounded-lg border border-indigo-900/50 shadow" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              <div className="flex justify-center pt-2">
                <button 
                  type="button" 
                  onClick={handleAddTermsImageRow} 
                  className="px-6 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer shadow-md"
                >
                  + เพิ่มรูปภาพประกอบ
                </button>
              </div>
            </div>

            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-2">
              <label className="text-gray-400 font-semibold block text-xs">หมายเหตุท้ายหน้า</label>
              <input
                type="text"
                value={footerNote}
                onChange={(e) => setFooterNote(e.target.value)}
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

      {/* --- POPUP MODAL FOR SELECT FORM TYPE --- */}
      {isSelectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#1e293b] border border-indigo-950/80 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-white">เลือกรูปแบบข้อมูล</h3>
              <p className="text-xs text-indigo-300">กรุณาเลือกประเภทรูปแบบที่คุณต้องการสร้าง</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <button
                onClick={() => handleSelectFormType('terms')}
                className="p-4 bg-[#0f172a] hover:bg-indigo-950/60 border border-indigo-900/50 hover:border-indigo-500 rounded-xl text-left transition space-y-1 cursor-pointer group shadow"
              >
                <h4 className="font-bold text-white text-base group-hover:text-indigo-300 transition">กฎ</h4>
                <p className="text-xs text-gray-400">ฟอร์มกฎแบบมีหัวข้อหลัก กลุ่มย่อย ข้อ และข้อย่อยแบบลำดับชั้น</p>
              </button>

              <button
                onClick={() => handleSelectFormType('police')}
                className="p-4 bg-[#0f172a] hover:bg-indigo-950/60 border border-indigo-900/50 hover:border-indigo-500 rounded-xl text-left transition space-y-1 cursor-pointer group shadow"
              >
                <h4 className="font-bold text-white text-base group-hover:text-indigo-300 transition">ค่าปรับ</h4>
                <p className="text-xs text-gray-400">ฟอร์มสำหรับกฎที่มีการระบุค่าปรับและเวลาจำคุก</p>
              </button>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setIsSelectModalOpen(false)}
                className="px-6 py-2 rounded-full font-bold text-gray-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer text-xs"
              >
                ยกเลิก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}