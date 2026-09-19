import { useState, useEffect } from 'react';
import axios from 'axios';

const Banner = ({ altText = "Banner Image" }) => {
  const [imageUrl, setImageUrl] = useState('');
  const defaultBanner = "https://via.placeholder.com/1200x400?text=Default+Banner";
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  useEffect(() => {
    const fetchBanner = async () => {
      try {
        const res = await axios.get(`${API_URL}/banners`);
        if (res.data && res.data.length > 0) {
          const latestBanner = res.data[0];
          if (latestBanner.imageUrl) {
            const serverOrigin = API_URL.replace('/api', '');
            setImageUrl(`${serverOrigin}${latestBanner.imageUrl}`);
          }
        }
      } catch (err) {
        console.error('Failed to fetch banner inside component:', err);
      }
    };

    fetchBanner();
  }, [API_URL]);

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