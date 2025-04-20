import React from 'react';
import { Request } from '../types/request';

interface RequestTableBodyProps {
  requests: Request[];
}

const RequestTableBody: React.FC<RequestTableBodyProps> = ({ requests }) => {
  // Function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-900/60 text-yellow-200 border-yellow-700';
      case 'APPROVED':
        return 'bg-green-900/60 text-green-200 border-green-700';
      case 'REJECTED':
        return 'bg-rose-900/60 text-rose-200 border-rose-700';
      default:
        return 'bg-gray-900/60 text-gray-200 border-gray-700';
    }
  };

  return (
    <tbody className="divide-y divide-gray-700">
      {requests.flatMap((request) =>
        request.students.map((student) => (
          <tr key={`${request.id}-${student.id}`} className="hover:bg-gray-800/30 transition-colors">
            <td className="py-4 pl-6 pr-3 text-sm font-medium text-white">
              {student.name}
              <span className="text-gray-400 ml-1">({student.rollNo})</span>
            </td>
            <td className="px-3 py-4 text-sm text-gray-300">{student.group?.name || '-'}</td>
            <td className="px-3 py-4 text-sm text-gray-300">{student.group?.batch || '-'}</td>
            <td className="px-3 py-4 text-sm text-gray-300">{request.type}</td>
            <td className="px-3 py-4 text-sm text-gray-300">
              {request.category ?
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/60 text-indigo-200 border border-indigo-700">
                  {request.category}
                </span> :
                <span className="text-gray-500 italic">-</span>
              }
            </td>
            <td className="px-3 py-4 text-sm text-gray-300">{request.reason}</td>
            <td className="px-3 py-4 text-sm text-gray-300">{new Date(request.startDate).toLocaleDateString()}</td>
            <td className="px-3 py-4 text-sm">
              {request.approvals.find(approval => approval.groupId === student.group?.id) ? (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.approvals.find(approval => approval.groupId === student.group?.id)?.status || '')} border`}>
                  {request.approvals.find(approval => approval.groupId === student.group?.id)?.status}
                </span>
              ) : (
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.approvals[0]?.status || '')} border`}>
                  {request.approvals[0]?.status || '-'}
                </span>
              )}
            </td>
             {/* <td className="px-3 py-4 text-sm text-gray-300">{request.requestedBy.name || request.requestedBy.email}</td> */}
          </tr>
        ))
      )}
    </tbody>
  );
};

export default RequestTableBody;