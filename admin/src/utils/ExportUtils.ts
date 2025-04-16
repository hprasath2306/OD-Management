import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; // Explicitly import autoTable
import { Request } from '../types/request';

// Export to Excel
export const exportToExcel = (requests: Request[], filename: string): void => {
  const exportData = requests.map(request => ({
    'Student': `${request.students[0].name} (${request.students[0].rollNo})`,
    'Type': request.type,
    'Category': request.category || '-',
    'Reason': request.reason,
    'Date': new Date(request.startDate).toLocaleDateString(),
    'Status': request.approvals[0].status,
    'Requested By': request.requestedBy.name || request.requestedBy.email,
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Requests');
  
  const colWidths = Object.keys(exportData[0]).map((key) => ({
    wch: Math.max(
      key.length,
      ...exportData.map(row => String(row[key as keyof typeof row]).length)
    ) + 2
  }));
  worksheet['!cols'] = colWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
};

// Export to PDF
export const exportToPDF = (requests: Request[], filename: string): void => {
  const doc = new jsPDF();
  
  const tableColumn = [
    'Student',
    'Type',
    'Category',
    'Reason',
    'Date',
    'Status',
    'Requested By'
  ];
  
  const tableRows = requests.map(request => [
    `${request.students[0].name} (${request.students[0].rollNo})`,
    request.type,
    request.category || '-',
    request.reason,
    new Date(request.startDate).toLocaleDateString(),
    request.approvals[0].status,
    request.requestedBy.name || request.requestedBy.email
  ]);

  // Explicitly apply autoTable to the jsPDF instance
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 20,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [66, 135, 245] },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    margin: { top: 10 }
  });

  doc.text('Student Requests Report', 14, 15);
  doc.save(`${filename}.pdf`);
};