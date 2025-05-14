'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

const Login = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Authenticate the user with phone number
      const loginResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/login/phoneNumber/rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      });

      if (!loginResponse.ok) {
        throw new Error('Invalid phone number');
      }

      const { authToken } = await loginResponse.json();
      
      // Verify the user's role
      const userResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/me', {
        headers: {
          'Accept': 'application/json',
          'X-Xano-Authorization': `Bearer ${authToken}`,
          'X-Xano-Authorization-Only': 'true',
        }
      });

      if (!userResponse.ok) {
        throw new Error('Authentication failed');
      }

      const userData = await userResponse.json();
      
      // Check if user is a rider
      if (userData.role !== 'Rider') {
        throw new Error('Unauthorized access');
      }

      // Store token and user ID
      localStorage.setItem('authToken', authToken);
      localStorage.setItem('userId', userData.id);
      
      // Mark rider as off trip initially
      try {
        const offTripResponse = await fetch(`https://api-server.krontiva.africa/api:D1OPCF46/riderOfftrip/${userData.id}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Xano-Authorization': `Bearer ${authToken}`,
          }
        });
        
        if (!offTripResponse.ok) {
          console.error('Failed to mark rider as off trip');
        }
      } catch (offTripError) {
        console.error('Error marking rider as off trip:', offTripError);
      }

      router.push('/orders');
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userId');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm space-y-4">
            <div>
              <label htmlFor="phoneNumber" className="sr-only">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                required
                className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18]"
                placeholder="Phone Number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                disabled={isLoading}
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
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
