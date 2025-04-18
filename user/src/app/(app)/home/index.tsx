import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../../context/AuthContext';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { getStudentRequests } from '../../../api/requestApi';
import { ApprovalStatus } from '../../../types/request';

export default function HomeScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { 
    data: requests, 
    isLoading, 
  } = useQuery({
    queryKey: ['odRequests'],
    queryFn: getStudentRequests
  });

  // Calculate stats
  const getStats = () => {
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

  const stats = getStats();

  // Get the most recent pending request
  const getRecentPendingRequest = () => {
    if (!requests) return null;
    
    const pendingRequests = requests.filter(
      (req: any) => req.approvals[0].status === ApprovalStatus.PENDING
    );
    
    // Sort by created date (newest first)
    pendingRequests.sort((a: any, b: any) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    return pendingRequests[pendingRequests.length - 1];
  };

  const recentPendingRequest = getRecentPendingRequest();

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
      <ScrollView style={styles.scrollView}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user?.email}</Text>
          </View>
        </View>

        <View style={styles.statsContainer}>
          <Text style={styles.sectionTitle}>OD Request Summary</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
            </View>
          ) : (
            <View style={styles.statCards}>
              <View style={[styles.statCard, styles.pendingCard]}>
                <Text style={styles.statValue}>{stats.pending}</Text>
                <Text style={styles.statLabel}>Pending</Text>
              </View>
              
              <View style={[styles.statCard, styles.approvedCard]}>
                <Text style={styles.statValue}>{stats.approved}</Text>
                <Text style={styles.statLabel}>Approved</Text>
              </View>
              
              <View style={[styles.statCard, styles.rejectedCard]}>
                <Text style={styles.statValue}>{stats.rejected}</Text>
                <Text style={styles.statLabel}>Rejected</Text>
              </View>
            </View>
          )}
        </View>

        <View style={styles.actionsContainer}>
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
        </View>

        <View style={styles.recentContainer}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#6200ee" />
            </View>
          ) : recentPendingRequest ? (
            <TouchableOpacity
              style={styles.recentCard}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/(app)/odrequest/${recentPendingRequest.id}`);
              }}
            >
              <View style={styles.recentHeader}>
                <View style={styles.recentTypeContainer}>
                  <Ionicons name="time-outline" size={18} color="#FF9800" />
                  <Text style={styles.recentType}>{recentPendingRequest.type}</Text>
                </View>
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingText}>PENDING</Text>
                </View>
              </View>
              
              <Text style={styles.recentReason} numberOfLines={2}>
                {recentPendingRequest.reason}
              </Text>
              
              <View style={styles.recentFooter}>
                <View style={styles.recentDate}>
                  <Ionicons name="calendar-outline" size={14} color="#666" />
                  <Text style={styles.dateText}>
                    {formatDate(recentPendingRequest.startDate)} - {formatDate(recentPendingRequest.endDate)}
                  </Text>
                </View>
                
                <Text style={styles.viewDetails}>View Details</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.emptyRecentContainer}>
              <Ionicons name="checkmark-circle-outline" size={48} color="#4CAF50" />
              <Text style={styles.emptyRecentText}>No pending requests</Text>
            </View>
          )}
        </View>

        <View style={styles.tipsContainer}>
          <Text style={styles.sectionTitle}>Quick Tips</Text>
          
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
    width: '31%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
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
}); 