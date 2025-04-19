import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Image,
  Dimensions,
  Share,
  Platform,
  ScrollView,
  TextInput
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import { getStudentRequests } from '../../../api/requestApi';
import { OdRequest, ApprovalStatus } from '../../../types/request';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import ViewShot from 'react-native-view-shot';
import { useAuth } from '../../../context/AuthContext';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function ODRequests() {
  const router = useRouter();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<OdRequest | null>(null);
  const [cardVisible, setCardVisible] = useState(false);
  const viewShotRef = useRef<ViewShot>(null);
  
  // Search and filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterVisible, setIsFilterVisible] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [filteredRequests, setFilteredRequests] = useState<OdRequest[] | null>(null);
  
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

  // Apply filters to requests
  useEffect(() => {
    if (!requests) {
      setFilteredRequests(null);
      return;
    }

    // Create a copy of requests to avoid modifying the original
    let result = [...requests];
    
    // Sort requests by the most recent date first (based on start date)
    result.sort((a, b) => {
      const dateA = new Date(a.startDate).getTime();
      const dateB = new Date(b.startDate).getTime();
      return dateB - dateA;  // Most recent first
    });

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (req) => 
          (req.reason && req.reason.toLowerCase().includes(query)) ||
          (req.type && req.type.toLowerCase().includes(query)) ||
          (req.category && req.category.toLowerCase().includes(query)) ||
          (req.description && req.description.toLowerCase().includes(query))
      );
    }

    // Apply date filters
    if (startDate) {
      const start = startDate.setHours(0, 0, 0, 0);
      result = result.filter(req => {
        const reqDate = new Date(req.startDate).setHours(0, 0, 0, 0);
        return reqDate >= start;
      });
    }

    if (endDate) {
      const end = endDate.setHours(23, 59, 59, 999);
      result = result.filter(req => {
        const reqDate = new Date(req.endDate).setHours(0, 0, 0, 0);
        return reqDate <= end;
      });
    }

    setFilteredRequests(result);
  }, [requests, searchQuery, startDate, endDate]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setStartDate(null);
    setEndDate(null);
    setIsFilterVisible(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  // Date picker handlers
  const onStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setStartDate(selectedDate);
    }
  };

  const onEndDateChange = (event: any, selectedDate?: Date) => {
    setShowEndDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setEndDate(selectedDate);
    }
  };

  const openStartDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowStartDatePicker(true);
  };

  const openEndDatePicker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEndDatePicker(true);
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

  const handleViewCard = (request: OdRequest) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedRequest(request);
    setCardVisible(true);
  };

  const closeCard = () => {
    setCardVisible(false);
    setSelectedRequest(null);
  };

  // Function to share the OD Card (only metadata, not the actual image)
  const shareODCard = async () => {
    if (!selectedRequest) return;
    
    try {
      await Share.share({
        message: `OD Request Approved\nID: ${selectedRequest.id}\nDuration: ${formatDate(selectedRequest.startDate)} to ${formatDate(selectedRequest.endDate)}\nReason: ${selectedRequest.reason}`,
        title: 'OD Approval Card'
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderItem = ({ item }: { item: OdRequest }) => (
    <TouchableOpacity
      style={styles.requestCard}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
          pathname: `/(app)/odrequest/[id]`,
          params: { 
            id: item.id,
            request: JSON.stringify(item)
          }
        });
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

      {item.approvals[0].status === ApprovalStatus.APPROVED && (
        <TouchableOpacity
          style={styles.viewCardButton}
          onPress={() => handleViewCard(item)}
        >
          <Ionicons name="card-outline" size={16} color="#fff" style={styles.viewCardIcon} />
          <Text style={styles.viewCardText}>View OD Card</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );

  const renderODCard = () => {
    if (!selectedRequest) return null;

    // Use the first approval for signature (assuming the first one is the latest or most relevant)
    const approval = selectedRequest.approvals[0];
    // @ts-ignore
    const approverName = approval.approverName || 'HOD';
    
    return (
      <Modal
        visible={cardVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={closeCard}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>OD Approval Card</Text>
              <TouchableOpacity onPress={closeCard} style={styles.closeButton}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.cardScrollView}>
              {/* <View style={styles.securityNotice}>
                <Ionicons name="shield-checkmark" size={18} color="#4CAF50" />
                <Text style={styles.securityText}>Screenshot Protected • Secure Document</Text>
              </View> */}

              <ViewShot ref={viewShotRef} style={styles.odCardContainer}>
                <View style={styles.odCardHeader}>
                  <View style={styles.watermark}>
                    <Text style={styles.watermarkText}>OFFICIAL</Text>
                  </View>
                  
                  <View style={styles.logoContainer}>
                    <Text style={styles.logoText}>Acadify</Text>
                  </View>
                  <Text style={styles.cardTitle}>ON-DUTY APPROVAL</Text>
                  <Text style={styles.cardIdNumber}>ID: {selectedRequest.id.substring(0, 8)}</Text>
                </View>
                
                <View style={styles.cardContent}>
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Student:</Text>
                    <Text style={styles.cardValue}>{user?.email || 'Student'}</Text>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Duration:</Text>
                    <Text style={styles.cardValue}>
                      {formatDate(selectedRequest.startDate)} to {formatDate(selectedRequest.endDate)}
                    </Text>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Type:</Text>
                    <Text style={styles.cardValue}>
                      {selectedRequest.type} - {selectedRequest.category}
                    </Text>
                  </View>
                  
                  <View style={styles.cardRow}>
                    <Text style={styles.cardLabel}>Reason:</Text>
                    <Text style={styles.cardValue}>
                      {selectedRequest.reason}
                    </Text>
                  </View>
                  
                  <View style={styles.approvalSection}>
                    <View style={styles.approvalStatus}>
                      <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
                      <Text style={styles.approvedText}>APPROVED</Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.signatureContainer}>
                      <Text style={styles.signatureText}>{approverName}</Text>
                      <Text style={styles.signatureTitle}>Approving Authority</Text>
                    </View>
                  </View>
                  
                  <View style={styles.authenticityContainer}>
                    <Text style={styles.authenticityText}>
                      This digital document is system-generated and valid without physical signature.
                      Verification can be done through the Acadify portal.
                    </Text>
                    <Text style={styles.dateGenerated}>
                      Generated on: {new Date().toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </ViewShot>
              
              <TouchableOpacity
                style={styles.shareButton}
                onPress={shareODCard}
              >
                <Ionicons name="share-social-outline" size={18} color="#fff" />
                <Text style={styles.shareButtonText}>Share Details</Text>
              </TouchableOpacity>
              
              <Text style={styles.shareDisclaimer}>
                Note: Only metadata will be shared, not the actual card image.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  };

  if (error) {
    console.log(error)
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
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsFilterVisible(!isFilterVisible);
            }}
          >
            <Ionicons name="options-outline" size={24} color="#333" />
          </TouchableOpacity>
        </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by reason, type, category..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
          {searchQuery ? (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Ionicons name="close-circle" size={20} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Date Filters */}
      {isFilterVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterTitle}>Filter by Date</Text>
          
          <View style={styles.dateFilterRow}>
            <TouchableOpacity 
              style={styles.dateFilterButton}
              onPress={openStartDatePicker}
            >
              <Ionicons name="calendar-outline" size={18} color="#4f5b93" />
              <Text style={styles.dateButtonText}>
                {startDate ? formatDate(startDate) : "Start Date"}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.dateFilterSeparator}>
              <Text style={styles.dateFilterSeparatorText}>to</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.dateFilterButton}
              onPress={openEndDatePicker}
            >
              <Ionicons name="calendar-outline" size={18} color="#4f5b93" />
              <Text style={styles.dateButtonText}>
                {endDate ? formatDate(endDate) : "End Date"}
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.clearFilterButton}
            onPress={clearFilters}
          >
            <Ionicons name="refresh-outline" size={18} color="#fff" />
            <Text style={styles.clearFilterText}>Clear Filters</Text>
          </TouchableOpacity>
        </View>
      )}

      {showStartDatePicker && (
        <DateTimePicker
          value={startDate || new Date()}
          mode="date"
          display="default"
          onChange={onStartDateChange}
        />
      )}

      {showEndDatePicker && (
        <DateTimePicker
          value={endDate || new Date()}
          mode="date"
          display="default"
          onChange={onEndDateChange}
        />
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6200ee" />
          <Text style={styles.loadingText}>Loading your requests...</Text>
        </View>
      ) : (
        <>
          {requests && requests.length > 0 ? (
            <>
              <FlatList
                data={filteredRequests || requests}
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
                ListEmptyComponent={
                  <View style={styles.noResultsContainer}>
                    <Ionicons name="search" size={64} color="#ccc" />
                    <Text style={styles.noResultsText}>No matching requests found</Text>
                    <TouchableOpacity
                      style={styles.clearSearchButton}
                      onPress={clearFilters}
                    >
                      <Ionicons name="refresh-outline" size={16} color="#fff" style={{marginRight: 4}} />
                      <Text style={styles.clearSearchText}>Clear Search & Filters</Text>
                    </TouchableOpacity>
                  </View>
                }
              />
              {filteredRequests && (
                <View style={styles.resultsCountContainer}>
                  {filteredRequests.length > 0 ? (
                    <Text style={styles.resultsCountText}>
                      Showing {filteredRequests.length} of {requests.length} requests • Most recent first
                    </Text>
                  ) : (
                    <Text style={[styles.resultsCountText, {color: '#ff5722'}]}>
                      No requests match your search criteria
                    </Text>
                  )}
                </View>
              )}
            </>
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
      
      {renderODCard()}
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const cardWidth = width * 0.9;

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
  viewCardButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginTop: 5,
  },
  viewCardIcon: {
    marginRight: 6,
  },
  viewCardText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: width * 0.9,
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  cardScrollView: {
    padding: 16,
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  securityText: {
    color: '#2e7d32',
    fontSize: 14,
    marginLeft: 8,
  },
  odCardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    marginBottom: 16,
  },
  odCardHeader: {
    backgroundColor: '#4f5b93',
    padding: 16,
    alignItems: 'center',
    position: 'relative',
  },
  watermark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.1,
    transform: [{ rotate: '-30deg' }],
  },
  watermarkText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  cardIdNumber: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 4,
  },
  cardContent: {
    padding: 16,
  },
  cardRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    width: 80,
  },
  cardValue: {
    fontSize: 14,
    color: '#444',
    flex: 1,
  },
  reasonContainer: {
    marginBottom: 16,
  },
  reasonValue: {
    fontSize: 14,
    color: '#444',
    marginTop: 4,
    lineHeight: 20,
  },
  approvalSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 16,
  },
  approvalStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  approvedText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 16,
  },
  signatureContainer: {
    alignItems: 'center',
  },
  signatureText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  signatureTitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  authenticityContainer: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  authenticityText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 18,
  },
  dateGenerated: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  shareButton: {
    backgroundColor: '#4f5b93',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  shareButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  shareDisclaimer: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 8,
  },
  filterButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  searchContainer: {
    padding: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  searchInput: {
    flex: 1,
    padding: 8,
    fontSize: 15,
    color: '#333',
  },
  filterContainer: {
    padding: 16,
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  filterTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  dateFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    justifyContent: 'space-between',
  },
  dateFilterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  dateFilterSeparator: {
    width: 40,
    alignItems: 'center',
  },
  dateFilterSeparatorText: {
    color: '#666',
    fontSize: 14,
  },
  dateButtonText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  clearFilterButton: {
    backgroundColor: '#4f5b93',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  clearFilterText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  clearSearchButton: {
    backgroundColor: '#4f5b93',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearSearchText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  resultsCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F0F3F8',
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  resultsCountText: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
  },
}); 