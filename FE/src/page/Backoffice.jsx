import { useState } from 'react';
import Navbar from '@/components/Navbar';
import { swalUtils } from '@/utils/swalUtils.js';

import ActivityRulesCRUD from '@/components/backoffice/ActivityRulesCRUD';
import CountryRulesCRUD from '@/components/backoffice/CountryRulesCRUD';
import RoleplayRulesCRUD from '@/components/backoffice/RoleplayRulesCRUD';
import TermsRulesCRUD from '@/components/backoffice/TermsRulesCRUD';
import RefundRulesCRUD from '@/components/backoffice/RefundRulesCRUD';
import ActivityLog from '@/components/backoffice/ActivityLog';

const Backoffice = () => {
  const [activeMenu, setActiveMenu] = useState('RoleplayRules');

  const sidebarMenus = [
    { id: 'CountryRules', name: '- จัดการกฎประเทศ -' },
    { id: 'ActivityRules', name: '- จัดการกฎกิจกรรม -' },
    { id: 'RoleplayRules', name: '- จัดการกฎ Roleplay -' },
    { id: 'TermsRules', name: '- จัดการ Terms & Conditions -' },
    { id: 'RefundRules', name: '- จัดการ Refund Policy -' },
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
        localStorage.removeItem('token');
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
      case 'CountryRules':
        return <CountryRulesCRUD />;
      case 'ActivityRules':
        return <ActivityRulesCRUD />;
      case 'RoleplayRules':
        return <RoleplayRulesCRUD />;
      case 'TermsRules':
        return <TermsRulesCRUD />;
      case 'RefundRules':
        return <RefundRulesCRUD />;
      case 'ActivityLog':
        return <ActivityLog />;
      default:
        return (
          <div className="text-center py-24 text-gray-500">
            <h3 className="text-blue-400 font-bold mb-1">ไม่พบเมนูจัดการนี้</h3>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-white flex flex-col w-full">
      <Navbar />

      <div className="flex-1 w-full max-w-full px-6 py-8 flex flex-col lg:flex-row gap-6">
        
        {/* SIDEBAR */}
        <aside className="w-full lg:w-64 shrink-0">
          <div className="bg-[#0f172a]/90 border border-indigo-950/60 rounded-xl overflow-hidden shadow-2xl">
            <div className="bg-[#1e293b]/70 border-b border-indigo-950/60 px-4 py-3 text-center">
              <span className="font-bold text-blue-400 tracking-wide text-sm">Home</span>
            </div>
            
            <nav className="flex flex-col">
              {sidebarMenus.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setActiveMenu(menu.id)}
                  className={`w-full py-3 px-4 text-xs font-semibold text-center border-b border-indigo-950/30 transition-all duration-300 cursor-pointer ${
                    activeMenu === menu.id
                      ? 'bg-blue-600/15 text-blue-400 border-r-4 border-r-blue-500 font-bold'
                      : 'text-gray-400 hover:bg-[#1e293b]/40 hover:text-blue-300'
                  }`}
                >
                  {menu.name}
                </button>
              ))}
              
              {/* ปุ่มออกจากระบบ */}
              <button
                onClick={handleLogout}
                className="w-full py-3 px-4 text-xs font-semibold text-center text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all duration-300 cursor-pointer"
              >
                - ออกจากระบบ -
              </button>
            </nav>
          </div>
        </aside>

        {/* CONTENT AREA */}
        <main className="flex-1 bg-[#0b0e17] border border-indigo-950/60 rounded-xl p-6 md:p-8 shadow-2xl min-h-[600px] overflow-hidden">
          {renderContent()}
        </main>

      </div>
    </div>
  );
};

export default Backoffice;