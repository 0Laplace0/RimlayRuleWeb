import { useState, useEffect } from 'react';
import axios from 'axios';
import { swalUtils } from '../../utils/swalUtils.js';

const BannerCRUD = () => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    id: null,
    bannerFile: null,
    bannerPreview: null,
    bgFile: null,
    bgPreview: null,
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  const token = localStorage.getItem('token');

  const fetchBannerData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/banners`);
      if (res.data) {
        const item = Array.isArray(res.data) ? res.data[0] : (res.data.data?.[0] || res.data);
        if (item && (item.id || item._id)) {
          const bannerId = item.id || item._id;
          const bannerUrl = item.imageUrl || item.bannerUrl;
          const bgUrl = item.bgUrl || item.backgroundUrl;
          setForm({
            id: bannerId,
            bannerFile: null,
            bannerPreview: bannerUrl ? `${API_URL.replace('/api', '')}${bannerUrl}` : null,
            bgFile: null,
            bgPreview: bgUrl ? `${API_URL.replace('/api', '')}${bgUrl}` : null,
          });
        }
      }
    } catch (err) {
      console.error('Fetch banner error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBannerData();
  }, []);

  const handleFileChange = (e, fieldType) => {
    const file = e.target.files[0];
    if (file) {
      if (fieldType === 'banner') {
        setForm((prev) => ({
          ...prev,
          bannerFile: file,
          bannerPreview: URL.createObjectURL(file),
        }));
      } else if (fieldType === 'bg') {
        setForm((prev) => ({
          ...prev,
          bgFile: file,
          bgPreview: URL.createObjectURL(file),
        }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const isEditMode = Boolean(form.id);
    const actionTitle = isEditMode ? 'ตรวจสอบการอัปเดต Banner & Background' : 'ตรวจสอบการสร้าง Banner & Background';

    const isConfirmed = await swalUtils.previewConfirm({
      actionTitle,
      fields: [
        { label: 'สถานะรูป Banner', value: form.bannerFile ? 'อัปโหลดรูปภาพใหม่' : 'ใช้รูปภาพเดิม' },
        { label: 'สถานะพื้นหลังเว็บ', value: form.bgFile ? 'อัปโหลดพื้นหลังใหม่' : 'ใช้พื้นหลังเดิม' },
      ],
      confirmText: 'ยืนยันบันทึก',
      cancelText: 'กลับไปแก้ไข'
    });

    if (!isConfirmed) return;

    try {
      const formData = new FormData();
      if (form.bannerFile) {
        formData.append('banner', form.bannerFile); 
      }
      if (form.bgFile) {
        formData.append('background', form.bgFile); 
      }

      const config = {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      };

      if (isEditMode) {
        await axios.put(`${API_URL}/banners/${form.id}`, formData, config);
        swalUtils.success('อัปเดต Banner และพื้นหลังเว็บสำเร็จแล้ว!');
      } else {
        await axios.post(`${API_URL}/banners`, formData, config);
        swalUtils.success('สร้าง Banner และพื้นหลังเว็บสำเร็จแล้ว!');
      }

      fetchBannerData();
    } catch (err) {
      swalUtils.error('เกิดข้อผิดพลาด!', err.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-[#1e293b]/20 p-6 rounded-2xl border border-indigo-950/60 shadow-xl space-y-6">
        
        <div className="bg-[#1e293b] border border-indigo-950/60 py-3 px-6 rounded-lg shadow-md flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">จัดการรูปภาพ Banner และพื้นหลังเว็บ</h2>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">กำลังโหลดข้อมูล...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 text-sm">
            <div className="bg-[#1e293b]/40 p-6 rounded-2xl border border-indigo-950/40 space-y-8">
              
              {/* อัปโหลดไฟล์รูปภาพ Banner */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <label className="sm:w-36 text-gray-400 font-semibold pt-2 shrink-0">
                  รูปภาพ Banner
                </label>
                <div className="flex-1 space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'banner')}
                    className="w-full px-4 py-2 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-gray-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer text-xs"
                  />
                  <p className="text-xs text-gray-500">แนะนำขนาดภาพสัดส่วน 16:9 หรือ 21:9 (เช่น 1920x600 px)</p>
                  
                  {form.bannerPreview && (
                    <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-indigo-900/50 shadow-lg bg-gray-950">
                      <img 
                        src={form.bannerPreview} 
                        alt="Banner Preview" 
                        className="w-full h-full object-cover object-center" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
                      <span className="absolute bottom-3 left-3 text-xs bg-black/60 px-2.5 py-1 rounded-md text-gray-300 border border-white/10">
                        ตัวอย่าง Banner
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <hr className="border-indigo-950/40" />

              {/* อัปโหลดไฟล์พื้นหลังเว็บ (Background) */}
              <div className="flex flex-col sm:flex-row sm:items-start gap-2">
                <label className="sm:w-36 text-gray-400 font-semibold pt-2 shrink-0">
                  พื้นหลังเว็บ (Background)
                </label>
                <div className="flex-1 space-y-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, 'bg')}
                    className="w-full px-4 py-2 rounded-xl bg-[#0f172a] border border-indigo-950/60 text-gray-300 file:mr-4 file:py-1.5 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer text-xs"
                  />
                  <p className="text-xs text-gray-500">แนะนำขนาด Full HD หรือ 4K (เช่น 1920x1080 หรือ 3840x2160 px)</p>
                  
                  {form.bgPreview && (
                    <div className="relative w-full h-48 sm:h-56 rounded-xl overflow-hidden border border-indigo-900/50 shadow-lg bg-gray-950">
                      <img 
                        src={form.bgPreview} 
                        alt="Background Preview" 
                        className="w-full h-full object-cover object-center" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60 pointer-events-none" />
                      <span className="absolute bottom-3 left-3 text-xs bg-black/60 px-2.5 py-1 rounded-md text-gray-300 border border-white/10">
                        ตัวอย่างพื้นหลังเว็บ
                      </span>
                    </div>
                  )}
                </div>
              </div>

            </div>

            <div className="flex items-center justify-center space-x-3 pt-4 border-t border-indigo-950/40">
              <button 
                type="submit" 
                className="px-8 py-2.5 rounded-full font-bold text-white bg-blue-600 hover:bg-blue-500 cursor-pointer shadow-lg shadow-blue-600/20 transition"
              >
                Save Changes
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default BannerCRUD;