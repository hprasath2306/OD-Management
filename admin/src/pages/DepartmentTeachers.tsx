import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { useParams, Link } from 'react-router-dom';
import { teacherApi, Teacher, CreateTeacherDto, UpdateTeacherDto } from '../api/teacher';
import { departmentApi } from '../api/department';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as XLSX from 'xlsx';

// Form validation schemas
const teacherSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  phone: z.string().min(10, 'Phone number must be at least 10 digits'),
});

type TeacherFormValues = z.infer<typeof teacherSchema>;

export function DepartmentTeachers() {
  const { departmentId } = useParams<{ departmentId: string }>();
  // const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch department
  const { data: department, isLoading: isDepartmentLoading } = useQuery({
    queryKey: ['department', departmentId],
    queryFn: () => departmentApi.getDepartment(departmentId!),
    enabled: !!departmentId,
  });

  // Fetch teachers for this department
  const { data: teachers = [], isLoading: isTeachersLoading, error } = useQuery({
    queryKey: ['teachers', departmentId],
    queryFn: () => teacherApi.getTeachersByDepartment(departmentId!),
    enabled: !!departmentId,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeacherFormValues>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Update form values when editing teacher changes
  useEffect(() => {
    if (editingTeacher) {
      reset({
        name: editingTeacher.user.name,
        email: editingTeacher.user.email,
        phone: editingTeacher.user.phone || '',
      });
    }
  }, [editingTeacher, reset]);

  // Create teacher mutation
  const createMutation = useMutation({
    mutationFn: (data: TeacherFormValues) => {
      const teacherData: CreateTeacherDto = {
        ...data,
        departmentId: departmentId!,
      };
      return teacherApi.createTeacher(teacherData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers', departmentId] });
      toast.success('Teacher created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create teacher');
    },
  });

  // Update teacher mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTeacherDto }) =>
      teacherApi.updateTeacher(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers', departmentId] });
      toast.success('Teacher updated successfully');
      setIsModalOpen(false);
      setEditingTeacher(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update teacher');
    },
  });

  // Delete teacher mutation
  const deleteMutation = useMutation({
    mutationFn: teacherApi.deleteTeacher,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers', departmentId] });
      toast.success('Teacher deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete teacher');
    },
  });

  // Add bulk upload mutation
  const bulkUploadMutation = useMutation({
    mutationFn: async (file: File) => {
      try {
        // Read the Excel file
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Validate and transform the data
        const teachers = jsonData.map((row: any) => ({
          name: row.name,
          email: row.email,
          phone: row.phone?.toString() || '',
          password: row.password?.toString() || '',
          departmentId: departmentId!
        }));

        // Send the transformed data to the API
        await teacherApi.bulkUploadTeachers({ teachers });
      } catch (error) {
        console.error('Error processing Excel file:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teachers', departmentId] });
      toast.success('Teachers uploaded successfully');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload teachers');
      console.error('Bulk upload error:', error.response?.data);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check if it's an Excel file
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }

    bulkUploadMutation.mutate(file);
  };

  const onSubmit = async (data: TeacherFormValues) => {
    try {
      if (editingTeacher) {
        // For update, include the departmentId
        updateMutation.mutate({ 
          id: editingTeacher.id, 
          data: {
            ...data,
            departmentId: departmentId!,
          } 
        });
      } else {
        // For create
        createMutation.mutate(data);
      }
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this teacher?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isDepartmentLoading || isTeachersLoading) {
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
          <h3 className="text-lg font-medium text-white">Error loading teachers</h3>
          <p className="mt-1 text-sm text-gray-300">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['teachers', departmentId] })}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900"
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
            className="mr-3 text-blue-400 hover:text-blue-300 transition-colors flex items-center"
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
            <h1 className="text-3xl font-bold text-white">
              Teachers - {department?.name}
            </h1>
            <p className="mt-2 text-purple-200">
              Manage faculty members in the {department?.name} department
            </p>
          </div>
        </div>
      </div>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            {/* Content */}
            <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
              <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl"></div>
              <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>
              
              {/* Header Actions */}
              <div className="px-6 py-5 border-b border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 relative z-10">
                <div>
                  <p className="text-gray-300 text-sm">
                    A list of all teachers in the {department?.name} department.
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Add bulk upload button */}
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".xlsx,.xls"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    {bulkUploadMutation.isPending ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        <span>Uploading...</span>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg
                          className="h-4 w-4 mr-2"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                          />
                        </svg>
                        Bulk Upload
                      </div>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingTeacher(null);
                      reset();
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Teacher
                  </button>
                </div>
              </div>

              {/* Add download template button */}
              <div className="px-6 py-3 bg-gray-800/30 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    // Create a workbook with sample data
                    const headers = [
                      'name',
                      'email',
                      'phone',
                      'password'
                    ];
                    
                    const sample = [
                      'John Doe',
                      'john@example.com',
                      '1234567890',
                      'password'
                    ];

                    const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
                    const wb = XLSX.utils.book_new();
                    XLSX.utils.book_append_sheet(wb, ws, 'Teachers');
                    
                    // Generate and download the Excel file
                    XLSX.writeFile(wb, 'teacher_template.xlsx');
                  }}
                  className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                >
                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download Template
                </button>
              </div>

              {/* Teachers Table */}
              <div className="relative z-10">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-800/50">
                      <tr>
                        <th scope="col" className="py-3.5 pl-6 pr-3 text-left text-sm font-medium text-gray-200">
                          Name
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">
                          Email
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">
                          Phone
                        </th>
                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-medium text-gray-200">
                          Designations
                        </th>
                        <th scope="col" className="relative py-3.5 pl-3 pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {teachers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-sm text-gray-300">
                            <div className="flex flex-col items-center justify-center">
                              <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              <p>No teachers found in this department</p>
                              <p className="text-gray-400 text-xs mt-2">Add teachers to get started</p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        teachers.map((teacher) => (
                          <tr key={teacher.id} className="hover:bg-gray-800/30 transition-colors">
                            <td className="py-4 pl-6 pr-3 text-sm font-medium text-white">
                              {teacher.user.name}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-300">
                              {teacher.user.email}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-300">
                              {teacher.user.phone || <span className="text-gray-500 italic">-</span>}
                            </td>
                            <td className="px-3 py-4 text-sm text-gray-300">
                              <Link
                                to={`/departments/${departmentId}/teachers/${teacher.id}/designations`}
                                className="text-blue-400 hover:text-blue-300 font-medium flex items-center transition-colors"
                              >
                                <span>View Designations</span>
                                <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </Link>
                            </td>
                            <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                              <div className="flex justify-end space-x-3">
                                <button
                                  onClick={() => handleEdit(teacher)}
                                  className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(teacher.id)}
                                  className="text-rose-400 hover:text-rose-300 flex items-center transition-colors"
                                >
                                  <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Delete
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
                        {editingTeacher ? 'Edit Teacher' : 'Add Teacher'}
                      </h2>
                      <button 
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingTeacher(null);
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
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            id="name"
                            {...register('name')}
                            placeholder="Enter teacher name"
                            className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white placeholder-gray-400 ${
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
                          htmlFor="email"
                          className="block text-sm font-medium text-gray-200 mb-1"
                        >
                          Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <input
                            type="email"
                            id="email"
                            {...register('email')}
                            placeholder="Enter email address"
                            className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white placeholder-gray-400 ${
                              errors.email 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                            } shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                          />
                        </div>
                        {errors.email && (
                          <p className="mt-2 text-sm text-red-400 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {errors.email.message}
                          </p>
                        )}
                      </div>

                      <div>
                        <label
                          htmlFor="phone"
                          className="block text-sm font-medium text-gray-200 mb-1"
                        >
                          Phone
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                          </div>
                          <input
                            type="text"
                            id="phone"
                            {...register('phone')}
                            placeholder="Enter phone number"
                            className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white placeholder-gray-400 ${
                              errors.phone 
                                ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                                : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                            } shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                          />
                        </div>
                        {errors.phone && (
                          <p className="mt-2 text-sm text-red-400 flex items-center">
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            {errors.phone.message}
                          </p>
                        )}
                      </div>

                      <div className="flex justify-end space-x-3 pt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setIsModalOpen(false);
                            setEditingTeacher(null);
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
                          ) : editingTeacher ? (
                            <div className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                              </svg>
                              Update Teacher
                            </div>
                          ) : (
                            <div className="flex items-center">
                              <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              Create Teacher
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
        </div>
      </main>
    </div>
  );
} 