import React, { useState, useEffect } from 'react';
import { Search, ChevronLeft, ChevronRight, FileText, Loader2 } from 'lucide-react';
import { LogItem, DateFilter, PagedResponse } from '../types';
import { fetchLogs } from '../services/api';
import { LogDetailModal } from './LogDetailModal';

interface LogTableProps {
  filter: DateFilter;
}

export const LogTable: React.FC<LogTableProps> = ({ filter }) => {
  const [data, setData] = useState<PagedResponse<LogItem> | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [level, setLevel] = useState('All');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [selectedLog, setSelectedLog] = useState<LogItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setPage(1);
  }, [filter.startDate, filter.endDate]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const response = await fetchLogs({
          page,
          pageSize,
          level,
          search: debouncedSearch,
          startDate: filter.startDate || undefined,
          endDate: filter.endDate || undefined,
        });
        setData(response);
      } catch (error) {
        console.error('Log verileri getirilemedi:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [page, pageSize, level, debouncedSearch, filter.startDate, filter.endDate]);

  // NULL KORUMALI BADGE FONKSİYONU
  const getBadgeColor = (logLevel?: string | null) => {
    if (!logLevel) return 'bg-slate-50 text-slate-700 border-slate-200';
    switch (logLevel.toLowerCase()) {
      case 'info': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'warning': return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'error':
      case 'fatal': return 'bg-rose-50 text-rose-700 border-rose-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const handleRowClick = (log: LogItem) => {
    setSelectedLog(log);
    setIsModalOpen(true);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 mt-6">
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between gap-4">
        <h3 className="text-base font-semibold text-slate-800 flex items-center gap-2">
          <FileText className="text-blue-600" size={18} />
          Log İnceleme Tablosu
        </h3>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <select 
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
            value={level}
            onChange={(e) => { setLevel(e.target.value); setPage(1); }}
          >
            <option value="All">Tüm Seviyeler</option>
            <option value="Info">Info</option>
            <option value="Warning">Warning</option>
            <option value="Error">Error</option>
          </select>

          <div className="relative w-full sm:w-64">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Mesaj veya modül ara..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-1 focus:ring-blue-500"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto relative min-h-[320px]">
        {loading && (
          <div className="absolute inset-0 bg-white/60 z-10 flex items-center justify-center">
            <Loader2 className="animate-spin text-blue-600" size={28} />
          </div>
        )}
        
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 text-slate-500 text-xs font-semibold uppercase border-b border-slate-200">
              <th className="px-5 py-3.5">Tarih / Saat</th>
              <th className="px-5 py-3.5">Seviye</th>
              <th className="px-5 py-3.5">Modül</th>
              <th className="px-5 py-3.5">Mesaj</th>
              <th className="px-5 py-3.5 text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {data?.items && data.items.length > 0 ? (
              data.items.map((log) => (
                <tr key={log.id} onClick={() => handleRowClick(log)} className="hover:bg-blue-50/50 cursor-pointer transition-colors">
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-600 text-xs">
                    {/* NULL KORUMASI */}
                    {log.timestamp ? new Date(log.timestamp).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded-md text-xs font-semibold border ${getBadgeColor(log.level)}`}>
                      {/* NULL KORUMASI */}
                      {log.level || 'Unknown'}
                    </span>
                  </td>
                  {/* NULL KORUMALARI */}
                  <td className="px-5 py-3.5 whitespace-nowrap text-slate-700 font-medium text-xs">{log.module || '-'}</td>
                  <td className="px-5 py-3.5 text-slate-600 truncate max-w-sm text-xs">{log.message || '-'}</td>
                  <td className="px-5 py-3.5 whitespace-nowrap text-right">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleRowClick(log); }}
                      className="text-blue-600 hover:bg-blue-100 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                    >
                      Detay
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-slate-400 text-sm">
                  {!loading && "Kriterlere uygun herhangi bir log kaydı bulunamadı."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <span>Sayfa Boyutu:</span>
          <select 
            className="border border-slate-200 rounded px-2 py-1 outline-none"
            value={pageSize}
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </select>
          <span className="ml-2 font-medium">Toplam {data?.totalCount?.toLocaleString('tr-TR') || 0} kayıt</span>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1 || loading}
            className="p-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="font-medium text-slate-700 px-2">Sayfa {page} / {data?.totalPages || 1}</span>
          <button 
            onClick={() => setPage(p => Math.min(data?.totalPages || p, p + 1))}
            disabled={page === (data?.totalPages || 1) || loading}
            className="p-1 rounded border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-40 transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <LogDetailModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} log={selectedLog} />
    </div>
  );
};