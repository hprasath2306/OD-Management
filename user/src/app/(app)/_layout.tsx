import { Tabs } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AppLayout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isTeacher = user?.role === 'TEACHER';
  const isStudent = user?.role === 'STUDENT';

  // Check authentication, show loading while checking
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  // Otherwise, show the app screens with tabs
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#6200ee',
        tabBarStyle: {
          elevation: 5,
          shadowOpacity: 0.1,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: -3 },
          borderTopColor: '#f0f0f0',
          backgroundColor: '#fff',
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          marginBottom: 5,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="home/index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Ionicons name="home-outline" size={22} color={color} />,
        }}
      />

      {isTeacher ? (
        // Teacher-specific tabs
        <Tabs.Screen
          name="approvals/index"
          options={{
            title: 'Approvals',
            tabBarIcon: ({ color }) => <Ionicons name="checkmark-circle-outline" size={22} color={color} />,
          }}
        />
      ) : ""}

      {isTeacher ? (
        <Tabs.Screen 
           name='odrequest/index'
           options={{
            href: null,
           }}
        />
      ):""
      }

      {isStudent ? (
        <Tabs.Screen
          name="approvals/index"
          options={{
            href: null,
          }}
        />
      ) : ""}

      {isStudent ? (
        <Tabs.Screen
          name="odrequest/index"
          options={{
            title: 'OD Requests',
            tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} />,
          }}
        />
      ) : ""}
      

      {/* Hidden screens for navigation */}
      <Tabs.Screen
        name="odrequest/create"
        options={{
          title: 'OD Requests',
          href: null,
          tabBarIcon: ({ color }) => <Ionicons name="document-text-outline" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="odrequest/[id]"
        options={{
          title: 'OD Requests',
          href: null,
        }}
      />
      <Tabs.Screen
        name="approvals/[id]"
        options={{
          title: 'Approval Details',
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={22} color={color} />,
        }}
      />
      {/* <Tabs.Screen
        name="approvals/index"
        options={{
          title: 'Approvals',
          href: null,
        }}
      /> */}
    </Tabs>
  );
} 