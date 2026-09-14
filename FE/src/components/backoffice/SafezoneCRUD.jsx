import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';

const SafezoneCRUD = () => {
  const [loading, setLoading] = useState(false);
  
  const [form, setForm] = useState({ 
    id: null, 
    title: 'Safezone',
    description: '', 
    penalty: '', 
    images: [] 
  });

  const API_URL = 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  // --- API Fetching: โหลดข้อมูลเดิมมาแสดงในฟอร์มทันทีอันแรก ---
  const fetchSafezoneData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/safezones`);
      if (res.data && res.data.length > 0) {
        const item = res.data[0]; // ดึงข้อมูลตัวแรกมาแสดงทันที
        const copiedImages = (item.images || []).map(img => ({
          id: img.id,
          caption: img.caption || '',
          file: null,
          preview: img.imageUrl ? `${API_URL.replace('/api', '')}${img.imageUrl}` : null
        }));

        setForm({ 
          id: item.id, 
          title: item.title || 'Safezone', 
          description: item.description || '', 
          penalty: item.penalty || '', 
          images: copiedImages
        });
      }
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', 'ไม่สามารถดึงข้อมูล Safezone ได้');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSafezoneData();
  }, []);

  // --- Functions สำหรับจัดการรูปภาพประกอบ ---
  const handleAddImageRow = () => {
    setForm({
      ...form,
      images: [
        ...form.images,
        {
          tempId: `temp_img_${Date.now()}`,
          caption: '',
          file: null,
          preview: null
        }
      ]
    });
  };

  const handleRemoveImageRow = (index) => {
    const updatedImages = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: updatedImages });
  };

  const handleImageFileChange = (index, e) => {
    const file = e.target.files[0];
    if (file) {
      const updatedImages = [...form.images];
      updatedImages[index] = {
        ...updatedImages[index],
        file: file,
        preview: URL.createObjectURL(file)
      };
      setForm({ ...form, images: updatedImages });
    }
  };

  const handleImageCaptionChange = (index, value) => {
    const updatedImages = [...form.images];
    updatedImages[index] = {
      ...updatedImages[index],
      caption: value
    };
    setForm({ ...form, images: updatedImages });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const isEditMode = Boolean(form.id);
    const actionTitle = isEditMode ? 'ตรวจสอบการแก้ไข Safezone' : 'ตรวจสอบการเพิ่ม Safezone';

    const isConfirmed = await swalUtils.previewConfirm({
      actionTitle,
      fields: [
        { label: 'จำนวนรูปภาพประกอบ', value: `${form.images.length} รูป` }
      ],
      confirmText: 'ยืนยันบันทึก',
      cancelText: 'กลับไปแก้ไข'
    });

    if (!isConfirmed) return;

    try {
      const formData = new FormData();
      // ส่งค่า title แฝงไว้หลังบ้านเสมอ (เพื่อไม่ให้ฐานข้อมูลพังเนื่องจากเป็น Field บังคับ)
      formData.append('title', form.title || 'Safezone');
      formData.append('description', form.description || '');
      formData.append('penalty', form.penalty || '');

      form.images.forEach((img, index) => {
        formData.append(`images[${index}][caption]`, img.caption || '');
        if (img.file) {
          formData.append('images', img.file);
        }
      });

      const config = { 
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        } 
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/safezones/${form.id}`, formData, config);
        swalUtils.success('อัปเดตข้อมูล Safezone สำเร็จแล้ว!');
      } else {
        const res = await axios.post(`${API_URL}/safezones`, formData, config);
        if (res.data && res.data.data) {
          setForm(prev => ({ ...prev, id: res.data.data.id }));
        }
        swalUtils.success('เพิ่มข้อมูล Safezone สำเร็จแล้ว!');
      }

      fetchSafezoneData();
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-[#1e293b]/20 p-6 rounded-2xl border border-indigo-950/60 shadow-xl space-y-6">
        
        <div className="bg-[#1e293b] border border-indigo-950/60 py-3 px-6 rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-white">จัดการข้อมูล Safezone</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-sm">
          <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-5">
            
            {/* ซ่อนช่องกรอกหัวข้อ Safezone (Title) ตามที่ขอ */}

            <div className="flex flex-col sm:flex-row sm:items-start">
              <label className="sm:w-36 text-gray-400 font-semibold mb-1 pt-2">รายละเอียดพื้นที่</label>
              <textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="อธิบายว่าพื้นที่นี้ทำอะไร..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white resize-y"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-start">
              <label className="sm:w-36 text-gray-400 font-semibold mb-1 pt-2">บทลงโทษ</label>
              <textarea
                rows={3}
                value={form.penalty}
                onChange={(e) => setForm({ ...form, penalty: e.target.value })}
                placeholder="บทลงโทษของการทำผิดใน safezone..."
                className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 focus:outline-none focus:border-indigo-500 text-white resize-y"
              />
            </div>

          </div>

          {/* Section รูปภาพและชื่อภาพประกอบ */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-950/40 pb-2">
              <h3 className="text-md font-bold text-indigo-300">รูปภาพประกอบ และชื่อภาพ Safezone</h3>
            </div>

            {form.images.map((img, index) => {
              const imgKey = img.tempId || img.id;
              return (
                <div key={imgKey} className="bg-[#1e293b]/80 p-5 rounded-2xl border border-indigo-900/30 space-y-4 relative">
                  <button 
                    type="button" 
                    onClick={() => handleRemoveImageRow(index)} 
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
                      placeholder="ชื่อภาพ Safezone (Caption)..."
                      value={img.caption}
                      onChange={(e) => handleImageCaptionChange(index, e.target.value)}
                      className="flex-1 px-4 py-2.5 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-white font-semibold focus:outline-none focus:border-indigo-500 text-sm"
                    />
                  </div>

                  <div className="pl-0 sm:pl-13 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageFileChange(index, e)}
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
                onClick={handleAddImageRow} 
                className="px-6 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 border border-indigo-500/50 text-indigo-400 rounded-full text-xs font-bold transition cursor-pointer shadow-md"
              >
                + เพิ่มรูปภาพ Safezone
              </button>
            </div>
          </div>

          <div className="flex items-center justify-center space-x-3 pt-4 border-t border-indigo-950/40">
            <button 
              type="submit" 
              className="px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-600/20"
            >
              Save Data
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SafezoneCRUD;