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
  TextInput,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { processApproval, getApprovalDetail } from '../../../api/requestApi';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/src/context/AuthContext';

export default function ApprovalDetailScreen() {
  const { id, request: requestParam } = useLocalSearchParams<{ id: string, request: string }>();
  const [parsedRequest, setParsedRequest] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [comments, setComments] = useState('');
  const [approvalModalVisible, setApprovalModalVisible] = useState(false);
  const [actionType, setActionType] = useState<'APPROVED' | 'REJECTED' | null>(null);
  const router = useRouter();
  const queryClient = useQueryClient();
  const {user} = useAuth();
  const teacherId = user?.id;

  // Try to get the complete approval details including previous steps
  const { 
    data: requestDetail, 
    isLoading: isDetailLoading,
    error: detailError 
  } = useQuery({
    queryKey: ['approvalDetail', id],
    queryFn: () => id && teacherId ? getApprovalDetail(id, teacherId) : null,
    enabled: !!id && !!teacherId,
  });

  // Combine data - prefer the fetched details (which should include previousSteps) 
  // but fallback to the passed request data
  const request = requestDetail || parsedRequest;

  // Debug log to check complete request object structure
  useEffect(() => {
    if (request) {
      console.log('========= FULL REQUEST OBJECT DEBUG =========');
      console.log('Request source:', requestDetail ? 'API fetch' : 'Navigation params');
      console.log('Keys in request object:', Object.keys(request));
      console.log('previousSteps field exists:', request.hasOwnProperty('previousSteps'));
      console.log('previousSteps value:', request.previousSteps);
      console.log('Complete request object:', JSON.stringify(request).slice(0, 500) + '...');
      console.log('=========================================');
    }
  }, [request, requestDetail]);

  // Parse the request from params as fallback
  useEffect(() => {
    if (requestParam) {
      try {
        const parsed = JSON.parse(requestParam);
        setParsedRequest(parsed);
      } catch (e) {
        console.error('Error parsing request:', e);
      }
    }
    setIsLoading(false);
  }, [requestParam]);

  const approvalMutation = useMutation({
    mutationFn: (data: { requestId: string, status: 'APPROVED' | 'REJECTED', comments?: string }) => 
      processApproval(teacherId!, { 
        status: data.status, 
        comments: data.comments,
        requestId: data.requestId
      }),
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['approverRequests'] });
      queryClient.invalidateQueries({ queryKey: ['approvalDetail', id] });
      Alert.alert(
        'Success',
        `Request ${actionType === 'APPROVED' ? 'approved' : 'rejected'} successfully`,
        [{ text: 'OK', onPress: () => router.back() }]
      );
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to process approval');
    },
  });

  const handleApproval = (approve: boolean) => {
    setActionType(approve ? 'APPROVED' : 'REJECTED');
    setApprovalModalVisible(true);
  };

  const confirmApproval = () => {
    if (!id || !actionType || !teacherId) {
      Alert.alert('Error', 'Missing required information for approval');
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    console.log(`Processing approval with teacherId: ${teacherId} and requestId: ${id}`);
    
    approvalMutation.mutate({
      requestId: id,
      status: actionType,
      comments: comments.trim() || undefined
    });
    setApprovalModalVisible(false);
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading || isDetailLoading) {
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

  if (detailError) {
    console.error('Error loading approval details:', detailError);
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

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Approval Request</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status</Text>
            <View style={styles.pendingBadge}>
              <Text style={styles.pendingText}>PENDING</Text>
            </View>
          </View>
        </View>

        {/* Previous Approvals - Show comments from previous approvers */}
        {request.previousSteps && request.previousSteps.length > 0 ? (
          <View style={styles.detailCard}>
            <Text style={styles.sectionTitle}>Previous Approvals</Text>
            
            {request.previousSteps.map((step: any, index: number) => (
              <View key={`prev-step-${index}`} style={styles.prevApprovalItem}>
                <View style={styles.prevApprovalHeader}>
                  <View style={styles.prevStepRole}>
                    <Ionicons 
                      name="person-outline" 
                      size={16} 
                      color={step.status === 'APPROVED' ? '#4CAF50' : '#F44336'} 
                    />
                    <Text style={styles.prevStepRoleText}>
                      {step.role || `Step ${step.sequence + 1}`}
                    </Text>
                  </View>
                  
                  <View style={[
                    styles.miniStatusBadge, 
                    { 
                      backgroundColor: step.status === 'APPROVED' 
                        ? '#E8F5E9' 
                        : '#FFEBEE'
                    }
                  ]}>
                    <Text style={[
                      styles.miniStatusText,
                      { 
                        color: step.status === 'APPROVED' 
                          ? '#4CAF50' 
                          : '#F44336'
                      }
                    ]}>
                      {step.status}
                    </Text>
                  </View>
                </View>
                
                {step.approver && (
                  <Text style={styles.prevApproverName}>
                    By: {step.approver.name}
                  </Text>
                )}
                
                {step.approvedAt && (
                  <Text style={styles.prevTimestamp}>
                    {new Date(step.approvedAt).toLocaleString()}
                  </Text>
                )}
                
                {step.comments && (
                  <View style={styles.commentBox}>
                    <Text style={styles.commentText}>
                      "{step.comments}"
                    </Text>
                  </View>
                )}
                
                {index < request.previousSteps.length - 1 && (
                  <View style={styles.prevStepDivider} />
                )}
              </View>
            ))}
          </View>
        ) : (
          request.currentStep && request.currentStep.sequence > 0 ? (
            <View style={styles.detailCard}>
              <Text style={styles.sectionTitle}>Previous Approvals</Text>
              <View style={styles.noPreviousStepsContainer}>
                <Ionicons name="information-circle-outline" size={24} color="#4f5b93" />
                <Text style={styles.noPreviousStepsText}>
                  Previous approvers did not leave any comments.
                </Text>
              </View>
            </View>
          ) : null
        )}

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
                {formatDate(request.startDate)}
              </Text>
              <Text style={styles.dateArrow}>to</Text>
              <Text style={styles.dateValue}>
                {formatDate(request.endDate)}
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
                    Roll No: {student.rollNo}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Approval Actions */}
        <View style={styles.actionCard}>
          <Text style={styles.sectionTitle}>Approval Action</Text>
          <Text style={styles.actionInfo}>
            Please review the request details and take appropriate action.
          </Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => handleApproval(false)}
              disabled={approvalMutation.isPending}
            >
              <Ionicons name="close-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => handleApproval(true)}
              disabled={approvalMutation.isPending}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Approval Confirmation Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={approvalModalVisible}
        onRequestClose={() => setApprovalModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {actionType === 'APPROVED' ? 'Approve Request' : 'Reject Request'}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setApprovalModalVisible(false)}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalBody}>
              <Text style={styles.commentLabel}>Comments (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Add comments for this decision..."
                placeholderTextColor="#999"
                multiline={true}
                value={comments}
                onChangeText={setComments}
              />
              
              <TouchableOpacity
                style={[
                  styles.confirmButton,
                  actionType === 'APPROVED' ? styles.confirmApproveButton : styles.confirmRejectButton
                ]}
                onPress={confirmApproval}
                disabled={approvalMutation.isPending}
              >
                {approvalMutation.isPending ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Ionicons 
                      name={actionType === 'APPROVED' ? "checkmark-circle-outline" : "close-circle-outline"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.confirmButtonText}>
                      Confirm {actionType === 'APPROVED' ? 'Approval' : 'Rejection'}
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  headerBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  backButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
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
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#FF9800',
    fontSize: 12,
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
  actionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionInfo: {
    fontSize: 15,
    color: '#666',
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 6,
  },
  rejectButton: {
    backgroundColor: '#F44336',
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    width: '85%',
    borderRadius: 12,
    elevation: 5,
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  commentLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  commentInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#333',
    height: 120,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  confirmApproveButton: {
    backgroundColor: '#4CAF50',
  },
  confirmRejectButton: {
    backgroundColor: '#F44336',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginLeft: 8,
  },
  prevApprovalItem: {
    marginBottom: 12,
  },
  prevApprovalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  prevStepRole: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  prevStepRoleText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  miniStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  miniStatusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  prevApproverName: {
    fontSize: 14,
    color: '#555',
    marginBottom: 2,
  },
  prevTimestamp: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  commentBox: {
    backgroundColor: '#f8f9fa',
    borderLeftWidth: 3,
    borderLeftColor: '#4f5b93',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginTop: 4,
  },
  commentText: {
    fontSize: 14,
    color: '#333',
    fontStyle: 'italic',
  },
  prevStepDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginTop: 12,
    marginBottom: 12,
  },
  noPreviousStepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginTop: 8,
  },
  noPreviousStepsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
  },
}); 