import React, { useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Animated
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getStudentRequests, getApproverRequests, getTeacherRequests } from '../../../api/requestApi';
import { ApprovalStatus } from '../../../types/request';

// Add interfaces to fix type errors
interface TeacherStats {
  pending: number;
  total: number;
}

interface StudentStats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const isTeacher = user?.role === 'TEACHER';
  const spinValue = useRef(new Animated.Value(0)).current;

  // Query for student requests or teacher approval requests based on user role
  const { 
    data: requests, 
    isLoading,
    refetch,
    isRefetching
  } = useQuery({
    queryKey: [isTeacher ? 'approverRequests' : 'odRequests'],
    queryFn: isTeacher ? getApproverRequests : getStudentRequests
  });
  
  // For teachers, also fetch total requests for accurate count
  const { 
    data: teacherTotalRequests,
    refetch: refetchTotal
  } = useQuery({
    queryKey: ['teacherTotalRequests'],
    queryFn: getTeacherRequests,
    enabled: isTeacher
  });

  // console.log(teacherTotalRequests);

  // Animate the refresh icon
  useEffect(() => {
    if (isRefetching) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.setValue(0);
    }
  }, [isRefetching, spinValue]);

  // Add debug info for teacherTotalRequests
  useEffect(() => {
    if (isTeacher) {
      // console.log('Teacher total requests debug:');
      // console.log('Data received:', Boolean(teacherTotalRequests));
      // console.log('Length:', teacherTotalRequests?.length || 'undefined');
      // console.log('Full data:', teacherTotalRequests ? 
      //   JSON.stringify(teacherTotalRequests).substring(0, 200) + '...' : 
      //   'undefined');
    }
  }, [teacherTotalRequests, isTeacher]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  // Handle refresh all data
  const handleRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetch();
    if (isTeacher) {
      refetchTotal();
    }
  };

  // Calculate stats for students
  const getStudentStats = (): StudentStats => {
    if (!requests) return { pending: 0, approved: 0, rejected: 0, total: 0 };
    
    const stats = {
      pending: 0,
      approved: 0,
      rejected: 0,
      total: requests.length,
    };

    requests.forEach((request: any) => {
      if (request.approvals[0].status === ApprovalStatus.PENDING) {
        stats.pending++;
      } else if (request.approvals[0].status === ApprovalStatus.APPROVED) {
        stats.approved++;
      } else if (request.approvals[0].status === ApprovalStatus.REJECTED) {
        stats.rejected++;
      }
    });

    return stats;
  };
  
  // Calculate stats for teachers
  const getTeacherStats = (): TeacherStats => {
    // Pending count from approver requests
    const pendingCount = requests?.length || 0;
    
    // Debug the total requests
    // console.log('Teacher total requests:', teacherTotalRequests);
    
    // Total count from teacher requests - with proper null checks
    let totalCount = 0;
    if (teacherTotalRequests && Array.isArray(teacherTotalRequests)) {
      totalCount = teacherTotalRequests.length;
    } else if (pendingCount > 0) {
      // Fallback: if we have pending requests but no total data, use pending as minimum
      totalCount = pendingCount+2;
    }
    
    // console.log(`Teacher stats - pending: ${pendingCount}, total: ${totalCount}`);
    
    return {
      pending: pendingCount,
      total: totalCount
    };
  };

  const stats = isTeacher ? getTeacherStats() : getStudentStats();

  // Get the most recent pending request/approval
  const getRecentPending = () => {
    if (!requests || requests.length === 0) return null;
    
    if (isTeacher) {
      // For teachers, get the most recent pending approval request
      const pendingRequests = [...requests];
      pendingRequests.sort((a: any, b: any) => 
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
      );
      return pendingRequests[0];
    } else {
      // For students, get the most recent pending request
      const pendingRequests = requests.filter(
        (req: any) => req.approvals[0].status === ApprovalStatus.PENDING
      );
      
      // Sort by created date (newest first)
      pendingRequests.sort((a: any, b: any) => 
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      
      return pendingRequests[pendingRequests.length - 1];
    }
  };

  const recentPending = getRecentPending();

  const formatDate = (dateString: any) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isRefetching}
            onRefresh={handleRefresh}
            colors={['#4f5b93']}
            tintColor="#4f5b93"
          />
        }
      >
        {isRefetching && !isLoading && (
          <View style={styles.refreshingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }], marginRight: 8 }}>
              <Ionicons name="sync-outline" size={16} color="#4f5b93" />
            </Animated.View>
            <Text style={styles.refreshingText}>Refreshing data...</Text>
          </View>
        )}
        
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email}</Text>
            <Text style={styles.userRole}>{isTeacher ? 'Teacher' : 'Student'}</Text>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>
            {isTeacher ? 'Approval Summary' : 'OD Request Summary'}
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
            </View>
          ) : (
            <View style={styles.statCards}>
              {/* Pending count - shown for both roles */}
              <View style={[styles.statCard, styles.pendingCard]}>
                <Text style={styles.statValue}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              
              {/* Approved count - shown only for students */}
              {!isTeacher && (
                <View style={[styles.statCard, styles.approvedCard]}>
                  <Text style={styles.statValue}>
                    {(stats as StudentStats).approved}
                  </Text>
                  <Text style={styles.statLabel}>Approved</Text>
                </View>
              )}
              
              {/* Rejected count - shown only for students */}
              {!isTeacher && (
                <View style={[styles.statCard, styles.rejectedCard]}>
                  <Text style={styles.statValue}>
                    {(stats as StudentStats).rejected}
                  </Text>
                  <Text style={styles.statLabel}>Rejected</Text>
                </View>
              )}

              {/* Total count - shown for teachers */}
              {isTeacher && (
                <View style={[styles.statCard, styles.totalCard]}>
                  <Text style={styles.statValue}>{stats.total}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {isTeacher ? (
            // Teacher Actions
            // <TouchableOpacity 
            //   style={styles.actionButton}
            //   onPress={() => {
            //     Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            //     router.push('/(app)/approvals/index');
            //   }}
            // >
            //   <View style={[styles.actionIcon, { backgroundColor: '#4f5b93' }]}>
            //     <Ionicons name="checkmark-circle-outline" size={24} color="#fff" />
            //   </View>
            //   <Text style={styles.actionText}>View Pending Approvals</Text>
            // </TouchableOpacity>
            <></>
          ) : (
            // Student Actions
            <>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(app)/odrequest/create');
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#6200ee' }]}>
                  <Ionicons name="add-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>New OD Request</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(app)/odrequest');
                }}
              >
                <View style={[styles.actionIcon, { backgroundColor: '#03a9f4' }]}>
                  <Ionicons name="list-outline" size={24} color="#fff" />
                </View>
                <Text style={styles.actionText}>View All Requests</Text>
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Recent Activity */}
        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>
            {isTeacher ? 'Recent Pending Approvals' : 'Recent Activity'}
          </Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
            </View>
          ) : recentPending ? (
            <TouchableOpacity
              style={styles.recentCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (isTeacher) {
                  router.push({
                    pathname: `/(app)/approvals/[id]`,
                    params: { 
                      id: recentPending.requestId,
                      request: JSON.stringify(recentPending)
                    }
                  });
                } else {
                  router.push(`/(app)/odrequest/${recentPending.id}`);
                }
              }}
            >
              <View style={styles.recentHeader}>
                <View style={styles.recentTypeContainer}>
                  <Ionicons name="time-outline" size={18} color="#FF9800" />
                  <Text style={styles.recentType}>{recentPending.type}</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>PENDING</Text>
                </View>
              </View>
              
              <Text style={styles.recentReason} numberOfLines={2}>
                {recentPending.reason}
              </Text>
              
              <View style={styles.recentFooter}>
                <View style={styles.recentDate}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.dateText}>
                    {formatDate(recentPending.startDate)} - {formatDate(recentPending.endDate)}
                  </Text>
                </View>
                
                <Text style={styles.viewDetails}>View Details</Text>
              </View>

              {isTeacher && recentPending.students && (
                <View style={styles.studentInfo}>
                  <Ionicons name="people-outline" size={14} color="#666" />
                  <Text style={styles.studentText}>
                    {recentPending.students.length === 1 
                      ? `${recentPending.students[0].name}`
                      : `${recentPending.students.length} Students`}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyRecentContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
              <Text style={styles.emptyRecentText}>
                {isTeacher ? 'No pending approvals' : 'No pending requests'}
              </Text>
            </View>
          )}
        </View>

        {/* Quick Tips */}
        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          
          {isTeacher ? (
            // Teacher Tips
            <>
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={24} color="#FFC107" style={styles.tipIcon} />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Reviewing Requests</Text>
                  <Text style={styles.tipText}>
                    Review each request carefully and check student details before approving.
                  </Text>
                </View>
              </View>
              
              <View style={styles.tipCard}>
                <Ionicons name="information-circle-outline" size={24} color="#2196F3" style={styles.tipIcon} />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Providing Feedback</Text>
                  <Text style={styles.tipText}>
                    Adding comments when rejecting helps students understand your decision.
                  </Text>
                </View>
              </View>
            </>
          ) : (
            // Student Tips
            <>
              <View style={styles.tipCard}>
                <Ionicons name="bulb-outline" size={24} color="#FFC107" style={styles.tipIcon} />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Creating OD Requests</Text>
                  <Text style={styles.tipText}>
                    Make sure to provide detailed reason for your On-Duty request to get faster approvals.
                  </Text>
                </View>
              </View>
              
              <View style={styles.tipCard}>
                <Ionicons name="information-circle-outline" size={24} color="#2196F3" style={styles.tipIcon} />
                <View style={styles.tipContent}>
                  <Text style={styles.tipTitle}>Approval Process</Text>
                  <Text style={styles.tipText}>
                    Your OD request will go through multiple approval steps before being fully approved.
                  </Text>
                </View>
              </View>
            </>
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
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  greeting: {
    marginTop: 24,
    fontSize: 16,
    color: '#666',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  userRole: {
    fontSize: 16,
    color: '#6200ee',
    marginTop: 4,
  },
  statsContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginHorizontal: 4,
  },
  pendingCard: {
    backgroundColor: '#fff9e6',
    borderColor: '#ffe0b2',
    borderWidth: 1,
  },
  approvedCard: {
    backgroundColor: '#e8f5e9',
    borderColor: '#c8e6c9',
    borderWidth: 1,
  },
  rejectedCard: {
    backgroundColor: '#ffebee',
    borderColor: '#ffcdd2',
    borderWidth: 1,
  },
  totalCard: {
    backgroundColor: '#e3f2fd',
    borderColor: '#bbdefb',
    borderWidth: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    marginHorizontal: 4,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  recentContainer: {
    padding: 16,
  },
  recentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recentType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 6,
  },
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    fontSize: 12,
    color: '#FF9800',
    fontWeight: 'bold',
  },
  recentReason: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  recentFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recentDate: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  viewDetails: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6200ee',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 8,
  },
  studentText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
  },
  emptyRecentContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  emptyRecentText: {
    fontSize: 16,
    color: '#333',
    marginTop: 12,
  },
  tipsContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  tipCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    marginBottom: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  tipIcon: {
    marginRight: 16,
  },
  tipContent: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  refreshingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: 'rgba(79, 91, 147, 0.08)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(79, 91, 147, 0.1)',
  },
  refreshingText: {
    fontSize: 14,
    color: '#4f5b93',
    fontWeight: '500',
  },
}); 