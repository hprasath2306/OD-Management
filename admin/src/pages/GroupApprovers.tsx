import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { groupApproverApi, GroupApprover, UpdateGroupApproverDto } from '../api/groupApprover';
import { teacherApi } from '../api/teacher';
import { Role } from '../api/designation';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';

// Form validation schemas
const approverSchema = z.object({
  teacherId: z.string().min(1, 'Please select a teacher'),
  role: z.nativeEnum(Role, {
    errorMap: () => ({ message: 'Please select a role' }),
  }),
});

type ApproverFormValues = z.infer<typeof approverSchema>;

export function GroupApprovers() {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApprover, setEditingApprover] = useState<GroupApprover | null>(null);
  const queryClient = useQueryClient();

  // Fetch approvers
  const { data: approvers = [], isLoading: isLoadingApprovers, error: approversError } = useQuery({
    queryKey: ['approvers', groupId],
    queryFn: () => groupApproverApi.getApproversByGroup(groupId!),
    enabled: !!groupId,
  });

  // Fetch teachers for dropdown
  const { data: teachers = [], isLoading: isLoadingTeachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherApi.getAllTeachers,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ApproverFormValues>({
    resolver: zodResolver(approverSchema),
  });

  // Create approver mutation
  const createMutation = useMutation({
    mutationFn: (data: ApproverFormValues) =>
      groupApproverApi.createApprover({ ...data, groupId: groupId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvers', groupId] });
      toast.success('Approver added successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add approver');
    },
  });

  // Update approver mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupApproverDto }) =>
      groupApproverApi.updateApprover(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvers', groupId] });
      toast.success('Approver updated successfully');
      setIsModalOpen(false);
      setEditingApprover(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update approver');
    },
  });

  // Delete approver mutation
  const deleteMutation = useMutation({
    mutationFn: groupApproverApi.deleteApprover,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvers', groupId] });
      toast.success('Approver removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove approver');
    },
  });

  const onSubmit = async (data: ApproverFormValues) => {
    if (editingApprover) {
      updateMutation.mutate({ id: editingApprover.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (approver: GroupApprover) => {
    setEditingApprover(approver);
    setValue('teacherId', approver.teacherId);
    setValue('role', approver.role);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this approver?')) {
      deleteMutation.mutate(id);
    }
  };

  // Helper function to format role for display
  const formatRole = (role: Role): string => {
    return role.replace('_', ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  };

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: Role): string => {
    const colors: Record<Role, string> = {
      [Role.TUTOR]: 'bg-blue-900/60 text-blue-200 border-blue-700',
      [Role.YEAR_INCHARGE]: 'bg-purple-900/60 text-purple-200 border-purple-700',
      [Role.HOD]: 'bg-indigo-900/60 text-indigo-200 border-indigo-700',
      [Role.LAB_INCHARGE]: 'bg-teal-900/60 text-teal-200 border-teal-700'
    };
    return colors[role] || 'bg-gray-900/60 text-gray-200 border-gray-700';
  };

  if (isLoadingApprovers || isLoadingTeachers) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (approversError) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-8 max-w-lg">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white">Error loading approvers</h3>
          <p className="mt-1 text-sm text-gray-300">
            {approversError instanceof Error ? approversError.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['approvers', groupId] })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-20 blur-3xl"></div>
        <div className="relative z-10 flex items-center">
          <button
            onClick={() => navigate(-1)}
            className="mr-3 text-purple-400 hover:text-purple-300 transition-colors flex items-center"
            aria-label="Go back"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
          <div>
            <h1 className="text-3xl font-bold text-white">Group Approvers</h1>
            <p className="mt-2 text-purple-200">
              Manage approvers and their roles for this group
            </p>
          </div>
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
              A list of all approvers for this group.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingApprover(null);
              reset();
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Approver
          </button>
        </div>

        {/* Approvers Table */}
        <div className="relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-6 pr-3 text-left text-sm font-medium text-gray-200"
                  >
                    Teacher Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-medium text-gray-200"
                  >
                    Email
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-medium text-gray-200"
                  >
                    Role
                  </th>
                  <th
                    scope="col"
                    className="relative py-3.5 pl-3 pr-6"
                  >
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {approvers.length === 0 ? (
                  <tr>
                    <td
                      colSpan={4}
                      className="py-8 text-center text-sm text-gray-300"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <p>No approvers found</p>
                        <p className="text-gray-400 text-xs mt-2">Add an approver to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  approvers.map((approver) => (
                    <tr key={approver.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">
                        {approver.teacher.user.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        {approver.teacher.user.email}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(approver.role)} border`}>
                          {formatRole(approver.role)}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(approver)}
                            className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(approver.id)}
                            className="text-rose-400 hover:text-rose-300 flex items-center transition-colors"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-gradient-to-br from-gray-900/90 to-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-6 max-w-md w-full relative overflow-hidden">
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-xl font-semibold text-white">
                  {editingApprover ? 'Edit Approver' : 'Add Approver'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingApprover(null);
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
                <div>
                  <label
                    htmlFor="teacherId"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Teacher
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <select
                      {...register('teacherId')}
                      className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white ${
                        errors.teacherId 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none`}
                    >
                      <option value="" className="bg-gray-800">Select a teacher</option>
                      {teachers.map((teacher) => (
                        <option key={teacher.id} value={teacher.id} className="bg-gray-800">
                          {teacher.user.name} ({teacher.user.email})
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.teacherId && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.teacherId.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="role"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Role
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                    </div>
                    <select
                      {...register('role')}
                      className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white ${
                        errors.role 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } shadow-sm focus:outline-none focus:ring-2 transition-colors appearance-none`}
                    >
                      <option value="" className="bg-gray-800">Select a role</option>
                      {Object.values(Role).map((role) => (
                        <option key={role} value={role} className="bg-gray-800">
                          {formatRole(role)}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.role && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.role.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingApprover(null);
                      reset();
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    {createMutation.isPending || updateMutation.isPending ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        <span>Processing...</span>
                      </div>
                    ) : editingApprover ? (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Update Approver
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Add Approver
                      </div>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 