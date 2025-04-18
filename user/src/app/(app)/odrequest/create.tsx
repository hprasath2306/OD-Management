import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Switch,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Modal,
  FlatList
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { createODRequest, getAllLabs, getAllStudents } from '../../../api/requestApi';
import { RequestType, ODCategory } from '../../../types/request';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';

// Simple type definitions for labs and students
type Lab = {
  id: string;
  name: string;
};

type Student = {
  id: string;
  name: string;
  rollNo?: string;
  group?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    name: string;
    email: string;
  };
};

export default function CreateODRequest() {
  const router = useRouter();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [needsLab, setNeedsLab] = useState(false);
  const [category, setCategory] = useState<ODCategory>(ODCategory.PROJECT);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);
  
  // Add new state fields
  const [isTeamRequest, setIsTeamRequest] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState<Student[]>([]);
  const [selectedLab, setSelectedLab] = useState<Lab | null>(null);
  const [labs, setLabs] = useState<Lab[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [showLabModal, setShowLabModal] = useState(false);
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [isLoadingLabs, setIsLoadingLabs] = useState(false);
  const [isLoadingStudents, setIsLoadingStudents] = useState(false);
  
  // Load available labs and students
  useEffect(() => {
    const loadLabs = async () => {
      try {
        setIsLoadingLabs(true);
        const labsData = await getAllLabs();
        setLabs(labsData);
      } catch (error) {
        console.error('Error loading labs:', error);
        Alert.alert('Error', 'Failed to load labs. Please try again.');
      } finally {
        setIsLoadingLabs(false);
      }
    };
    
    const loadStudents = async () => {
      try {
        setIsLoadingStudents(true);
        const studentsData = await getAllStudents();
        
        // Filter out the current user from the team members list
        const filteredStudents = Array.isArray(studentsData)
          ? studentsData.filter(student => student.user?.id !== user?.id)
          : [];
          
        setStudents(filteredStudents);
      } catch (error) {
        console.error('Error loading students:', error);
        Alert.alert('Error', 'Failed to load students. Please try again.');
      } finally {
        setIsLoadingStudents(false);
      }
    };
    
    loadLabs();
    loadStudents();
  }, [user?.id]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const submitMutation = useMutation({
    mutationFn: createODRequest,
    onSuccess: () => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Request Submitted',
        'Your OD request has been submitted successfully.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    },
    onError: (error: any) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message || 'Failed to submit request');
    },
  });

  const handleSubmit = () => {
    if (!reason.trim()) {
      Alert.alert('Error', 'Please enter a reason for your request');
      return;
    }

    if (endDate < startDate) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }
    
    if (needsLab && !selectedLab) {
      Alert.alert('Error', 'Please select a lab');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Prepare student IDs for team requests
    let studentIds = [user?.id || ''];
    if (isTeamRequest && selectedStudents.length > 0) {
      // Use the user ID from each student object if available
      studentIds = selectedStudents.map(s => s.user?.id || s.id);
      if (!studentIds.includes(user?.id || '')) {
        studentIds.push(user?.id || '');
      }
    }

    submitMutation.mutate({
      type: RequestType.OD,
      // @ts-ignore
      category: category,
      needsLab,
      reason,
      description,
      startDate,
      endDate,
      labId: selectedLab?.id,
      students: studentIds
    });
  };

  const toggleStudentSelection = (student: Student) => {
    if (selectedStudents.some(s => s.id === student.id)) {
      setSelectedStudents(selectedStudents.filter(s => s.id !== student.id));
    } else {
      setSelectedStudents([...selectedStudents, student]);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const categories = Object.values(ODCategory);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
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
          <Text style={styles.headerTitle}>New OD Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.sectionTitle}>Reason *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter reason for OD"
            value={reason}
            onChangeText={setReason}
            placeholderTextColor="#999"
            multiline
          />

          <Text style={styles.sectionTitle}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Enter additional details"
            value={description}
            onChangeText={setDescription}
            placeholderTextColor="#999"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          <Text style={styles.sectionTitle}>Category</Text>
          <View style={styles.categoryContainer}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryButton,
                  category === cat && styles.categoryButtonActive,
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat);
                }}
              >
                <Text
                  style={[
                    styles.categoryText,
                    category === cat && styles.categoryTextActive,
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          
          {/* Team Request Switch */}
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              Team Request
            </Text>
            <Switch
              value={isTeamRequest}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setIsTeamRequest(value);
                if (!value) {
                  setSelectedStudents([]);
                }
              }}
              trackColor={{ false: '#ddd', true: '#b39ddb' }}
              thumbColor={isTeamRequest ? '#6200ee' : '#f4f3f4'}
            />
          </View>
          
          {/* Team Student Selection */}
          {isTeamRequest && (
            <View style={styles.teamSection}>
              <Text style={styles.sectionTitle}>Team Members</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowStudentModal(true)}
              >
                <Ionicons name="people" size={20} color="#6200ee" />
                <Text style={styles.selectButtonText}>
                  {selectedStudents.length > 0
                    ? `${selectedStudents.length} student(s) selected`
                    : 'Select team members'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
              
              {selectedStudents.length > 0 && (
                <View style={styles.selectedItemsContainer}>
                  {selectedStudents.map(student => (
                    <View key={student.id} style={styles.selectedItem}>
                      <Text style={styles.selectedItemText}>{student.user?.name || student.name}</Text>
                      <TouchableOpacity
                        onPress={() => toggleStudentSelection(student)}
                        style={styles.removeButton}
                      >
                        <Ionicons name="close-circle" size={18} color="#666" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          <Text style={styles.sectionTitle}>Lab Required</Text>
          <View style={styles.switchContainer}>
            <Text style={styles.switchLabel}>
              Do you need lab access for this OD?
            </Text>
            <Switch
              value={needsLab}
              onValueChange={(value) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNeedsLab(value);
                if (!value) {
                  setSelectedLab(null);
                }
              }}
              trackColor={{ false: '#ddd', true: '#b39ddb' }}
              thumbColor={needsLab ? '#6200ee' : '#f4f3f4'}
            />
          </View>
          
          {/* Lab Selection */}
          {needsLab && (
            <View style={styles.labSection}>
              <Text style={styles.sectionTitle}>Select Lab</Text>
              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => setShowLabModal(true)}
              >
                <Ionicons name="flask" size={20} color="#6200ee" />
                <Text style={styles.selectButtonText}>
                  {selectedLab ? selectedLab.name : 'Select a lab'}
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.sectionTitle}>Duration</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Start Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowStartDate(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6200ee" />
                <Text style={styles.dateText}>{formatDate(startDate)}</Text>
              </TouchableOpacity>
              {showStartDate && (
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowStartDate(false);
                    if (selectedDate) {
                      setStartDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>

            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>End Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowEndDate(true)}
              >
                <Ionicons name="calendar-outline" size={18} color="#6200ee" />
                <Text style={styles.dateText}>{formatDate(endDate)}</Text>
              </TouchableOpacity>
              {showEndDate && (
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="default"
                  onChange={(event, selectedDate) => {
                    setShowEndDate(false);
                    if (selectedDate) {
                      setEndDate(selectedDate);
                    }
                  }}
                />
              )}
            </View>
          </View>

          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={submitMutation.isPending}
          >
            {submitMutation.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit Request</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      
      {/* Lab Selection Modal */}
      <Modal
        visible={showLabModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowLabModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Lab</Text>
              <TouchableOpacity
                onPress={() => setShowLabModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {isLoadingLabs ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Loading labs...</Text>
              </View>
            ) : labs.length === 0 ? (
              <Text style={styles.noDataText}>No labs available</Text>
            ) : (
              <FlatList
                data={labs}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.labItem}
                    onPress={() => {
                      setSelectedLab(item);
                      setShowLabModal(false);
                    }}
                  >
                    <Text style={styles.labName}>{item.name}</Text>
                    <View style={styles.radioContainer}>
                      {selectedLab?.id === item.id ? (
                        <Ionicons name="radio-button-on" size={24} color="#6200ee" />
                      ) : (
                        <Ionicons name="radio-button-off" size={24} color="#666" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
          </View>
        </View>
      </Modal>
      
      {/* Student Selection Modal */}
      <Modal
        visible={showStudentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowStudentModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Students</Text>
              <TouchableOpacity
                onPress={() => setShowStudentModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            {isLoadingStudents ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6200ee" />
                <Text style={styles.loadingText}>Loading students...</Text>
              </View>
            ) : students.length === 0 ? (
              <Text style={styles.noDataText}>No students available</Text>
            ) : (
              <FlatList
                data={students}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.studentItem}
                    onPress={() => toggleStudentSelection(item)}
                  >
                    <View style={styles.studentInfo}>
                      <Text style={styles.studentName}>{item.user?.name || item.name}</Text>
                      {item.rollNo && (
                        <Text style={styles.studentDetails}>
                          Roll No: {item.rollNo} {item.group?.name ? `• ${item.group.name}` : ''}
                        </Text>
                      )}
                    </View>
                    <View style={styles.checkboxContainer}>
                      {selectedStudents.some(s => s.id === item.id) ? (
                        <Ionicons name="checkbox" size={24} color="#6200ee" />
                      ) : (
                        <Ionicons name="square-outline" size={24} color="#666" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowStudentModal(false)}
            >
              <Text style={styles.modalButtonText}>Done</Text>
            </TouchableOpacity>
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
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    color: '#333',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  typeContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 16,
    padding: 2,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 6,
  },
  typeButtonActive: {
    backgroundColor: '#6200ee',
  },
  typeText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  typeTextActive: {
    color: '#fff',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  categoryButtonActive: {
    backgroundColor: '#6200ee',
  },
  categoryText: {
    fontSize: 14,
    color: '#666',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  switchLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dateItem: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    elevation: 2,
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 },
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // New styles
  teamSection: {
    marginBottom: 16,
  },
  labSection: {
    marginBottom: 16,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  selectedItemsContainer: {
    marginTop: 8,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedItemText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeButton: {
    padding: 2,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingBottom: 30,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  labItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  labName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  radioContainer: {
    padding: 4,
  },
  studentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  studentDetails: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  checkboxContainer: {
    padding: 4,
  },
  modalButton: {
    backgroundColor: '#6200ee',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    padding: 20,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
}); 