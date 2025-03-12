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

function ODRequestDetailsModel({
  selectedRequest,
  handleCloseDetailsModal,
  labs,
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <CheckCircleIcon className="mr-1 h-4 w-4" />
            Approved
          </span>
        );
      case "REJECTED":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
            <XCircleIcon className="mr-1 h-4 w-4" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
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

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        ></div>
        <span
          className="hidden sm:inline-block sm:align-middle sm:h-screen"
          aria-hidden="true"
        >
          &#8203;
        </span>
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                OD Request Details
              </h3>
              <StatusBadge status={overallStatus} />
            </div>
          </div>

          <div className="bg-white px-6 py-5">
            {/* Request Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                  Request Information
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Category
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.category
                          ? getCategoryDisplayName(selectedRequest.category)
                          : "N/A"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Reason
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.reason}
                      </p>
                    </div>
                  </div>

                  {selectedRequest.description && (
                    <div className="flex items-start">
                      <DocumentTextIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Description
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedRequest.description}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Duration
                      </p>
                      <p className="text-sm text-gray-900">
                        {formatDate(selectedRequest.startDate)}
                        {selectedRequest.startDate !==
                          selectedRequest.endDate &&
                          ` to ${formatDate(selectedRequest.endDate)}`}
                      </p>
                    </div>
                  </div>

                  {selectedRequest.needsLab && selectedRequest.lab && (
                    <div className="flex items-start">
                      <BeakerIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Lab Required
                        </p>
                        <p className="text-sm text-gray-900">
                          {selectedRequest.lab.name}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 shadow-sm">
                <h4 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">
                  People Information
                </h4>

                <div className="space-y-3">
                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Requested By
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.requestedBy.name} (
                        {selectedRequest.requestedBy.email})
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start">
                    <UserGroupIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Students
                      </p>
                      <ul className="text-sm text-gray-900 list-disc list-inside">
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
                    <BuildingLibraryIcon className="h-5 w-5 text-gray-500 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Flow Template
                      </p>
                      <p className="text-sm text-gray-900">
                        {selectedRequest.flowTemplate?.name || "N/A"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Approval Workflow */}
            <div className="mt-6">
              <h4 className="text-lg font-semibold text-gray-800 mb-4">
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
                      className="mb-6 bg-gray-50 rounded-lg p-4 shadow-sm"
                    >
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-md font-semibold text-gray-700">
                          Class: {approval.groupName}
                        </h5>
                        <StatusBadge status={approval.status} />
                      </div>

                      {/* Students in this group */}
                      {groupStudents.length > 0 && (
                        <div className="mb-3 bg-white rounded p-3">
                          <p className="text-sm font-medium text-gray-700 mb-1">
                            Students in this group:
                          </p>
                          <ul className="text-sm text-gray-900 list-disc list-inside">
                            {groupStudents.map(student => (
                              <li key={student.id}>
                                {student.name} (Roll No: {student.rollNo})
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Progress bar */}
                      <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                        <div 
                          className={`h-2.5 rounded-full ${
                            approval.status === 'APPROVED' 
                              ? 'bg-green-600' 
                              : approval.status === 'REJECTED' 
                                ? 'bg-red-600' 
                                : 'bg-blue-600'
                          }`}
                          style={{ 
                            width: `${approval.status === 'APPROVED' 
                              ? '100%' 
                              : approval.status === 'REJECTED' 
                                ? '100%' 
                                : `${Math.min(100, ((approval.currentStepIndex + 1) / (selectedRequest.flowTemplate?.steps.length || 1)) * 100)}%`}` 
                          }}
                        ></div>
                      </div>

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
                                      className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                                      aria-hidden="true"
                                    ></span>
                                  )}
                                  <div className="relative flex space-x-3">
                                    <div>
                                      <span
                                        className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                                          step.status === "APPROVED"
                                            ? "bg-green-500"
                                            : step.status === "REJECTED"
                                            ? "bg-red-500"
                                            : "bg-gray-400"
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
                                        <p className="text-sm text-gray-800 font-medium">
                                          {getRoleDisplayName(role)}
                                        </p>
                                        {step.approvedAt && (
                                          <p className="text-xs text-gray-500">
                                            {new Date(
                                              step.approvedAt
                                            ).toLocaleString()}
                                          </p>
                                        )}
                                        {step.comments && (
                                          <p className="text-xs text-gray-600 mt-1 italic">
                                            "{step.comments}"
                                          </p>
                                        )}
                                      </div>
                                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
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
                <div className="text-center py-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">
                    No approval information available.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-3 flex justify-end">
            <button
              type="button"
              className="inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
              onClick={handleCloseDetailsModal}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ODRequestDetailsModel;
