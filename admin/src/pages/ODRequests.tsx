import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../components/ui/Spinner';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'react-hot-toast';
import api from '../api/auth';
import Select from 'react-select';

// Types based on schema
type ODCategory = 'PROJECT' | 'SIH' | 'SYMPOSIUM' | 'OTHER';
type RequestType = 'OD' | 'LEAVE';
type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Student {
  id: string;
  rollNo: string;
  name: string;
  user: {
    id: string;
    name: string;
  };
}

interface Lab {
  id: string;
  name: string;
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
  labId?: string;
  createdAt: string;
  students: { id: string; name: string; rollNo: string }[];
  approvals?: { status: ApprovalStatus }[];
}

// Form validation schema
const odRequestSchema = z.object({
  type: z.enum(['OD', 'LEAVE']),
  category: z.enum(['PROJECT', 'SIH', 'SYMPOSIUM', 'OTHER']).optional(),
  needsLab: z.boolean().default(false),
  reason: z.string().min(1, "Reason is required"),
  description: z.string().optional(),
  startDate: z.string(),
  endDate: z.string(),
  labId: z.string().optional(),
  isTeamRequest: z.boolean().default(false),
  students: z.array(z.object({
    value: z.string(),
    label: z.string()
  })).optional(),
}).refine(
  (data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
  },
  {
    message: "End date must be after or equal to start date",
    path: ["endDate"]
  }
).refine(
  (data) => {
    return !data.needsLab || (data.needsLab && data.labId);
  },
  {
    message: "Lab ID is required when lab access is needed",
    path: ["labId"]
  }
);

type ODRequestFormValues = z.infer<typeof odRequestSchema>;

export function ODRequests() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requests, setRequests] = useState<ODRequest[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [students, setStudents] = useState<Student[]>([]);

  // Form setup
  const { register, handleSubmit, reset, watch, control, setValue, formState: { errors } } = useForm<ODRequestFormValues>({
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
      students: []
    },
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
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <p className="mt-2 text-sm text-gray-700">
                  Manage your OD (On Duty) and Leave requests.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  type="button"
                  onClick={handleOpenModal}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  New Request
                </button>
              </div>
            </div>

            {/* Requests Table */}
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Spinner size="lg" />
              </div>
            ) : requests.length === 0 ? (
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-4">You haven't submitted any requests yet.</p>
                <p className="text-gray-500">Click the "New Request" button to create your first request.</p>
              </div>
            ) : (
              <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                  <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                    <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                      <table className="min-w-full divide-y divide-gray-300">
                        <thead className="bg-gray-50">
                          <tr>
                            <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">Type</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Dates</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Students</th>
                            <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {requests.map((request) => (
                            <tr key={request.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
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
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {request.students?.length > 1 ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    Team ({request.students.length})
                                  </span>
                                ) : (
                                  <span>Individual</span>
                                )}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm">
                                {request.approvals && request.approvals.length > 0 ? (
                                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${request.approvals[0].status === 'APPROVED'
                                      ? 'bg-green-100 text-green-800'
                                      : request.approvals[0].status === 'REJECTED'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}>
                                    {request.approvals[0].status}
                                  </span>
                                ) : (
                                  <span>Pending</span>
                                )}
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

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <form onSubmit={handleSubmit(onSubmit)}>
                <div>
                  <div className="mt-3 text-center sm:mt-5">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Create New Request
                    </h3>
                    <div className="mt-2">
                      <div className="space-y-4">
                        {/* Request Type */}
                        <div>
                          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                            Request Type
                          </label>
                          <select
                            {...register('type')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="OD">On Duty (OD)</option>
                            <option value="LEAVE">Leave</option>
                          </select>
                          {errors.type && (
                            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
                          )}
                        </div>

                        {/* Category - Only show for OD requests */}
                        {requestType === 'OD' && (
                          <div>
                            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                              Category
                            </label>
                            <select
                              {...register('category')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="PROJECT">Project</option>
                              <option value="SIH">SIH</option>
                              <option value="SYMPOSIUM">Symposium</option>
                              <option value="OTHER">Other</option>
                            </select>
                            {errors.category && (
                              <p className="mt-1 text-sm text-red-600">{errors.category.message}</p>
                            )}
                          </div>
                        )}

                        {/* Team or Individual Request */}
                        <div className="flex items-center">
                          <input
                            id="isTeamRequest"
                            type="checkbox"
                            {...register('isTeamRequest')}
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="isTeamRequest" className="ml-2 block text-sm text-gray-900">
                            This is a team request
                          </label>
                        </div>

                        {/* Student Selection */}
                        {isTeamRequest ? (
                          <div>
                            <label htmlFor="students" className="block text-sm font-medium text-gray-700">
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
                                  placeholder="Select team members..."
                                  value={field.value || []}
                                  onChange={(val) => field.onChange(val || [])}
                                />
                              )}
                            />
                            {errors.students && (
                              <p className="mt-1 text-sm text-red-600">{errors.students.message}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <label htmlFor="currentStudent" className="block text-sm font-medium text-gray-700">
                              Student
                            </label>
                            <div className="mt-1 block w-full rounded-md border-gray-300 shadow-sm bg-gray-100 px-3 py-2 text-gray-700">
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
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="needsLab" className="ml-2 block text-sm text-gray-900">
                            Requires Lab Access
                          </label>
                        </div>

                        {/* Lab Selection (conditional) */}
                        {needsLab && (
                          <div>
                            <label htmlFor="labId" className="block text-sm font-medium text-gray-700">
                              Select Lab
                            </label>
                            <select
                              {...register('labId')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            >
                              <option value="">Select a lab</option>
                              {labs.map(lab => (
                                <option key={lab.id} value={lab.id}>{lab.name}</option>
                              ))}
                            </select>
                            {errors.labId && (
                              <p className="mt-1 text-sm text-red-600">{errors.labId.message}</p>
                            )}
                          </div>
                        )}

                        {/* Reason */}
                        <div>
                          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
                            Reason
                          </label>
                          <input
                            type="text"
                            {...register('reason')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          {errors.reason && (
                            <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
                          )}
                        </div>

                        {/* Description */}
                        <div>
                          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                            Description (Optional)
                          </label>
                          <textarea
                            rows={3}
                            {...register('description')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          {errors.description && (
                            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                          )}
                        </div>

                        {/* Date Range */}
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                              Start Date
                            </label>
                            <input
                              type="date"
                              {...register('startDate')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.startDate && (
                              <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                            )}
                          </div>
                          <div>
                            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                              End Date
                            </label>
                            <input
                              type="date"
                              {...register('endDate')}
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            />
                            {errors.endDate && (
                              <p className="mt-1 text-sm text-red-600">{errors.endDate.message}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                  >
                    {isLoading ? 'Submitting...' : 'Submit'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      reset();
                    }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
} 