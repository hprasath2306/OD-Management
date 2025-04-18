import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getStudentRequests } from '../../../api/requestApi';
import { OdRequest, ApprovalStatus } from '../../../types/request';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function ODRequests() {
  const router = useRouter();
  const { 
    data: requests, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['odRequests'],
    queryFn: getStudentRequests
  });

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

  const renderItem = ({ item }: { item: OdRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/(app)/odrequest/${item.id}`);
      }}
    >
      <View style={styles.cardHeader}>
        <View style={styles.typeContainer}>
          <Text style={styles.requestType}>{item.type}</Text>
          {item.category && (
            <Text style={styles.category}>{item.category}</Text>
          )}
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.approvals[0].status) },
          ]}
        >
          <Text style={styles.statusText}>{item.approvals[0].status}</Text>
        </View>
      </View>

      <Text style={styles.reasonText} numberOfLines={2}>
        {item.reason}
      </Text>

      <View style={styles.dateContainer}>
        <View style={styles.dateItem}>
          <Ionicons name="calendar-outline" size={16} color="#666" />
          <Text style={styles.dateText}>
            {formatDate(item.startDate)} - {formatDate(item.endDate)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Failed to load requests</Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryText}>Retry</Text>
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
            style={styles.backButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>OD Requests</Text>
          <View style={{ width: 40 }} />
        </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : (
        <>
          {requests && requests.length > 0 ? (
            <FlatList
              data={requests}
              renderItem={renderItem}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContainer}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  colors={['#6200ee']}
                  tintColor="#6200ee"
                />
              }
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={80} color="#ccc" />
              <Text style={styles.emptyText}>No OD requests found</Text>
              <Text style={styles.emptySubtext}>
                Create a new request to get started
              </Text>
              <TouchableOpacity
                style={styles.createEmptyButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/(app)/odrequest/create');
                }}
              >
                <Text style={styles.createEmptyText}>Create Request</Text>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  createButton: {
    backgroundColor: '#6200ee',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  listContainer: {
    padding: 16,
  },
  requestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  requestType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  category: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  reasonText: {
    fontSize: 15,
    color: '#333',
    marginBottom: 12,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  createEmptyButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
    elevation: 2,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  createEmptyText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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
  },
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 