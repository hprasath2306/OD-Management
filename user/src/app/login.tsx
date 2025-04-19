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
  Image,
  ImageBackground
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
  const [forgotPasswordStep, setForgotPasswordStep] = useState(0); // 0: login, 1: enter email, 2: enter OTP, 3: new password
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verifyEmailMode, setVerifyEmailMode] = useState(false);
  const [verificationOtp, setVerificationOtp] = useState('');
  const { login, forgotPassword, verifyForgotPassword, resetPassword, verifyEmail } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      
      // First check if the response indicates an admin account
      const response = await login(email, password, true);
      
      // If login was successful and returned user is an admin, prevent login
      if (response?.user?.role === 'ADMIN') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert(
          'Admin Access Restricted',
          'Admin users should use the website for full functionality. This mobile app is for students only.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Reset the form
                setPassword('');
              }
            }
          ]
        );
        return;
      }
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      
      // Check if the error is due to unverified email
      if (error.message?.includes('Email not verified')) {
        setVerifyEmailMode(true);
        Alert.alert(
          'Email Verification Required',
          'Your email is not verified. Please check your email for the verification code and enter it below.'
        );
      } else {
        Alert.alert('Login Failed', error.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async () => {
    if (!verificationOtp) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await verifyEmail(email, verificationOtp);
      setVerifyEmailMode(false);
      Alert.alert(
        'Success',
        'Your email has been verified. You can now login.',
        [
          {
            text: 'OK',
            onPress: () => handleLogin()
          }
        ]
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      console.log(error)
      Alert.alert('Verification Failed', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPasswordRequest = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await forgotPassword(email);
      setForgotPasswordStep(2);
      Alert.alert(
        'OTP Sent',
        'A one-time password has been sent to your email. Please enter it to continue.'
      );
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Error', 'Please enter the OTP sent to your email');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      await verifyForgotPassword(email, otp);
      setForgotPasswordStep(3);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      Alert.alert('Error', 'Please enter a new password');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await resetPassword(email, otp, newPassword);
      Alert.alert('Success', 'Your password has been reset successfully', [
        {
          text: 'OK',
          onPress: () => {
            setPassword('');
            setOtp('');
            setNewPassword('');
            setConfirmPassword('');
            setForgotPasswordStep(0);
          }
        }
      ]);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStepTitle = () => {
    if (verifyEmailMode) return 'Verify Email';
    
    switch (forgotPasswordStep) {
      case 1: return 'Reset Password';
      case 2: return 'Verify OTP';
      case 3: return 'Create New Password';
      default: return 'Welcome Back';
    }
  };

  const getStepSubtitle = () => {
    if (verifyEmailMode) return 'Enter the verification code sent to your email';
    
    switch (forgotPasswordStep) {
      case 1: return 'Enter your email to receive a reset code';
      case 2: return 'Enter the verification code sent to your email';
      case 3: return 'Enter your new password';
      default: return 'Sign in to access your account';
    }
  };

  const renderFormContent = () => {
    if (verifyEmailMode) {
      return (
        <>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={22} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={false}
            />
          </View>
          <View style={styles.inputContainer}>
            <Ionicons name="key-outline" size={22} color="#555" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter Verification Code"
              placeholderTextColor="#999"
              value={verificationOtp}
              onChangeText={setVerificationOtp}
              keyboardType="number-pad"
              maxLength={6}
            />
          </View>
          <TouchableOpacity
            style={styles.button}
            onPress={handleVerifyEmail}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify Email</Text>
            )}
          </TouchableOpacity>
        </>
      );
    }
    
    switch (forgotPasswordStep) {
      case 1: // Email entry for forgot password
        return (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleForgotPasswordRequest}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Send Reset Code</Text>
              )}
            </TouchableOpacity>
          </>
        );
      
      case 2: // OTP verification
        return (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="key-outline" size={22} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                placeholderTextColor="#999"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </>
        );
      
      case 3: // New password entry
        return (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="New Password"
                placeholderTextColor="#999"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon} 
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={22} 
                  color="#555" 
                />
              </TouchableOpacity>
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Confirm Password"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
              />
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </>
        );
      
      default: // Login form
        return (
          <>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={22} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={22} color="#555" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
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
                  color="#555" 
                />
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={styles.button}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Sign In</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        );
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <StatusBar style="dark" />
      <View style={styles.background}>
        <View style={styles.headerContainer}>
          <Text style={styles.appName}>Acadify</Text>
          <Text style={styles.tagline}>User Portal</Text>
        </View>
        
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.formContainer}>
            <Text style={styles.title}>{getStepTitle()}</Text>
            <Text style={styles.subtitle}>{getStepSubtitle()}</Text>
            
            {renderFormContent()}

            {!verifyEmailMode && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (forgotPasswordStep === 0) {
                    setForgotPasswordStep(1);
                  } else {
                    setForgotPasswordStep(0);
                    setOtp('');
                    setNewPassword('');
                    setConfirmPassword('');
                  }
                }}
              >
                <Text style={styles.forgotPasswordText}>
                  {forgotPasswordStep === 0 ? 'Forgot Password?' : 'Back to Login'}
                </Text>
              </TouchableOpacity>
            )}
            
            {verifyEmailMode && (
              <TouchableOpacity
                style={styles.forgotPasswordButton}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setVerifyEmailMode(false);
                  setVerificationOtp('');
                }}
              >
                <Text style={styles.forgotPasswordText}>Back to Login</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  background: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 100,
    marginBottom: 30,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    padding: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  tagline: {
    fontSize: 18,
    color: '#666',
  },
  formContainer: {
    borderRadius: 24,
    padding: 25,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    marginBottom: 20,
    backgroundColor: '#f5f5f5',
  },
  inputIcon: {
    padding: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    color: '#333',
    fontSize: 16,
  },
  eyeIcon: {
    padding: 15,
  },
  button: {
    flexDirection: 'row',
    backgroundColor: '#4f5b93',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    shadowColor: 'rgba(79, 91, 147, 0.4)',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonIcon: {
    marginRight: 8,
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
    color: '#4f5b93',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
}); 