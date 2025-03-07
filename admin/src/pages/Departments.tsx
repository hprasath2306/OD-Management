import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { departmentApi, Department, CreateDepartmentDto, UpdateDepartmentDto } from '../api/department';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';

// Form validation schemas
const departmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  code: z.string().min(2, 'Code must be at least 2 characters'),
});

type DepartmentFormValues = z.infer<typeof departmentSchema>;

export function Departments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const queryClient = useQueryClient();

  // Fetch departments
  const { data: departments = [], isLoading, error } = useQuery({
    queryKey: ['departments'],
    queryFn: departmentApi.getAllDepartments,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartmentFormValues>({
    resolver: zodResolver(departmentSchema),
    defaultValues: editingDepartment || {
      name: '',
      code: '',
    },
  });

  // Create department mutation
  const createMutation = useMutation({
    mutationFn: departmentApi.createDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create department');
    },
  });

  // Update department mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDepartmentDto }) =>
      departmentApi.updateDepartment(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department updated successfully');
      setIsModalOpen(false);
      setEditingDepartment(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update department');
    },
  });

  // Delete department mutation
  const deleteMutation = useMutation({
    mutationFn: departmentApi.deleteDepartment,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['departments'] });
      toast.success('Department deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete department');
    },
  });

  const onSubmit = async (data: DepartmentFormValues) => {
    if (editingDepartment) {
      updateMutation.mutate({ id: editingDepartment.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    reset(department);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this department?')) {
      deleteMutation.mutate(id);
    }
  };

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
          <h3 className="text-lg font-medium text-gray-900">Error loading departments</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['departments'] })}
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
          <h1 className="text-3xl font-bold leading-tight text-gray-900">Departments</h1>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <p className="mt-2 text-sm text-gray-700">
                  A list of all departments in the system.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setEditingDepartment(null);
                    reset({ name: '', code: '' });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Department
                </button>
              </div>
            </div>

            {/* Department Table */}
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
                            Code
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Designations
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Teachers
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
                        {departments.length === 0 ? (
                          <tr>
                            <td
                              colSpan={5}
                              className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-center"
                            >
                              No departments found
                            </td>
                          </tr>
                        ) : (
                          departments.map((department) => (
                            <tr key={department.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {department.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {department.code}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <Link
                                  to={`/designations`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </Link>
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                <Link
                                  to={`/departments/${department.id}/teachers`}
                                  className="text-blue-600 hover:text-blue-900"
                                >
                                  View
                                </Link>
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => handleEdit(department)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(department.id)}
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
              <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg p-6 max-w-md w-full">
                  <h2 className="text-lg font-medium mb-4">
                    {editingDepartment ? 'Edit Department' : 'Add Department'}
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
                        htmlFor="code"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Code
                      </label>
                      <input
                        type="text"
                        {...register('code')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.code ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.code && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.code.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingDepartment(null);
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
                        ) : editingDepartment ? (
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