export interface DateFilter {
  startDate: string;
  endDate: string;
}

export interface LogSummary {
  totalLogs: number;
  errorCount: number;
  warningCount: number;
  mostErrorModule: string | null;
}

export interface TimelineData {
  date: string;
  totalCount: number;
  errorCount: number;
  warningCount: number;
}

export interface ModuleChartData {
  moduleName: string;
  totalCount: number;
  errorCount: number;
}

export interface LogItem {
  id: number;
  timestamp: string;
  level: string;
  module: string;
  message: string;
  exception?: string | null;
  user?: string | null;
}

export interface LogQueryParams {
  page: number;
  pageSize: number;
  level?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
}

export interface PagedResponse<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}