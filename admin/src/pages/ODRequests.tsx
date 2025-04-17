import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'react-hot-toast';
import api from '../api/auth';
import Select from 'react-select';
import ODRequestDetailsModel from '../components/ODRequestDetailsModel';
import { ODRequest, Lab, Student, ODRequestFormValues, odRequestSchema } from '../api/request';

export function ODRequests() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<ODRequest | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<ODRequestFormValues>({
    resolver: zodResolver(odRequestSchema),
    defaultValues: {
      type: 'OD',
      category: 'PROJECT',
      needsLab: false,
      reason: '',
      description: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date().toISOString().split('T')[0],
      isTeamRequest: false,
      students: [
      ],
    }
  });

  const needsLab = watch('needsLab');
  const requestType = watch('type');
  const isTeamRequest = watch('isTeamRequest');

  // Load students for team requests
  const loadStudents = async () => {
    try {
      const response = await api.get('student');
      const studentData = response.data.data || [];

      // Filter out the current user from the team members list
      const filteredStudents = Array.isArray(studentData)
        ? studentData.filter(student => student.user?.name !== user?.name)
        : [];

      setStudents(filteredStudents);
    } catch (error) {
      console.error('Error loading students:', error);
      setStudents([]);
    }
  };

  // Load user's OD requests
  const loadRequests = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/requests/student');
      setRequests(response.data.requests || []); // Access the requests array from response
    } catch (error) {
      console.error('Error loading requests:', error);
      toast.error('Failed to load your requests');
      setRequests([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  };

  // Load labs for dropdown
  const loadLabs = async () => {
    try {
      const response = await api.get('/lab');
      setLabs(response.data);
    } catch (error) {
      console.error('Error loading labs:', error);
    }
  };

  // Submit form
  const onSubmit = async (data: ODRequestFormValues) => {
    try {
      setIsLoading(true);
      // Use user ID for individual requests, selected students for team requests
      const studentIds = isTeamRequest
        ? (data.students?.map(student => student.value).filter(Boolean) || [])
        : [user?.id]; // Use user ID directly from auth context
      console.log(studentIds);
      if (isTeamRequest) {
        studentIds.push(user?.id);
      }
      if (studentIds.length === 0) {
        throw new Error('No students selected');
      }

      const submitData = {
        type: data.type,
        category: data.type === 'OD' ? data.category : undefined,
        needsLab: data.needsLab,
        reason: data.reason,
        description: data.description,
        startDate: data.startDate,
        endDate: data.endDate,
        labId: data.needsLab ? data.labId : undefined,
        students: studentIds
      };

      await api.post('/requests', submitData);
      toast.success('Request submitted successfully');
      setIsModalOpen(false);
      reset();
      loadRequests();
    } catch (error: any) {
      console.error('Error submitting request:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadRequests();
    loadLabs();
    loadStudents();
  }, []);

  const handleOpenModal = () => {
    try {
      // Reset form with default values
      reset({
        type: 'OD',
        category: 'PROJECT',
        needsLab: false,
        reason: '',
        description: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        isTeamRequest: false,
        students: []
      });
      setIsModalOpen(true);

    } catch (error) {
      console.error('Error opening modal:', error);
      toast.error('Failed to open request form');
    }
  };

  const handleOpenDetailsModal = (request: ODRequest) => {
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    setSelectedRequest(null);
  };

  return (
    <>
      <div className="py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-20 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white">OD Requests</h1>
            <p className="mt-2 text-purple-200">
              Manage your OD (On Duty) and Leave requests
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
          <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl"></div>
          <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>
          
          {/* Header Actions */}
          <div className="px-6 py-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
            <div>
              <p className="text-gray-300 text-sm">
                View and manage your OD and Leave requests
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              New Request
            </button>
          </div>

          {/* Requests Table */}
          <div className="relative z-10">
            {isLoading ? (
              <div className="flex items-center justify-center h-48">
                <Spinner size="lg" className="text-purple-500" />
              </div>
            ) : requests.length === 0 ? (
              <div className="py-8 text-center">
                <div className="flex flex-col items-center justify-center">
                  <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                  <p className="text-gray-300">You haven't submitted any requests yet</p>
                  <p className="text-gray-400 text-xs mt-2">Click the "New Request" button to create your first request</p>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-800/50">
                    <tr>
                      <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-medium text-gray-200">Type</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Reason</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Dates</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Students</th>
                      <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">Status</th>
                      <th scope="col" className="relative py-3.5 pl-3 pr-6">
                        <span className="sr-only">Details</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {requests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-800/30 transition-colors">
                        <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">
                          {request.type}
                          {request.category && (
                            <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/60 text-blue-200 border border-blue-700">
                              {request.category}
                            </span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">{request.reason}</td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                          {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                          {request.students?.length > 1 ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/60 text-purple-200 border border-purple-700">
                              Team ({request.students.length})
                            </span>
                          ) : (
                            <span>Individual</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-sm">
                          {request.approvals && request.approvals.length > 0 ? (
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              request.approvals[0].status === 'APPROVED'
                                ? 'bg-green-900/60 text-green-200 border border-green-700'
                                : request.approvals[0].status === 'REJECTED'
                                  ? 'bg-red-900/60 text-red-200 border border-red-700'
                                  : 'bg-yellow-900/60 text-yellow-200 border border-yellow-700'
                              }`}>
                              {request.approvals[0].status}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-900/60 text-gray-200 border border-gray-700">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                          <button
                            onClick={() => handleOpenDetailsModal(request)}
                            className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            Details
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
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-900/90 to-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-6 max-w-lg w-full relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">
                  Create New Request
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    reset();
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Request Type */}
                <div>
                  <label htmlFor="type" className="block text-sm font-medium text-gray-200 mb-1">
                    Request Type
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                    <select
                      {...register('type')}
                      className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none"
                    >
                      <option value="OD" className="bg-gray-800">On Duty (OD)</option>
                      <option value="LEAVE" className="bg-gray-800">Leave</option>
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.type && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.type.message}
                    </p>
                  )}
                </div>

                {/* Category - Only show for OD requests */}
                {requestType === 'OD' && (
                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-200 mb-1">
                      Category
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <select
                        {...register('category')}
                        className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none"
                      >
                        <option value="PROJECT" className="bg-gray-800">Project</option>
                        <option value="SIH" className="bg-gray-800">SIH</option>
                        <option value="SYMPOSIUM" className="bg-gray-800">Symposium</option>
                        <option value="OTHER" className="bg-gray-800">Other</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.category && (
                      <p className="mt-2 text-sm text-red-400 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {errors.category.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Team or Individual Request */}
                <div className="flex items-center">
                  <input
                    id="isTeamRequest"
                    type="checkbox"
                    {...register('isTeamRequest')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-800/80"
                  />
                  <label htmlFor="isTeamRequest" className="ml-2 block text-sm text-gray-200">
                    This is a team request
                  </label>
                </div>

                {/* Student Selection */}
                {isTeamRequest ? (
                  <div>
                    <label htmlFor="students" className="block text-sm font-medium text-gray-200 mb-1">
                      Team Members
                    </label>
                    <Controller
                      name="students"
                      control={control}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti={true}
                          options={students.map(student => ({
                            value: student.user.id,
                            label: `${student?.user?.name || 'Unknown'}`
                          }))}
                          className="mt-1 block w-full"
                          classNamePrefix="react-select"
                          placeholder="Select team members..."
                          value={field.value || []}
                          onChange={(val) => field.onChange(val || [])}
                          styles={{
                            control: (base) => ({
                              ...base,
                              backgroundColor: 'rgba(31, 41, 55, 0.8)',
                              borderColor: 'rgb(75, 85, 99)',
                              '&:hover': {
                                borderColor: 'rgb(99, 102, 241)'
                              },
                            }),
                            menu: (base) => ({
                              ...base,
                              backgroundColor: 'rgb(31, 41, 55)'
                            }),
                            option: (base, { isFocused, isSelected }) => ({
                              ...base,
                              backgroundColor: isSelected 
                                ? 'rgb(67, 56, 202)' 
                                : isFocused 
                                  ? 'rgba(67, 56, 202, 0.2)' 
                                  : undefined,
                              ':active': {
                                backgroundColor: 'rgba(67, 56, 202, 0.4)'
                              },
                              color: 'white'
                            }),
                            multiValue: (base) => ({
                              ...base,
                              backgroundColor: 'rgba(67, 56, 202, 0.2)'
                            }),
                            multiValueLabel: (base) => ({
                              ...base,
                              color: 'white'
                            }),
                            multiValueRemove: (base) => ({
                              ...base,
                              color: 'white',
                              ':hover': {
                                backgroundColor: 'rgb(220, 38, 38)',
                                color: 'white'
                              }
                            }),
                            input: (base) => ({
                              ...base,
                              color: 'white'
                            }),
                            placeholder: (base) => ({
                              ...base,
                              color: 'rgb(156, 163, 175)'
                            }),
                          }}
                        />
                      )}
                    />
                    {errors.students && (
                      <p className="mt-2 text-sm text-red-400 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {errors.students.message}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <label htmlFor="currentStudent" className="block text-sm font-medium text-gray-200 mb-1">
                      Student
                    </label>
                    <div className="mt-1 block w-full rounded-lg border border-gray-600 bg-gray-800/80 px-4 py-3 text-gray-200">
                      {user?.email || 'Current Student'}
                    </div>
                  </div>
                )}

                {/* Needs Lab */}
                <div className="flex items-center">
                  <input
                    id="needsLab"
                    type="checkbox"
                    {...register('needsLab')}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-600 rounded bg-gray-800/80"
                  />
                  <label htmlFor="needsLab" className="ml-2 block text-sm text-gray-200">
                    Requires Lab Access
                  </label>
                </div>

                {/* Lab Selection (conditional) */}
                {needsLab && (
                  <div>
                    <label htmlFor="labId" className="block text-sm font-medium text-gray-200 mb-1">
                      Select Lab
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                      </div>
                      <select
                        {...register('labId')}
                        className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none"
                      >
                        <option value="" className="bg-gray-800">Select a lab</option>
                        {labs.map(lab => (
                          <option key={lab.id} value={lab.id} className="bg-gray-800">{lab.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    {errors.labId && (
                      <p className="mt-2 text-sm text-red-400 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {errors.labId.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Reason */}
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-gray-200 mb-1">
                    Reason
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      {...register('reason')}
                      placeholder="Enter reason for request"
                      className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors"
                    />
                  </div>
                  {errors.reason && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.reason.message}
                    </p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-200 mb-1">
                    Description (Optional)
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <textarea
                      rows={3}
                      {...register('description')}
                      placeholder="Provide additional details (optional)"
                      className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors"
                    />
                  </div>
                  {errors.description && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.description.message}
                    </p>
                  )}
                </div>

                {/* Date Range */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-200 mb-1">
                      Start Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        {...register('startDate')}
                        className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors"
                      />
                    </div>
                    {errors.startDate && (
                      <p className="mt-2 text-sm text-red-400 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-200 mb-1">
                      End Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <input
                        type="date"
                        {...register('endDate')}
                        className="pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white border-gray-600 focus:border-indigo-500 focus:ring-indigo-500 shadow-sm focus:outline-none focus:ring-2 transition-colors"
                      />
                    </div>
                    {errors.endDate && (
                      <p className="mt-2 text-sm text-red-400 flex items-center">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        {errors.endDate.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        <span>Submitting...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Submit Request
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {isDetailsModalOpen && selectedRequest && (
        <ODRequestDetailsModel selectedRequest={selectedRequest} handleCloseDetailsModal={handleCloseDetailsModal} labs={labs} />
      )}
    </>
  );
}