import { useAuth } from '../context/AuthContext';

export function Dashboard() {
  const { user } = useAuth();

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
                    <dt className="text-sm font-medium text-gray-300 truncate">Total Users</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-white">124</div>
                      <span className="ml-2 text-sm font-medium text-green-400">+8%</span>
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
                      <div className="text-2xl font-semibold text-white">87</div>
                      <span className="ml-2 text-sm font-medium text-green-400">+12%</span>
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
                      <div className="text-2xl font-semibold text-white">23</div>
                      <span className="ml-2 text-sm font-medium text-yellow-400">-5%</span>
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
                      <div className="text-2xl font-semibold text-white">14</div>
                      <span className="ml-2 text-sm font-medium text-red-400">+2%</span>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Requests & Activity Section */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Recent OD Requests */}
          <div className="lg:col-span-2 bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
            <div className="absolute -bottom-16 -right-16 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl"></div>
            <div className="px-4 py-5 sm:px-6 border-b border-gray-700 relative z-10">
              <h3 className="text-lg font-medium leading-6 text-white">Recent OD Requests</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-300">Latest requests submitted by students</p>
            </div>
            <div className="relative z-10">
              <ul className="divide-y divide-gray-700">
                <li className="px-4 py-4 sm:px-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold">
                        JS
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">John Smith</div>
                        <div className="text-sm text-gray-400">CSE Department • Field Trip</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-900/60 text-yellow-200 border border-yellow-700">
                        Pending
                      </span>
                      <span className="ml-2 text-sm text-gray-400">2 hours ago</span>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-4 sm:px-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold">
                        SP
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">Sara Parker</div>
                        <div className="text-sm text-gray-400">ECE Department • Workshop</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-200 border border-green-700">
                        Approved
                      </span>
                      <span className="ml-2 text-sm text-gray-400">5 hours ago</span>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-4 sm:px-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white font-bold">
                        RJ
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">Robert Johnson</div>
                        <div className="text-sm text-gray-400">Mech Department • Competition</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-900/60 text-green-200 border border-green-700">
                        Approved
                      </span>
                      <span className="ml-2 text-sm text-gray-400">1 day ago</span>
                    </div>
                  </div>
                </li>

                <li className="px-4 py-4 sm:px-6 hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold">
                        AM
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-white">Alex Miller</div>
                        <div className="text-sm text-gray-400">IT Department • Hackathon</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-900/60 text-red-200 border border-red-700">
                        Rejected
                      </span>
                      <span className="ml-2 text-sm text-gray-400">2 days ago</span>
                    </div>
                  </div>
                </li>
              </ul>
              <div className="px-4 py-3 sm:px-6 border-t border-gray-700 flex justify-center">
                <button className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">
                  View all requests
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions & Activity */}
          <div className="space-y-5">
            <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
              <div className="absolute -top-8 -left-8 w-24 h-24 rounded-full bg-purple-500/20 blur-xl"></div>
              <div className="px-4 py-5 sm:p-6 relative z-10">
                <h3 className="text-lg font-medium leading-6 text-white mb-3">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:from-violet-700 hover:to-indigo-700 transition-colors">
                    New Request
                  </button>
                  <button className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:from-emerald-700 hover:to-green-700 transition-colors">
                    Approvals
                  </button>
                  <button className="bg-gradient-to-r from-amber-600 to-yellow-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:from-amber-700 hover:to-yellow-700 transition-colors">
                    Reports
                  </button>
                  <button className="bg-gradient-to-r from-rose-600 to-pink-600 text-white px-4 py-2 rounded-lg text-sm font-medium shadow-lg hover:from-rose-700 hover:to-pink-700 transition-colors">
                    Settings
                  </button>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md rounded-xl shadow-xl border border-gray-700/50 overflow-hidden relative">
              <div className="absolute -bottom-8 -right-8 w-24 h-24 rounded-full bg-blue-500/20 blur-xl"></div>
              <div className="px-4 py-5 sm:p-6 relative z-10">
                <h3 className="text-lg font-medium leading-6 text-white mb-3">Recent Activity</h3>
                <ol className="space-y-3">
                  <li className="relative flex gap-x-4">
                    <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                      <div className="w-px bg-gray-600"></div>
                    </div>
                    <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-gradient-to-br from-purple-600 to-indigo-700 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                    <p className="flex-auto py-0.5 text-sm leading-5 text-gray-300">
                      <span className="font-medium text-white">5 new users</span> added to the system
                    </p>
                    <time className="flex-none py-0.5 text-xs leading-5 text-gray-400">2h ago</time>
                  </li>
                  
                  <li className="relative flex gap-x-4">
                    <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                      <div className="w-px bg-gray-600"></div>
                    </div>
                    <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-gradient-to-br from-green-600 to-emerald-700 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                    <p className="flex-auto py-0.5 text-sm leading-5 text-gray-300">
                      <span className="font-medium text-white">New template</span> created for workshop requests
                    </p>
                    <time className="flex-none py-0.5 text-xs leading-5 text-gray-400">5h ago</time>
                  </li>
                  
                  <li className="relative flex gap-x-4">
                    <div className="absolute left-0 top-0 flex w-6 justify-center -bottom-6">
                      <div className="w-px bg-gray-600"></div>
                    </div>
                    <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-gradient-to-br from-amber-600 to-yellow-700 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                    <p className="flex-auto py-0.5 text-sm leading-5 text-gray-300">
                      <span className="font-medium text-white">CSE Department</span> added 3 new courses
                    </p>
                    <time className="flex-none py-0.5 text-xs leading-5 text-gray-400">1d ago</time>
                  </li>
                  
                  <li className="relative flex gap-x-4">
                    <div className="relative flex h-6 w-6 flex-none items-center justify-center bg-gradient-to-br from-blue-600 to-cyan-700 rounded-full">
                      <div className="h-1.5 w-1.5 rounded-full bg-white"></div>
                    </div>
                    <p className="flex-auto py-0.5 text-sm leading-5 text-gray-300">
                      <span className="font-medium text-white">System update</span> completed successfully
                    </p>
                    <time className="flex-none py-0.5 text-xs leading-5 text-gray-400">2d ago</time>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 