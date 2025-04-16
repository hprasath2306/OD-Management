/**
 * DateUtils.ts
 * Utility functions for handling dates in the application
 */

// Format a date as YYYY-MM-DD for input fields
export const formatDateForInput = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Get start and end dates for last week
export const getLastWeek = (): { startDate: string; endDate: string } => {
  const today = new Date();
  const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  
  return {
    startDate: formatDateForInput(lastWeek),
    endDate: formatDateForInput(today)
  };
};

// Get start and end dates for last month
export const getLastMonth = (): { startDate: string; endDate: string } => {
  const today = new Date();
  const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, today.getDate());
  
  return {
    startDate: formatDateForInput(lastMonth),
    endDate: formatDateForInput(today)
  };
};

// Get start and end dates for last 6 months
export const getLast6Months = (): { startDate: string; endDate: string } => {
  const today = new Date();
  const last6Months = new Date(today.getFullYear(), today.getMonth() - 6, today.getDate());
  
  return {
    startDate: formatDateForInput(last6Months),
    endDate: formatDateForInput(today)
  };
}; 