import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { swalUtils } from '@/utils/swalUtils.js';

import ActivityRulesCRUD from '@/components/backoffice/ActivityRulesCRUD';
import ActivityLog from '@/components/backoffice/ActivityLog';

const Backoffice = () => {
  const [activeMenu, setActiveMenu] = useState('ActivityRules');

  const sidebarMenus = [
    { id: 'ActivityRules', name: '- จัดการกฎกิจกรรม -' },
    { id: 'ActivityLog', name: '- Realtime Activity Log -' },
  ];

  const handleLogout = async () => {
    try {
      const result = await swalUtils.confirm(
        'ยืนยันการออกจากระบบ?',
        'คุณต้องการออกจากระบบ Backoffice ใช่หรือไม่'
      );
      const isConfirmed = typeof result === 'object' ? result.isConfirmed : result;

      if (isConfirmed === true) {
        swalUtils.success('ออกจากระบบแล้ว!', 'คุณได้ออกจากระบบเรียบร้อยแล้ว');
      } else {
        return;
      }
    } catch (error) {
      swalUtils.success('ออกจากระบบแล้ว!', 'คุณได้ออกจากระบบเรียบร้อยแล้ว');
    }
  };

  const renderContent = () => {
    switch (activeMenu) {
      case 'ActivityRules':
        return <ActivityRulesCRUD />;
      case 'ActivityLog':
        return <ActivityLog />;
      default:
        return (
          <div className="text-center py-24 text-gray-500">
            <h3 className="text-purple-300 font-bold mb-1">ไม่พบเมนูจัดการนี้</h3>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#0d0d11] text-white flex flex-col w-full">
      <Navbar />

      <div className="flex-1 w-full max-w-full px-6 py-8 flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-[#0b0b0d] border border-purple-950/60 rounded-lg overflow-hidden shadow-2xl">
            <div className="bg-[#181125] border-b border-purple-950/60 px-4 py-3 text-center">
              <span className="font-bold text-purple-300 tracking-wide text-sm">Home</span>
            </div>
            
            <nav className="flex flex-col">
              {sidebarMenus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setActiveMenu(menu.id)}
                  className={`w-full py-3 px-4 text-xs font-semibold text-center border-b border-purple-950/20 transition-all duration-300 cursor-pointer ${
                    activeMenu === menu.id
                      ? 'bg-purple-600/10 text-purple-400 border-r-4 border-r-purple-500'
                      : 'text-gray-400 hover:bg-[#121217] hover:text-purple-300'
                  }`}
                >
                  {menu.name}
                </button>
              ))}
              
              {/* ปุ่มออกจากระบบเรียกใช้งาน handleLogout */}
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 text-xs font-semibold text-center text-rose-400 bg-rose-950/10 hover:bg-rose-950/20 transition-all duration-300 cursor-pointer"
              >
                - ออกจากระบบ -
              </button>
            </nav>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 bg-[#0b0b0d] border border-purple-950/60 rounded-lg p-6 md:p-8 shadow-2xl min-h-[600px] overflow-hidden">
          {renderContent()}
        </main>

      </div>
    </div>
  );
};

export default Backoffice;