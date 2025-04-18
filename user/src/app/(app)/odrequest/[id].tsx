import React from 'react';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getRequestDetails, cancelRequest } from '../../../api/requestApi';
import { ApprovalStatus } from '../../../types/request';
import * as Haptics from 'expo-haptics';

export default function RequestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  // console.log(id)
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: request, isLoading, error } = useQuery({
    queryKey: ['request', id],
    queryFn: () => getRequestDetails(id || ''),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: cancelRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      queryClient.invalidateQueries({ queryKey: ['request', id] });
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

  if (error || !request) {
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
          style={styles.backButtonIcon}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>OD Request Details</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Text style={styles.statusTitle}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(request.status) },
              ]}
            >
              <Text style={styles.statusText}>{request.status}</Text>
            </View>
          </View>
          
          {request.status === ApprovalStatus.PENDING && (
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Request</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

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
            <Text style={styles.detailValue}>
              {formatDate(request.startDate)} to {formatDate(request.endDate)}
            </Text>
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

        <View style={styles.detailCard}>
          <Text style={styles.sectionTitle}>Approval Process</Text>
          
          {request.approvals && request.approvals.length > 0 ? (
            request.approvals.map((approval: any) => (
              <View key={approval.id} style={styles.approvalItem}>
                <View style={styles.approvalHeader}>
                  <Text style={styles.approvalTitle}>
                    Group Approval
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
                
                {approval.approvalSteps && (
                  <View style={styles.stepsContainer}>
                    {approval.approvalSteps.map((step: any, index: any) => (
                      <View key={step.id} style={styles.approvalStep}>
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
                            Step {index + 1}
                          </Text>
                          <Text style={styles.stepStatus}>{step.status}</Text>
                          {step.comments && (
                            <Text style={styles.stepComments}>
                              Comments: {step.comments}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <Text style={styles.noApprovals}>No approval information available</Text>
          )}
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  backButtonIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
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
  backButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
}); 