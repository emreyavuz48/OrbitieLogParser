import React, { useEffect, useState } from 'react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import { LogItem } from '../types';

interface LogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  log: LogItem | null;
}

export const LogDetailModal: React.FC<LogDetailModalProps> = ({ isOpen, onClose, log }) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', handleEsc);

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !log) return null;

  const handleCopy = async () => {
    if (log.exception) {
      try {
        await navigator.clipboard.writeText(log.exception);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Panoya kopyalama başarısız:', err);
      }
    }
  };

  const getBadgeColor = (level?: string | null) => {
    if (!level) return 'bg-slate-100 text-slate-800 border-slate-200';
    switch (level.toLowerCase()) {
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': 
      case 'fatal': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-500">#{log.id}</span>
            <h2 className="text-base font-semibold text-slate-800">Log Detayı</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs">
            <div>
              <span className="text-slate-400 block mb-1">Tarih / Saat</span>
              <p className="font-semibold text-slate-700">
                {log.timestamp ? new Date(log.timestamp).toLocaleString('tr-TR') : '-'}
              </p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Seviye</span>
              <span className={`inline-block px-2 py-0.5 rounded-full font-medium border text-[11px] ${getBadgeColor(log.level)}`}>
                {log.level || 'Unknown'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Modül</span>
              <p className="font-semibold text-slate-700">{log.module || '-'}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-1">Kullanıcı</span>
              <p className="font-semibold text-slate-700">{log.user || 'Sistem / Anonim'}</p>
            </div>
          </div>

          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1.5">Mesaj</span>
            <div className="p-3.5 bg-slate-50 rounded-lg text-slate-800 text-sm border border-slate-200/70 font-medium">
              {log.message || 'Mesaj içeriği yok.'}
            </div>
          </div>

          {log.exception && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Exception & StackTrace</span>
                <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-2.5 py-1 rounded transition-colors">
                  {copied ? <CheckCircle2 size={13} className="text-green-600" /> : <Copy size={13} />}
                  <span>{copied ? 'Kopyalandı' : 'Kopyala'}</span>
                </button>
              </div>
              <div className="bg-[#1e1e1e] rounded-lg overflow-hidden border border-slate-800">
                <pre className="p-4 text-xs text-rose-300 font-mono overflow-x-auto max-h-72 whitespace-pre-wrap">
                  <code>{log.exception}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};