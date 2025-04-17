import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from './ui/Spinner';

export function ProtectedRoute() {
  const { isAuthenticated, isLoading, isAuthenticating } = useAuth();

  // Show loading spinner while checking authentication status
  // or during authentication process
  if (isLoading || isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Spinner size="lg" className="mb-4" />
        <p className="text-white text-lg">Loading your dashboard...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

export function PublicRoute() {
  const { isAuthenticated, isLoading, isAuthenticating } = useAuth();

  // Show loading spinner while checking authentication status
  // or during authentication process
  if (isLoading || isAuthenticating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <Spinner size="lg" className="mb-4" />
        <p className="text-white text-lg">Authenticating...</p>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
} 