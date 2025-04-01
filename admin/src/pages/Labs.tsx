import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { labApi, Lab, UpdateLabDto } from '../api/lab';
import { departmentApi } from '../api/department';
import { teacherApi } from '../api/teacher';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams } from 'react-router-dom';

// Form validation schema
const labSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  departmentId: z.string().uuid('Please select a department'),
  inchargeId: z.string().uuid('Please select an incharge'),
});

type LabFormValues = z.infer<typeof labSchema>;

export function Labs() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLab, setEditingLab] = useState<Lab | null>(null);
  const queryClient = useQueryClient();
  const { departmentId } = useParams<{ departmentId: string }>();

  // Fetch labs
  const { data: labs = [], isLoading, error } = useQuery({
    queryKey: ['labs', departmentId],
    queryFn: () => departmentId 
      ? labApi.getLabsByDepartment(departmentId) 
      : labApi.getAllLabs(),
  });

  // Fetch departments for dropdown
  const { data: departments = [] } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAllDepartments,
  });

  // Fetch teachers for dropdown
  const { data: teachers = [] } = useQuery({
    queryKey: ['teachers'],
    queryFn: teacherApi.getAllTeachers,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LabFormValues>({
    resolver: zodResolver(labSchema),
    defaultValues: editingLab || {
      name: '',
      departmentId: departmentId || '',
      inchargeId: '',
    },
  });

  // Watch the departmentId to filter teachers
  const watchDepartmentId = watch('departmentId');
  
  // Filter teachers by department
  const filteredTeachers = teachers.filter(
    (teacher) => teacher.departmentId === watchDepartmentId
  );

  // Create lab mutation
  const createMutation = useMutation({
    mutationFn: labApi.createLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      toast.success('Lab created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create lab');
    },
  });

  // Update lab mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLabDto }) =>
      labApi.updateLab(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      toast.success('Lab updated successfully');
      setIsModalOpen(false);
      setEditingLab(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update lab');
    },
  });

  // Delete lab mutation
  const deleteMutation = useMutation({
    mutationFn: labApi.deleteLab,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['labs'] });
      toast.success('Lab deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete lab');
    },
  });

  const onSubmit = async (data: LabFormValues) => {
    if (editingLab) {
      updateMutation.mutate({ id: editingLab.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (lab: Lab) => {
    setEditingLab(lab);
    reset({
      name: lab.name,
      departmentId: lab.departmentId,
      inchargeId: lab.inchargeId,
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this lab?')) {
      deleteMutation.mutate(id);
    }
  };

  // Set departmentId from URL if available
  useEffect(() => {
    if (departmentId) {
      setValue('departmentId', departmentId);
    }
  }, [departmentId, setValue]);

  if (isLoading) {
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
          <h3 className="text-lg font-medium text-gray-900">Error loading labs</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['labs'] })}
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
          <h1 className="text-3xl font-bold leading-tight text-gray-900">
            {departmentId 
              ? `Labs - ${departments.find(d => d.id === departmentId)?.name || 'Department'}`
              : 'Labs'
            }
          </h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <p className="mt-2 text-sm text-gray-700">
                  A list of all labs in the system.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setEditingLab(null);
                    reset({ 
                      name: '', 
                      departmentId: departmentId || '', 
                      inchargeId: '' 
                    });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Lab
                </button>
              </div>
            </div>

            {/* Lab Table */}
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
                            Name
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Department
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Incharge
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
                        {labs.length === 0 ? (
                          <tr>
                            <td
                              colSpan={4}
                              className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-center"
                            >
                              No labs found
                            </td>
                          </tr>
                        ) : (
                          labs.map((lab) => (
                            <tr key={lab.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {lab.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {lab.department?.name || 'Unknown Department'}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {lab.incharge?.user?.name || 'Unknown Incharge'}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => handleEdit(lab)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(lab.id)}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
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
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-lg font-medium mb-4">
                    {editingLab ? 'Edit Lab' : 'Add Lab'}
                  </h2>
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label
                        htmlFor="name"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Name
                      </label>
                      <input
                        type="text"
                        {...register('name')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.name ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="departmentId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Department
                      </label>
                      <select
                        {...register('departmentId')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.departmentId ? 'border-red-300' : ''
                        }`}
                        disabled={!!departmentId}
                      >
                        <option value="">Select Department</option>
                        {departments.map((department) => (
                          <option key={department.id} value={department.id}>
                            {department.name}
                          </option>
                        ))}
                      </select>
                      {errors.departmentId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.departmentId.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="inchargeId"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Incharge
                      </label>
                      <select
                        {...register('inchargeId')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.inchargeId ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="">Select Incharge</option>
                        {filteredTeachers.map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.user?.name || 'Unknown Teacher'}
                          </option>
                        ))}
                      </select>
                      {errors.inchargeId && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.inchargeId.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingLab(null);
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
                        ) : editingLab ? (
                          'Update'
                        ) : (
                          'Create'
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