import React from 'react';
import { Request } from '../types/request';

interface RequestTableBodyProps {
  requests: Request[];
}

const RequestTableBody: React.FC<RequestTableBodyProps> = ({ requests }) => {
  return (
    <tbody>
      {requests.map((request) => (
        <tr key={request.id} className="hover:bg-gray-50 border-b">
          <td className="p-3">{request.students[0].name} ({request.students[0].rollNo})</td>
          <td className="p-3">{request.type}</td>
          <td className="p-3">{request.category || '-'}</td>
          <td className="p-3">{request.reason}</td>
          <td className="p-3">{new Date(request.startDate).toLocaleDateString()}</td>
          <td className="p-3">{request.approvals[0].status}</td>
          <td className="p-3">{request.requestedBy.name || request.requestedBy.email}</td>
        </tr>
      ))}
    </tbody>
  );
};

export default RequestTableBody;