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
  FlatList,
  ImageBackground,
  Image,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { 
  createODRequest, 
  getAllLabs, 
  getAllStudents, 
  uploadProofOfOD,
  uploadProofDirectly 
} from '../../../api/requestApi';
import { RequestType, ODCategory } from '../../../types/request';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { Stack } from 'expo-router';

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
  
  // New state for file upload
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofFileName, setProofFileName] = useState<string | null>(null);
  const [isUploadingProof, setIsUploadingProof] = useState(false);
  const [proofUrl, setProofUrl] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Get user token for authentication
  const [userToken, setUserToken] = useState<string | null>(null);
  
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

  // Get user token for authentication
  useEffect(() => {
    const fetchToken = async () => {
      try {
        // This is a placeholder. Replace with your actual token retrieval logic
        // For example: const token = await AsyncStorage.getItem('userToken');
        const token = "your-auth-token"; // Replace with actual token retrieval
        setUserToken(token);
      } catch (error) {
        console.error('Error fetching token:', error);
      }
    };
    
    fetchToken();
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Pick image from library
  const pickImage = async () => {
    try {
      // Reset any previous upload states
      setUploadError(null);
      
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload an image.');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        base64: true,
      });
      
      if (!result.canceled && result.assets && result.assets[0].base64) {
        setProofImage(`data:image/jpeg;base64,${result.assets[0].base64}`);
        setProofFileName(result.assets[0].fileName || 'image.jpg');
        // Reset URL if selecting a new image
        setProofUrl(null);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Upload image directly to server
  const handleUploadProof = async () => {
    if (!proofImage) {
      setUploadError('No image selected');
      return;
    }

    setIsUploadingProof(true);
    setUploadError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Generate a temporary ID for the upload
      const tempId = 'temp-' + Date.now();
      const result = await uploadProofDirectly(proofImage);
      console.log(result);
      
      if (result && result.proofUrl) {
        setProofUrl(result.proofUrl);
        Alert.alert('Success', 'Proof uploaded successfully');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Error uploading proof:', error);
      setUploadError(`Error uploading proof: ${error instanceof Error ? error.message : 'Unknown error'}`);
      Alert.alert('Upload Failed', 'Could not upload image. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsUploadingProof(false);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setProofImage(null);
    setProofFileName(null);
    setProofUrl(null);
    setUploadError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const submitMutation = useMutation({
    mutationFn: createODRequest,
    onSuccess: (data) => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Request submitted successfully');
      router.replace('/(app)/odrequest');
    },
    onError: (error: any) => {
      console.error('Error creating request:', error);
      Alert.alert('Error', error.message || 'Failed to create request');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      students: studentIds,
      // @ts-ignore - Allow null value
      proofOfOD: proofUrl
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
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Create OD Request</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-text-outline" size={22} color="#4f5b93" />
              <Text style={styles.cardTitle}>Request Details</Text>
            </View>
            
            <Text style={styles.sectionTitle}>Reason <Text style={styles.requiredStar}>*</Text></Text>
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
          </View>
          
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="people-outline" size={22} color="#4f5b93" />
              <Text style={styles.cardTitle}>Team Request</Text>
            </View>
            
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>
                  Team Request
                </Text>
                <Text style={styles.switchDescription}>
                  Enable if you're submitting this request for a team
                </Text>
              </View>
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
                thumbColor={isTeamRequest ? '#4f5b93' : '#f4f3f4'}
              />
            </View>
            
            {isTeamRequest && (
              <View style={styles.teamSection}>
                <Text style={styles.sectionTitle}>Team Members</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowStudentModal(true)}
                >
                  <Ionicons name="people" size={20} color="#4f5b93" />
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
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="flask-outline" size={22} color="#4f5b93" />
              <Text style={styles.cardTitle}>Lab Access</Text>
            </View>
          
            <View style={styles.switchContainer}>
              <View style={styles.switchLabelContainer}>
                <Text style={styles.switchLabel}>
                  Lab Required
                </Text>
                <Text style={styles.switchDescription}>
                  Do you need lab access for this OD?
                </Text>
              </View>
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
                thumbColor={needsLab ? '#4f5b93' : '#f4f3f4'}
              />
            </View>
            
            {needsLab && (
              <View style={styles.labSection}>
                <Text style={styles.sectionTitle}>Select Lab</Text>
                <TouchableOpacity
                  style={styles.selectButton}
                  onPress={() => setShowLabModal(true)}
                >
                  <Ionicons name="flask" size={20} color="#4f5b93" />
                  <Text style={styles.selectButtonText}>
                    {selectedLab ? selectedLab.name : 'Select a lab'}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Ionicons name="calendar-outline" size={22} color="#4f5b93" />
              <Text style={styles.cardTitle}>Duration</Text>
            </View>
            
            <View style={styles.dateContainer}>
              <View style={styles.dateItem}>
                <Text style={styles.dateLabel}>Start Date</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowStartDate(true)}
                >
                  <Ionicons name="calendar-outline" size={18} color="#4f5b93" />
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
                  <Ionicons name="calendar-outline" size={18} color="#4f5b93" />
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
          </View>

          {/* Upload Proof of OD Section */}
          <View style={styles.uploadCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="document-attach-outline" size={22} color="#4f5b93" />
              <Text style={styles.uploadCardTitle}>Supporting Document</Text>
            </View>
            
            <Text style={styles.uploadDescriptionText}>Upload a proof document for your OD request (e.g., event invitation, medical certificate, etc.)</Text>
            
            {proofImage ? (
              <View style={styles.selectedImageContainer}>
                <Image source={{ uri: proofImage }} style={styles.selectedImage} />
                <Text style={styles.fileName}>{proofFileName}</Text>
                
                {!proofUrl && !isUploadingProof && (
                  <TouchableOpacity 
                    style={[styles.uploadButton, styles.uploadNowButton]} 
                    onPress={handleUploadProof}
                  >
                    <Ionicons name="cloud-upload-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadButtonText}>Upload Now</Text>
                  </TouchableOpacity>
                )}
                
                {isUploadingProof && (
                  <View style={styles.uploadingContainer}>
                    <ActivityIndicator size="small" color="#4F46E5" />
                    <Text style={styles.uploadingText}>Uploading...</Text>
                  </View>
                )}
                
                {proofUrl && (
                  <View style={styles.uploadSuccessContainer}>
                    <Ionicons name="checkmark-circle" size={18} color="#059669" style={{ marginRight: 8 }} />
                    <Text style={styles.uploadSuccessText}>Uploaded successfully</Text>
                  </View>
                )}
                
                <TouchableOpacity 
                  style={styles.removeButton} 
                  onPress={removeImage}
                  disabled={isUploadingProof}
                >
                  <Ionicons name="trash-outline" size={16} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.uploadButton} 
                onPress={pickImage}
              >
                <Ionicons name="image-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                <Text style={styles.uploadButtonText}>Select Image</Text>
              </TouchableOpacity>
            )}
            
            {uploadError && (
              <Text style={styles.errorText}>{uploadError}</Text>
            )}
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleSubmit}
            disabled={submitMutation.isPending || isUploadingProof}
          >
            <LinearGradient
              colors={['#4f5b93', '#6d6a97']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButton}
            >
              {submitMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="paper-plane" size={18} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={styles.submitButtonText}>Submit Request</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
                <ActivityIndicator size="large" color="#4f5b93" />
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
                    <View style={styles.labNameContainer}>
                      <Ionicons name="flask-outline" size={20} color="#4f5b93" style={{ marginRight: 10 }} />
                      <Text style={styles.labName}>{item.name}</Text>
                    </View>
                    <View style={styles.radioContainer}>
                      {selectedLab?.id === item.id ? (
                        <Ionicons name="radio-button-on" size={24} color="#4f5b93" />
                      ) : (
                        <Ionicons name="radio-button-off" size={24} color="#666" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowLabModal(false)}
            >
              <LinearGradient
                colors={['#4f5b93', '#6373b5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </LinearGradient>
            </TouchableOpacity>
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
                <ActivityIndicator size="large" color="#4f5b93" />
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
                        <Ionicons name="checkbox" size={24} color="#4f5b93" />
                      ) : (
                        <Ionicons name="square-outline" size={24} color="#666" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
              />
            )}
            
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setShowStudentModal(false)}
            >
              <LinearGradient
                colors={['#4f5b93', '#6373b5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modalButton}
              >
                <Text style={styles.modalButtonText}>Done</Text>
              </LinearGradient>
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
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
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
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
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
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  requiredStar: {
    color: '#e53935',
    fontWeight: 'bold',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginTop: 8,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#333',
    marginBottom: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  categoryButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryButtonActive: {
    backgroundColor: '#4f5b93',
    borderColor: '#4f5b93',
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
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  switchLabelContainer: {
    flex: 1,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  switchDescription: {
    fontSize: 13,
    color: '#777',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateItem: {
    width: '48%',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#555',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#333',
  },
  submitButton: {
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Team section styles
  teamSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  labSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectButtonText: {
    fontSize: 15,
    color: '#333',
    flex: 1,
    marginLeft: 10,
  },
  selectedItemsContainer: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  selectedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eef0f7',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#dde2f0',
  },
  selectedItemText: {
    fontSize: 14,
    color: '#333',
    marginRight: 4,
  },
  removeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF3B30',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  removeButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  // Modal styles
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
    maxHeight: '80%',
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
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  labNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    paddingVertical: 14,
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
    color: '#777',
    marginTop: 2,
  },
  checkboxContainer: {
    padding: 4,
  },
  modalButton: {
    borderRadius: 25,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 30,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  noDataText: {
    padding: 30,
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
  },
  uploadedImageContainer: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden',
    marginTop: 10,
  },
  uploadedImage: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  uploadedImageDetails: {
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  fileName: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
  uploadButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  uploadNowButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4f5b93',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  uploadNowButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  uploadSuccessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  uploadSuccessText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  uploadErrorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  uploadErrorText: {
    color: '#F44336',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  selectImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    borderStyle: 'dashed',
    paddingVertical: 20,
    marginTop: 10,
  },
  selectImageButtonText: {
    fontSize: 16,
    color: '#4f5b93',
    fontWeight: '500',
    marginLeft: 8,
  },
  uploadDescriptionText: {
    fontSize: 14,
    color: '#777',
    marginBottom: 12,
  },
  uploadCard: {
    backgroundColor: '#ffffff',
    borderRadius: 8,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  uploadCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#111827',
  },
  selectedImageContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  selectedImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    resizeMode: 'cover',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  uploadingText: {
    marginLeft: 8,
    color: '#4F46E5',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 14,
    marginTop: 8,
  },
  submitContainer: {
    padding: 16,
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 8,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  uploadButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 14,
  },
  submitButtonContainer: {
    borderRadius: 25,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 16,
    elevation: 2,
    shadowOpacity: 0.2,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
}); 