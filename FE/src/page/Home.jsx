import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full relative overflow-x-hidden">
      <Navbar />

      {/* Hero Section */}
      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-16 flex flex-col items-center justify-center text-center">
        
        {/* ป้ายประกาศต้อนรับเล็กๆ */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-500/30 text-purple-300 text-xs font-semibold mb-6 animate-pulse">
          <span className="w-2 h-2 rounded-full bg-purple-400"></span>
          ยินดีต้อนรับสู่คอมมูนิตี้ของเรา
        </div>

        {/* หัวข้อหลัก */}
        <h1 className="text-4xl md:text-6xl font-black tracking-wider text-white leading-tight">
          RIMLAY <span className="text-purple-400">ROLEPLAY</span>
        </h1>

        <p className="mt-6 text-base md:text-lg text-gray-400 max-w-2xl leading-relaxed">
          สัมผัสประสบการณ์การเล่นเกมแนว Roleplay รูปแบบใหม่ กฎระเบียบชัดเจน ระบบเสถียร 
          และคอมมูนิตี้ที่เป็นกันเอง พร้อมให้คุณมาร่วมสร้างเรื่องราวไปกับเราแล้ววันนี้
        </p>

        {/* ปุ่มกดนำทาง */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link 
            to="/country-rules" 
            className="px-8 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-lg shadow-purple-900/50 transition-all duration-300 hover:-translate-y-0.5"
          >
            อ่านกฎประเทศ
          </Link>
          
          <Link 
            to="/rules" 
            className="px-8 py-3 rounded-xl bg-[#14121a] hover:bg-[#1a1724] border border-purple-900/60 text-purple-300 font-bold transition-all duration-300 hover:-translate-y-0.5"
          >
            กฎระเบียบและกิจกรรม
          </Link>
        </div>

        {/* การ์ดฟีเจอร์ย่อยด้านล่าง (ตัวอย่างเนื้อหา) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-20 max-w-5xl">
          <div className="bg-[#121019] border border-purple-950/80 p-6 rounded-2xl text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">01</div>
            <h3 className="text-lg font-bold text-purple-200">ระบบเสถียร</h3>
            <p className="text-sm text-gray-400">เซิร์ฟเวอร์เปิดให้บริการตลอด 24 ชั่วโมง พร้อมทีมงานดูแลอย่างใกล้ชิด</p>
          </div>

          <div className="bg-[#121019] border border-purple-950/80 p-6 rounded-2xl text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">02</div>
            <h3 className="text-lg font-bold text-purple-200">กฎระเบียบชัดเจน</h3>
            <p className="text-sm text-gray-400">ระบบการจัดการและบทลงโทษโปร่งใส ตรวจสอบได้ง่ายผ่านหน้าเว็บไซต์</p>
          </div>

          <div className="bg-[#121019] border border-purple-950/80 p-6 rounded-2xl text-left space-y-2">
            <div className="w-10 h-10 rounded-xl bg-purple-900/40 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">03</div>
            <h3 className="text-lg font-bold text-purple-200">คอมมูนิตี้อบอุ่น</h3>
            <p className="text-sm text-gray-400">พบปะเพื่อนใหม่และสร้างสรรค์บทบาทตัวละครในแบบที่คุณต้องการ</p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Home;