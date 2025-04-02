import React from 'react';
import { Request } from '../types/request';
import { exportToExcel, exportToPDF } from '../utils/ExportUtils';


interface ExportButtonsProps {
  requests: Request[];
  filename: string;
}

const ExportButtons: React.FC<ExportButtonsProps> = ({ requests, filename }) => {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => exportToExcel(requests, filename)}
        className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
      >
        Export to Excel
      </button>
      <button
        onClick={() => exportToPDF(requests, filename)}
        className="px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors"
      >
        Export to PDF
      </button>
    </div>
  );
};

export default ExportButtons;