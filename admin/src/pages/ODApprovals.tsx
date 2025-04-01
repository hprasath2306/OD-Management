import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { toast } from 'react-hot-toast';
import api from '../api/auth';

type ODCategory = 'PROJECT' | 'SIH' | 'SYMPOSIUM' | 'OTHER';
type RequestType = 'OD' | 'LEAVE';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Student {
  id: string;
  rollNo: string;
  name: string;
  group?: {
    id: string;
    name: string;
  };
}

interface Lab {
  id: string;
  name: string;
}

interface ApprovalStep {
  sequence: number;
  status: ApprovalStatus;
  comments: string | null;
  approvedAt: string | null;
  approverId: string;
}

interface GroupApproval {
  groupId: string;
  groupName: string;
  status: ApprovalStatus;
  currentStepIndex: number;
  steps: ApprovalStep[];
}

interface FlowStep {
  sequence: number;
  role: string;
}

interface FlowTemplate {
  id: string;
  name: string;
  steps: FlowStep[];
}

interface ODRequest {
  id: string;
  type: RequestType;
  category: ODCategory;
  needsLab: boolean;
  reason: string;
  description?: string;
  startDate: string;
  endDate: string;
  approvalStatus: ApprovalStatus;
  lab: Lab | null;
  requestedBy: {
    id: string;
    name: string;
    email: string;
  };
  students: Student[];
  approvals: GroupApproval[];
  flowTemplate: FlowTemplate;
  requestId: string;
}

export function ODApprovals() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);
  const [comment, setComment] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentTeacherId, setCurrentTeacherId] = useState<string>(user?.id || '');



  console.log(selectedRequest)

  // Load teacher's pending approval requests
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/requests/approver');
      console.log('Approver requests:', response.data);
      setRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading approval requests:', error);
      toast.error('Failed to load approval requests');
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  };
  console.log(setCurrentTeacherId)
  // Approve or reject a request
  const handleApproval = async (requestId: string, approve: boolean) => {
    try {
      setIsLoading(true);
      console.log(requestId);   
      await api.post(`/requests/${currentTeacherId}/approve`, {
        status: approve ? "APPROVED" : "REJECTED",
        comments: comment || undefined,
        requestId: requestId
      });
      toast.success(`Request ${approve ? 'approved' : 'rejected'} successfully`);
      setIsModalOpen(false);
      setSelectedRequest(null);
      setComment('');
      loadRequests(); // Refresh the list
    } catch (error) {
      console.error('Error processing approval:', error);
      toast.error('Failed to process approval');
    } finally {
      setIsLoading(false);
    }
  };

  // Open approval modal
  const openApprovalModal = (request: ODRequest) => {
    setSelectedRequest(request);
    setComment('');
    setIsModalOpen(true);
  };

  // Load data on component mount
  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <>
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold leading-tight text-gray-900">OD Requests</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-4">No pending requests require your approval.</p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Student</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dates</th>
                            {/* <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Group</th> */}
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                            <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                              <span className="sr-only">Actions</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {requests.map((request) => (
                            <tr key={Math.random()}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {request.students && request.students.length > 1 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Team ({request.students.length})
                                  </span>
                                ) : (
                                  request.students && request.students[0]?.name || 'Unknown'
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {request.type}
                                {request.category && (
                                  <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {request.category}
                                  </span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{request.reason}</td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                              </td>
                              {/* <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {request.approvals && request.approvals.length > 0 
                                  ? request.approvals.map(approval => approval.groupName).join(', ')
                                  : 'No group'}
                              </td> */}
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                {request.approvalStatus}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => openApprovalModal(request)}
                                  className="text-indigo-600 hover:text-indigo-900"
                                >
                                  Review
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Approval Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div>
                <div className="mt-3 text-center sm:mt-5">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">
                    Review Request
                  </h3>
                  <div className="mt-2">
                    <div className="bg-gray-50 p-4 rounded-md mb-4">
                      <h4 className="font-medium">Request Details</h4>
                      <p className="text-sm text-gray-500 mt-1">
                        <span className="font-medium">Type:</span> {selectedRequest.type} {selectedRequest.category && `(${selectedRequest.category})`}
                      </p>
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Reason:</span> {selectedRequest.reason}
                      </p>
                      {selectedRequest.description && (
                        <p className="text-sm text-gray-500">
                          <span className="font-medium">Description:</span> {selectedRequest.description}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        <span className="font-medium">Dates:</span> {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                      </p>
                      {/* <p className="text-sm text-gray-500">
                        <span className="font-medium">Requested By:</span> {selectedRequest.requestedBy.name} ({selectedRequest.requestedBy.email})
                      </p> */}
                      <div className="mt-2">
                        <span className="font-medium text-sm">Students:</span>
                        <ul className="list-disc list-inside text-sm text-gray-500 mt-1">
                          {selectedRequest.students.map(student => (
                            <li key={student.id}>
                              {student.name} ({student.rollNo}) - {student.group?.name || 'No Group'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    <div className="mt-4">
                      <label htmlFor="comment" className="block text-sm font-medium text-gray-700">
                        Comments (Optional)
                      </label>
                      <textarea
                        id="comment"
                        rows={3}
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="Add any comments about your decision..."
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleApproval(selectedRequest?.requestId, true)}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:col-start-2 sm:text-sm"
                >
                  {isLoading ? 'Processing...' : 'Approve'}
                </button>
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleApproval(selectedRequest?.requestId, false)}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                >
                  {isLoading ? 'Processing...' : 'Reject'}
                </button>
              </div>
              <div className="mt-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setSelectedRequest(null);
                    setComment('');
                  }}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 