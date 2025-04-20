import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import api from '../api/auth';
import { Spinner } from '../components/ui/Spinner';
import { useNavigate } from 'react-router-dom';
import { Request } from '../types/request';

type RequestStats = {
  totalApproved: number;
  totalPending: number;
  totalRejected: number;
  recentRequests: Request[];
}

type Approval = {
  status: string;
  groupId?: string;
}

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<RequestStats>({
    totalApproved: 0,
    totalPending: 0,
    totalRejected: 0,
    recentRequests: []
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/requests');
        const requests: Request[] = response.data.requests;

        // Count requests by status
        const approved = requests.filter(req =>
          req.approvals.some((approval: Approval) => approval.status === 'APPROVED')).length;
        const pending = requests.filter(req =>
          req.approvals.some((approval: Approval) => approval.status === 'PENDING')).length;
        const rejected = requests.filter(req =>
          req.approvals.some((approval: Approval) => approval.status === 'REJECTED')).length;

        // Get recent OD requests sorted by date
        const odRequests = requests
          .filter(req => req.type === 'OD')
          .sort((a: Request, b: Request) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime())
          .slice(0, 5);

        setStats({
          totalApproved: approved,
          totalPending: pending,
          totalRejected: rejected,
          recentRequests: odRequests
        });

        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      if (diffHours === 0) {
        const diffMinutes = Math.floor(diffTime / (1000 * 60));
        return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
      }
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Function to get initials from name
  const getInitials = (name: string | undefined): string => {
    if (!name) return 'U';
    return name.split(' ').map((n) => n[0]).join('').toUpperCase();
  };

  // Function to get status badge color
  const getStatusBadgeClass = (status: string | undefined): string => {
    if (!status) return 'bg-gray-900/60 text-gray-200 border border-gray-700';
    switch (status.toUpperCase()) {
      case 'PENDING':
        return 'bg-yellow-900/60 text-yellow-200 border border-yellow-700';
      case 'APPROVED':
        return 'bg-green-900/60 text-green-200 border border-green-700';
      case 'REJECTED':
        return 'bg-red-900/60 text-red-200 border border-red-700';
      default:
        return 'bg-gray-900/60 text-gray-200 border border-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <Spinner size="lg" className="text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 p-8 max-w-md">
          <svg className="h-12 w-12 text-red-500 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h3 className="text-lg font-medium text-white">Dashboard Error</h3>
          <p className="mt-1 text-sm text-gray-300">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 focus:ring-offset-slate-900"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="py-8 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 relative">
          <div className="absolute -top-12 -left-12 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-20 blur-3xl"></div>
          <div className="relative z-10">
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="mt-2 text-purple-200">
              Welcome back, <span className="font-semibold">{user?.name || user?.email}</span>
              <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-900 text-purple-200 border border-purple-700">
                {user?.role}
              </span>
            </p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-purple-500/10 blur-xl"></div>
            <div className="px-5 py-4 sm:p-6 relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-xl shadow-lg">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Total Requests</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">{stats.totalApproved + stats.totalPending + stats.totalRejected}</div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-green-500/10 blur-xl"></div>
            <div className="px-5 py-4 sm:p-6 relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-emerald-500 to-green-600 p-3 rounded-xl shadow-lg">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Approved Requests</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">{stats.totalApproved}</div>
                      {/* <span className="ml-2 text-sm font-medium text-green-400">+{stats.approvedPercentChange}%</span> */}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-yellow-500/10 blur-xl"></div>
            <div className="px-5 py-4 sm:p-6 relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-amber-500 to-yellow-600 p-3 rounded-xl shadow-lg">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Pending Requests</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">{stats.totalPending}</div>
                      {/* <span className="ml-2 text-sm font-medium text-yellow-400">{stats.pendingPercentChange}%</span> */}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
            <div className="absolute -top-12 -right-12 w-24 h-24 rounded-full bg-red-500/10 blur-xl"></div>
            <div className="px-5 py-4 sm:p-6 relative z-10">
              <div className="flex items-center">
                <div className="flex-shrink-0 bg-gradient-to-br from-rose-500 to-red-600 p-3 rounded-xl shadow-lg">
                  <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-300 truncate">Rejected Requests</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">{stats.totalRejected}</div>
                      {/* <span className="ml-2 text-sm font-medium text-red-400">+{stats.rejectedPercentChange}%</span> */}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests & Activity Section */}
        <div className="grid grid-cols-1 gap-5 ">
          {/* Recent OD Requests */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
            <div className="px-4 py-5 sm:px-6 border-b border-gray-700 relative z-10">
              <h3 className="text-lg font-medium leading-6 text-white">Recent OD Requests</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-300">Latest requests submitted by students</p>
            </div>
            <div className="relative z-10">
              {stats.recentRequests.length === 0 ? (
                <div className="px-4 py-8 text-center">
                  <p className="text-gray-400">No recent OD requests found</p>
                </div>
              ) : (
                <ul className="divide-y divide-gray-700">
                  {stats.recentRequests.map((request) => (
                    <li key={request.id} className="px-4 py-4 sm:px-6 hover:bg-gray-800/50 transition-colors cursor-pointer" onClick={() => navigate(`/requests?id=${request.id}`)}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                            {getInitials(request.students[0]?.name)}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-white">{request.students[0]?.name}</div>
                            <div className="text-sm text-gray-400">
                              {request.students[0]?.group?.name || 'Unknown Class'} • {request.category || request.type}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(request.approvals[0]?.status)}`}>
                            {request.approvals[0]?.status}
                          </span>
                          <span className="ml-2 text-sm text-gray-400">{formatDate(request.startDate)}</span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              <div className="px-4 py-3 sm:px-6 border-t border-gray-700 flex justify-center">
                <button
                  className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  onClick={() => navigate('/requests')}
                >
                  View all requests
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
} 