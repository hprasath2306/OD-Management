import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const adminNavigation = [
  { name: 'Dashboard', href: '/' },
  { name: 'Departments', href: '/departments' },
  { name: 'Designations', href: '/designations' },
  { name: 'Flow Templates', href: '/flow-templates' },
  { name: 'Results', href: '/results' },
];

const teacherNavigation = [
  { name: 'OD Requests', href: '/od-approvals' },
  { name: 'Results', href: '/results' },
];

const studentNavigation = [
  { name: 'OD Requests', href: '/od-requests' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  // Determine which navigation items to show based on user role
  const getNavigation = () => {
    if (user?.role === 'ADMIN') {
      return adminNavigation;
    } else if (user?.role === 'STUDENT') {
      return studentNavigation;
    } else if (user?.role === 'TEACHER') {
      return teacherNavigation;
    }
    return [];
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-gradient-to-r from-slate-900 to-slate-800 border-b border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between h-16">
            {/* Logo and Navigation */}
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center ml-4">
                <h1 className="text-xl font-bold text-white">Acadify Admin</h1>
              </div>
              <div className="hidden sm:flex sm:ml-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`inline-flex items-center px-4 h-16 text-sm font-medium border-b-[3px] ${
                      location.pathname === item.href || (item.href === '/' && location.pathname === '')
                        ? 'border-blue-500 text-white'
                        : 'border-transparent text-gray-300 hover:border-gray-700 hover:text-gray-100'
                    }`}
                    aria-current={location.pathname === item.href ? 'page' : undefined}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            
            {/* User Info and Logout */}
            <div className="flex items-center pr-4">
              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-200">{user?.email}</span>
                {user?.role && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-200 border border-blue-800">
                    {user.role}
                  </span>
                )}
                <button
                  onClick={() => logout()}
                  className="inline-flex items-center px-4 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-slate-900"
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        <Outlet />
      </main>
    </div>
  );
} 