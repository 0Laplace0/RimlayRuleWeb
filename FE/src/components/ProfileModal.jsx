import { useState } from 'react';
import { swalUtils } from '../utils/swalUtils.js';

const ProfileModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('purchase'); // 'topup' | 'purchase' | 'redeem'
  const [redeemCode, setRedeemCode] = useState('');

  // ข้อมูลโปรไฟล์ผู้ใช้
  const [userData, setUserData] = useState({
    username: 'Tomorrow Dev',
    registerDate: '9 สิงหาคม 2567',
    cash: 31990,
    totalTopup: 32000,
    points: 10000,
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200',
  });

  // ประวัติการเติมเงิน
  const topupHistory = [
    { date: '9 สิงหาคม 2567', amount: '฿32,000', method: 'PromptPay QR' },
    { date: '1 สิงหาคม 2567', amount: '฿500', method: 'TrueMoney Wallet' },
  ];

  // ประวัติการสั่งซื้อ
  const purchaseHistory = [
    { date: '9 สิงหาคม 2567', product: 'Example_Product', amount: 10, totalPrice: '฿5,000' },
    { date: '8 สิงหาคม 2567', product: 'VIP Gaming Chair', amount: 1, totalPrice: '฿3,500' },
  ];

  if (!isOpen) return null;

  // 🚪 ฟังก์ชันออกจากระบบ
  const handleLogout = async () => {
    const isConfirmed = await swalUtils.confirm?.(
      'ยืนยันการออกจากระบบ?',
      'คุณต้องการออกจากระบบใช่หรือไม่'
    );
    if (isConfirmed || isConfirmed === undefined) {
      await swalUtils.success?.('ออกจากระบบสำเร็จ!', 'คุณได้ออกจากระบบเรียบร้อยแล้ว');
      onClose();
    }
  };

  // ฟังก์ชันกรอกโค้ด
  const handleRedeem = (e) => {
    e.preventDefault();
    const code = redeemCode.trim().toUpperCase();

    if (!code) {
      swalUtils.error?.('กรุณากรอกโค้ด', 'โปรดระบุโค้ดรับรางวัลก่อนกดยืนยัน');
      return;
    }

    if (code === 'RIMLAY2026' || code === 'TODAY2026') {
      const addedCash = 500;
      setUserData((prev) => ({
        ...prev,
        cash: prev.cash + addedCash,
        totalTopup: prev.totalTopup + addedCash,
      }));
      swalUtils.success?.('แลกโค้ดสำเร็จ!', `คุณได้รับ ฿${addedCash} เข้าระบบเรียบร้อยแล้ว`);
      setRedeemCode('');
    } else {
      swalUtils.error?.('โค้ดไม่ถูกต้อง', 'รหัสโค้ดนี้ไม่ถูกต้อง หรือถูกใช้งานไปแล้ว');
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="w-full max-w-3xl space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* 🟪 กล่องบน: ข้อมูลโปรไฟล์หลัก (Theme ม่วง) */}
        <div className="bg-[#120e1d] border border-purple-500/30 rounded-xl p-6 md:p-8 shadow-2xl shadow-purple-950/40 relative mt-8 sm:mt-0">
          
          {/* ปุ่มปิด Popup */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/20 border border-red-500/50 text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 flex items-center justify-center text-sm font-bold shadow-md hover:shadow-red-500/40 z-10 cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            ✕
          </button>

          {/* Header: รูปโปรไฟล์ + ชื่อผู้ใช้ + ปุ่มออกจากระบบ */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pt-4 sm:pt-0">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full overflow-hidden border-2 border-purple-500/60 shadow-lg shadow-purple-500/20 shrink-0">
                <img 
                  src={userData.avatar} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-wide">
                {userData.username}
              </h2>
            </div>

            {/* ปุ่มออกจากระบบ (สีแดง + ไอคอน Logout) */}
            <button
              onClick={handleLogout}
              className="flex items-center space-x-2 px-4 py-2 border border-red-500/60 bg-red-500/10 rounded-lg text-xs font-semibold text-red-400 hover:bg-red-600 hover:text-white transition-all duration-200 cursor-pointer self-end sm:self-center sm:mr-8 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>ออกจากระบบ</span>
            </button>
          </div>

          {/* รายละเอียดโปรไฟล์ (เปลี่ยนตัวหนังสือเน้นเป็นสีม่วงม่วงสว่าง) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-8 text-sm">
            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">จำนวนเงิน:</p>
                <p className="text-purple-400 font-bold text-base sm:text-lg">฿{userData.cash.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">คะแนนสะสม:</p>
                <p className="text-purple-400 font-bold text-base sm:text-lg">{userData.points.toLocaleString()} points</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-gray-400 text-xs mb-1">วันที่สมัคร:</p>
                <p className="text-purple-400 font-bold text-base sm:text-lg">{userData.registerDate}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">ยอดการเติม:</p>
                <p className="text-purple-400 font-bold text-base sm:text-lg">฿{userData.totalTopup.toLocaleString()}</p>
              </div>
            </div>
          </div>

        </div>

        {/* กล่องล่าง: ประวัติย้อนหลัง & ระบบกรอกโค้ด */}
        <div className="bg-[#120e1d] border border-purple-500/30 rounded-xl p-6 md:p-8 shadow-2xl shadow-purple-950/40 space-y-6">
          
          {/* หัวข้อแท็บ (เส้นใต้ม่วง) */}
          <div className="flex border-b border-gray-800 gap-8 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setActiveTab('topup')}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === 'topup' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              ประวัติการเติมเงิน
              {activeTab === 'topup' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 shadow-sm shadow-purple-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('purchase')}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === 'purchase' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              ประวัติการสั่งซื้อ
              {activeTab === 'purchase' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 shadow-sm shadow-purple-500"></span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('redeem')}
              className={`pb-3 text-sm font-bold transition-all relative whitespace-nowrap cursor-pointer ${
                activeTab === 'redeem' ? 'text-purple-400' : 'text-gray-400 hover:text-white'
              }`}
            >
              กรอกโค้ดรับรางวัล
              {activeTab === 'redeem' && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-purple-500 shadow-sm shadow-purple-500"></span>
              )}
            </button>
          </div>
          
          {/* TAB 1: ประวัติการเติมเงิน */}
          {activeTab === 'topup' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="py-3 px-2 font-medium">วันที่</th>
                    <th className="py-3 px-2 font-medium">จำนวนเงิน</th>
                    <th className="py-3 px-2 font-medium text-right">ช่องทาง</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-gray-200">
                  {topupHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-500/5 transition-colors">
                      <td className="py-3 px-2">{item.date}</td>
                      <td className="py-3 px-2 text-purple-400 font-semibold">{item.amount}</td>
                      <td className="py-3 px-2 text-right text-gray-400">{item.method}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 2: ประวัติการสั่งซื้อ */}
          {activeTab === 'purchase' && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead>
                  <tr className="text-gray-400 border-b border-gray-800">
                    <th className="py-3 px-2 font-medium">วันที่</th>
                    <th className="py-3 px-2 font-medium">สินค้า</th>
                    <th className="py-3 px-2 font-medium text-center">จำนวน</th>
                    <th className="py-3 px-2 font-medium text-right">ราคาทั้งหมด</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50 text-gray-200">
                  {purchaseHistory.map((item, idx) => (
                    <tr key={idx} className="hover:bg-purple-500/5 transition-colors">
                      <td className="py-3 px-2">{item.date}</td>
                      <td className="py-3 px-2 font-medium">{item.product}</td>
                      <td className="py-3 px-2 text-center">{item.amount}</td>
                      <td className="py-3 px-2 text-right text-purple-400 font-semibold">{item.totalPrice}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: กรอกโค้ดรับรางวัล */}
          {activeTab === 'redeem' && (
            <form onSubmit={handleRedeem} className="space-y-4 pt-1">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="กรอกโค้ดรับรางวัล เช่น RIMLAY2026"
                  value={redeemCode}
                  onChange={(e) => setRedeemCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-[#181326] border border-purple-500/40 rounded-lg px-4 py-3 text-sm text-white placeholder-gray-500 uppercase tracking-wider font-mono focus:outline-none focus:border-purple-500 transition-colors"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm rounded-lg transition-all shadow-md shadow-purple-600/30 cursor-pointer"
                >
                  แลกรับรางวัล
                </button>
              </div>
              <p className="text-xs text-gray-400">
                * ทดลองกรอกโค้ด: <span className="text-purple-400 font-mono cursor-pointer underline" onClick={() => setRedeemCode('RIMLAY2026')}>RIMLAY2026</span>
              </p>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default ProfileModal;