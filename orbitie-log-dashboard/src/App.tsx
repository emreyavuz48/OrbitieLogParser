import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Server, RefreshCw } from 'lucide-react';
import { TimelineChart } from './components/TimelineChart';
import { ModuleChart } from './components/ModuleChart';
import { LogTable } from './components/LogTable';
import { fetchLogSummary, fetchTimelineChart, fetchModuleChart } from './services/api';
import { LogSummary, DateFilter, TimelineData, ModuleChartData } from './types';

const App: React.FC = () => {
  const [filter, setFilter] = useState<DateFilter>({ startDate: '', endDate: '' });

  const [summaryData, setSummaryData] = useState<LogSummary | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData[]>([]);
  const [moduleData, setModuleData] = useState<ModuleChartData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (filter.startDate && filter.endDate && filter.startDate > filter.endDate) {
      setError('Başlangıç tarihi bitiş tarihinden sonra olamaz.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const [summaryRes, timelineRes, moduleRes] = await Promise.allSettled([
        fetchLogSummary(filter),
        fetchTimelineChart(filter),
        fetchModuleChart(filter)
      ]);

      if (summaryRes.status === 'fulfilled') setSummaryData(summaryRes.value);
      if (timelineRes.status === 'fulfilled') setTimelineData(timelineRes.value);
      if (moduleRes.status === 'fulfilled') setModuleData(moduleRes.value);

      if (summaryRes.status === 'rejected' || timelineRes.status === 'rejected' || moduleRes.status === 'rejected') {
        setError('Bazı veriler yüklenirken hata oluştu.');
      }
    } catch (err: any) {
      setError(err.message || 'Bilinmeyen bir hata oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [filter.startDate, filter.endDate]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Activity size={20} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800">Orbitie Log Dashboard</h1>
              <p className="text-xs text-slate-500 font-medium">Sistem günlükleri ve hata analizleri</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={filter.startDate}
              onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
              className="text-sm border border-slate-300 rounded-md p-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={filter.endDate}
              onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
              className="text-sm border border-slate-300 rounded-md p-1.5 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            {(filter.startDate || filter.endDate) && (
              <button 
                onClick={() => setFilter({ startDate: '', endDate: '' })}
                className="text-sm text-slate-500 hover:text-red-500 ml-2 font-medium"
              >
                Temizle
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 flex items-center gap-2">
            <AlertTriangle size={20} />
            {error}
          </div>
        )}

        {/* Task 3.1: KPI Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative">
          {isLoading && (
            <div className="absolute inset-0 bg-white/50 z-10 flex items-center justify-center rounded-xl">
              <RefreshCw className="animate-spin text-blue-600" size={24} />
            </div>
          )}
          
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Server size={18} className="text-blue-500"/>
              <h3 className="text-sm font-semibold">Toplam Log</h3>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {summaryData ? summaryData.totalLogs.toLocaleString('tr-TR') : '--'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <AlertTriangle size={18} className="text-red-500"/>
              <h3 className="text-sm font-semibold">Hata (Error)</h3>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {summaryData ? summaryData.errorCount.toLocaleString('tr-TR') : '--'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <AlertTriangle size={18} className="text-yellow-500"/>
              <h3 className="text-sm font-semibold">Uyarı (Warning)</h3>
            </div>
            <p className="text-2xl font-bold text-slate-800">
              {summaryData ? summaryData.warningCount.toLocaleString('tr-TR') : '--'}
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-3 text-slate-500 mb-2">
              <Activity size={18} className="text-purple-500"/>
              <h3 className="text-sm font-semibold">En Sorunlu Modül</h3>
            </div>
            <p className="text-lg font-bold text-slate-800 truncate" title={summaryData?.mostErrorModule || ''}>
              {summaryData?.mostErrorModule || '--'}
            </p>
          </div>
        </div>

        {/* Task 3.2: Recharts Grafikleri */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative">
          {isLoading && (
             <div className="absolute inset-0 bg-white/50 z-10 rounded-xl" />
          )}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[400px]">
             <h3 className="text-base font-semibold text-slate-800 mb-4">Zamana Göre Log Akışı</h3>
             <TimelineChart data={timelineData} isLoading={isLoading} />
          </div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm h-[400px]">
             <h3 className="text-base font-semibold text-slate-800 mb-4">Modüllere Göre Log Dağılımı</h3>
             <ModuleChart data={moduleData} isLoading={isLoading} />
          </div>
        </div>

        {/* Task 3.3: Log Tablosu */}
        <LogTable filter={filter} />
      </main>
    </div>
  );
};

export default App;