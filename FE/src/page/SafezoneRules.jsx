import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';

export default function Safezone() {
  const [safezones, setSafezones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSafezones();
  }, []);

  const fetchSafezones = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/safezones');
      const resultData = Array.isArray(res.data) ? res.data : (res.data.data || []);
      setSafezones(resultData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-600">กำลังโหลดข้อมูล...</div>;

  // ดึงรายละเอียดและบทลงโทษจากข้อมูลแถวแรกมาแสดงที่ Header ด้านบน
  const mainInfo = safezones[0] || {};

  // ฟังก์ชันจัดการ URL รูปภาพให้ถูกต้องเสมอ
  const getImageUrl = (imageUrl) => {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return imageUrl.startsWith('/') ? `http://localhost:5000${imageUrl}` : `http://localhost:5000/${imageUrl}`;
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        
        {/* Header: หัวข้อกลาง รายละเอียดและบทลงโทษชิดซ้าย */}
        <div className="pb-8 border-b border-gray-200 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-6 text-center">
            Safezone
          </h1>
          <div className="max-w-3xl mx-auto space-y-2 text-left">
            {mainInfo.description && (
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed whitespace-pre-line">
                {mainInfo.description}
              </p>
            )}
            {mainInfo.penalty && (
              <p className="text-gray-900 font-semibold text-base">
                บทลงโทษ : {mainInfo.penalty}
              </p>
            )}
          </div>
        </div>

        {/* Safezone Image Grid: วิ่งลูปดึงรูปภาพจากตาราง images ที่ผูกอยู่ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {safezones.map((item) => {
            // เช็คว่ารายการนี้มีรูปภาพในอาณาเขต images หรือไม่
            if (!item.images || item.images.length === 0) return null;

            return item.images.map((img) => (
              <div key={img.id} className="flex flex-col items-center p-4">
                <div className="w-full h-64 sm:h-72 overflow-hidden rounded-lg mb-4 bg-gray-50 shadow-sm">
                  <img 
                    src={getImageUrl(img.imageUrl)} 
                    alt={img.caption || item.title} 
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
                {/* แสดงชื่อภาพจาก caption หรือ title หลัก */}
                <h3 className="text-lg font-bold text-gray-800 tracking-wide text-center">
                  {img.caption || item.title}
                </h3>
              </div>
            ));
          })}
        </div>

      </div>
    </div>
  );
}