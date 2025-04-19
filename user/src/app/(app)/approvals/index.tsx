import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  SectionList,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getApproverRequests } from '../../../api/requestApi';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';

export default function TeacherApprovals() {
  const router = useRouter();
  const { user } = useAuth();
  const [debugMode, setDebugMode] = useState(false);
  const [tapCount, setTapCount] = useState(0);
  
  const handleHeaderTap = () => {
    const newCount = tapCount + 1;
    setTapCount(newCount);
    
    if (newCount >= 5) {
      setDebugMode(!debugMode);
      setTapCount(0);
      Alert.alert(
        'Debug Mode', 
        debugMode ? 'Debug mode disabled' : 'Debug mode enabled'
      );
    }
  };

  const { 
    data: approvalRequests, 
    isLoading, 
    error, 
    refetch,
    isRefetching
  } = useQuery({
    queryKey: ['approverRequests'],
    queryFn: getApproverRequests
  });

  // Debug the data we're getting from the API
  React.useEffect(() => {
    if (approvalRequests) {
      console.log('Received approvalRequests:', JSON.stringify(approvalRequests).slice(0, 200) + '...');
      console.log('Number of requests:', approvalRequests.length);
      console.log('First request sample:', approvalRequests[0] ? {
        requestId: approvalRequests[0].requestId,
        type: approvalRequests[0].type,
        status: approvalRequests[0].status,
      } : 'No requests');
    }
  }, [approvalRequests]);

  // Process and organize approval data
  const organizedData = useMemo(() => {
    if (!approvalRequests || approvalRequests.length === 0) {
      console.log('No approval requests to organize');
      return [
        { title: 'Pending Approvals', data: [], key: 'pending' }
      ];
    }

    console.log('Organizing approval data...');
    
    // Sort all requests by date (newest first)
    const sortedRequests = [...approvalRequests].sort((a, b) => 
      new Date(b.createdAt || b.startDate).getTime() - new Date(a.createdAt || a.startDate).getTime()
    );
    
    // Separate requests by status
    const pendingRequests = sortedRequests.filter(req => 
      !req.status || req.status === 'PENDING'
    );
    
    // Create a combined section for approved and rejected requests
    const otherRequests = sortedRequests.filter(req => 
      req.status === 'APPROVED' || req.status === 'REJECTED'
    );
    
    console.log(`Pending: ${pendingRequests.length}, Other: ${otherRequests.length}`);

    // Always add both sections, even if empty
    return [
      {
        title: 'Pending Approvals',
        data: pendingRequests,
        key: 'pending'
      },
      // {
      //   title: 'Other Approvals',
      //   data: otherRequests,
      //   key: 'other'
      // }
    ];
  }, [approvalRequests]);

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const renderItem = ({ item, section }: { item: any, section: any }) => {
    // Debug any issues with item structure
    if (!item || !item.requestId) {
      console.error('Invalid item in renderItem:', item);
      return (
        <View style={[styles.requestCard, { backgroundColor: '#ffebee' }]}>
          <Text style={{ color: '#d32f2f' }}>Invalid request data</Text>
          <Text style={{ fontSize: 12, color: '#666' }}>
            {item ? `Data received but missing requestId: ${JSON.stringify(item).slice(0, 100)}...` : 'No data received'}
          </Text>
        </View>
      );
    }
    
    // Determine status badge appearance
    let badgeStyle = styles.pendingBadge;
    let textStyle = styles.pendingText;
    let statusText = 'PENDING';
    
    // For the "other" section, check each item's individual status
    if (section.key === 'other') {
      if (item.status === 'APPROVED') {
        badgeStyle = styles.approvedBadge;
        textStyle = styles.approvedText;
        statusText = 'APPROVED';
      } else if (item.status === 'REJECTED') {
        badgeStyle = styles.rejectedBadge;
        textStyle = styles.rejectedText;
        statusText = 'REJECTED';
      }
    }
    
    return (
      <TouchableOpacity
        style={styles.requestCard}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push({
            pathname: `/(app)/approvals/[id]`,
            params: { 
              id: item.requestId,
              request: JSON.stringify(item)
            }
          });
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.typeContainer}>
            <Text style={styles.requestType}>
              {item.type || 'Unknown Type'} 
              {item.needsLab && <Text style={styles.labRequired}> • Lab Required</Text>}
            </Text>
            {item.category && (
              <Text style={styles.category}>{item.category}</Text>
            )}
          </View>
          <View style={badgeStyle}>
            <Text style={textStyle}>{statusText}</Text>
          </View>
        </View>

        <Text style={styles.reasonText} numberOfLines={2}>
          {item.reason || 'No reason provided'}
        </Text>

        <View style={styles.dateContainer}>
          <View style={styles.dateItem}>
            <Ionicons name="calendar-outline" size={16} color="#666" />
            <Text style={styles.dateText}>
              {item.startDate ? formatDate(item.startDate) : 'Unknown'} - 
              {item.endDate ? formatDate(item.endDate) : 'Unknown'}
            </Text>
          </View>
        </View>

        <View style={styles.studentInfo}>
          <Ionicons name="people-outline" size={16} color="#666" />
          <Text style={styles.studentText}>
            {item.students && item.students.length > 0 ? 
              (item.students.length === 1 
                ? `${item.students[0].name || 'Unknown Student'}`
                : `${item.students.length} Students`) 
              : 'No students'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderSectionHeader = ({ section }: { section: any }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{section.title}</Text>
      {section.key === 'pending' && (
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{section.data.length}</Text>
        </View>
      )}
      {/* {section.key === 'other' && (
        <View style={[styles.countBadge, { backgroundColor: '#607D8B' }]}>
          <Text style={styles.countText}>{section.data.length}</Text>
        </View>
      )} */}
    </View>
  );

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#F44336" />
          <Text style={styles.errorText}>Failed to load approval requests</Text>
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
        <View style={{ width: 40 }} />
        <TouchableOpacity onPress={handleHeaderTap}>
          <Text style={styles.headerTitle}>Teacher Approvals</Text>
        </TouchableOpacity>
        <View style={{ width: 40 }} />
      </View>

      {debugMode && (
        <View style={styles.debugContainer}>
          <Text style={styles.debugTitle}>Debug Information</Text>
          <Text style={styles.debugText}>User ID: {user?.id || 'No user ID'}</Text>
          <Text style={styles.debugText}>API Data: {approvalRequests ? `${approvalRequests.length} items` : 'No data'}</Text>
          <Text style={styles.debugText}>Organized Sections: {organizedData.length}</Text>
          {organizedData.map(section => (
            <Text key={section.key} style={styles.debugText}>
              {section.title}: {section.data.length} items
            </Text>
          ))}
          <TouchableOpacity 
            style={styles.debugButton}
            onPress={() => {
              refetch();
              Alert.alert('Debug', 'Refreshing data...');
            }}
          >
            <Text style={styles.debugButtonText}>Refresh Data</Text>
          </TouchableOpacity>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading approval requests...</Text>
        </View>
      ) : (
        <>
          {organizedData.length > 0 ? (
            <SectionList
              sections={organizedData}
              renderItem={renderItem}
              renderSectionHeader={renderSectionHeader}
              keyExtractor={(item) => item.requestId}
              contentContainerStyle={styles.listContainer}
              stickySectionHeadersEnabled={true}
              refreshControl={
                <RefreshControl
                  refreshing={isRefetching}
                  onRefresh={refetch}
                  colors={['#6200ee']}
                  tintColor="#6200ee"
                />
              }
              ListFooterComponent={() => (
                <View style={styles.listFooter}>
                  <Text style={styles.footerText}>
                    You've reached the end of the list
                  </Text>
                </View>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle-outline" size={80} color="#4CAF50" />
              <Text style={styles.emptyText}>No approval requests</Text>
              <Text style={styles.emptySubtext}>
                You don't have any requests to review
              </Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 16,
    paddingTop: 8,
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
    flexWrap: 'wrap',
  },
  requestType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  labRequired: {
    color: '#6200ee',
    fontWeight: 'normal',
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
  pendingBadge: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  pendingText: {
    color: '#FF9800',
    fontSize: 12,
    fontWeight: 'bold',
  },
  approvedBadge: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  approvedText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rejectedBadge: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rejectedText: {
    color: '#F44336',
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
    marginBottom: 12,
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
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  studentText: {
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
  retryButton: {
    backgroundColor: '#6200ee',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 16,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f8f9fa',
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f5b93',
  },
  countBadge: {
    backgroundColor: '#4f5b93',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
  },
  countText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  listFooter: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
  },
  debugContainer: {
    margin: 10,
    padding: 10,
    backgroundColor: '#f0f4ff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  debugTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
  },
  debugButton: {
    backgroundColor: '#4f5b93',
    padding: 8,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 8,
  },
  debugButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
}); 