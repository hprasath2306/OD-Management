import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { studentApi, Student, CreateStudentDto, UpdateStudentDto } from '../api/student';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import * as XLSX from 'xlsx';

// Form validation schemas
const studentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(10, 'Phone number must be at least 10 characters'),
  rollNo: z.string().min(1, 'Roll number is required'),
  regNo: z.string().min(1, 'Registration number is required'),
  attendancePercentage: z.number().min(0, 'Attendance must be at least 0%').max(100, 'Attendance cannot exceed 100%'),
});

type StudentFormValues = z.infer<typeof studentSchema>;

export function Students() {
  const { groupId, departmentId } = useParams<{ groupId: string; departmentId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch students
  const { data: students = [], isLoading, error } = useQuery({
    queryKey: ['students', groupId],
    queryFn: () => studentApi.getStudentsByGroup(groupId!),
    enabled: !!groupId,
  });

  // Form handling
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<StudentFormValues>({
    resolver: zodResolver(studentSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      rollNo: '',
      regNo: '',
      attendancePercentage: 0,
    },
  });

  // Create student mutation
  const createMutation = useMutation({
    mutationFn: (data: StudentFormValues) =>
      studentApi.createStudent({ 
        ...data, 
        groupId: groupId!,
        departmentId: departmentId!
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', groupId] });
      toast.success('Student created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create student');
      console.error('Create student error:', error.response?.data);
    },
  });

  // Update student mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentDto }) =>
      studentApi.updateStudent(id, {
        ...data,
        departmentId: departmentId!
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', groupId] });
      toast.success('Student updated successfully');
      setIsModalOpen(false);
      setEditingStudent(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update student');
      console.error('Update student error:', error.response?.data);
    },
  });

  // Delete student mutation
  const deleteMutation = useMutation({
    mutationFn: studentApi.deleteStudent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', groupId] });
      toast.success('Student deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete student');
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
        const students = jsonData.map((row: any) => ({
          name: row.name,
          email: row.email,
          phone: row.phone?.toString() || '',
          rollNo: row.rollNo,
          regNo: String(row.regNo),
          attendancePercentage: Number(row.attendancePercentage) || 0,
          departmentId: departmentId!,
          groupId: groupId!
        }));

        // Send the transformed data to the API
        await studentApi.bulkUploadStudents({ students });
      } catch (error) {
        console.error('Error processing Excel file:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students', groupId] });
      toast.success('Students uploaded successfully');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to upload students');
      console.error('Bulk upload error:', error.response?.data);
    },
  });

  const onSubmit = async (data: StudentFormValues) => {
    if (editingStudent) {
      updateMutation.mutate({ id: editingStudent.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setValue('name', student.user.name);
    setValue('email', student.user.email);
    setValue('phone', student.user.phone);
    setValue('rollNo', student.rollNo);
    setValue('regNo', student.regNo);
    setValue('attendancePercentage', student.attendancePercentage);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      deleteMutation.mutate(id);
    }
  };

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
          <h3 className="text-lg font-medium text-gray-900">Error loading students</h3>
          <p className="mt-1 text-sm text-gray-500">
            {error instanceof Error ? error.message : 'Something went wrong'}
          </p>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['students', groupId] })}
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
            <h1 className="text-3xl font-bold leading-tight text-gray-900">Students</h1>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto sm:px-6 lg:px-8">
          <div className="px-4 py-8 sm:px-0">
            <div className="sm:flex sm:items-center">
              <div className="sm:flex-auto">
                <p className="mt-2 text-sm text-gray-700">
                  A list of all students in this group.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none space-x-4">
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
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  {bulkUploadMutation.isPending ? (
                    <Spinner size="sm" className="mr-2" />
                  ) : (
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
                  )}
                  Bulk Upload
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingStudent(null);
                    reset();
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Student
                </button>
              </div>
            </div>

            {/* Add download template button */}
            <div className="mt-4">
              <button
                type="button"
                onClick={() => {
                  // Create a workbook with sample data
                  const headers = [
                    'name',
                    'email',
                    'phone',
                    'rollNo',
                    'regNo',
                    'attendancePercentage'
                  ];
                  
                  const sample = [
                    'John Doe',
                    'john@example.com',
                    '1234567890',
                    '21CS101',
                    '2021CSE101',
                    '85'
                  ];

                  const ws = XLSX.utils.aoa_to_sheet([headers, sample]);
                  const wb = XLSX.utils.book_new();
                  XLSX.utils.book_append_sheet(wb, ws, 'Students');
                  
                  // Generate and download the Excel file
                  XLSX.writeFile(wb, 'student_template.xlsx');
                }}
                className="text-sm text-blue-600 hover:text-blue-900"
              >
                Download Template
              </button>
            </div>

            {/* Students Table */}
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
                            Email
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Phone
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Roll No
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Registration No
                          </th>
                          <th
                            scope="col"
                            className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                          >
                            Attendance %
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
                        {students.length === 0 ? (
                          <tr>
                            <td
                              colSpan={7}
                              className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 text-center"
                            >
                              No students found
                            </td>
                          </tr>
                        ) : (
                          students.map((student) => (
                            <tr key={student.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {student.user.name}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {student.user.email}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {student.user.phone}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {student.rollNo}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {student.regNo}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {student.attendancePercentage}%
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => handleEdit(student)}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDelete(student.id)}
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
                    {editingStudent ? 'Edit Student' : 'Add Student'}
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
                        htmlFor="email"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Email
                      </label>
                      <input
                        type="email"
                        {...register('email')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.email ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.email.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="phone"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Phone
                      </label>
                      <input
                        type="text"
                        {...register('phone')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.phone ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.phone.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="rollNo"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Roll No
                      </label>
                      <input
                        type="text"
                        {...register('rollNo')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.rollNo ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.rollNo && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.rollNo.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="regNo"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Registration No
                      </label>
                      <input
                        type="text"
                        {...register('regNo')}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.regNo ? 'border-red-300' : ''
                        }`}
                      />
                      {errors.regNo && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.regNo.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label
                        htmlFor="attendancePercentage"
                        className="block text-sm font-medium text-gray-700"
                      >
                        Attendance Percentage
                      </label>
                      <input
                        type="number"
                        {...register('attendancePercentage', { valueAsNumber: true })}
                        className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
                          errors.attendancePercentage ? 'border-red-300' : ''
                        }`}
                        min="0"
                        max="100"
                        step="0.01"
                      />
                      {errors.attendancePercentage && (
                        <p className="mt-1 text-sm text-red-600">
                          {errors.attendancePercentage.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          setEditingStudent(null);
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
                        ) : editingStudent ? (
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