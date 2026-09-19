import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';
import Pagination from '../Pagination';
import QuillEditor from '../QuillEditor.jsx';

export default function PoliceRulesCRUD() {
  // --- STATES ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('table'); // 'table' | 'form-penalty' | 'form-terms'
  const [formType, setFormType] = useState('penalty'); // 'penalty' | 'terms'
  const [isSelectModalOpen, setIsSelectModalOpen] = useState(false); // Popup State

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State (Shared / General)
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [footerNote, setFooterNote] = useState('');
  
  // 1. Penalty Rules SubGroups (ใช้ textDelta ร่วมกับ QuillEditor, เพิ่ม jailValue)
  const [penaltySubGroups, setPenaltySubGroups] = useState([
    { subId: `temp_sg_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_r_${Date.now()}`, textDelta: { ops: [{ insert: '' }] }, penaltyValue: '', jailValue: '' }] }
  ]);

  // 2. Terms Rules SubGroups (ใช้ textDelta และ QuillEditor ทั้งข้อใหญ่และข้อย่อย)
  const [termsSubGroups, setTermsSubGroups] = useState([
    { 
      subId: `temp_${Date.now()}`, 
      subTitle: '', 
      rules: [
        { 
          ruleId: `temp_${Date.now()}`, 
          textDelta: { ops: [{ insert: '' }] }, 
          subItems: [] 
        }
      ] 
    }
  ]);

  // 3. Terms Images State (สำหรับฟอร์มกฎที่มีรูปภาพ)
  const [termsImages, setTermsImages] = useState([]);

  // --- Helper function สำหรับแปลง Text/Delta ---
  const normalizeDelta = (val) => {
    if (!val) return { ops: [{ insert: '' }] };
    if (typeof val === 'object' && val.ops) return val;
    return { ops: [{ insert: String(val) }] };
  };

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
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลกฎ/ค่าปรับตำรวจได้');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setFooterNote('');
    setPenaltySubGroups([{ subId: `temp_sg_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_r_${Date.now()}`, textDelta: { ops: [{ insert: '' }] }, penaltyValue: '', jailValue: '' }] }]);
    setTermsSubGroups([{ 
      subId: `temp_${Date.now()}`, 
      subTitle: '', 
      rules: [{ ruleId: `temp_${Date.now()}`, textDelta: { ops: [{ insert: '' }] }, subItems: [] }] 
    }]);
    setTermsImages([]);
    setView('table');
  };

  const handleOpenSelectModal = () => {
    resetForm();
    setIsSelectModalOpen(true);
  };

  const handleSelectFormType = (type) => {
    setFormType(type);
    setIsSelectModalOpen(false);
    setView(type === 'terms' ? 'form-terms' : 'form-penalty');
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
        subId: sg.subId || sg.id || `temp_${Date.now()}_${Math.random()}`,
        subTitle: sg.subTitle || sg.sub_title || sg.name || '',
        rules: (sg.rules || sg.items || []).map(r => ({
          ruleId: r.ruleId || r.id || `temp_${Date.now()}_${Math.random()}`,
          textDelta: normalizeDelta(r.textDelta || r.text),
          subItems: (r.subItems || r.sub_items || []).map(si => ({
            subItemId: si.subItemId || si.id || `temp_${Date.now()}_${Math.random()}`,
            textDelta: normalizeDelta(si.textDelta || si.text)
          }))
        }))
      }));
      setTermsSubGroups(mappedTerms.length > 0 ? mappedTerms : [{ 
        subId: `temp_${Date.now()}`, 
        subTitle: '', 
        rules: [{ ruleId: `temp_${Date.now()}`, textDelta: { ops: [{ insert: '' }] }, subItems: [] }] 
      }]);

      const copiedImages = (category.images || []).map(img => ({
        id: img.id,
        caption: img.caption || '',
        file: null,
        preview: img.imageUrl ? `http://localhost:5000${img.imageUrl}` : null
      }));
      setTermsImages(copiedImages);
      setView('form-terms');
    } else {
      setFormType('penalty');
      const mappedPenalty = rawSubGroups.map(sub => ({
        subId: sub.subId || `temp_sg_${Date.now()}_${Math.random()}`,
        subTitle: sub.subTitle || sub.sub_title || '',
        rules: (sub.rules || sub.items || []).map(r => ({
          ruleId: r.ruleId || `temp_r_${Date.now()}_${Math.random()}`,
          textDelta: normalizeDelta(r.textDelta || r.text),
          penaltyValue: r.penaltyValue || r.penalty_value || '',
          jailValue: r.jailValue || r.jail_value || ''
        }))
      }));
      setPenaltySubGroups(mappedPenalty.length > 0 ? mappedPenalty : [{ subId: `temp_sg_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_r_${Date.now()}`, textDelta: { ops: [{ insert: '' }] }, penaltyValue: '', jailValue: '' }] }]);
      setView('form-penalty');
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
    let apiUrl = 'http://localhost:5000/api/police-rules';
    let isMultipart = false;

    if (formType === 'terms') {
      const formattedSubGroups = termsSubGroups.map(sg => ({
        subTitle: sg.subTitle || '',
        rules: (sg.rules || []).map(r => ({
          textDelta: r.textDelta || { ops: [{ insert: '' }] },
          subItems: (r.subItems || []).map(si => ({
            textDelta: si.textDelta || { ops: [{ insert: '' }] }
          }))
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
      payload = {
        title: title.trim(),
        footerNote: footerNote.trim(),
        footer_note: footerNote.trim(),
        subGroups: penaltySubGroups.map(sg => ({
          subTitle: sg.subTitle || '',
          rules: sg.rules.map(r => ({
            textDelta: r.textDelta || { ops: [{ insert: '' }] },
            penaltyValue: r.penaltyValue || '',
            jailValue: r.jailValue || ''
          }))
        }))
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

  // --- PENALTY FORM HANDLERS (Immutable Safe) ---
  const handleAddPenaltySubGroup = () => {
    setPenaltySubGroups([
      ...penaltySubGroups.map(sg => ({ ...sg, rules: sg.rules.map(r => ({ ...r })) })),
      { subId: `temp_sg_${Date.now()}_${Math.random()}`, subTitle: '', rules: [{ ruleId: `temp_r_${Date.now()}_${Math.random()}`, textDelta: { ops: [{ insert: '' }] }, penaltyValue: '', jailValue: '' }] }
    ]);
  };
  const handleRemovePenaltySubGroup = (subId) => {
    setPenaltySubGroups(penaltySubGroups.filter(sg => sg.subId !== subId));
  };
  const handlePenaltySubTitleChange = (subId, value) => {
    setPenaltySubGroups(penaltySubGroups.map(sg => sg.subId === subId ? { ...sg, subTitle: value } : sg));
  };
  const handleAddPenaltyRule = (subId) => {
    setPenaltySubGroups(penaltySubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: [...sg.rules.map(r => ({ ...r })), { ruleId: `temp_r_${Date.now()}_${Math.random()}`, textDelta: { ops: [{ insert: '' }] }, penaltyValue: '', jailValue: '' }]
        };
      }
      return sg;
    }));
  };
  const handleRemovePenaltyRule = (subId, ruleId) => {
    setPenaltySubGroups(penaltySubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.filter(r => r.ruleId !== ruleId)
        };
      }
      return sg;
    }));
  };
  const handlePenaltyRuleChange = (subId, ruleId, field, value) => {
    setPenaltySubGroups(penaltySubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, [field]: value } : r)
        };
      }
      return sg;
    }));
  };

  // --- TERMS FORM HANDLERS (Immutable Safe) ---
  const handleAddTermsSubGroup = () => {
    setTermsSubGroups([
      ...termsSubGroups.map(sg => ({ ...sg, rules: sg.rules.map(r => ({ ...r, subItems: r.subItems.map(si => ({...si})) })) })),
      { 
        subId: `temp_${Date.now()}_${Math.random()}`, 
        subTitle: '', 
        rules: [{ ruleId: `temp_rule_${Date.now()}_${Math.random()}`, textDelta: { ops: [{ insert: '' }] }, subItems: [] }] 
      }
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
          rules: [...sg.rules, { ruleId: `temp_rule_${Date.now()}_${Math.random()}`, textDelta: { ops: [{ insert: '' }] }, subItems: [] }]
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
  const handleUpdateTermsRuleDelta = (subId, ruleId, delta) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, textDelta: delta } : r)
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
          rules: sg.rules.map(r => r.ruleId === ruleId ? { 
            ...r, 
            subItems: [...r.subItems, { subItemId: `temp_subitem_${Date.now()}_${Math.random()}`, textDelta: { ops: [{ insert: '' }] } }] 
          } : r)
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
  const handleUpdateTermsSubItemDelta = (subId, ruleId, subItemId, delta) => {
    setTermsSubGroups(termsSubGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? {
            ...r,
            subItems: r.subItems.map(si => si.subItemId === subItemId ? { ...si, textDelta: delta } : si)
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
            <h2 className="text-2xl font-bold text-white">จัดการข้อมูล: กฎ & ค่าปรับ (ตำรวจ)</h2>
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

          {isSelectModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
              <div className="bg-[#1e293b] border border-indigo-950 rounded-2xl max-w-md w-full p-6 space-y-6 shadow-2xl">
                <div className="text-center space-y-2">
                  <h3 className="text-lg font-bold text-white">เลือกรูปแบบข้อมูล</h3>
                  <p className="text-xs text-gray-400">กรุณาเลือกประเภทรูปแบบที่คุณต้องการสร้าง</p>
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <button
                    type="button"
                    onClick={() => handleSelectFormType('terms')}
                    className="p-4 rounded-xl bg-[#0f172a] hover:bg-indigo-950/40 border border-indigo-900/50 text-left transition space-y-1 cursor-pointer group"
                  >
                    <div className="font-bold text-indigo-300 group-hover:text-indigo-200">กฎระเบียบ</div>
                    <div className="text-xs text-gray-400">ฟอร์มกฎแบบมีหัวข้อหลัก กลุ่มย่อย ข้อ และข้อย่อยแบบลำดับชั้น</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectFormType('penalty')}
                    className="p-4 rounded-xl bg-[#0f172a] hover:bg-indigo-950/40 border border-indigo-900/50 text-left transition space-y-1 cursor-pointer group"
                  >
                    <div className="font-bold text-indigo-300 group-hover:text-indigo-200">ค่าปรับ</div>
                    <div className="text-xs text-gray-400">ฟอร์มสำหรับระบุรายการ ราคาค่าปรับ และเวลาจำคุก</div>
                  </button>
                </div>
                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSelectModalOpen(false)}
                    className="px-6 py-2 rounded-full text-xs font-bold text-gray-400 hover:text-white bg-gray-800 hover:bg-gray-700 transition cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : view === 'form-penalty' ? (
        /* --- PENALTY FORM VIEW (ค่าปรับ - ใช้ QuillEditor) --- */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {editingId ? 'แก้ไขข้อมูลค่าปรับ (ตำรวจ)' : 'เพิ่มข้อมูลค่าปรับ (ตำรวจ)'} ::
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
                  placeholder="เช่น อัตราค่าปรับจราจร/คดีอาญา"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                <h3 className="text-md font-bold text-indigo-300">หมวดหมู่กลุ่มย่อย & รายการค่าปรับ</h3>
                <button type="button" onClick={handleAddPenaltySubGroup} className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มกลุ่มย่อย
                </button>
              </div>

              {penaltySubGroups.map((sub, subIdx) => (
                <div key={sub.subId} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-4 relative">
                  {penaltySubGroups.length > 1 && (
                    <button type="button" onClick={() => handleRemovePenaltySubGroup(sub.subId)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" title="ลบกลุ่มนี้">
                      ✕
                    </button>
                  )}

                  <div className="flex items-center gap-3 pr-8">
                    <span className="text-indigo-400 font-bold">#{subIdx + 1}</span>
                    <input
                      type="text"
                      placeholder="ชื่อกลุ่มย่อย (ถ้ามี)..."
                      value={sub.subTitle}
                      onChange={(e) => handlePenaltySubTitleChange(sub.subId, e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="space-y-3 pl-0 sm:pl-6">
                    {sub.rules.map((rule, ruleIdx) => {
                      const ruleDelta = normalizeDelta(rule.textDelta || rule.text);
                      return (
                        <div key={rule.ruleId} className="bg-[#0f172a] p-4 rounded-xl border border-indigo-950/40 space-y-3">
                          <div className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold pt-2">{ruleIdx + 1}.</span>
                            <div className="flex-1 bg-[#1e293b] rounded-xl overflow-hidden border border-indigo-900/40 text-white">
                              <QuillEditor
                                value={ruleDelta}
                                onChange={(delta) => handlePenaltyRuleChange(sub.subId, rule.ruleId, 'textDelta', delta)}
                                placeholder="รายละเอียดการกระทำผิด..."
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => handleRemovePenaltyRule(sub.subId, rule.ruleId)}
                              className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer mt-1"
                              title="ลบข้อนี้"
                            >
                              🗑
                            </button>
                          </div>

                          {/* --- วางช่อง "จำคุก / นาที" ไว้ข้างๆ "ค่าปรับ" --- */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pl-6">
                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">ค่าปรับ</label>
                              <input
                                type="text"
                                placeholder="เช่น 1,000 บาท"
                                value={rule.penaltyValue}
                                onChange={(e) => handlePenaltyRuleChange(sub.subId, rule.ruleId, 'penaltyValue', e.target.value)}
                                className="w-full px-3 py-1.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>

                            <div>
                              <label className="text-xs text-gray-400 mb-1 block">จำคุก / นาที</label>
                              <input
                                type="text"
                                placeholder="เช่น 10 นาที"
                                value={rule.jailValue || ''}
                                onChange={(e) => handlePenaltyRuleChange(sub.subId, rule.ruleId, 'jailValue', e.target.value)}
                                className="w-full px-3 py-1.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    <button type="button" onClick={() => handleAddPenaltyRule(sub.subId)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer">
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
        /* --- TERMS FORM VIEW (กฎ + QuillEditor ข้อใหญ่และข้อย่อย + รูปภาพ) --- */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {editingId ? 'แก้ไขข้อมูลกฎระเบียบ (ตำรวจ)' : 'เพิ่มข้อมูลกฎระเบียบ (ตำรวจ)'} ::
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
                    {sg.rules.map((rule, ruleIndex) => {
                      const ruleDelta = normalizeDelta(rule.textDelta || rule.text);
                      return (
                        <div key={rule.ruleId} className="flex flex-col gap-4 bg-[#0f172a] p-4 rounded-xl border border-indigo-950/30">
                          <div className="flex items-start gap-3">
                            <span className="text-indigo-400 font-bold shrink-0 pt-2">{ruleIndex + 1}.</span>
                            <div className="flex-1 flex items-start gap-2">
                              <div className="flex-1 bg-[#1e293b] rounded-xl overflow-hidden border border-indigo-900/40 text-white">
                                <QuillEditor
                                  value={ruleDelta}
                                  onChange={(delta) => handleUpdateTermsRuleDelta(sg.subId, rule.ruleId, delta)}
                                  placeholder="รายละเอียดข้อกฎระเบียบ..."
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveTermsRule(sg.subId, rule.ruleId)}
                                className="p-2.5 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer mt-1"
                                title="ลบข้อนี้"
                              >
                                🗑
                              </button>
                            </div>
                          </div>

                          {/* SubItems */}
                          <div className="pl-6 space-y-3">
                            {rule.subItems?.map((subItem, subItemIndex) => {
                              const subItemDelta = normalizeDelta(subItem.textDelta || subItem.text);
                              return (
                                <div key={subItem.subItemId} className="flex items-start gap-2">
                                  <span className="text-gray-400 text-xs shrink-0 pt-2">{ruleIndex + 1}.{subItemIndex + 1}</span>
                                  <div className="flex-1 bg-[#1e293b] rounded-xl overflow-hidden border border-indigo-900/40 text-white">
                                    <QuillEditor
                                      value={subItemDelta}
                                      onChange={(delta) => handleUpdateTermsSubItemDelta(sg.subId, rule.ruleId, subItem.subItemId, delta)}
                                      placeholder="ข้อย่อย..."
                                    />
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveTermsSubItem(sg.subId, rule.ruleId, subItem.subItemId)}
                                    className="p-2 text-rose-400 hover:text-rose-300 transition cursor-pointer mt-1"
                                    title="ลบข้อย่อย"
                                  >
                                    ✕
                                  </button>
                                </div>
                              );
                            })}
                            <button
                              type="button"
                              onClick={() => handleAddTermsSubItem(sg.subId, rule.ruleId)}
                              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                            >
                              + เพิ่มข้อย่อย
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => handleAddTermsRule(sg.subId)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer"
                    >
                      + เพิ่มข้อในหมวดนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Images Section */}
            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-300 font-semibold text-xs">รูปภาพประกอบ (ถ้ามี)</label>
                <button
                  type="button"
                  onClick={handleAddTermsImageRow}
                  className="px-3 py-1 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer"
                >
                  + เพิ่มรูปภาพ
                </button>
              </div>
              {termsImages.map((img, imgIdx) => (
                <div key={img.tempId || img.id || imgIdx} className="flex flex-col sm:flex-row items-center gap-3 bg-[#0f172a] p-3 rounded-xl border border-indigo-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleTermsImageFileChange(imgIdx, e)}
                    className="text-xs text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-900/50 file:text-indigo-300 hover:file:bg-indigo-900"
                  />
                  {img.preview && (
                    <img src={img.preview} alt="preview" className="w-12 h-12 object-cover rounded-lg border border-indigo-900/50" />
                  )}
                  <input
                    type="text"
                    placeholder="คำอธิบายรูปภาพ..."
                    value={img.caption || ''}
                    onChange={(e) => handleTermsImageCaptionChange(imgIdx, e.target.value)}
                    className="flex-1 px-3 py-1.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg text-xs text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveTermsImageRow(imgIdx)}
                    className="p-1.5 text-rose-500 hover:text-rose-400 transition cursor-pointer"
                  >
                    ✕
                  </button>
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
      )}
    </div>
  );
}