import React, { useEffect } from 'react';
import { Filters } from '../types/request';
import { getLastWeek, getLastMonth, getLast6Months } from '../utils/DateUtils';

interface FilterPanelProps {
  filters: Filters;
  setFilters: (filters: Filters) => void;
  dateFilter: string;
  setDateFilter: (filter: string) => void;
  showDateRange: boolean;
  setShowDateRange: (show: boolean) => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  filters,
  setFilters,
  dateFilter,
  setDateFilter,
  showDateRange,
  setShowDateRange,
}) => {
  // Update date filters based on selection
  useEffect(() => {
    if (dateFilter === 'week') {
      const { startDate, endDate } = getLastWeek();
      setFilters({ ...filters, dateFrom: startDate, dateTo: endDate });
      setShowDateRange(false);
    } else if (dateFilter === 'month') {
      const { startDate, endDate } = getLastMonth();
      setFilters({ ...filters, dateFrom: startDate, dateTo: endDate });
      setShowDateRange(false);
    } else if (dateFilter === '6months') {
      const { startDate, endDate } = getLast6Months();
      setFilters({ ...filters, dateFrom: startDate, dateTo: endDate });
      setShowDateRange(false);
    } else if (dateFilter === 'custom') {
      setShowDateRange(true);
    } else if (dateFilter === '') {
      setFilters({ ...filters, dateFrom: '', dateTo: '' });
      setShowDateRange(false);
    }
  }, [dateFilter, setFilters, setShowDateRange]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Date Filter */}
        <div>
          <label htmlFor="dateFilter" className="block text-sm font-medium text-gray-200 mb-1">
            Date Filter
          </label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none"
          >
            <option value="" className="bg-gray-800">All Dates</option>
            <option value="week" className="bg-gray-800">Last Week</option>
            <option value="month" className="bg-gray-800">Last Month</option>
            <option value="6months" className="bg-gray-800">Last 6 Months</option>
            <option value="custom" className="bg-gray-800">Custom Range</option>
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-200 mb-1">
            Category
          </label>
          <select
            id="categoryFilter"
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none"
          >
            <option value="" className="bg-gray-800">All Categories</option>
            <option value="PROJECT" className="bg-gray-800">Project</option>
            <option value="LEAVE" className="bg-gray-800">Leave</option>
            <option value="OTHER" className="bg-gray-800">Other</option>
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <label htmlFor="statusFilter" className="block text-sm font-medium text-gray-200 mb-1">
            Status
          </label>
          <select
            id="statusFilter"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="w-full px-4 py-2.5 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none"
          >
            <option value="" className="bg-gray-800">All Status</option>
            <option value="PENDING" className="bg-gray-800">Pending</option>
            <option value="APPROVED" className="bg-gray-800">Approved</option>
            <option value="REJECTED" className="bg-gray-800">Rejected</option>
          </select>
        </div>
      </div>

      {/* Custom Date Range */}
      {showDateRange && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="dateFrom" className="block text-sm font-medium text-gray-200 mb-1">
              From Date
            </label>
            <input
              type="date"
              id="dateFrom"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors"
            />
          </div>
          <div>
            <label htmlFor="dateTo" className="block text-sm font-medium text-gray-200 mb-1">
              To Date
            </label>
            <input
              type="date"
              id="dateTo"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-4 py-2.5 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;