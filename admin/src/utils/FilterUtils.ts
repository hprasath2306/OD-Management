import { Request, Filters } from '../types/request';

export const filterRequests = (
  requests: Request[],
  searchTerm: string,
  filters: Filters
): Request[] => {
  let filtered = [...requests];

  if (searchTerm) {
    filtered = filtered.filter(request => 
      request.reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      request.students[0].name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  if (filters.dateFrom || filters.dateTo) {
    filtered = filtered.filter(request => {
      const requestDate = new Date(request.startDate);
      const fromDate = filters.dateFrom ? new Date(filters.dateFrom) : null;
      const toDate = filters.dateTo ? new Date(filters.dateTo) : null;
      
      if (fromDate && toDate) {
        return requestDate >= fromDate && requestDate <= toDate;
      }
      if (fromDate) {
        return requestDate >= fromDate;
      }
      if (toDate) {
        return requestDate <= toDate;
      }
      return true;
    });
  }

  if (filters.category) {
    filtered = filtered.filter(request => request.category === filters.category);
  }
  if (filters.status) {
    filtered = filtered.filter(request => request.approvals[0].status === filters.status);
  }

  return filtered;
};

export const applyDateFilter = (
  type: string,
  setFilters: React.Dispatch<React.SetStateAction<Filters>>,
  setShowDateRange: React.Dispatch<React.SetStateAction<boolean>>
): void => {
  setShowDateRange(false);
  const today = new Date();
  let dateFrom = '';

  switch (type) {
    case 'week':
      dateFrom = new Date(today.setDate(today.getDate() - 7)).toISOString().split('T')[0];
      break;
    case 'month':
      dateFrom = new Date(today.setMonth(today.getMonth() - 1)).toISOString().split('T')[0];
      break;
    case '6months':
      dateFrom = new Date(today.setMonth(today.getMonth() - 6)).toISOString().split('T')[0];
      break;
    case 'custom':
      setShowDateRange(true);
      setFilters(prev => ({ ...prev, dateFrom: '', dateTo: '' }));
      return;
    default:
      dateFrom = '';
  }

  setFilters(prev => ({
    ...prev,
    dateFrom: dateFrom,
    dateTo: type === '' ? '' : new Date().toISOString().split('T')[0]
  }));
};