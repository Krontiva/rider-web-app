'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [credentials, setCredentials] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // First authenticate the user
      const loginResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!loginResponse.ok) {
        throw new Error('Invalid credentials');
      }

      const { authToken } = await loginResponse.json();
      
      // Verify the user's role using the auth token
      const userResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/me', {
        headers: {
          'Content-Type': 'application/json',
          'X-Xano-Authorization': `Bearer ${authToken}`,
          'X-Xano-Authorization-Only': 'true',
        }
      });

      if (!userResponse.ok) {
        throw new Error('Authentication failed');
      }

      const userData = await userResponse.json();
      
      // Check if user is a rider (add your role check logic here)
      if (userData.role !== 'rider') {  // adjust the role check based on your user data structure
        throw new Error('Unauthorized access');
      }

      // Store token temporarily
      localStorage.setItem('tempAuthToken', authToken);

      // Send OTP
      const otpResponse = await fetch(
        'https://api-server.krontiva.africa/api:uEBBwbSs/reset/user/password/email',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: credentials.email
          }),
        }
      );

      if (!otpResponse.ok) {
        throw new Error('Failed to send OTP');
      }

      // If everything is successful, redirect to verify page
      router.push(`/verify?email=${encodeURIComponent(credentials.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      localStorage.removeItem('tempAuthToken'); // Clean up on error
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full space-y-8 p-4 md:p-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-bold text-black">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18]"
                placeholder="Email address"
                value={credentials.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18]"
                placeholder="Password"
                value={credentials.password}
                onChange={handleChange}
              />
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FE5B18] hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18] disabled:opacity-50"
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
