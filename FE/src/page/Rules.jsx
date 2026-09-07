import { useState } from 'react';
import Navbar from '../components/Navbar';

const Rules = () => {
  // 1. เปลี่ยน State เป็นการจัดการ Popup และ หมวดหมู่ที่ถูกเลือก
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const rulesCategories = [
    {
      id: 'guide',
      title: 'คำแนะนำ / SETTING NAME / REPORT',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
      rules: [
        { text: 'ต้องตั้งชื่อ-นามสกุล ใน Steam, Discord, FiveM ให้ตรงกับบัตรประชาชนในเกม[cite: 1]', allowed: true },
        { text: 'ชื่อ Steam ต้องเป็นภาษาอังกฤษเท่านั้น[cite: 1]', allowed: true },
        { text: 'ห้ามตั้งชื่อ Steam เป็นสัญลักษณ์หรืออักขระพิเศษ[cite: 1]', allowed: false },
        { text: 'ต้องส่งคลิปหลักฐานการ Report ความยาว 1 นาทีขึ้นไป (ก่อนเกิดเหตุ 30 วิ / หลังเกิดเหตุ 30 วิ) ภายใน 24 ชม.[cite: 1]', allowed: true },
        { text: 'ห้ามแจ้งผู้กระทำผิดแทนบุคคลอื่น (ต้องมาจากผู้ถูกกระทำโดยตรง)[cite: 1]', allowed: false },
      ]
    },
    {
      id: 'roleplay',
      title: 'ROLE PLAY & PROTECT NEWBIE',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      ),
      rules: [
        { text: 'ผู้เล่นทุกคนต้องศึกษาและปฏิบัติตามกฎของประเทศอย่างเคร่งครัด[cite: 1]', allowed: true },
        { text: 'อนุญาตให้สร้างสรรค์ Roleplay ตามบทบาทตัวละครได้อย่างอิสระภายใต้กฎ[cite: 1]', allowed: true },
        { text: 'ห้ามทำร้าย ปล้น หรืออุ้มผู้เล่นใหม่ที่อยู่ภายใต้สถานะการคุ้มครอง (Protect Newbie)', allowed: false },
        { text: 'ห้ามอ้างว่าไม่รู้กฎประเทศเมื่อกระทำความผิด[cite: 1]', allowed: false },
      ]
    },
    {
      id: 'metarule',
      title: 'META RULE กฎประเทศ',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h1.5a2.5 2.5 0 002.5-2.5V11a2 2 0 012-2h1.055M11 20.055V18a2 2 0 012-2h3.055M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      rules: [
        { text: 'ปฏิบัติตามหลัก Toxic 70/30 และใช้คำพูดเชิงสร้างสรรค์[cite: 1]', allowed: true },
        { text: 'ห้าม Meta Gaming (นำข้อมูล OC นอกเกมมาใช้ประโยชน์ในตัวละคร IC)', allowed: false },
        { text: 'ห้ามแขวะ บลัฟ หรือเหยียดเรื่องเพศ ศาสนา เชื้อชาติ รูปลักษณ์[cite: 1]', allowed: false },
        { text: 'ห้าม Sexual Harassment ทุกกรณี[cite: 1]', allowed: false },
        { text: 'ห้ามซื้อ-ขายสิ่งของในเกมเป็นเงินจริง (OC) นอกระบบ[cite: 1]', allowed: false },
      ]
    },
    {
      id: 'darkjob',
      title: 'กฎงานดำ & ขอบเขตการเล่น',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      rules: [
        { text: 'ดำเนินเรื่องราวงานดำได้ตามพื้นที่ที่กำหนดไว้', allowed: true },
        { text: 'ห้ามทำร้ายหรือปล้นขณะอีกฝ่ายใช้ตู้เซฟ/โต๊ะคราฟต์ใน Rebel (เว้นแต่มีสตอรี่นอกมาก่อน)[cite: 1]', allowed: false },
        { text: 'ห้ามนำรถเข้าไปจอดในเขตพื้นที่กั้นของ Rebel[cite: 1]', allowed: false },
        { text: 'ห้ามหนีคดีเข้า Safe Zone หรืออยู่นานเกิน 10 นาทีเพื่อรีเซ็ตเวลา[cite: 1]', allowed: false },
      ]
    },
    {
      id: 'robbery',
      title: 'กฎการปล้น & ขอบเขตโจร',
      icon: (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      rules: [
        { text: 'ทำการปล้นตามจำนวนคนที่กำหนดและอยู่ในพื้นที่ที่อนุญาต', allowed: true },
        { text: 'ห้ามทำการปล้น หรืออุ้มลักพาตัวในพื้นที่ Safe Zone[cite: 1]', allowed: false },
        { text: 'ห้ามปล้นหน่วยงาน (หมอ/ตำรวจ) ขณะกำลังปฏิบัติหน้าที่', allowed: false },
        { text: 'ห้ามปล้นทรัพย์สินจนหมดตัว ให้เหลือของจำเป็นไว้ให้ผู้ถูกปล้นดำรงชีวิต', allowed: false },
      ]
    }
  ];

  // 2. ฟังก์ชันเปิด-ปิด Popup
  const handleOpenModal = (category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    // หน่วงเวลาเล็กน้อยก่อนลบข้อมูลกันกระตุกตอนปิดแอนิเมชัน (ถ้ามี)
    setTimeout(() => setSelectedCategory(null), 200); 
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full relative">
      <Navbar />

      <div className="flex-1 w-full max-w-6xl mx-auto px-4 py-8 flex flex-col items-center">
        
        {/* หัวข้อใหญ่ */}
        <div className="text-center mb-10 mt-4">
          <h1 className="text-3xl md:text-4xl font-extrabold text-purple-300 tracking-wider">
            กฎประเทศ
          </h1>
          <div className="w-20 h-1 bg-purple-600 mx-auto mt-3 rounded-full"></div>
          <p className="mt-4 text-sm text-gray-400">คลิกที่หมวดหมู่เพื่ออ่านรายละเอียดกฎระเบียบ</p>
        </div>

        {/* 3. เมนูกริดกล่องสี่เหลี่ยม */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 w-full mb-8 max-w-5xl">
          {rulesCategories.map((item) => (
            <button
              key={item.id}
              onClick={() => handleOpenModal(item)}
              className="aspect-square p-4 rounded-xl border border-purple-950/60 bg-[#0b0b0d] flex flex-col items-center justify-center text-center transition-all duration-300 group hover:-translate-y-1 hover:bg-[#14121c] hover:border-purple-500 hover:shadow-lg hover:shadow-purple-900/40"
            >
              <div className="p-3 rounded-lg mb-4 bg-[#14121a] text-purple-500/70 transition-colors group-hover:bg-purple-600/20 group-hover:text-purple-400">
                {item.icon}
              </div>
              <span className="text-xs font-semibold leading-relaxed text-gray-400 group-hover:text-purple-200 px-2 line-clamp-2">
                {item.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* ========================================= */}
      {/* 4. ส่วนของ POPUP (MODAL) */}
      {/* ========================================= */}
      {isModalOpen && selectedCategory && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm transition-opacity">
          
          {/* ฉากหลังสำหรับคลิกเพื่อปิด */}
          <div 
            className="absolute inset-0" 
            onClick={handleCloseModal}
          ></div>

          {/* กล่อง Popup */}
          <div className="relative w-full max-w-2xl bg-[#0b0b0d] border border-purple-900/50 rounded-2xl shadow-2xl flex flex-col max-h-[85vh] animate-[fadeIn_0.2s_ease-out]">
            
            {/* Header Popup */}
            <div className="bg-[#14121a] p-5 border-b border-purple-900/50 rounded-t-2xl flex items-center justify-between sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <div className="text-purple-400">
                  {selectedCategory.icon}
                </div>
                <h2 className="text-lg md:text-xl font-bold text-purple-300">
                  {selectedCategory.title}
                </h2>
              </div>
              
              {/* ปุ่ม X ปิด Popup */}
              <button 
                onClick={handleCloseModal}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-rose-500/20 hover:border-rose-500/50 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* เนื้อหาภายใน Popup (เลื่อน Scrollbar ได้ถ้ากฎยาว) */}
            <div className="p-6 overflow-y-auto">
              <ul className="space-y-3">
                {selectedCategory.rules.map((rule, index) => (
                  <li 
                    key={index} 
                    className="flex items-start bg-[#0d0d11]/80 p-4 rounded-xl border border-purple-950/30 text-gray-300 text-sm leading-relaxed hover:border-purple-900/50 transition-colors"
                  >
                    {rule.allowed ? (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-950/30 text-emerald-400 border border-emerald-900/50 font-black text-xs mr-4 shrink-0 mt-0.5">
                        ✓
                      </span>
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-950/30 text-rose-500 border border-rose-900/50 font-black text-xs mr-4 shrink-0 mt-0.5">
                        ✕
                      </span>
                    )}
                    <span className="pt-0.5">{rule.text}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            {/* Footer Popup */}
            <div className="p-4 bg-[#0a0a0d] border-t border-purple-900/50 rounded-b-2xl flex justify-end">
              <button 
                onClick={handleCloseModal}
                className="px-6 py-2 bg-purple-900/40 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-sm font-semibold transition-colors"
              >
                รับทราบ
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Rules;