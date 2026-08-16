import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor: string;
  iconTextColor: string;
  isLoading: boolean;
}

export const KPICard: React.FC<KPICardProps> = ({ 
  title, 
  value, 
  icon: Icon, 
  iconBgColor, 
  iconTextColor, 
  isLoading 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 transition-transform hover:-translate-y-1 duration-200">
      <div className={`p-4 rounded-full ${iconBgColor} ${iconTextColor}`}>
        <Icon size={24} />
      </div>
      <div className="flex-1">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        {isLoading ? (
          <div className="h-7 w-24 bg-gray-200 animate-pulse rounded mt-1"></div>
        ) : (
          <p className="text-2xl font-bold text-gray-800 mt-1">
            {value || value === 0 ? value : '-'}
          </p>
        )}
      </div>
    </div>
  );
};