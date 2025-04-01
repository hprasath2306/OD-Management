import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { teacherDesignationApi, TeacherDesignation } from '../api/teacherDesignation';
import { teacherApi } from '../api/teacher';
import { designationApi } from '../api/designation';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, useParams } from 'react-router-dom';

// Form validation schemas
const designationSchema = z.object({
  designationId: z.string().min(1, 'Please select a designation'),
});

type DesignationFormValues = z.infer<typeof designationSchema>;

export function TeacherDesignations() {
  const { teacherId } = useParams<{ teacherId: string; departmentId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDesignation, setEditingDesignation] = useState<TeacherDesignation | null>(null);
  const queryClient = useQueryClient();

  // Fetch teacher
  const { data: teacher, isLoading: isTeacherLoading } = useQuery({
    queryKey: ['teacher', teacherId],
    queryFn: () => teacherApi.getTeacher(teacherId!),
    enabled: !!teacherId,
  });

  // Fetch all available designations
  const { data: allDesignations = [], isLoading: isAllDesignationsLoading } = useQuery({
    queryKey: ['designations'],
    queryFn: designationApi.getAllDesignations,
  });

  // Fetch teacher designations
  const { data: teacherDesignations = [], isLoading: isTeacherDesignationsLoading, error } = useQuery({
    queryKey: ['teacherDesignations', teacherId],
    queryFn: () => teacherDesignationApi.getDesignationsByTeacher(teacherId!),
    enabled: !!teacherId,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<DesignationFormValues>({
    resolver: zodResolver(designationSchema),
  });

  // Create designation mutation
  const createMutation = useMutation({
    mutationFn: (data: DesignationFormValues) =>
      teacherDesignationApi.createDesignation({ ...data, teacherId: teacherId! }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherDesignations', teacherId] });
      toast.success('Designation added successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add designation');
      console.error('Create error:', error.response?.data);
    },
  });

  // Update designation mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: { designationId: string } }) =>
      teacherDesignationApi.updateDesignation(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherDesignations', teacherId] });
      toast.success('Designation updated successfully');
      setIsModalOpen(false);
      setEditingDesignation(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update designation');
      console.error('Update error:', error.response?.data);
    },
  });

  // Delete designation mutation
  const deleteMutation = useMutation({
    mutationFn: teacherDesignationApi.deleteDesignation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teacherDesignations', teacherId] });
      toast.success('Designation removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to remove designation');
      console.error('Delete error:', error.response?.data);
    },
  });

  const onSubmit = async (data: DesignationFormValues) => {
    if (editingDesignation) {
      updateMutation.mutate({ id: editingDesignation.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (designation: TeacherDesignation) => {
    setEditingDesignation(designation);
    setValue('designationId', designation.designationId);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to remove this designation?')) {
      deleteMutation.mutate(id);
    }
  };

  // Helper function to get designation name by ID
  const getDesignationName = (designationId: string): string => {
    const designation = allDesignations.find(d => d.id === designationId);
    if (!designation) return 'Unknown';
    
    return designation.role.replace('_', ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  };

  if (isTeacherLoading || isTeacherDesignationsLoading || isAllDesignationsLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <h3 className="text-lg font-medium text-gray-900">Error loading designations</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['teacherDesignations', teacherId] })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
          <button
              onClick={() => navigate(-1)}
              className="mr-2 text-blue-600 hover:text-blue-900"
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
            <h1 className="text-3xl font-bold leading-tight text-gray-900">
              Designations - {teacher?.user.name}
            </h1>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <p className="mt-2 text-sm text-gray-700">
                  A list of all designations for {teacher?.user.name}.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDesignation(null);
                    reset();
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Designation
                </button>
              </div>
            </div>

            {/* Designations Table */}
            <div className="mt-8 flex flex-col">
              <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            Role
                          </th>
                          <th
                            scope="col"
                            className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                          >
                            <span className="sr-only">Actions</span>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {teacherDesignations.length === 0 ? (
                          <tr>
                            <td
                              colSpan={2}
                              className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-center"
                            >
                              No designations found
                            </td>
                          </tr>
                        ) : (
                          teacherDesignations.map((designation) => (
                            <tr key={designation.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {getDesignationName(designation.designationId)}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => handleEdit(designation)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(designation.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Remove
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-lg font-medium mb-4">
                    {editingDesignation ? 'Edit Designation' : 'Add Designation'}
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label
                        htmlFor="designationId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Designation
                      </label>
                      <select
                        {...register('designationId')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.designationId ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="">Select a designation</option>
                        {allDesignations.map((designation) => (
                          <option key={designation.id} value={designation.id}>
                            {designation.role.replace('_', ' ').replace(/\w\S*/g, (txt) => {
                              return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
                            })}
                          </option>
                        ))}
                      </select>
                      {errors.designationId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.designationId.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingDesignation(null);
                          reset();
                        }}
                        className="inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={createMutation.isPending || updateMutation.isPending}
                        className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      >
                        {createMutation.isPending || updateMutation.isPending ? (
                          <Spinner size="sm" />
                        ) : editingDesignation ? (
                          'Update'
                        ) : (
                          'Add'
                        )}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
} 