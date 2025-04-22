import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { groupApi, Group, UpdateGroupDto } from '../api/group';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useParams } from 'react-router-dom';
import { studentApi } from '../api/student';

// Form validation schemas
const groupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  section: z.string().min(1, 'Section is required'),
  batch: z.string().min(4, 'Batch must be at least 4 characters (e.g., 2024)'),
});

type GroupFormValues = z.infer<typeof groupSchema>;

export function Groups() {
  const { departmentId } = useParams<{ departmentId: string }>();
  // const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const queryClient = useQueryClient();

  // Fetch groups
  const { data: groups = [], isLoading, error } = useQuery({
    queryKey: ['groups', departmentId],
    queryFn: () => groupApi.getGroupsByDepartment(departmentId!),
    enabled: !!departmentId,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupFormValues>({
    resolver: zodResolver(groupSchema),
    defaultValues: {
      name: '',
      section: '',
      batch: '',
    },
  });

  // Create group mutation
  const createMutation = useMutation({
    mutationFn: (data: GroupFormValues) =>
      groupApi.createGroup({ ...data, departmentId: departmentId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', departmentId] });
      toast.success('Group created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create group');
    },
  });

  // Update group mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGroupDto }) =>
      groupApi.updateGroup(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', departmentId] });
      toast.success('Group updated successfully');
      setIsModalOpen(false);
      setEditingGroup(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update group');
    },
  });

  // Delete group mutation
  const deleteMutation = useMutation({
    mutationFn: groupApi.deleteGroup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups', departmentId] });
      toast.success('Group deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete group');
    },
  });

  const resetGroupODCountsMutation = useMutation({
    mutationFn: studentApi.resetGroupODCounts,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      toast.success('OD counts reset successfully for all students in the group');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reset OD counts');
    },
  });

  const onSubmit = async (data: GroupFormValues) => {
    if (editingGroup) {
      updateMutation.mutate({ id: editingGroup.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (group: Group) => {
    setEditingGroup(group);
    reset({
      name: group.name,
      section: group.section,
      batch: group.batch,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this group?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleResetGroupODCounts = (groupId: string) => {
    if (window.confirm('Are you sure you want to reset OD counts for all students in this group?')) {
      resetGroupODCountsMutation.mutate(groupId);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-8 max-w-lg">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white">Error loading groups</h3>
          <p className="mt-1 text-sm text-gray-300">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['groups', departmentId] })}
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
          <Link
            to="/departments"
            className="mr-3 text-purple-400 hover:text-purple-300 transition-colors flex items-center"
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
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">Groups</h1>
            <p className="mt-2 text-purple-200">
              Manage student groups in this department
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
              A list of all groups in this department.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingGroup(null);
              reset({ name: '', section: '', batch: '' });
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Group
          </button>
        </div>

        {/* Groups Table */}
        <div className="relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-6 pr-3 text-left text-sm font-medium text-gray-200"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-medium text-gray-200"
                  >
                    Section
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-medium text-gray-200"
                  >
                    Batch
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-medium text-gray-200"
                  >
                    Approvers
                  </th>
                  <th
                    scope="col"
                    className="px-3 py-3.5 text-left text-sm font-medium text-gray-200"
                  >
                    Students
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
                {groups.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-8 text-center text-sm text-gray-300"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                        </svg>
                        <p>No groups found</p>
                        <p className="text-gray-400 text-xs mt-2">Create a new group to get started</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  groups.map((group) => (
                    <tr key={group.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">
                        {group.name}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-900/60 text-indigo-200 border border-indigo-700">
                          {group.section}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900/60 text-purple-200 border border-purple-700">
                          {group.batch}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <Link
                          to={`/departments/${departmentId}/groups/${group.id}/approvers`}
                          className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-300">
                        <Link
                          to={`/departments/${departmentId}/groups/${group.id}/students`}
                          className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </Link>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(group)}
                            className="text-indigo-400 hover:text-indigo-300 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(group.id)}
                            className="text-rose-400 hover:text-rose-300 transition-colors"
                          >
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleResetGroupODCounts(group.id);
                            }}
                            className="text-blue-400 hover:text-blue-300 flex items-center ml-3"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Reset ODs
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
                  {editingGroup ? 'Edit Group' : 'Add Group'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingGroup(null);
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
                    htmlFor="name"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Name
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      {...register('name')}
                      placeholder="Enter group name"
                      className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white ${
                        errors.name 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    />
                  </div>
                  {errors.name && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="section"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Section
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h7" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      {...register('section')}
                      placeholder="Enter section (e.g., A, B, C)"
                      className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white ${
                        errors.section 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    />
                  </div>
                  {errors.section && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.section.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="batch"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Batch
                  </label>
                  <div className="relative rounded-md shadow-sm">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <input
                      type="text"
                      {...register('batch')}
                      placeholder="Enter batch year (e.g., 2024)"
                      className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white ${
                        errors.batch 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    />
                  </div>
                  {errors.batch && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.batch.message}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingGroup(null);
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
                    ) : editingGroup ? (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                        </svg>
                        Update Group
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Group
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