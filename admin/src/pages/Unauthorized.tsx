import { useAuth } from '../context/AuthContext';

export function Unauthorized() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Unauthorized Access</h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          You don't have permission to access the admin dashboard.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <p className="text-sm text-gray-700">
                Your account ({user?.email}) has the role <strong>{user?.role}</strong>, but this area is restricted to users with the <strong>ADMIN</strong> role.
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-700">
                If you believe this is an error, please contact your system administrator.
              </p>
            </div>
            <div>
              <button
                onClick={() => logout()}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 