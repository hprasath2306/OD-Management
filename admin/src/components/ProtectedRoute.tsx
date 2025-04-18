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
        <div className="relative flex flex-col items-center">
          <div className="absolute -top-24 w-48 h-48 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse"></div>
          <Spinner size="lg" className="mb-6 relative z-10" />
          <h2 className="text-white text-xl font-semibold mb-2 relative z-10">Welcome Back</h2>
          <p className="text-purple-200 text-center relative z-10 max-w-xs">
            <span className="inline-block animate-pulse">Loading your dashboard</span>
            <span className="inline-block ml-1 animate-bounce delay-100">.</span>
            <span className="inline-block ml-0.5 animate-bounce delay-200">.</span>
            <span className="inline-block ml-0.5 animate-bounce delay-300">.</span>
          </p>
        </div>
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
        <div className="relative flex flex-col items-center">
          <div className="absolute -top-20 w-40 h-40 bg-purple-600/20 rounded-full filter blur-3xl animate-pulse"></div>
          <Spinner size="lg" className="mb-6 relative z-10" />
          <div className="bg-slate-800/50 backdrop-blur-sm px-8 py-4 rounded-xl border border-purple-500/20 shadow-lg relative z-10">
            <h2 className="text-white text-xl font-semibold mb-1">Acadify</h2>
            <p className="text-purple-200 flex items-center">
              <svg className="w-4 h-4 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="inline-block">
                Authenticating
                <span className="inline-block ml-0.5 animate-bounce delay-100">.</span>
                <span className="inline-block ml-0.5 animate-bounce delay-200">.</span>
                <span className="inline-block ml-0.5 animate-bounce delay-300">.</span>
              </span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
} 