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

  console.log(setCurrentTeacherId)

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

  // Status badge color mapping
  const getStatusBadgeClass = (status: ApprovalStatus) => {
    switch (status) {
      case 'APPROVED':
        return 'bg-green-900 text-green-200 border border-green-800';
      case 'REJECTED':
        return 'bg-red-900 text-red-200 border border-red-800';
      case 'PENDING':
      default:
        return 'bg-yellow-900 text-yellow-200 border border-yellow-800';
    }
  };

  return (
    <>
      <div className="py-6 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-6 bg-gradient-to-r from-slate-800 to-purple-900 rounded-lg shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white">OD Approvals</h1>
            <div className="text-sm text-gray-300">
              Manage and review student OD requests
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg shadow-xl border border-slate-700/50 overflow-hidden backdrop-blur-sm backdrop-filter">
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <Spinner size="lg" />
            </div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-2 text-lg font-medium text-white">No pending approvals</h3>
              <p className="mt-1 text-sm text-gray-400">You don't have any pending OD requests that require your approval at this time.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700/30">
                <thead className="bg-slate-800">
                  <tr>
                    <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-semibold text-white">Student</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Type</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Reason</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Dates</th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-white">Status</th>
                    <th scope="col" className="relative py-3.5 pl-3 pr-6">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700/30 bg-slate-900/50">
                  {requests.map((request) => (
                    <tr key={Math.random()} className="hover:bg-slate-800/50 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-gray-200">
                        {request.students && request.students.length > 1 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-200 border border-purple-800">
                            Team ({request.students.length})
                          </span>
                        ) : (
                          request.students && request.students[0]?.name || 'Unknown'
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        {request.type}
                        {request.category && (
                          <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200 border border-blue-800">
                            {request.category}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{request.reason}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.approvalStatus)}`}>
                          {request.approvalStatus}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                        <button
                          onClick={() => openApprovalModal(request)}
                          className="text-purple-400 hover:text-purple-300 transition-colors px-3 py-1 rounded-md hover:bg-purple-900/30"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Approval Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed z-50 inset-0 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            {/* Backdrop with blur effect */}
            <div 
              className="fixed inset-0 bg-gray-900 bg-opacity-80 transition-opacity backdrop-blur-sm" 
              onClick={() => {
                setIsModalOpen(false);
                setSelectedRequest(null);
                setComment('');
              }} 
            />
            
            {/* Modal content */}
            <div className="inline-block align-bottom bg-gradient-to-b from-slate-800 to-slate-900 rounded-lg overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-purple-500/30">
              {/* Header */}
              <div className="px-6 pt-5 pb-4 bg-gradient-to-r from-purple-900/50 to-slate-800/50 border-b border-purple-500/20">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Review Request
                  </h3>
                  <button 
                    onClick={() => {
                      setIsModalOpen(false);
                      setSelectedRequest(null);
                      setComment('');
                    }}
                    className="text-gray-400 hover:text-white transition-colors"
                  >
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="px-6 py-5">
                {/* Request Details Card */}
                <div className="bg-slate-800/70 rounded-lg border border-slate-700/50 overflow-hidden mb-5">
                  {/* Type and Dates */}
                  <div className="p-4 border-b border-slate-700/30">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-lg font-medium text-white">{selectedRequest.type}</span>
                          {selectedRequest.category && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200 border border-blue-800">
                              {selectedRequest.category}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {new Date(selectedRequest.startDate).toLocaleDateString()} - {new Date(selectedRequest.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(selectedRequest.approvalStatus)}`}>
                        {selectedRequest.approvalStatus}
                      </span>
                    </div>
                  </div>

                  {/* Reason and Description */}
                  <div className="p-4 border-b border-slate-700/30">
                    <h4 className="font-medium text-gray-200 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Reason
                    </h4>
                    <p className="text-sm text-gray-300 bg-slate-700/30 p-3 rounded-md">{selectedRequest.reason}</p>
                    
                    {selectedRequest.description && (
                      <div className="mt-3">
                        <h4 className="font-medium text-gray-200 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                          </svg>
                          Description
                        </h4>
                        <p className="text-sm text-gray-300 bg-slate-700/30 p-3 rounded-md">{selectedRequest.description}</p>
                      </div>
                    )}
                  </div>

                  {/* Students List */}
                  <div className="p-4">
                    <h4 className="font-medium text-gray-200 mb-2 flex items-center">
                      <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                      Students ({selectedRequest.students.length})
                    </h4>
                    <div className="space-y-2 mt-2">
                      {selectedRequest.students.map(student => (
                        <div key={student.id} className="flex items-center justify-between p-2 bg-slate-700/30 rounded-md">
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-purple-900 flex items-center justify-center text-white font-medium text-sm mr-3">
                              {student.name.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-white">{student.name}</p>
                              <p className="text-xs text-gray-400">{student.rollNo}</p>
                            </div>
                          </div>
                          {student.group?.name && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-900/60 text-purple-200 border border-purple-800/50">
                              {student.group.name}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Comments Section */}
                <div className="mb-6">
                  <label htmlFor="comment" className="block text-sm font-medium text-gray-200 mb-2 flex items-center">
                    <svg className="w-4 h-4 mr-1 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Add Comments (Optional)
                  </label>
                  <textarea
                    id="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    className="w-full rounded-md border-gray-600 bg-slate-800/50 shadow-sm focus:border-purple-500 focus:ring-purple-500 text-white placeholder-gray-400 text-sm transition-colors"
                    placeholder="Add any comments about your decision..."
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleApproval(selectedRequest?.requestId, false)}
                    className="flex-1 inline-flex justify-center items-center rounded-md border border-transparent px-4 py-2.5 bg-gradient-to-r from-red-700 to-red-600 text-sm font-medium text-white hover:from-red-800 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        Rejecting...
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Reject Request
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleApproval(selectedRequest?.requestId, true)}
                    className="flex-1 inline-flex justify-center items-center rounded-md border border-transparent px-4 py-2.5 bg-gradient-to-r from-green-700 to-green-600 text-sm font-medium text-white hover:from-green-800 hover:to-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 focus:ring-offset-slate-900 transition-all disabled:opacity-50"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        Approving...
                      </div>
                    ) : (
                      <>
                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Approve Request
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 