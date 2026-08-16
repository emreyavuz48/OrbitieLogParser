import React from 'react';
import { X, Calendar } from 'lucide-react';
import { DateFilter } from '../types';

interface DatePickerProps {
  filter: DateFilter;
  onChange: (filter: DateFilter) => void;
  onClear: () => void;
}

export const DatePicker: React.FC<DatePickerProps> = ({ filter, onChange, onClear }) => {
  const hasFilter = filter.startDate || filter.endDate;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filter, [e.target.name]: e.target.value });
  };

  return (
    <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex items-center gap-2 text-gray-600">
        <Calendar size={20} />
        <span className="font-medium text-sm">Tarih Filtresi:</span>
      </div>
      
      <div className="flex items-center gap-2">
        <input
          type="date"
          name="startDate"
          value={filter.startDate}
          onChange={handleChange}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <span className="text-gray-400">-</span>
        <input
          type="date"
          name="endDate"
          value={filter.endDate}
          onChange={handleChange}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {hasFilter && (
        <button
          onClick={onClear}
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-700 transition-colors ml-auto sm:ml-0"
        >
          <X size={16} />
          <span>Temizle</span>
        </button>
      )}
    </div>
  );
};