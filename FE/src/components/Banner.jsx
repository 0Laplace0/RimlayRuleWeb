import { useState, useEffect } from 'react';
import axios from 'axios';

const Banner = ({ 
  altText = "Banner Image", 
  manageGlobalBackground = false, // true ถ้าต้องการให้ Component นี้เปลี่ยน bg ของทั้งหน้าเว็บให้อัตโนมัติ
  fallbackBgColor = "#0f172a" 
}) => {
  const [imageUrl, setImageUrl] = useState('');
  const [bgUrl, setBgUrl] = useState('');
  
  const defaultBanner = "https://via.placeholder.com/1200x400?text=Default+Banner";
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchBannerAndBg = async () => {
      try {
        const res = await axios.get(`${API_URL}/banners`);
        if (res.data) {
          const item = Array.isArray(res.data) 
            ? res.data[0] 
            : (res.data.data?.[0] || res.data);

          if (item) {
            const serverOrigin = API_URL.replace('/api', '');
            
            // จัดการ Banner URL
            const rawBanner = item.imageUrl || item.bannerUrl;
            if (rawBanner) {
              setImageUrl(`${serverOrigin}${rawBanner}`);
            }

            // จัดการ Background URL
            const rawBg = item.bgUrl || item.backgroundUrl;
            if (rawBg) {
              const fullBg = `${serverOrigin}${rawBg}`;
              setBgUrl(fullBg);

              // ถ้าเปิดให้จัดการพื้นหลังทั้งเว็บ (Body) อัตโนมัติ
              if (manageGlobalBackground) {
                document.body.style.backgroundImage = `linear-gradient(rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.9)), url(${fullBg})`;
                document.body.style.backgroundSize = 'cover';
                document.body.style.backgroundPosition = 'center';
                document.body.style.backgroundAttachment = 'fixed';
              }
            } else if (manageGlobalBackground) {
              document.body.style.backgroundColor = fallbackBgColor;
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch banner and background inside component:', err);
      }
    };

    fetchBannerAndBg();

    // Cleanup style เมื่อ unmount (ถ้าต้องการรีเซ็ต)
    return () => {
      if (manageGlobalBackground) {
        document.body.style.backgroundImage = '';
      }
    };
  }, [API_URL, manageGlobalBackground, fallbackBgColor]);

  return (
    <div className="relative w-full h-[280px] sm:h-[350px] md:h-[420px] overflow-hidden bg-gray-900">
      {/* 1. ภาพ Banner ที่โหลดอัตโนมัติจาก API */}
      <img
        src={imageUrl || defaultBanner}
        alt={altText}
        className="w-full h-full object-cover object-center transition-all duration-300"
      />

      {/* 2. Layer ไล่ระดับสีขาว (Gradient Fade to White) ด้านล่าง */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-white pointer-events-none" />
    </div>
  );
};

export default Banner;