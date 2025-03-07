import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { Dashboard } from './pages/Dashboard';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Departments } from './pages/Departments';
import { DepartmentTeachers } from './pages/DepartmentTeachers';
import { Designations } from './pages/Designations';
import { Groups } from './pages/Groups';
import { GroupApprovers } from './pages/GroupApprovers';
import { Students } from './pages/Students';
import { TeacherDesignations } from './pages/TeacherDesignations';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route element={<PublicRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
            </Route>

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/departments/:departmentId/teachers" element={<DepartmentTeachers />} />
                <Route path="/departments/:departmentId/teachers/:teacherId/designations" element={<TeacherDesignations />} />
                <Route path="/departments/:departmentId/groups" element={<Groups />} />
                <Route path="/departments/:departmentId/groups/:groupId/approvers" element={<GroupApprovers />} />
                <Route path="/departments/:departmentId/groups/:groupId/students" element={<Students />} />
                <Route path="/designations" element={<Designations />} />
              </Route>
            </Route>

            {/* Redirect to login by default */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
