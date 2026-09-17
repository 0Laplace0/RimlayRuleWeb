import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';
import Pagination from '../Pagination';

export default function CouncilRulesCRUD() {
  // --- STATES ---
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [view, setView] = useState('table'); // 'table' | 'form'

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [title, setTitle] = useState('');
  const [footerNote, setFooterNote] = useState('');
  
  // SubGroups (มี subItems สำหรับระเบียบ/ข้อบังคับสภา)
  const [subGroups, setSubGroups] = useState([
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

  // Images State (สำหรับรูปภาพประกอบกฎสภา)
  const [images, setImages] = useState([]);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token');
    return token ? { headers: { Authorization: `Bearer ${token}` } } : {};
  };

  useEffect(() => {
    fetchCouncilRules();
  }, []);

  // --- API CALLS ---
  const fetchCouncilRules = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/council-rules', getAuthHeader());
      setCategories(res.data.data || res.data || []);
    } catch (err) {
      console.error(err);
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูลกฎสภาได้');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setTitle('');
    setFooterNote('');
    setSubGroups([{ subId: `temp_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_${Date.now()}`, text: '', subItems: [] }] }]);
    setImages([]);
    setView('table');
  };

  const handleOpenAddForm = () => {
    resetForm();
    setView('form');
  };

  const handleEdit = (category) => {
    setEditingId(category.id || category._id);
    setTitle(category.title || '');
    setFooterNote(category.footerNote || category.footer_note || '');

    const rawSubGroups = category.subGroups || category.sub_groups || [];
    const mappedSubGroups = rawSubGroups.map(sg => ({
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
    setSubGroups(mappedSubGroups.length > 0 ? mappedSubGroups : [{ subId: `temp_${Date.now()}`, subTitle: '', rules: [] }]);

    // Map รูปภาพประกอบ
    const copiedImages = (category.images || []).map(img => ({
      id: img.id,
      caption: img.caption || '',
      file: null,
      preview: img.imageUrl ? `http://localhost:5000${img.imageUrl}` : null
    }));
    setImages(copiedImages);

    setView('form');
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
        await axios.delete(`http://localhost:5000/api/council-rules/${id}`, getAuthHeader());
        swalUtils.success('ลบข้อมูลสำเร็จ!', 'ได้ทำการลบรายการเรียบร้อยแล้ว');
        fetchCouncilRules();
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

    const formattedSubGroups = subGroups.map(sg => ({
      subTitle: sg.subTitle || '',
      rules: (sg.rules || []).map(r => ({
        text: r.text || '',
        subItems: (r.subItems || []).map(si => ({ text: si.text || '' }))
      }))
    }));

    let payload = {};
    let apiUrl = 'http://localhost:5000/api/council-rules';
    let isMultipart = false;

    if (images.length > 0) {
      isMultipart = true;
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('footerNote', footerNote.trim());
      formData.append('footer_note', footerNote.trim());
      formData.append('subGroups', JSON.stringify(formattedSubGroups));

      images.forEach((img, index) => {
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
      fetchCouncilRules();
    } catch (err) {
      console.error(err);
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // --- SUBGROUP & RULES HANDLERS ---
  const handleAddSubGroup = () => {
    setSubGroups([
      ...subGroups, 
      { subId: `temp_${Date.now()}`, subTitle: '', rules: [{ ruleId: `temp_${Date.now()}`, text: '', subItems: [] }] }
    ]);
  };
  const handleRemoveSubGroup = (subId) => {
    setSubGroups(subGroups.filter(sg => sg.subId !== subId));
  };
  const handleUpdateSubGroupTitle = (subId, value) => {
    setSubGroups(subGroups.map(sg => sg.subId === subId ? { ...sg, subTitle: value } : sg));
  };
  const handleAddRule = (subId) => {
    setSubGroups(subGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: [...sg.rules, { ruleId: `temp_${Date.now()}`, text: '', subItems: [] }]
        };
      }
      return sg;
    }));
  };
  const handleRemoveRule = (subId, ruleId) => {
    setSubGroups(subGroups.map(sg => {
      if (sg.subId === subId) {
        return { ...sg, rules: sg.rules.filter(r => r.ruleId !== ruleId) };
      }
      return sg;
    }));
  };
  const handleUpdateRuleText = (subId, ruleId, value) => {
    setSubGroups(subGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, text: value } : r)
        };
      }
      return sg;
    }));
  };
  const handleAddSubItem = (subId, ruleId) => {
    setSubGroups(subGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, subItems: [...r.subItems, { subItemId: `temp_${Date.now()}`, text: '' }] } : r)
        };
      }
      return sg;
    }));
  };
  const handleRemoveSubItem = (subId, ruleId, subItemId) => {
    setSubGroups(subGroups.map(sg => {
      if (sg.subId === subId) {
        return {
          ...sg,
          rules: sg.rules.map(r => r.ruleId === ruleId ? { ...r, subItems: r.subItems.filter(si => si.subItemId !== subItemId) } : r)
        };
      }
      return sg;
    }));
  };
  const handleUpdateSubItem = (subId, ruleId, subItemId, value) => {
    setSubGroups(subGroups.map(sg => {
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

  // --- IMAGE HANDLERS (Flex Row Preview) ---
  const handleAddImageRow = () => {
    setImages([
      ...images,
      {
        tempId: `temp_img_${Date.now()}`,
        caption: '',
        file: null,
        preview: null
      }
    ]);
  };

  const handleRemoveImageRow = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleImageFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updated = [...images];
      updated[index] = {
        ...updated[index],
        file: file,
        preview: URL.createObjectURL(file)
      };
      setImages(updated);
    }
  };

  const handleImageCaptionChange = (index, value) => {
    const updated = [...images];
    updated[index] = {
      ...updated[index],
      caption: value
    };
    setImages(updated);
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
            <h2 className="text-2xl font-bold text-white">จัดการข้อมูล: กฎสภา</h2>
            
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
                onClick={handleOpenAddForm}
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
      ) : (
        /* --- FORM VIEW (กฎสภา + รูปภาพแบบ Flex Row) --- */
        <div className="space-y-6">
          <div className="bg-[#1e293b] border border-indigo-950/60 py-4 px-6 rounded-lg text-center shadow-lg">
            <h1 className="text-lg font-bold text-indigo-300 tracking-wide">
              :: {editingId ? 'แก้ไขข้อมูลกฎสภา' : 'เพิ่มข้อมูลกฎสภา'} ::
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
                  placeholder="เช่น ระเบียบข้อบังคับสภา..."
                />
              </div>
            </div>

            {/* Sub-groups */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
                <h3 className="text-md font-bold text-indigo-300">หมวดหมู่กฎย่อย & ข้อย่อย (Sub-items)</h3>
                <button type="button" onClick={handleAddSubGroup} className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer">
                  + เพิ่มกลุ่มย่อย
                </button>
              </div>

              {subGroups.map((sg, index) => (
                <div key={sg.subId} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-5 relative">
                  <button type="button" onClick={() => handleRemoveSubGroup(sg.subId)} className="absolute top-4 right-4 text-gray-500 hover:text-rose-500 cursor-pointer" title="ลบกลุ่มนี้">
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
                      onChange={(e) => handleUpdateSubGroupTitle(sg.subId, e.target.value)}
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
                              onChange={(e) => handleUpdateRuleText(sg.subId, rule.ruleId, e.target.value)}
                              className="w-full px-4 py-2.5 bg-[#1e293b] border border-indigo-900/40 rounded-lg outline-none text-gray-200 text-sm focus:border-indigo-500 resize-y"
                            />
                            <button 
                              type="button" 
                              onClick={() => handleRemoveRule(sg.subId, rule.ruleId)} 
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
                                onChange={(e) => handleUpdateSubItem(sg.subId, rule.ruleId, subItem.subItemId, e.target.value)}
                                className="flex-1 px-3 py-2 bg-[#1e293b] border border-indigo-900/40 rounded-lg outline-none text-gray-200 text-xs focus:border-indigo-500"
                              />
                              <button 
                                type="button" 
                                onClick={() => handleRemoveSubItem(sg.subId, rule.ruleId, subItem.subItemId)} 
                                className="p-2 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer shrink-0"
                                title="ลบข้อย่อย"
                              >
                                ✕
                              </button>
                            </div>
                          ))}
                          <button type="button" onClick={() => handleAddSubItem(sg.subId, rule.ruleId)} className="text-xs text-blue-400 hover:text-blue-300 font-semibold cursor-pointer pt-1">
                            + เพิ่มข้อย่อย
                          </button>
                        </div>
                      </div>
                    ))}

                    <button type="button" onClick={() => handleAddRule(sg.subId)} className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer">
                      + เพิ่มข้อใหญ่
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* --- รูปภาพประกอบ (แยกภาพตัวอย่างออกจากกรอบ Choose File โดยจัดวางเรียงเคียงกัน) --- */}
            <div className="space-y-4 pt-4 border-t border-indigo-950/40">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-indigo-300">รูปภาพประกอบ และชื่อภาพ</h3>
                <button
                  type="button"
                  onClick={handleAddImageRow}
                  className="px-4 py-1.5 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer"
                >
                  + เพิ่มรูปภาพ
                </button>
              </div>

              {images.map((img, index) => (
                <div key={img.id || img.tempId || index} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-3 relative">
                  <button
                    type="button"
                    onClick={() => handleRemoveImageRow(index)}
                    className="absolute top-4 right-4 text-gray-400 hover:text-rose-500 cursor-pointer"
                    title="ลบรูปภาพนี้"
                  >
                    ✕
                  </button>

                  <div className="flex items-center gap-3 pr-8">
                    <div className="w-12 h-12 rounded-xl bg-indigo-900/40 border border-indigo-700/50 flex items-center justify-center shrink-0 shadow-inner">
                      <span className="text-indigo-300 font-black text-sm">#{index + 1}</span>
                    </div>
                    <input
                      type="text"
                      placeholder="ชื่อภาพประกอบ (Caption)..."
                      value={img.caption}
                      onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                      className="flex-1 px-4 py-3 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="pl-0 sm:pl-15">
                    <div className="flex items-center gap-4">
                      {/* กรอบ Choose File */}
                      <div className="flex-1 bg-[#0f172a] border border-indigo-950/60 rounded-xl px-4 py-2.5 flex items-center gap-3">
                        <label className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg cursor-pointer transition shadow-md shrink-0">
                          Choose File
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleImageFileChange(index, e)}
                            className="hidden"
                          />
                        </label>
                        <span className="text-xs text-gray-400 truncate">
                          {img.file ? img.file.name : 'No file chosen'}
                        </span>
                      </div>

                      {/* ภาพตัวอย่าง (แยกออกมาอยู่นอกกรอบทางขวา) */}
                      {img.preview && (
                        <div className="shrink-0">
                          <img src={img.preview} alt="Preview" className="h-12 w-20 sm:h-14 sm:w-24 rounded-lg border border-indigo-900/50 object-cover shadow" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {images.length === 0 && (
                <p className="text-xs text-gray-500 italic">ยังไม่มีรูปภาพประกอบ (สามารถกดปุ่มเพิ่มรูปภาพด้านบนได้)</p>
              )}
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