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

  const itemsPerPage: number = 10;
   const { user } = useAuth();

  useEffect(() => {
    const loadRequests = async () => {


      if (user?.role === "ADMIN") {

        const data = await api.get('/requests');
        setRequests(data.data.requests);
        setFilteredRequests(data.data.requests);
      }
      else {
        const data = await api.get(`/requests/group`);
        setRequests(data.data.requests);
        setFilteredRequests(data.data.requests);
      }

    };
    loadRequests();
  }, []);

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

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold  mb-6">Student Requests Status</h2>
      <div className="mb-6 space-y-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <ExportButton requests={filteredRequests} filename={getExportFilename()} />
        <FilterPanel
          filters={filters}
          setFilters={setFilters}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          showDateRange={showDateRange}
          setShowDateRange={setShowDateRange}
        />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-3 text-left font-semibold">Student</th>
              <th className="p-3 text-left font-semibold">Type</th>
              <th className="p-3 text-left font-semibold">Category</th>
              <th className="p-3 text-left font-semibold">Reason</th>
              <th className="p-3 text-left font-semibold">Date</th>
              <th className="p-3 text-left font-semibold">Status</th>
              <th className="p-3 text-left font-semibold">Requested By</th>
            </tr>
          </thead>
          <RequestTableBody requests={currentItems} />
        </table>
      </div>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={filteredRequests.length}
      />
    </div>
  );
};

export default RequestTableContainer;