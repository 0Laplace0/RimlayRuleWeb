const Pagination = ({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  indexOfFirstItem, 
  indexOfLastItem, 
  totalItems 
}) => {
  if (totalItems === 0) return null;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 px-2">
      <span className="text-xs text-gray-400">
        แสดงผล {indexOfFirstItem + 1} ถึง {Math.min(indexOfLastItem, totalItems)} จากทั้งหมด {totalItems} รายการ
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-4 py-1.5 bg-[#1e293b] border border-indigo-950/60 hover:bg-indigo-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 text-xs font-bold rounded-lg transition cursor-pointer"
        >
          ก่อนหน้า
        </button>
        <span className="text-xs text-white px-2">
          หน้า {currentPage} จาก {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-4 py-1.5 bg-[#1e293b] border border-indigo-950/60 hover:bg-indigo-950/30 disabled:opacity-40 disabled:cursor-not-allowed text-indigo-300 text-xs font-bold rounded-lg transition cursor-pointer"
        >
          ถัดไป
        </button>
      </div>
    </div>
  );
};

export default Pagination;