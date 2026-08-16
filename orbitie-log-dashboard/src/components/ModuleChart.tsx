import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ModuleChartData } from '../types';
import { Loader2, AlertCircle } from 'lucide-react';

interface ModuleChartProps {
  data: ModuleChartData[];
  isLoading: boolean;
}

export const ModuleChart: React.FC<ModuleChartProps> = ({ data, isLoading }) => {
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
        <BarChart data={data} layout="vertical" margin={{ top: 5, right: 10, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
          <XAxis type="number" stroke="#6b7280" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis 
            dataKey="moduleName" 
            type="category" 
            width={130} 
            stroke="#4b5563" 
            fontSize={11} 
            tickLine={false} 
            axisLine={false} 
          />
          <Tooltip 
            cursor={{ fill: '#f3f4f6' }}
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="top" height={36} />
          <Bar dataKey="totalCount" name="Toplam Log" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
          <Bar dataKey="errorCount" name="Hata Sayısı" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={12} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};