import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';

// Form validation schema
const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(4, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function Login() {
  const { login } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsSubmitting(true);
      await login(data.email, data.password);
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Left Section - Branding & Info */}
      <div className="w-full md:w-1/2 flex flex-col justify-center p-8 md:p-16 bg-gradient-to-br from-violet-600 via-indigo-700 to-purple-800 text-white rounded-none md:rounded-r-3xl shadow-2xl relative overflow-hidden">
        {/* Glassmorphism overlay */}
        <div className="absolute top-0 left-0 right-0 bottom-0 bg-white opacity-[0.07] backdrop-blur-sm"></div>
        
        {/* Decorative elements */}
        <div className="absolute -top-24 -left-24 w-48 h-48 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 opacity-50 blur-2xl"></div>
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-gradient-to-tl from-blue-500 to-cyan-400 opacity-40 blur-3xl"></div>
        
        <div className="max-w-md mx-auto relative z-10">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-pink-300 to-violet-300">Acadify</h1>
          <h2 className="text-2xl md:text-3xl font-semibold mb-6">OD Management System</h2>
          <p className="text-indigo-100 mb-8 text-lg">
            Streamline your academic administration workflow with our comprehensive OD management platform.
          </p>
          <div className="hidden md:block">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Streamlined Approvals</h3>
                <p className="text-indigo-200 text-sm">Efficient workflow management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Centralized Management</h3>
                <p className="text-indigo-200 text-sm">One platform for all departments</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="bg-gradient-to-br from-violet-500 to-purple-600 p-3 rounded-full shadow-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Data Insights</h3>
                <p className="text-indigo-200 text-sm">Comprehensive analytics and reports</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Right Section - Login Form */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-8 md:p-16">
        <div className="w-full max-w-md">
          <div className="bg-gradient-to-br from-gray-900/80 to-slate-800/80 backdrop-blur-md p-8 rounded-2xl shadow-2xl border border-gray-700/50 relative overflow-hidden">
            {/* Glassmorphism highlights */}
            <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-purple-500/20 blur-2xl"></div>
            <div className="absolute -bottom-32 -left-32 w-64 h-64 rounded-full bg-cyan-500/10 blur-3xl"></div>
            
            <div className="text-center mb-8 relative z-10">
              <h2 className="text-2xl font-bold text-white">Welcome Back</h2>
              <p className="text-gray-300 mt-2">Sign in to access your dashboard</p>
            </div>
            
            <form className="space-y-6 relative z-10" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-200 mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    disabled={isSubmitting}
                    {...register('email')}
                    className={`pl-10 w-full px-4 py-3 border ${
                      errors.email ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                    } rounded-lg bg-gray-800/60 shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-200 mb-1">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type="password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    {...register('password')}
                    className={`pl-10 w-full px-4 py-3 border ${
                      errors.password ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-600 focus:ring-purple-500 focus:border-purple-500'
                    } rounded-lg bg-gray-800/60 shadow-sm placeholder-gray-400 text-white focus:outline-none focus:ring-2 disabled:opacity-60 disabled:cursor-not-allowed`}
                    placeholder="••••••••"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400">{errors.password.message}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    disabled={isSubmitting}
                    className="h-4 w-4 text-purple-600 focus:ring-purple-500 bg-gray-700 border-gray-600 rounded disabled:opacity-60 disabled:cursor-not-allowed"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-300">
                    Remember me
                  </label>
                </div>

                {/* <div className="text-sm">
                  <Link
                    to="/forgot-password"
                    className="font-medium text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div> */}
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition-colors relative overflow-hidden"
                >
                  {isSubmitting ? (
                    <>
                      <div className="absolute inset-0 bg-white/10 backdrop-blur-sm"></div>
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span>Signing in...</span>
                      </div>
                    </>
                  ) : (
                    'Sign in'
                  )}
                </button>
              </div>
            </form>

            <div className="mt-6 relative z-10">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-gray-800 text-gray-400">Need help?</span>
                </div>
              </div>
              
              <div className="mt-4 text-center text-sm text-gray-400">
                Contact your system administrator for support
              </div>
            </div>
          </div>
          
          <div className="mt-6 text-center text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Acadify. All rights reserved.</p>
          </div>
        </div>
      </div>
    </div>
  );
} 