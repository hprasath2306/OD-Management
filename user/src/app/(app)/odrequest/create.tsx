import React, { useState } from 'react';
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
  Platform
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { useMutation } from '@tanstack/react-query';
import { createODRequest } from '../../../api/requestApi';
import { RequestType, ODCategory } from '../../../types/request';
import * as Haptics from 'expo-haptics';
import { useAuth } from '../../../context/AuthContext';

export default function CreateODRequest() {
  const router = useRouter();
  const { user } = useAuth();
  const [reason, setReason] = useState('');
  const [description, setDescription] = useState('');
  const [needsLab, setNeedsLab] = useState(false);
  const [category, setCategory] = useState<ODCategory>(ODCategory.OTHER);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDate, setShowStartDate] = useState(false);
  const [showEndDate, setShowEndDate] = useState(false);

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

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    submitMutation.mutate({
      type: RequestType.OD,
      category,
      needsLab,
      reason,
      description,
      startDate,
      endDate,
      students: [user?.id || ''], // Add current user as a student
    });
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
              }}
              trackColor={{ false: '#ddd', true: '#b39ddb' }}
              thumbColor={needsLab ? '#6200ee' : '#f4f3f4'}
            />
          </View>

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
              {/* {showStartDate && (
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
              )} */}
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
              {/* {showEndDate && (
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
              )} */}
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
}); 