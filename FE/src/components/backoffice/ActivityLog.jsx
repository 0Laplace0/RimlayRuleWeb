import { useState, useMemo } from 'react';
import { Download, X, Filter, ChevronDown } from 'lucide-react';
import * as XLSX from 'xlsx';

// Mock Data ข้อมูล Log กิจกรรมทั้งหมดในระบบ
const initialLogs = [
  {
    id: 'LOG-1009',
    user: 'ShadowSlayer99',
    action: 'PURCHASE',
    detail: 'สั่งซื้อ Mechanical Keyboard RGB (1 ชิ้น)',
    category: 'SHOP_CASH',
    amount: '-150 Cash',
    timestamp: '2026-07-21 17:45:12',
    status: 'SUCCESS',
    ip: '182.52.41.12'
  },
  {
    id: 'LOG-1008',
    user: 'GodlikeWhale',
    action: 'EXCHANGE',
    detail: 'แลกของขวัญ Golden Cat Condo (1 ชิ้น)',
    category: 'SHOP_POINTS',
    amount: '-1,200 Points',
    timestamp: '2026-07-21 17:42:05',
    status: 'SUCCESS',
    ip: '110.168.22.99'
  },
  {
    id: 'LOG-1007',
    user: 'CyberGamer_TH',
    action: 'TOPUP',
    detail: 'เติมเงินเข้าระบบผ่าน PromptPay',
    category: 'TOPUP',
    amount: '+500 Cash',
    timestamp: '2026-07-21 17:30:00',
    status: 'SUCCESS',
    ip: '49.229.102.5'
  },
  {
    id: 'LOG-1006',
    user: 'NeonViper',
    action: 'LOGIN',
    detail: 'เข้าสู่ระบบสำเร็จ',
    category: 'AUTH',
    amount: '-',
    timestamp: '2026-07-21 17:15:40',
    status: 'SUCCESS',
    ip: '171.96.180.44'
  },
  {
    id: 'LOG-1005',
    user: 'UnknownUser',
    action: 'LOGIN_FAILED',
    detail: 'พยายามเข้าสู่ระบบ (รหัสผ่านไม่ถูกต้อง)',
    category: 'AUTH',
    amount: '-',
    timestamp: '2026-07-21 17:10:12',
    status: 'FAILED',
    ip: '27.55.78.210'
  },
  {
    id: 'LOG-1004',
    user: 'KuroNeko',
    action: 'PURCHASE',
    detail: 'สั่งซื้อ Wireless Gaming Mouse (1 ชิ้น)',
    category: 'SHOP_CASH',
    amount: '-90 Cash',
    timestamp: '2026-07-21 16:55:22',
    status: 'SUCCESS',
    ip: '180.183.12.3'
  },
  {
    id: 'LOG-1003',
    user: 'ShadowSlayer99',
    action: 'LOGIN',
    detail: 'เข้าสู่ระบบสำเร็จ',
    category: 'AUTH',
    amount: '-',
    timestamp: '2026-07-21 16:40:00',
    status: 'SUCCESS',
    ip: '182.52.41.12'
  }
];

const ActivityLog = () => {
  const [logs] = useState(initialLogs);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');

  // State สำหรับ Modal Export
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportCategory, setExportCategory] = useState('ALL');
  const [activePeriod, setActivePeriod] = useState('Daily');
  const [subFilter, setSubFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ดึงตัวเลือกสำหรับ Sub-filter ตาม Period จากข้อมูล Log จริง
  const getFilteredOptions = () => {
    if (activePeriod === 'Daily') {
      const dates = [...new Set(logs.map(log => log.timestamp.split(' ')[0]))];
      return dates.map(d => ({ label: d, value: d }));
    }
    if (activePeriod === 'Monthly') {
      const months = [...new Set(logs.map(log => log.timestamp.substring(0, 7)))];
      return months.map(m => ({ label: m, value: m }));
    }
    if (activePeriod === 'Yearly') {
      const years = [...new Set(logs.map(log => log.timestamp.substring(0, 4)))];
      return years.map(y => ({ label: y, value: y }));
    }
    if (activePeriod === 'Quarter') {
      // ตัวอย่างจำลองไตรมาสจากข้อมูล
      return [
        { label: 'Q3/2026', value: '2026-07' },
        { label: 'Q2/2026', value: '2026-04' }
      ];
    }
    return [];
  };

  // ฟังก์ชันดาวน์โหลด Excel จริง
  const handleExport = () => {
    let dataToExport = logs;

    // 1. กรองตามประเภทข้อมูล (Category) ใน Export Modal
    if (exportCategory !== 'ALL') {
      dataToExport = dataToExport.filter(log => log.category === exportCategory);
    }

    // 2. กรองตามระยะเวลา (Period & Sub-filter)
    if (subFilter) {
      dataToExport = dataToExport.filter(log => log.timestamp.startsWith(subFilter));
    }

    // 3. แปลงโครงสร้างข้อมูลให้พร้อมออกรายงาน Excel
    const formattedData = dataToExport.map(log => ({
      'Log ID': log.id,
      'เวลา (Timestamp)': log.timestamp,
      'ประเภท': log.category,
      'ผู้ใช้งาน': log.user,
      'IP Address': log.ip,
      'รายละเอียดกิจกรรม': log.detail,
      'จำนวน/มูลค่า': log.amount,
      'สถานะ': log.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Activity Logs');

    const fileName = `System_Logs_${exportCategory}_${activePeriod}${subFilter ? `_${subFilter}` : ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setIsModalOpen(false);
  };

  // ฟิลเตอร์ข้อมูลตามการค้นหาและหมวดหมู่หลักในหน้าจอ
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchesSearch =
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === 'ALL' || log.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, filterCategory]);

  // Badge แสดงประเภทกิจกรรม
  const renderCategoryBadge = (category) => {
    switch (category) {
      case 'AUTH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">AUTH</span>;
      case 'TOPUP':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">TOPUP</span>;
      case 'SHOP_CASH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">SHOP (CASH)</span>;
      case 'SHOP_POINTS':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">POINTS SHOP</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">OTHER</span>;
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      {/* Header & Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-950/60 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-purple-300 tracking-wide">REALTIME USER ACTIVITY LOG</h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">บันทึกประวัติพฤติกรรมผู้ใช้ในระบบแบบเรียลไทม์</p>
        </div>

        {/* Quick Stats & Export Button */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="bg-[#121217] px-3 py-1.5 rounded-lg border border-purple-900/30 text-gray-300">
            รายการทั้งหมด: <span className="font-bold text-purple-400">{logs.length}</span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" /> Export Workbook
          </button>
        </div>
      </div>

      {/* --- EXPORT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#151125] border border-purple-900/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-purple-950/40 pb-4">
              <div className="flex items-center gap-2.5">
                <Filter className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Export Log Workbook (XLSX)</h3>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-400 hover:text-white p-2 bg-purple-950/30 rounded-xl cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 1. Category Filter Selection */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category Type</p>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'ALL', label: 'ทั้งหมด' },
                  { id: 'AUTH', label: 'AUTH' },
                  { id: 'TOPUP', label: 'TOPUP' },
                  { id: 'SHOP_CASH', label: 'SHOP (CASH)' },
                  { id: 'SHOP_POINTS', label: 'POINTS SHOP' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setExportCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      exportCategory === cat.id
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-600/30'
                        : 'bg-transparent text-gray-400 border-purple-900 hover:border-purple-700'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 2. Period Selection */}
            <div className="space-y-3">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Period</p>
              <div className="flex gap-2">
                {['Daily', 'Monthly', 'Yearly', 'Quarter'].map(p => (
                  <button 
                    key={p} 
                    onClick={() => { setActivePeriod(p); setSubFilter(''); setIsDropdownOpen(false); }} 
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                      activePeriod === p ? 'bg-white text-black border-white' : 'bg-transparent text-gray-400 border-purple-900 hover:border-purple-700'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. Custom Dropdown Sub-Filter (ขอบมน) */}
            <div className="space-y-3 relative">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Select {activePeriod === 'Yearly' ? 'Year' : activePeriod === 'Quarter' ? 'Quarter' : activePeriod === 'Monthly' ? 'Month' : 'Date'}
              </p>
              
              <div 
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full bg-[#1c192d] border border-purple-900/50 text-white rounded-2xl p-4 text-sm flex justify-between items-center cursor-pointer hover:border-emerald-500/50 transition-all"
              >
                <span>{subFilter || '-- เลือกทั้งหมด --'}</span>
                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </div>
              
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-[#1c192d] border border-purple-900/50 rounded-2xl p-2 z-50 shadow-2xl max-h-52 overflow-y-auto">
                  <div 
                    onClick={() => { setSubFilter(''); setIsDropdownOpen(false); }} 
                    className={`p-3 hover:bg-emerald-600/20 rounded-xl cursor-pointer text-sm ${!subFilter ? 'text-emerald-400 font-bold' : 'text-gray-300'}`}
                  >
                    -- เลือกทั้งหมด --
                  </div>
                  {getFilteredOptions().map((opt, i) => (
                    <div 
                      key={i} 
                      onClick={() => { setSubFilter(opt.value); setIsDropdownOpen(false); }} 
                      className={`p-3 hover:bg-emerald-600/20 rounded-xl cursor-pointer text-sm ${subFilter === opt.value ? 'text-emerald-400 font-bold bg-emerald-600/10' : 'text-gray-300'}`}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4 border-t border-purple-950/40">
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="flex-1 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleExport} 
                className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg cursor-pointer"
              >
                Export XLSX
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {[
            { id: 'ALL', label: 'ทั้งหมด' },
            { id: 'AUTH', label: 'Login / Logout' },
            { id: 'TOPUP', label: 'เติมเงิน' },
            { id: 'SHOP_CASH', label: 'ร้านค้า (Cash)' },
            { id: 'SHOP_POINTS', label: 'ร้านสะสม (Points)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                filterCategory === tab.id
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                  : 'bg-[#121217] text-gray-400 hover:text-purple-300 border border-purple-950/40'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="w-full md:w-64">
          <input
            type="text"
            placeholder="ค้นหาชื่อผู้ใช้, รายละเอียด..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#121217] border border-purple-950/60 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 transition-colors"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-[#121217] rounded-lg border border-purple-950/60 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#181125] text-purple-300 text-[11px] font-bold uppercase tracking-wider border-b border-purple-950/80">
                <th className="py-3 px-4">เวลา</th>
                <th className="py-3 px-4">ประเภท</th>
                <th className="py-3 px-4">ผู้ใช้งาน</th>
                <th className="py-3 px-4">รายละเอียดกิจกรรม</th>
                <th className="py-3 px-4 text-right">จำนวน/มูลค่า</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950/30 text-xs">
              {filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-purple-900/10 transition-colors duration-150">
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap font-mono text-[11px]">
                      {log.timestamp}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderCategoryBadge(log.category)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-200">
                      {log.user}
                      <span className="block text-[10px] text-gray-500 font-mono">{log.ip}</span>
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {log.detail}
                    </td>
                    <td className={`py-3 px-4 text-right font-mono font-semibold whitespace-nowrap ${
                      log.amount.startsWith('+') ? 'text-emerald-400' : log.amount.startsWith('-') ? 'text-rose-400' : 'text-gray-500'
                    }`}>
                      {log.amount}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          สำเร็จ
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                          ล้มเหลว
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    ไม่พบข้อมูล Log กิจกรรมตามเงื่อนไขที่ค้นหา
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ActivityLog;