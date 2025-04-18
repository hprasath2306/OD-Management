import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import LoginScreen from './login';
import HomeScreen from './(app)/home/index';
import { Redirect } from 'expo-router';

export default function InitialPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Add a small delay to ensure the auth check is complete
    const timer = setTimeout(() => {
      setInitialCheckDone(true);
    }, 1500);
    
    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner while checking authentication
  if (isLoading || !initialCheckDone) {
    return (
      <View style={styles.loadingContainer}>
        <Ionicons name="school-outline" size={70} color="#6200ee" />
        <Text style={styles.loadingText}>Acadify</Text>
        <ActivityIndicator size="large" color="#6200ee" style={{ marginTop: 20 }} />
      </View>
    );
  }

  // Render based on authentication status
  if (isAuthenticated) {
    return <Redirect href="/(app)/home" />
  } else {
    return <Redirect href="/login" />;
  }
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
  },
});