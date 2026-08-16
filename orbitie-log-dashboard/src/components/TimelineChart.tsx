import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TimelineData } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

interface TimelineChartProps {
  data: TimelineData[];
  isLoading: boolean;
}

export const TimelineChart: React.FC<TimelineChartProps> = ({ data, isLoading }) => {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-72">
        <Loader2 className="animate-spin text-blue-600 w-8 h-8" />
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-72 text-gray-500">
        <AlertCircle className="w-10 h-10 mb-2 text-gray-400" />
        <span className="font-medium">Veri Bulunamadı</span>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorError" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
          <XAxis 
            dataKey="date" 
            stroke="#6b7280" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(str: string) => {
              const d = new Date(str);
              return isNaN(d.getTime()) ? str : d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
            }}
          />
          <YAxis stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelFormatter={(label: any) => {
              if (!label) return '';
              const d = new Date(String(label));
              return isNaN(d.getTime()) ? String(label) : d.toLocaleDateString('tr-TR');
            }}
          />
          <Legend verticalAlign="top" height={36} />
          <Area type="monotone" dataKey="totalCount" name="Toplam Log" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" />
          <Area type="monotone" dataKey="errorCount" name="Hata Sayısı" stroke="#ef4444" fillOpacity={1} fill="url(#colorError)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};