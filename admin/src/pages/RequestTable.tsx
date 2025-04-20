import React, { useState, useEffect } from 'react';
import SearchBar from '../components/SearchBar';
import Pagination from '../components/Pagination';
import { Request, Filters } from '../types/request';
import { filterRequests } from '../utils/FilterUtils';
import FilterPanel from '../components/FIlterPanel';
import RequestTableBody from '../components/RequestBody';
import api from '../api/auth';
import { useAuth } from '../context/AuthContext';
import ExportButton from '../components/ExportButton';
import { Spinner } from '../components/ui/Spinner';

const RequestTableContainer: React.FC = () => {
  const [requests, setRequests] = useState<Request[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<Request[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filters, setFilters] = useState<Filters>({
    dateFrom: '',
    dateTo: '',
    category: '',
    status: ''
  });
  const [dateFilter, setDateFilter] = useState<string>('');
  const [showDateRange, setShowDateRange] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const itemsPerPage: number = 10;
  const { user } = useAuth();


  useEffect(() => {
    const loadRequests = async () => {
      try {
        setIsLoading(true);
        if (user?.role === "ADMIN") {
          const data = await api.get('/requests');
          setRequests(data.data.requests);
          setFilteredRequests(data.data.requests);
        } else {
          const data = await api.get(`/requests/group`);
          setRequests(data.data.requests);
          setFilteredRequests(data.data.requests);
        }
        setError(null);
      } catch (err) {
        console.error('Error loading requests:', err);
        setError('Failed to load requests. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    loadRequests();
  }, [user]);

  useEffect(() => {
    const filtered = filterRequests(requests, searchTerm, filters);
    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, filters, requests]);

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  const getExportFilename = (): string => {
    let prefix = 'Requests';
    if (dateFilter === 'week') prefix = 'Last_Week_Requests';
    else if (dateFilter === 'month') prefix = 'Last_Month_Requests';
    else if (dateFilter === '6months') prefix = 'Last_6_Months_Requests';
    else if (dateFilter === 'custom') prefix = `Requests_${filters.dateFrom}_to_${filters.dateTo}`;

    if (filters.category) prefix += `_${filters.category}`;
    if (filters.status) prefix += `_${filters.status}`;

    return prefix;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-8 max-w-lg">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white">Error loading requests</h3>
          <p className="mt-1 text-sm text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  console.log('Filtered Requests:', filteredRequests); // Debugging line

  return (
    <div className="py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-20 blur-3xl"></div>
        <div className="relative z-10">
          <h1 className="text-3xl font-bold text-white">Student Requests</h1>
          <p className="mt-2 text-purple-200">
            Track and manage student requests and their approval status
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>

        {/* Search and Filters */}
        <div className="px-6 py-5 border-b border-gray-700 relative z-10">
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="w-full md:w-1/2">
                <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
              </div>
              <ExportButton requests={filteredRequests} filename={getExportFilename()} />
            </div>
            <FilterPanel
              filters={filters}
              setFilters={setFilters}
              dateFilter={dateFilter}
              setDateFilter={setDateFilter}
              showDateRange={showDateRange}
              setShowDateRange={setShowDateRange}
            />
          </div>
        </div>

        {/* Request Table */}
        <div className="relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th className="py-3.5 pl-6 pr-3 text-left text-sm font-medium text-gray-200">Student</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Class</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Batch</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Type</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Category</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Reason</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Date</th>
                  <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Status</th>
                  {/* <th className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Requested By</th> */}
                </tr>
              </thead>
              {filteredRequests.length === 0 ? (
                <tbody>
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-sm text-gray-300">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p>No requests found</p>
                        <p className="text-gray-400 text-xs mt-2">Try adjusting your filters or search term</p>
                      </div>
                    </td>
                  </tr>
                </tbody>
              ) : (
                <RequestTableBody requests={currentItems} />
              )}
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-700 relative z-10">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={filteredRequests.length}
          />
        </div>
      </div>
    </div>
  );
};

export default RequestTableContainer;