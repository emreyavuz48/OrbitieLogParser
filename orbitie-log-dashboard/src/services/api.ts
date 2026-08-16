import { 
  LogSummary, 
  DateFilter, 
  TimelineData, 
  ModuleChartData, 
  LogQueryParams, 
  PagedResponse, 
  LogItem 
} from '../types';

const API_BASE_URL = 'http://localhost:5243/api';

export const fetchLogSummary = async (filter: DateFilter): Promise<LogSummary> => {
  const params = new URLSearchParams();
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/logs/summary${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Log özet verileri alınırken hata oluştu.');
  return response.json();
};

export const fetchTimelineChart = async (filter: DateFilter): Promise<TimelineData[]> => {
  const params = new URLSearchParams();
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);

  const queryString = params.toString();
  const url = `${API_BASE_URL}/logs/chart/timeline${queryString ? `?${queryString}` : ''}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Zaman serisi verisi alınamadı.');
  return response.json();
};

export const fetchModuleChart = async (filter: DateFilter, top: number = 10): Promise<ModuleChartData[]> => {
  const params = new URLSearchParams();
  params.append('top', top.toString());
  if (filter.startDate) params.append('startDate', filter.startDate);
  if (filter.endDate) params.append('endDate', filter.endDate);

  const url = `${API_BASE_URL}/logs/chart/by-module?${params.toString()}`;

  const response = await fetch(url);
  if (!response.ok) throw new Error('Modül grafik verisi alınamadı.');
  return response.json();
};

export const fetchLogs = async (params: LogQueryParams): Promise<PagedResponse<LogItem>> => {
  const query = new URLSearchParams({
    page: params.page.toString(),
    pageSize: params.pageSize.toString(),
  });

  if (params.level && params.level !== 'All') {
    query.append('level', params.level);
  }
  if (params.search && params.search.trim() !== '') {
    query.append('search', params.search.trim());
  }
  if (params.startDate) {
    query.append('startDate', params.startDate);
  }
  if (params.endDate) {
    query.append('endDate', params.endDate);
  }

  const response = await fetch(`${API_BASE_URL}/logs?${query.toString()}`);
  if (!response.ok) {
    throw new Error('Log verileri getirilirken bir hata oluştu.');
  }

  return response.json();
};