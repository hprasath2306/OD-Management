import { ODRequest, Lab } from "../api/request";
import {
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  BeakerIcon,
  CalendarIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BuildingLibraryIcon,
} from "@heroicons/react/24/solid";
import React from 'react';

// Add CSS for custom scrollbar
const scrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(31, 41, 55, 0.5);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(107, 114, 128, 0.5);
    border-radius: 10px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(107, 114, 128, 0.8);
  }
`;

function ODRequestDetailsModel({
  selectedRequest,
  handleCloseDetailsModal,
}: {
  selectedRequest: ODRequest;
  handleCloseDetailsModal: () => void;
  labs: Lab[];
}) {
  // Helper function to format dates
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Get overall request status
  const getOverallStatus = () => {
    if (!selectedRequest.approvals || selectedRequest.approvals.length === 0)
      return "PENDING";

    // If any approval is rejected, the request is rejected
    if (
      selectedRequest.approvals.some(
        (approval) => approval.status === "REJECTED"
      )
    ) {
      return "REJECTED";
    }

    // If all approvals are approved, the request is approved
    if (
      selectedRequest.approvals.every(
        (approval) => approval.status === "APPROVED"
      )
    ) {
      return "APPROVED";
    }

    return "PENDING";
  };

  // Get status badge
  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-200 border border-green-700">
            <CheckCircleIcon className="mr-1 h-4 w-4" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/60 text-red-200 border border-red-700">
            <XCircleIcon className="mr-1 h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-200 border border-yellow-700">
            <ClockIcon className="mr-1 h-4 w-4" />
            Pending
          </span>
        );
    }
  };

  // Get role display name
  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "TUTOR":
        return "Class Tutor";
      case "YEAR_INCHARGE":
        return "Year Incharge";
      case "HOD":
        return "Head of Department";
      case "LAB_INCHARGE":
        return "Lab Incharge";
      default:
        return role;
    }
  };

  // Get category display name
  const getCategoryDisplayName = (category: string) => {
    switch (category) {
      case "PROJECT":
        return "Project Work";
      case "SIH":
        return "Smart India Hackathon";
      case "SYMPOSIUM":
        return "Symposium/Conference";
      case "OTHER":
        return "Other Activity";
      default:
        return category;
    }
  };

  const overallStatus = getOverallStatus();

  React.useEffect(() => {
    // Add the scrollbar styles to the document head
    const styleElement = document.createElement('style');
    styleElement.innerHTML = scrollbarStyles;
    document.head.appendChild(styleElement);
    
    // Clean up on component unmount
    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-gray-900/90 to-slate-800/90 backdrop-blur-md rounded-xl shadow-2xl border border-gray-700/50 p-0 max-w-3xl w-full relative overflow-hidden flex flex-col h-[80vh]">
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/10 blur-2xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-800 to-gray-900 px-6 py-4 border-b border-gray-700 flex-shrink-0">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                OD Request Details
              </h3>
              <StatusBadge status={overallStatus} />
            </div>
          </div>

          <div className="px-6 py-5 flex-grow overflow-auto">
            {/* Request Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-slate-800/80 rounded-lg p-4 shadow-sm border border-gray-700/50">
                <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                  Request Information
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Category
                      </p>
                      <p className="text-sm text-white">
                        {selectedRequest.category
                          ? getCategoryDisplayName(selectedRequest.category)
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Reason
                      </p>
                      <p className="text-sm text-white">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  </div>

                  {selectedRequest.description && (
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          Description
                        </p>
                        <p className="text-sm text-white">
                          {selectedRequest.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Duration
                      </p>
                      <p className="text-sm text-white">
                        {formatDate(selectedRequest.startDate)}
                        {selectedRequest.startDate !==
                          selectedRequest.endDate &&
                          ` to ${formatDate(selectedRequest.endDate)}`}
                      </p>
                    </div>
                  </div>

                  {selectedRequest.needsLab && selectedRequest.lab && (
                    <div className="flex items-start">
                      <BeakerIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">
                          Lab Required
                        </p>
                        <p className="text-sm text-white">
                          {selectedRequest.lab.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-slate-800/80 rounded-lg p-4 shadow-sm border border-gray-700/50">
                <h4 className="text-lg font-semibold text-white mb-3 border-b border-gray-700 pb-2">
                  People Information
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Requested By
                      </p>
                      <p className="text-sm text-white">
                        {selectedRequest.requestedBy.name} (
                        {selectedRequest.requestedBy.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Students
                      </p>
                      <ul className="text-sm text-white list-disc list-inside">
                        {selectedRequest.students.map((student) => (
                          <li key={student.id}>
                            {student.name} (Roll No: {student.rollNo}) -{" "}
                            {student.group.name}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <BuildingLibraryIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-300">
                        Flow Template
                      </p>
                      <p className="text-sm text-white">
                        {selectedRequest.flowTemplate?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Workflow */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-white mb-4">
                Approval Workflow
              </h4>

              {selectedRequest.approvals &&
              selectedRequest.approvals.length > 0 ? (
                selectedRequest.approvals.map((approval, index) => {
                  // Filter students who belong to this group
                  const groupStudents = selectedRequest.students.filter(
                    student => student.group.id === approval.groupId
                  );
                  
                  return (
                    <div
                      key={index}
                      className="mb-6 bg-slate-800/80 rounded-lg p-4 shadow-sm border border-gray-700/50"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-md font-semibold text-white">
                          Class: {approval.groupName}
                        </h5>
                        <StatusBadge status={approval.status} />
                      </div>

                      {/* Students in this group */}
                      {groupStudents.length > 0 && (
                        <div className="mb-3 bg-gray-900/50 rounded p-3 border border-gray-700/50">
                          <p className="text-sm font-medium text-gray-300 mb-1">
                            Students in this group:
                          </p>
                          <ul className="text-sm text-white list-disc list-inside">
                            {groupStudents.map(student => (
                              <li key={student.id}>
                                {student.name} (Roll No: {student.rollNo})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Timeline */}
                      <div className="flow-root">
                        <ul className="-mb-8">
                          {approval.steps.map((step, stepIndex) => {
                            const flowStep =
                              selectedRequest.flowTemplate?.steps.find(
                                (fs) => fs.sequence === step.sequence
                              );
                            const role = flowStep
                              ? flowStep.role
                              : "Unknown Role";
                            const isLastStep =
                              stepIndex === approval.steps.length - 1;

                            return (
                              <li key={step.sequence}>
                                <div className="relative pb-8">
                                  {!isLastStep && (
                                    <span
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-700"
                                      aria-hidden="true"
                                    ></span>
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span
                                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-gray-900 ${
                                          step.status === "APPROVED"
                                            ? "bg-green-600"
                                            : step.status === "REJECTED"
                                            ? "bg-red-600"
                                            : "bg-gray-600"
                                        }`}
                                      >
                                        {step.status === "APPROVED" ? (
                                          <CheckCircleIcon className="h-5 w-5 text-white" />
                                        ) : step.status === "REJECTED" ? (
                                          <XCircleIcon className="h-5 w-5 text-white" />
                                        ) : (
                                          <ClockIcon className="h-5 w-5 text-white" />
                                        )}
                                      </span>
                                    </div>
                                    <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                                      <div>
                                        <p className="text-sm text-white font-medium">
                                          {getRoleDisplayName(role)}
                                        </p>
                                        {step.approvedAt && (
                                          <p className="text-xs text-gray-400">
                                            {new Date(
                                              step.approvedAt
                                            ).toLocaleString()}
                                          </p>
                                        )}
                                        {step.comments && (
                                          <p className="text-xs text-gray-300 mt-1 italic">
                                            "{step.comments}"
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap">
                                        <StatusBadge status={step.status} />
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4 bg-slate-800/80 rounded-lg border border-gray-700/50">
                  <p className="text-sm text-gray-300">
                    No approval information available.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-slate-800/50 px-6 py-3 flex justify-end border-t border-gray-700 flex-shrink-0">
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-lg border border-gray-600 bg-transparent px-4 py-2 text-sm font-medium text-gray-300 shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-colors"
              onClick={handleCloseDetailsModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <style>{`
        /* Firefox scrollbar styling */
        * {
          scrollbar-width: thin;
          scrollbar-color: #4B5563 #1F2937;
        }
        
        /* Chrome, Edge, and Safari scrollbar styling */
        *::-webkit-scrollbar {
          width: 14px;
        }
        
        *::-webkit-scrollbar-track {
          background: #1F2937;
          border-radius: 10px;
        }
        
        *::-webkit-scrollbar-thumb {
          background-color: #4B5563;
          border-radius: 10px;
          border: 3px solid #1F2937;
        }
        
        *::-webkit-scrollbar-thumb:hover {
          background-color: #6B7280;
        }
      `}</style>
    </div>
  );
}

export default ODRequestDetailsModel;
