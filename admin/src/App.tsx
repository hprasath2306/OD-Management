import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, PublicRoute } from './components/ProtectedRoute';
import { Login } from './pages/auth/Login';
import { Dashboard } from './pages/Dashboard';
import { Departments } from './pages/Departments';
import { DepartmentTeachers } from './pages/DepartmentTeachers';
import { Designations } from './pages/Designations';
import { Groups } from './pages/Groups';
import { GroupApprovers } from './pages/GroupApprovers';
import { Students } from './pages/Students';
import { TeacherDesignations } from './pages/TeacherDesignations';
import { FlowTemplates } from './pages/FlowTemplates';
import { FlowSteps } from './pages/FlowSteps';
import { Layout } from './components/Layout';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Unauthorized } from './pages/Unauthorized';
import { ODRequests } from './pages/ODRequests';
import { ODApprovals } from './pages/ODApprovals';
import { Labs } from './pages/Labs';
import RequestTable from './pages/RequestTable';
import { useAuth } from './context/AuthContext';

// Create a client
const queryClient = new QueryClient();

// Redirect component for the dashboard that checks user role
function DashboardRoute() {
  const { user } = useAuth();
  
  // If user is a student, redirect to od-requests page
  if (user?.role === 'STUDENT') {
    return <Navigate to="/od-requests" replace />;
  }
  
  // If user is a teacher, redirect to od-approvals page
  if (user?.role === 'TEACHER') {
    return <Navigate to="/od-approvals" replace />;
  }
  
  // Only admins should see the dashboard
  return <Dashboard />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<PublicRoute />}>
              <Route index element={<Login />} />
            </Route>
            <Route path="/unauthorized" element={<Unauthorized />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route index element={<DashboardRoute />} />
                <Route path="/departments" element={<Departments />} />
                <Route path="/departments/:departmentId/teachers" element={<DepartmentTeachers />} />
                <Route path="/departments/:departmentId/teachers/:teacherId/designations" element={<TeacherDesignations />} />
                <Route path="/departments/:departmentId/groups" element={<Groups />} />
                <Route path="/departments/:departmentId/groups/:groupId/approvers" element={<GroupApprovers />} />
                <Route path="/departments/:departmentId/groups/:groupId/students" element={<Students />} />
                <Route path="/labs" element={<Labs />} />
                <Route path="/departments/:departmentId/labs" element={<Labs />} />
                <Route path="/designations" element={<Designations />} />
                <Route path="/flow-templates" element={<FlowTemplates />} />
                <Route path="/flow-templates/:templateId/steps" element={<FlowSteps />} />
                <Route path="/od-requests" element={<ODRequests />} />
                <Route path="/od-approvals" element={<ODApprovals />} />
                <Route path="/results" element={<RequestTable/>} />
              </Route>
            </Route>

            {/* Default redirect to login */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
