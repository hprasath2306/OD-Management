import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useAuth } from '../context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const { login, forgotPassword } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await login(email, password);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Login Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await forgotPassword(email);
      Alert.alert(
        'Password Reset',
        'If your email is registered, you will receive a password reset OTP shortly.'
      );
      setIsForgotPassword(false);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="light" />
      {/* <Image
        source={{ uri: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&q=80' }}
        style={styles.backgroundImage}
      /> */}
      
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <BlurView intensity={75} style={styles.formContainer} tint="dark">
          <View style={styles.logoContainer}>
            {/* <Text style={styles.logo}>Acadify</Text> */}
            {/* <Text style={styles.subtitle}>OnDuty Management System</Text> */}
          </View>

          <Text style={styles.title}>
            {isForgotPassword ? 'Reset Password' : 'Welcome Back'}
          </Text>
          
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#fff" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#aaa"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {!isForgotPassword && (
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#fff" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#aaa"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#fff" 
                />
              </TouchableOpacity>
            </View>
          )}

          {isForgotPassword ? (
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Link</Text>
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign In</Text>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIsForgotPassword(!isForgotPassword);
            }}
          >
            <Text style={styles.forgotPasswordText}>
              {isForgotPassword ? 'Back to Login' : 'Forgot Password?'}
            </Text>
          </TouchableOpacity>
        </BlurView>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  formContainer: {
    borderRadius: 20,
    padding: 25,
    overflow: 'hidden',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: '#fff',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  button: {
    backgroundColor: '#6200ee',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  forgotPasswordButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  forgotPasswordText: {
    color: '#ccc',
    fontSize: 16,
  },
}); 