import { useState, useMemo, useEffect, useCallback } from 'react';
import { Download, X, Filter, ChevronDown, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import axios from 'axios';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  // State สำหรับ Modal Export
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [exportCategory, setExportCategory] = useState('ALL');
  const [activePeriod, setActivePeriod] = useState('Daily');
  const [subFilter, setSubFilter] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // ฟังก์ชันดึงข้อมูลจาก Backend Real API
  const fetchLogs = useCallback(async (isManual = false) => {
    try {
      if (isManual) setRefreshing(true);
      const res = await axios.get(`${API_URL}/activity-logs`);
      const responseData = res.data.data || res.data;
      setLogs(Array.isArray(responseData) ? responseData : []);
    } catch (err) {
      console.error('Failed to fetch activity logs:', err);
    } finally {
      setLoading(false);
      if (isManual) setRefreshing(false);
    }
  }, [API_URL]);

  // Initial fetch & Realtime polling (ทุก 10 วินาที)
  useEffect(() => {
    fetchLogs();
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchLogs]);

  // ดึงตัวเลือกสำหรับ Sub-filter ตาม Period จากข้อมูล Log จริง
  const getFilteredOptions = () => {
    if (activePeriod === 'Daily') {
      const dates = [...new Set(logs.map(log => (log.timestamp || '').split(' ')[0]).filter(Boolean))];
      return dates.map(d => ({ label: d, value: d }));
    }
    if (activePeriod === 'Monthly') {
      const months = [...new Set(logs.map(log => (log.timestamp || '').substring(0, 7)).filter(Boolean))];
      return months.map(m => ({ label: m, value: m }));
    }
    if (activePeriod === 'Yearly') {
      const years = [...new Set(logs.map(log => (log.timestamp || '').substring(0, 4)).filter(Boolean))];
      return years.map(y => ({ label: y, value: y }));
    }
    if (activePeriod === 'Quarter') {
      return [
        { label: 'Q3/2026', value: '2026-07' },
        { label: 'Q2/2026', value: '2026-04' }
      ];
    }
    return [];
  };

  // หมวดหมู่ทั้งหมดอ้างอิงจากเมนู Sidebar ครบทุก CRUD
  const categoriesList = [
    { id: 'ALL', label: 'ทั้งหมด' },
    { id: 'HOME', label: 'หน้าแรก' },
    { id: 'COUNTRY_RULES', label: 'กฎประเทศ' },
    { id: 'ACTIVITY_RULES', label: 'กฎกิจกรรม' },
    { id: 'ROLEPLAY_RULES', label: 'Roleplay' },
    { id: 'POLICE_RULES', label: 'กฎตำรวจ/ค่าปรับ' },
    { id: 'DOCTOR_RULES', label: 'กฎแพทย์/ค่ารักษา' },
    { id: 'COUNCIL_RULES', label: 'กฎสภา' },
    { id: 'TERMS_RULES', label: 'Terms & Conditions' },
    { id: 'REFUND_RULES', label: 'Refund Policy' },
    { id: 'STREAMING_RULES', label: 'Streaming Policy' },
    { id: 'SAFEZONE_RULES', label: 'Safezone' },
  ];

  // ฟังก์ชันดาวน์โหลด Excel จริง
  const handleExport = () => {
    let dataToExport = logs;

    if (exportCategory !== 'ALL') {
      dataToExport = dataToExport.filter(log => log.category === exportCategory);
    }

    if (subFilter) {
      dataToExport = dataToExport.filter(log => (log.timestamp || '').startsWith(subFilter));
    }

    const formattedData = dataToExport.map(log => ({
      'Log ID': log.id || '-',
      'เวลา (Timestamp)': log.timestamp || '-',
      'โมดูล (Module)': log.category || '-',
      'การกระทำ (Action)': log.action || '-',
      'ผู้ใช้งาน': log.user || '-',
      'IP Address': log.ip || '-',
      'รายละเอียดกิจกรรม': log.detail || '-',
      'สถานะ': log.status || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(formattedData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'CRUD Activity Logs');

    const fileName = `CRUD_Logs_${exportCategory}_${activePeriod}${subFilter ? `_${subFilter}` : ''}.xlsx`;
    XLSX.writeFile(workbook, fileName);

    setIsModalOpen(false);
  };

  // ฟิลเตอร์ข้อมูลตามการค้นหาและหมวดหมู่หลักในหน้าจอ
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const user = log.user || '';
      const detail = log.detail || '';
      const id = log.id || '';
      const action = log.action || '';
      const matchesSearch =
        user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        detail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        id.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        filterCategory === 'ALL' || log.category === filterCategory;

      return matchesSearch && matchesCategory;
    });
  }, [logs, searchTerm, filterCategory]);

  // Badge แสดงประเภทโมดูล CRUD ครบทุกเมนู
  const renderCategoryBadge = (category) => {
    switch (category) {
      case 'HOME':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/25 text-indigo-300 border border-indigo-500/40">หน้าแรก</span>;
      case 'COUNTRY_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/25 text-amber-300 border border-amber-500/40">กฎประเทศ</span>;
      case 'ACTIVITY_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/25 text-emerald-300 border border-emerald-500/40">กฎกิจกรรม</span>;
      case 'ROLEPLAY_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/25 text-purple-300 border border-purple-500/40">Roleplay</span>;
      case 'POLICE_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/25 text-blue-300 border border-blue-500/40">กฎตำรวจ</span>;
      case 'DOCTOR_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/25 text-cyan-300 border border-cyan-500/40">กฎแพทย์</span>;
      case 'COUNCIL_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-fuchsia-500/25 text-fuchsia-300 border border-fuchsia-500/40">กฎสภา</span>;
      case 'TERMS_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/25 text-slate-300 border border-slate-500/40">Terms</span>;
      case 'REFUND_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/25 text-rose-300 border border-rose-500/40">Refund</span>;
      case 'STREAMING_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violet-500/25 text-violet-300 border border-violet-500/40">Streaming</span>;
      case 'SAFEZONE_RULES':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-500/25 text-teal-300 border border-teal-500/40">Safezone</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-500/20 text-gray-400">{category || 'OTHER'}</span>;
    }
  };

  // Badge แสดง Action (CREATE, UPDATE, DELETE)
  const renderActionBadge = (action) => {
    switch (action) {
      case 'CREATE':
        return <span className="text-emerald-400 font-bold">+ CREATE</span>;
      case 'UPDATE':
        return <span className="text-amber-400 font-bold">~ UPDATE</span>;
      case 'DELETE':
        return <span className="text-rose-400 font-bold">- DELETE</span>;
      default:
        return <span className="text-gray-400">{action || 'EXEC'}</span>;
    }
  };

  return (
    <div className="w-full space-y-6 relative">
      {/* Header & Status Indicator */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-purple-950/60 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl font-bold text-purple-300 tracking-wide">BACKOFFICE CRUD ACTIVITY LOG</h2>
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">บันทึกประวัติการกระทำ CRUD ทุกเมนูหลังบ้านแบบเรียลไทม์</p>
        </div>

        {/* Quick Stats, Refresh & Export Button */}
        <div className="flex items-center space-x-3 text-xs">
          <button
            onClick={() => fetchLogs(true)}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#121217] hover:bg-purple-950/40 text-gray-300 rounded-lg border border-purple-900/30 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>รีเฟรช</span>
          </button>
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
          <div className="bg-[#151125] border border-purple-900/60 rounded-3xl p-6 w-full max-w-xl shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-purple-950/40 pb-4">
              <div className="flex items-center gap-2.5">
                <Filter className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Export CRUD Log Workbook (XLSX)</h3>
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
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Module Category</p>
              <div className="flex flex-wrap gap-2">
                {categoriesList.map((cat) => (
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
        {/* Filter Tabs (แสดงครบทุกโมดูล) */}
        <div className="flex flex-wrap gap-1.5 w-full md:w-auto">
          {categoriesList.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterCategory(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
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
            placeholder="ค้นหาชื่อผู้ใช้, action, รายละเอียด..."
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
                <th className="py-3 px-4">โมดูล</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">ผู้กระทำ</th>
                <th className="py-3 px-4">รายละเอียดกิจกรรม CRUD</th>
                <th className="py-3 px-4 text-center">สถานะ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-purple-950/30 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-16 text-gray-400">
                    กำลังโหลดข้อมูล CRUD Logs...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr key={log.id || Math.random()} className="hover:bg-purple-900/10 transition-colors duration-150">
                    <td className="py-3 px-4 text-gray-400 whitespace-nowrap font-mono text-[11px]">
                      {log.timestamp || '-'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {renderCategoryBadge(log.category)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-mono">
                      {renderActionBadge(log.action)}
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-200">
                      {log.user || 'Admin'}
                      {log.ip && <span className="block text-[10px] text-gray-500 font-mono">{log.ip}</span>}
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {log.detail || '-'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.status === 'SUCCESS' ? (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                          สำเร็จ
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-950/60 text-rose-400 border border-rose-800/40">
                          {log.status || 'ล้มเหลว'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-500">
                    ไม่พบข้อมูล CRUD Activity Log ตามเงื่อนไขที่ค้นหา
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