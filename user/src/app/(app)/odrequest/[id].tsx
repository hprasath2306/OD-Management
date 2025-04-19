import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { cancelRequest, getStudentRequests } from '../../../api/requestApi';
import { ApprovalStatus, OdRequest } from '../../../types/request';
import * as Haptics from 'expo-haptics';

export default function RequestDetailScreen() {
  const { id, request: requestParam } = useLocalSearchParams<{ id: string, request: string }>();
  const [request, setRequest] = useState<OdRequest | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const queryClient = useQueryClient();

  // Query to fetch requests if needed
  const { data: requests } = useQuery({
    queryKey: ['odRequests'],
    queryFn: getStudentRequests,
    enabled: !request && !!id, // Only run this query if we don't have the request and have an ID
  });

  // Parse the request from params
  useEffect(() => {
    const loadRequest = async () => {
      // Try to get from params first
      if (requestParam) {
        try {
          const parsedRequest = JSON.parse(requestParam) as OdRequest;
          setRequest(parsedRequest);
          setIsLoading(false);
          return;
        } catch (e) {
          console.error('Error parsing request:', e);
        }
      }

      // If parsing failed or no requestParam, try to get from cache
      if (id) {
        const cachedRequests = queryClient.getQueryData<OdRequest[]>(['odRequests']);
        if (cachedRequests) {
          const foundRequest = cachedRequests.find((req: OdRequest) => req.id === id);
          if (foundRequest) {
            setRequest(foundRequest);
            setIsLoading(false);
            return;
          }
        }
      }

      // If we reach this point, wait for the query to complete
      setIsLoading(true);
    };

    loadRequest();
  }, [requestParam, id, queryClient]);

  // Once requests are fetched, find the one we need
  useEffect(() => {
    if (requests && id && !request) {
      const foundRequest = requests.find((req: OdRequest) => req.id === id);
      if (foundRequest) {
        setRequest(foundRequest);
      }
      setIsLoading(false);
    }
  }, [requests, id, request]);

  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['odRequests'] });
      Alert.alert('Success', 'Request cancelled successfully');
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to cancel request');
    },
  });

  const handleCancel = () => {
    if (!id) return;

    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            cancelMutation.mutate(id);
          },
        },
      ]
    );
  };

  const getStatusColor = (status: ApprovalStatus) => {
    switch (status) {
      case ApprovalStatus.APPROVED:
        return '#4CAF50';
      case ApprovalStatus.REJECTED:
        return '#F44336';
      case ApprovalStatus.CANCELLED:
        return '#9E9E9E';
      default:
        return '#FF9800';
    }
  };

  const formatDate = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateCompact = (dateString: Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const findStepBySequence = (flowTemplate: any, sequence: number) => {
    if (!flowTemplate || !flowTemplate.steps) return null;
    return flowTemplate.steps.find((s: any) => s.sequence === sequence);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading request details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Failed to load request details</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Use the first approval's status as the request status
  const status = request.approvals && request.approvals.length > 0 
    ? request.approvals[0].status 
    : ApprovalStatus.PENDING;

  // Sort steps by sequence for proper display
  // @ts-ignore
  const flowSteps = request.flowTemplate?.steps || [];
  const sortedFlowSteps = [...flowSteps].sort((a, b) => a.sequence - b.sequence);
  
  // Current progress in the flow
  const currentApproval = request.approvals?.[0];
  const currentStepIndex = currentApproval?.currentStepIndex || 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OD Request Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(status) },
              ]}
            >
              <Text style={styles.statusText}>{status}</Text>
            </View>
          </View>
        </View>

        {/* Request Information Card */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Request Information</Text>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Request Type</Text>
            <Text style={styles.detailValue}>{request.type}</Text>
          </View>
          
          {request.category && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{request.category}</Text>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Duration</Text>
            <View style={styles.dateRangeContainer}>
              <Text style={styles.dateValue}>
                {formatDateCompact(request.startDate)}
              </Text>
              <Text style={styles.dateArrow}>to</Text>
              <Text style={styles.dateValue}>
                {formatDateCompact(request.endDate)}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Lab Required</Text>
            <Text style={styles.detailValue}>{request.needsLab ? 'Yes' : 'No'}</Text>
          </View>
          
          {request.lab && (
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Lab</Text>
              <Text style={styles.detailValue}>{request.lab.name}</Text>
            </View>
          )}
          
          <View style={styles.detailDivider} />
          
          <View style={styles.reasonContainer}>
            <Text style={styles.reasonLabel}>Reason</Text>
            <Text style={styles.reasonText}>{request.reason}</Text>
          </View>
          
          {request.description && (
            <View style={styles.reasonContainer}>
              <Text style={styles.reasonLabel}>Description</Text>
              <Text style={styles.reasonText}>{request.description}</Text>
            </View>
          )}
        </View>

        {/* Students Card */}
        {request.students && request.students.length > 0 && (
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Student Information</Text>
            
            {request.students.map((student: any) => (
              <View key={student.id} style={styles.studentItem}>
                <Ionicons name="person-circle-outline" size={24} color="#6200ee" />
                <View style={styles.studentDetails}>
                  <Text style={styles.studentName}>{student.name}</Text>
                  <Text style={styles.studentInfo}>
                    Roll No: {student.rollNo} • {student.group?.name || 'No Group'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Approval Flow Visualization */}
        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Approval Flow</Text>
          
          {sortedFlowSteps && sortedFlowSteps.length > 0 ? (
            <View style={styles.flowContainer}>
              {sortedFlowSteps.map((step: any, index: number) => {
                const isCompleted = status === ApprovalStatus.APPROVED || 
                // @ts-ignore
                  (currentApproval?.steps?.some((s: any) => 
                    s.sequence === step.sequence && s.status === ApprovalStatus.APPROVED));
                
                const isRejected = status === ApprovalStatus.REJECTED || 
                  // @ts-ignore
                  (currentApproval?.steps?.some((s: any) => 
                    s.sequence === step.sequence && s.status === ApprovalStatus.REJECTED));
                
                const isPending = !isCompleted && !isRejected && 
                  // @ts-ignore
                  (currentApproval?.steps?.some((s: any) => 
                    s.sequence === step.sequence && s.status === ApprovalStatus.PENDING));
                
                const isCurrent = isPending;
                // @ts-ignore
                const approvalStep = currentApproval?.steps?.find((s: any) => s.sequence === step.sequence);
                
                return (
                  <View key={`flow-${index}`} style={styles.flowStep}>
                    <View style={[
                      styles.flowStepIndicator,
                      isCompleted ? styles.completedStep : 
                      isRejected ? styles.rejectedStep : 
                      isCurrent ? styles.currentStep : 
                      styles.pendingStep
                    ]}>
                      {isCompleted ? (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                      ) : isRejected ? (
                        <Ionicons name="close" size={16} color="#fff" />
                      ) : (
                        <Text style={styles.flowStepNumber}>{index + 1}</Text>
                      )}
                    </View>
                    
                    <View style={styles.flowStepContent}>
                      <Text style={[
                        styles.flowStepTitle,
                        isCurrent && styles.currentStepText
                      ]}>
                        {step.role}
                      </Text>
                      
                      {approvalStep && (
                        <View style={styles.flowStepStatus}>
                          <View style={[
                            styles.miniStatusBadge,
                            { backgroundColor: getStatusColor(approvalStep.status) }
                          ]}>
                            <Text style={styles.miniStatusText}>{approvalStep.status}</Text>
                          </View>
                          
                          {approvalStep.approvedAt && (
                            <Text style={styles.flowTimestamp}>
                              {new Date(approvalStep.approvedAt).toLocaleString()}
                            </Text>
                          )}
                          
                          {approvalStep.comments && (
                            <Text style={styles.flowComments}>
                              "{approvalStep.comments}"
                            </Text>
                          )}
                        </View>
                      )}
                    </View>
                    
                    {index < sortedFlowSteps.length - 1 && (
                      <View style={[
                        styles.flowConnector,
                        isCompleted ? styles.completedConnector : styles.pendingConnector
                      ]} />
                    )}
                  </View>
                );
              })}
            </View>
          ) : (
            <Text style={styles.noApprovals}>No approval flow information available</Text>
          )}
        </View>
        
        {/* Approval Details */}
        {/* <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Approval Details</Text>
          
          {request.approvals && request.approvals.length > 0 ? (
            request.approvals.map((approval: any) => (
              <View key={approval.groupId} style={styles.approvalItem}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalTitle}>
                    {approval.groupName}
                  </Text>
                  <View
                    style={[
                      styles.approvalStatusBadge,
                      { backgroundColor: getStatusColor(approval.status) },
                    ]}
                  >
                    <Text style={styles.approvalStatusText}>
                      {approval.status}
                    </Text>
                  </View>
                </View>
                
                {approval.steps && (
                  <View style={styles.stepsContainer}>
                    {approval.steps.map((step: any, index: number) => {
                      // @ts-ignore
                      const flowStep = findStepBySequence(request.flowTemplate, step.sequence);
                      return (
                        <View key={`step-${step.sequence}-${index}`} style={styles.approvalStep}>
                          <View
                            style={[
                              styles.stepIndicator,
                              {
                                backgroundColor:
                                  step.status === ApprovalStatus.PENDING
                                    ? '#FF9800'
                                    : step.status === ApprovalStatus.APPROVED
                                    ? '#4CAF50'
                                    : '#F44336',
                              },
                            ]}
                          />
                          <View style={styles.stepContent}>
                            <Text style={styles.stepTitle}>
                              {flowStep ? flowStep.role : `Step ${index + 1}`}
                            </Text>
                            <Text style={styles.stepStatus}>{step.status}</Text>
                            {step.approvedAt && (
                              <Text style={styles.stepTimestamp}>
                                {new Date(step.approvedAt).toLocaleString()}
                              </Text>
                            )}
                            {step.comments && (
                              <Text style={styles.stepComments}>
                                Comments: {step.comments}
                              </Text>
                            )}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noApprovals}>No approval information available</Text>
          )}
        </View> */}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginTop: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 30,
  },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#ff3b30',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 15,
    color: '#666',
    flex: 1,
  },
  detailValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  detailDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 12,
  },
  reasonContainer: {
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 15,
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    color: '#333',
    marginTop: 12,
    marginBottom: 24,
  },
  approvalItem: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  approvalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  approvalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  approvalStatusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvalStatusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepsContainer: {
    marginTop: 8,
  },
  approvalStep: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  stepIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginTop: 2,
    marginRight: 12,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
  },
  stepStatus: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  stepTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  stepComments: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
    fontStyle: 'italic',
  },
  noApprovals: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 16,
  },
  studentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
  },
  studentDetails: {
    marginLeft: 12,
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  studentInfo: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  flowContainer: {
    marginTop: 8,
  },
  flowStep: {
    position: 'relative',
    marginBottom: 8,
    paddingLeft: 36,
  },
  flowStepIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  flowStepNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedStep: {
    backgroundColor: '#4CAF50',
  },
  currentStep: {
    backgroundColor: '#FF9800',
    borderWidth: 2,
    borderColor: '#FFC107',
  },
  pendingStep: {
    backgroundColor: '#9E9E9E',
  },
  rejectedStep: {
    backgroundColor: '#F44336',
  },
  flowConnector: {
    position: 'absolute',
    left: 14,
    top: 28,
    width: 2,
    height: 24,
  },
  completedConnector: {
    backgroundColor: '#4CAF50',
  },
  pendingConnector: {
    backgroundColor: '#E0E0E0',
  },
  flowStepContent: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  flowStepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  currentStepText: {
    color: '#FF9800',
  },
  flowStepStatus: {
    marginTop: 8,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  miniStatusText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  flowTimestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  flowComments: {
    fontSize: 14,
    color: '#333',
    marginTop: 8,
    fontStyle: 'italic',
  },
  dateRangeContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  dateValue: {
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  dateArrow: {
    fontSize: 14,
    color: '#666',
    marginHorizontal: 8,
  },
}); 