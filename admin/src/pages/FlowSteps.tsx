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
      <div className="flex items-center justify-center h-48">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-8 max-w-lg">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white">Template not found</h3>
          <p className="mt-1 text-sm text-gray-300">
            The flow template you're looking for doesn't exist or has been removed.
          </p>
          <button
            onClick={() => navigate('/flow-templates')}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900 transition-colors"
          >
            Back to Templates
          </button>
        </div>
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.sequence - b.sequence);

  // Helper function to get role badge color
  const getRoleBadgeColor = (role: Role): string => {
    const colors: Record<Role, string> = {
      'TUTOR': 'bg-blue-900/60 text-blue-200 border-blue-700',
      'YEAR_INCHARGE': 'bg-purple-900/60 text-purple-200 border-purple-700',
      'HOD': 'bg-indigo-900/60 text-indigo-200 border-indigo-700',
      'LAB_INCHARGE': 'bg-teal-900/60 text-teal-200 border-teal-700'
    };
    return colors[role] || 'bg-gray-900/60 text-gray-200 border-gray-700';
  };

  // Helper function to format role for display
  const formatRole = (role: Role): string => {
    return role.replace('_', ' ').replace(/\w\S*/g, (txt) => {
      return txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase();
    });
  };

  return (
    <div className="py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 relative">
        <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-20 blur-3xl"></div>
        <div className="relative z-10 flex items-center">
          <button
            onClick={() => navigate('/flow-templates')}
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
            <h1 className="text-3xl font-bold text-white">Flow Steps - {template.name}</h1>
            <p className="mt-2 text-purple-200">
              Manage approval steps for this flow template
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
              A list of all steps in this flow template.
            </p>
          </div>
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
            className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 transition-colors"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add Step
          </button>
        </div>

        {/* Flow Steps Table */}
        <div className="relative z-10">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-800/50">
                <tr>
                  <th
                    scope="col"
                    className="py-3.5 pl-6 pr-3 text-left text-sm font-medium text-gray-200"
                  >
                    Sequence
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
                {sortedSteps.length === 0 ? (
                  <tr>
                    <td
                      colSpan={3}
                      className="py-8 text-center text-sm text-gray-300"
                    >
                      <div className="flex flex-col items-center justify-center">
                        <svg className="h-12 w-12 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        <p>No steps found</p>
                        <p className="text-gray-400 text-xs mt-2">Add steps to create an approval flow</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedSteps.map((step) => (
                    <tr key={step.id} className="hover:bg-gray-800/30 transition-colors">
                      <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm font-medium text-white">
                        {step.sequence}
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleBadgeColor(step.role)} border`}>
                          {formatRole(step.role)}
                        </span>
                      </td>
                      <td className="relative whitespace-nowrap py-4 pl-3 pr-6 text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setEditingStep(step);
                              reset({
                                sequence: step.sequence,
                                role: step.role,
                              });
                              setIsModalOpen(true);
                            }}
                            className="text-indigo-400 hover:text-indigo-300 flex items-center transition-colors"
                          >
                            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Edit
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm('Are you sure you want to delete this step?')) {
                                deleteStepMutation.mutate(step.id);
                              }
                            }}
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
                  {editingStep ? 'Edit Flow Step' : 'Add Flow Step'}
                </h2>
                <button 
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingStep(null);
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
                    htmlFor="sequence"
                    className="block text-sm font-medium text-gray-200 mb-1"
                  >
                    Sequence
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                      </svg>
                    </div>
                    <input
                      type="number"
                      {...register('sequence', { valueAsNumber: true })}
                      placeholder="Enter step sequence"
                      className={`pl-10 w-full px-4 py-3 rounded-lg border bg-gray-800/80 text-white placeholder-gray-400 ${
                        errors.sequence 
                          ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
                          : 'border-gray-600 focus:border-indigo-500 focus:ring-indigo-500'
                      } shadow-sm focus:outline-none focus:ring-2 transition-colors`}
                    />
                  </div>
                  {errors.sequence && (
                    <p className="mt-2 text-sm text-red-400 flex items-center">
                      <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      {errors.sequence.message}
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
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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
                      <option value="TUTOR" className="bg-gray-800">Tutor</option>
                      <option value="YEAR_INCHARGE" className="bg-gray-800">Year Incharge</option>
                      <option value="HOD" className="bg-gray-800">HOD</option>
                      <option value="LAB_INCHARGE" className="bg-gray-800">Lab Incharge</option>
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
                      setEditingStep(null);
                      reset();
                    }}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-4 py-2.5 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={createStepMutation.isPending || updateStepMutation.isPending}
                    className="inline-flex items-center justify-center rounded-lg border border-transparent bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
                  >
                    {createStepMutation.isPending || updateStepMutation.isPending ? (
                      <div className="flex items-center">
                        <Spinner size="sm" className="mr-2" />
                        <span>Processing...</span>
                      </div>
                    ) : editingStep ? (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12m0 0l4-4m-4 4l-4-4" />
                        </svg>
                        Update Step
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <svg className="mr-1.5 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        Create Step
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