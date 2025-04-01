import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { flowTemplateApi, flowStepApi, FlowStep, CreateFlowStepDto, Role } from '../api/flowTemplate';
import { Spinner } from '../components/ui/Spinner';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useParams, useNavigate } from 'react-router-dom';

// Form validation schema
const flowStepSchema = z.object({
  sequence: z.number().min(1, 'Sequence must be at least 1'),
  role: z.enum(['TUTOR', 'YEAR_INCHARGE', 'HOD', 'LAB_INCHARGE'] as [Role, ...Role[]]),
});

type FlowStepFormValues = z.infer<typeof flowStepSchema>;

export function FlowSteps() {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStep, setEditingStep] = useState<FlowStep | null>(null);
  const queryClient = useQueryClient();

  // Form setup
  const { register, handleSubmit, reset, formState: { errors } } = useForm<FlowStepFormValues>({
    resolver: zodResolver(flowStepSchema),
    defaultValues: {
      sequence: 1,
      role: 'TUTOR',
    },
  });

  // Queries
  const { data: template, isLoading: isTemplateLoading } = useQuery({
    queryKey: ['flowTemplate', templateId],
    queryFn: () => flowTemplateApi.getFlowTemplate(templateId!),
    enabled: !!templateId,
    retry: 3,
    retryDelay: 1000,
  });

  const { data: steps = [], isLoading: isStepsLoading } = useQuery({
    queryKey: ['flowSteps', templateId],
    queryFn: () => flowStepApi.getFlowStepsByTemplate(templateId!),
    enabled: !!templateId,
    retry: 3,
    retryDelay: 1000,
  });

  // Mutations
  const createStepMutation = useMutation({
    mutationFn: (data: CreateFlowStepDto) => flowStepApi.createFlowStep(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flowSteps', templateId] });
      toast.success('Flow step created successfully');
      setIsModalOpen(false);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create flow step');
    },
  });

  const updateStepMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: FlowStepFormValues }) => 
      flowStepApi.updateFlowStep(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flowSteps', templateId] });
      toast.success('Flow step updated successfully');
      setIsModalOpen(false);
      setEditingStep(null);
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update flow step');
    },
  });

  const deleteStepMutation = useMutation({
    mutationFn: (id: string) => flowStepApi.deleteFlowStep(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flowSteps', templateId] });
      toast.success('Flow step deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete flow step');
    },
  });

  // Form submission handler
  const onSubmit = (data: FlowStepFormValues) => {
    if (editingStep) {
      updateStepMutation.mutate({ id: editingStep.id, data });
    } else {
      createStepMutation.mutate({
        ...data,
        flowTemplateId: templateId!,
      });
    }
  };

  const isLoading = isTemplateLoading || isStepsLoading;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-lg text-gray-700 mb-4">Template not found</p>
        <button
          onClick={() => navigate('/flow-templates')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Back to Templates
        </button>
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.sequence - b.sequence);

  return (
    <>
      <header>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/flow-templates')}
              className="mr-2 text-blue-600 hover:text-blue-900"
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
              Flow Steps - {template.name}
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
                  Manage steps for this flow template.
                </p>
              </div>
              <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                <button
                  type="button"
                  onClick={() => {
                    setEditingStep(null);
                    reset({ 
                      sequence: sortedSteps.length > 0 
                        ? sortedSteps[sortedSteps.length - 1].sequence + 1 
                        : 1, 
                      role: 'TUTOR' 
                    });
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 sm:w-auto"
                >
                  Add Step
                </button>
              </div>
            </div>

            {/* Flow Steps Table */}
            {sortedSteps.length === 0 ? (
              <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
                <p className="text-gray-500 mb-4">No steps have been added to this template yet.</p>
                <p className="text-gray-500">Click the "Add Step" button to create your first step.</p>
              </div>
            ) : (
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
                              Sequence
                            </th>
                            <th
                              scope="col"
                              className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
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
                          {sortedSteps.map((step: FlowStep) => (
                            <tr key={step.id}>
                              <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-6">
                                {step.sequence}
                              </td>
                              <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                {step.role}
                              </td>
                              <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                <button
                                  onClick={() => {
                                    setEditingStep(step);
                                    reset({
                                      sequence: step.sequence,
                                      role: step.role,
                                    });
                                    setIsModalOpen(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-900 mr-4"
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => {
                                    if (window.confirm('Are you sure you want to delete this step?')) {
                                      deleteStepMutation.mutate(step.id);
                                    }
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                >
                                  Delete
                                </button>
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
                      {editingStep ? 'Edit Flow Step' : 'Add Flow Step'}
                    </h3>
                    <div className="mt-2">
                      <div className="space-y-4">
                        <div>
                          <label htmlFor="sequence" className="block text-sm font-medium text-gray-700">
                            Sequence
                          </label>
                          <input
                            type="number"
                            {...register('sequence', { valueAsNumber: true })}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          />
                          {errors.sequence && (
                            <p className="mt-1 text-sm text-red-600">{errors.sequence.message}</p>
                          )}
                        </div>
                        <div>
                          <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                            Role
                          </label>
                          <select
                            {...register('role')}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          >
                            <option value="TUTOR">Tutor</option>
                            <option value="YEAR_INCHARGE">Year Incharge</option>
                            <option value="HOD">HOD</option>
                            <option value="LAB_INCHARGE">Lab Incharge</option>
                          </select>
                          {errors.role && (
                            <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                  <button
                    type="submit"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm"
                  >
                    {editingStep ? 'Update' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setEditingStep(null);
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