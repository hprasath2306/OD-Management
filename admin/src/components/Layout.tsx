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
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'OD Requests', href: '/od-approvals' },
  { name: 'Results', href: '/results' },
];

const studentNavigation = [
  { name: 'Dashboard', href: '/dashboard' },
  { name: 'OD Request', href: '/od-requests' },
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
      return  teacherNavigation;
    }
    return [];
  };

  const navigation = getNavigation();

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <h1 className="text-xl font-bold text-gray-900">Acadify Admin</h1>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'border-blue-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:items-center">
              <div className="ml-3 relative">
                <div className="flex items-center space-x-4">
                  <div className="text-sm font-medium text-gray-700">
                    {user?.email}
                    {user?.role && (
                      <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {user.role}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => logout()}
                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-full shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Logout
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <div className="py-10">
        <Outlet />
      </div>
    </div>
  );
} 